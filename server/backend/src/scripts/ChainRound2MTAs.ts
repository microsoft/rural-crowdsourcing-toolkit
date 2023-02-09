import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, BoxDbFunctions, mainLogger as logger, BasicModel } from '@karya/common';
import { MicrotaskAssignmentRecord, MicrotaskRecord, MicrotaskType, ScenarioName, TaskRecord } from '@karya/core';
import { Promise as BBPromise } from 'bluebird';

declare type MicrotaskMap = {[key: number]: any[] }
type MicrotaskJoinElement = MicrotaskRecord & {
    tags: string[],
    scenario_name: ScenarioName
}

const chainMap: {[key: string]: string} = {
    "G1": "G2",
    "G2": "G3",
    "G3": "G1"
};

const groups = ["G1", "G2", "G3"];

(async () => {
    setupDbConnection();

    const microtaskMap: MicrotaskMap = {}
    const response = await knex.raw(`select mt.*, t.itags->'itags' as tags, t.scenario_name as scenario_name from 
    ((select * from microtask) mt 
    left join 
    (select id, params, itags, scenario_name from task) t on mt.task_id = t.id) 
    where t.params->>'mode' = 'none' 
    OR 
    t.itags->>'itags' like '%R1%' order by mt.input->'data'->>'sentenceId'`)

    const microtasks: MicrotaskJoinElement[] = response.rows

    const scoredIds = microtasks.filter(mt => mt.scenario_name == 'TEXT_TRANSLATION_VALIDATION').map(mt => (mt.input.data as any).sentenceId)

    // Determine target tasks
    const targetTasks: {[key:string]: TaskRecord} = {}
    await BBPromise.mapSeries(groups, async gId=> {
        const taskResponse = await knex.raw(`SELECT * FROM task where itags->>'itags' like '%R2%' and itags->>'itags' like '%${gId}%'`)
        // @ts-ignore
        const task = (taskResponse.rows)[0] as TaskRecord
        targetTasks[gId] = task
    })


    microtasks.forEach(mt => {
        const sentenceId = (mt.input.data as any).sentenceId
        if (scoredIds.includes(sentenceId)) {
            if (microtaskMap[sentenceId]) {
                microtaskMap[sentenceId].push(mt)
            } else {
                microtaskMap[sentenceId] = [mt]
            }
        }
    })

    await BBPromise.mapSeries( scoredIds, async id => {
        const mts: MicrotaskJoinElement[] = microtaskMap[id]
        const mtaMap: {[key: string]: MicrotaskAssignmentRecord} = {}

        let allMtasFound = true
        await BBPromise.mapSeries(mts, async mt => {
            try {
                const mta = await BasicModel.getSingle('microtask_assignment', {microtask_id: mt.id}) 
                mtaMap[mt.id] = mta
            } catch (e) {
                console.log(e)
                console.log(`MTA record not found for microtask:  ${mt.id}`)
                allMtasFound = false
            }
        })

        // If all mtas not present, return
        if (!allMtasFound) {
            return
        }
        
        const noInterfaceTranslation: string[] = []
        let ttv: MicrotaskJoinElement

        mts.forEach(mt => {
            if (mt.scenario_name != 'TEXT_TRANSLATION_VALIDATION') {
                const mta = mtaMap[mt.id]
                noInterfaceTranslation.push(((mta.output?.data as any).translation))
            } else {
                ttv = mt
            }
        })

        const ttvMtas = await BasicModel.getRecords('microtask_assignment', {microtask_id: ttv!!.id})
        let candidateTransObjTtv: {[key: string]: number} = {} 

        ttvMtas.forEach(mta => {
             // const candidateTransObjTtv = (mtaMap[ttv!!.id].output?.data as any).translations
            if (Object.keys(candidateTransObjTtv).length == 0) {
                candidateTransObjTtv = (mta.output?.data as any).translations
            } else {
                const candidateTrans = (mta.output?.data as any).translations
                const trans = Object.keys(candidateTrans)
                console.log("trans")
                trans.forEach(trans => {
                    candidateTransObjTtv[trans] += candidateTrans[trans]
                    }
                 )
            }
        })
        console.log(candidateTransObjTtv, ttvMtas.map(mta => (mta.output as any).data.translations))


       

        // Determining best translation
        let bestTranslation: string
        let bestScore = 0
        const candidateTrans = Object.keys(candidateTransObjTtv)
        candidateTrans.forEach( trans => {
            const score = candidateTransObjTtv[trans]
            if (score > bestScore) {
                bestScore = score
                bestTranslation = trans
            }
        })
        // combining all translations
        const translations = noInterfaceTranslation
        translations.push(bestTranslation!!)
        // shuffle array
        translations.map(value => ({ value, sort: Math.random() }))
                    .sort((a, b) => a.sort - b.sort)
                    .map(({ value }) => value)

        const gId = ttv!!.tags.find(tag => groups.includes(tag))!!
        const targetGid = chainMap[gId]
        const targetTask = targetTasks[targetGid]

        const validationMt: MicrotaskType<'TEXT_TRANSLATION_VALIDATION'> = {
            task_id: targetTask.id,
            // @ts-ignore
            input: {data: {
                            source: (ttv!!.input.data as any).source, 
                            translations, 
                            //@ts-ignore
                            sentenceId: ttv.input?.data.sentenceId
                        }
                    },
            deadline: targetTask.deadline,
            credits: targetTask.params.creditsPerMicrotask as number,
            status: 'INCOMPLETE',
            base_credits: targetTask.params.baseCreditsPerMicrotask as number,
        };

        await BasicModel.insertRecord('microtask', validationMt)
    })

})().finally(() => knex.destroy());
