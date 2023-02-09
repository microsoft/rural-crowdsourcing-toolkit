// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Disable a set of access codes

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, BasicModel, WorkerModel } from '@karya/common';
import { Promise as BBPromise } from 'bluebird';
import { MicrotaskAssignmentRecord, MicrotaskRecord, MicrotaskType } from '@karya/core';
import { exit } from 'process';

declare type TextTranslationTaskMap = {[key: string]: string[]}
declare type TextTranslationValidationTaskMap = {[key: string]: string}

const SPLIT_FACTOR = 3
const NUMBER_OF_INTERFACES = 6
const NUMBER_OF_INTERFACES_FILTER = 4

const isGroupChainable = async (ttIds: string[]) => {
    let ambigousMtaGroups: MicrotaskAssignmentRecord[][] = []
    let nonAmbigousMtaGroups: MicrotaskAssignmentRecord[][] = []
    let isGroupComplete = true

    const task_list = ttIds.join(",")
    console.log(ttIds[0])
    const response = await knex.raw(`SELECT * from microtask WHERE task_id in (${task_list}) order by input->'data'->>'sentenceId'`)
    const allMts = response.rows as MicrotaskRecord[]
    let a=0, na = 0
    const groupId = {"G1": 0, "G2": 0, "G3": 0}

    for(var i = 0; i < allMts.length; i = i+NUMBER_OF_INTERFACES) {
        const mtas = []
        let isAmbiguous = false
        for (var j=0; j < NUMBER_OF_INTERFACES; j++) {
            const currentMt = allMts[i+j]
            const currentTask = await BasicModel.getSingle('task', {id: currentMt.task_id})
            // @ts-ignore
            groupId[currentTask.itags.itags[3]] += 1
            try {
                const mta = await BasicModel.getSingle('microtask_assignment', {microtask_id: currentMt.id, status: 'VERIFIED'})
                // TODO: ASK VIVEK FOR STATUS CONFIRMATION
                // console.log((mta.output?.data as any))
                if((mta.output?.data as any).ambiguous == true) {
                    isAmbiguous = true
                    a += 1
                }
                if (currentTask.params.mode != 'none') {
                    // console.log(currentTask.params.mode, i, j, currentMt.task_id)
                    mtas.push(mta)
                }
            } catch(e) {
                isGroupComplete = false
                break
            }
        }

        // Check if all mtas were completed
        if (mtas.length != NUMBER_OF_INTERFACES_FILTER) {
            continue
        }
        // Add to respective array
        if (isAmbiguous) {
            ambigousMtaGroups.push(mtas)
        } else {
            nonAmbigousMtaGroups.push(mtas)
        }
    }

    const requiredSentences = (allMts.length/NUMBER_OF_INTERFACES)/SPLIT_FACTOR
    console.log("Required sentences", requiredSentences, allMts.length, nonAmbigousMtaGroups.length, ambigousMtaGroups.length, a, isGroupComplete, groupId)

    // Check if non ambigous mtas are not enough
    if (nonAmbigousMtaGroups.length < requiredSentences) {
        // See if mtas are completed
        if (!isGroupComplete) return null
    }

    // Group is chainable
    let chainableMtaGroups = []

    if (nonAmbigousMtaGroups.length >= requiredSentences) {
        // Return required nonAmbigous Assignments
        chainableMtaGroups = nonAmbigousMtaGroups.slice(0, requiredSentences)
    } else {
        // non ambigous assignment is not enough, take rest of assignments from ambigous mtas
        chainableMtaGroups = nonAmbigousMtaGroups
        ambigousMtaGroups.slice(0, requiredSentences - nonAmbigousMtaGroups.length).forEach(mta => chainableMtaGroups.push(mta))
    }
    // console.log("Chainable microtask", chainableMtaGroups.length, nonAmbigousMtaGroups.length, ambigousMtaGroups.length, requiredSentences)

    return chainableMtaGroups
}

const createTTVAssignments = 
async (ttvTaskMap: TextTranslationValidationTaskMap, chainableMtaGroups: MicrotaskAssignmentRecord[][], ttGroupId: string) => {
    const chainMap: {[key: string]: string} = {
        "G1": "G2",
        "G2": "G3",
        "G3": "G1"
    }

    const targetGroup = chainMap[ttGroupId]
    const targetTaskId = ttvTaskMap[targetGroup]
    const targetTask = await BasicModel.getSingle('task', {id: targetTaskId})


    await BBPromise.mapSeries(chainableMtaGroups, async mtaGroup => {
        try {
            const microtask = await BasicModel.getSingle('microtask', {"id": mtaGroup[0].microtask_id}) as MicrotaskType<'TEXT_TRANSLATION'>
            const sourceSentence = microtask.input!!.data.sentence
            const validationMt: MicrotaskType<'TEXT_TRANSLATION_VALIDATION'> = {
            task_id: targetTask.id,
            // @ts-ignore
            input: {data: {source: sourceSentence, translations: mtaGroup.map(mta => (mta.output!!.data as any).translation), sentenceId: microtask.input?.data.sentenceId}},
            deadline: targetTask.deadline,
            credits: targetTask.params.creditsPerMicrotask as number,
            status: 'INCOMPLETE',
            base_credits: targetTask.params.baseCreditsPerMicrotask as number,
            };
            await BasicModel.insertRecord('microtask', validationMt)
        } catch (e) {
            console.log(e)
        }
    })

}

/** Main Script to reset the DB */
(async () => {
  setupDbConnection();

  // Get all groups task
  const ttTaskMap: TextTranslationTaskMap  = { "G1": [], "G2": [], "G3": [] }
  const ttvTaskMap: TextTranslationValidationTaskMap = { "G1": "", "G2": "", "G3": "" }

  // For text translation
  const ttGroupIds = Object.keys(ttTaskMap)
  await BBPromise.mapSeries(ttGroupIds, async gId => {
    const response = await knex.raw(`SELECT id FROM TASK WHERE scenario_name = 'TEXT_TRANSLATION' AND itags::text like '%${gId}%'`)
    response.rows.forEach( (row: any) =>  ttTaskMap[gId].push(row.id))
  })

  // For text translation validation
  const ttvGroupIds = Object.keys(ttvTaskMap)
  await BBPromise.mapSeries(ttvGroupIds, async gId => {
    const response = await knex.raw(`SELECT id FROM TASK WHERE scenario_name = 'TEXT_TRANSLATION_VALIDATION' AND itags::text like '%${gId}%' AND itags::text like '%R1%'`)
    console.log("TTV tassks belonging to single group", response.rows.length)
    response.rows.forEach( (row: any) =>  ttvTaskMap[gId] = row.id)
  })

  // Check if groups are assignable
  const chainableTTPool: {[key: string]: MicrotaskAssignmentRecord[][]}  = { "G1": [], "G2": [], "G3": [] }

  await BBPromise.mapSeries(ttGroupIds, async gId => {
    const chainableMtaGroupss = await isGroupChainable(ttTaskMap[gId])
    if (chainableMtaGroupss == null) {
        console.log(`Group ${gId} is not chainable`);
        process.exit();
    }
    createTTVAssignments(ttvTaskMap, chainableMtaGroupss, gId)
  })

  // Create mtas for Text Translation Validation



})().finally(() => console.log("DOOOOO"));
