// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Disable a set of access codes

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, BasicModel, WorkerModel } from '@karya/common';
import { Promise as BBPromise } from 'bluebird';
import { MicrotaskAssignmentRecord, MicrotaskRecord, MicrotaskType } from '@karya/core';

declare type TextTranslationTaskMap = {[key: string]: string[]}
declare type TextTranslationValidationTaskMap = {[key: string]: string}

const SPLIT_FACTOR = 3
const NUMBER_OF_INTERFACES = 6

const isGroupChainable = async (ttIds: string[]) => {
    let ambigousMtaGroups: MicrotaskAssignmentRecord[][] = []
    let nonAmbigousMtaGroups: MicrotaskAssignmentRecord[][] = []
    let totalMts = 0
    let isGroupComplete = true

    const response = await knex.raw(`SELECT * from microtask WHERE task_id in (${ttIds.join(",")}) order by input`)
    const allMts = response.rows as MicrotaskRecord[]

    for(var i = 0; i < allMts.length; i = i+NUMBER_OF_INTERFACES) {
        const mtas = []
        let isAmbigous = false
        for (var j=0; j < NUMBER_OF_INTERFACES; j++) {
            const currentMt = allMts[i+j]
            try {
                const mta = await BasicModel.getSingle('microtask_assignment', {task_id: currentMt.id, status: 'VERIFIED'})
                // TODO: ASK VIVEK FOR STATUS CONFIRMATION

                if((mta.extras as any).ambigous) {
                    isAmbigous = true
                }
                mtas.push(mta)
            } catch {
                isGroupComplete = false
                break
            }
        }

        // Check if all mtas were completed
        if (mtas.length != NUMBER_OF_INTERFACES) continue
        // Add to respective array
        if (isAmbigous) {
            ambigousMtaGroups.push(mtas)
        } else {
            nonAmbigousMtaGroups.push(mtas)
        }
    }

    const requiredSentences = (totalMts/NUMBER_OF_INTERFACES)/SPLIT_FACTOR

    // Check if non ambigous mtas are not enough
    if (nonAmbigousMtaGroups.length < requiredSentences) {
        // See if mtas are completed
        if (isGroupComplete) return null
    }

    // Group is chainable
    let chainableMtaGroups = []

    if (nonAmbigousMtaGroups.length >= requiredSentences) {
        // Return required nonAmbigous Assignments
        chainableMtaGroups = nonAmbigousMtaGroups.slice(requiredSentences)
    } else {
        // non ambigous assignment is not enough, take rest of assignments from ambigous mtas
        chainableMtaGroups = nonAmbigousMtaGroups
        ambigousMtaGroups.slice(requiredSentences - nonAmbigousMtaGroups.length).forEach(mta => chainableMtaGroups.push(mta))
    }

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
        const microtask = await BasicModel.getSingle('microtask', {"id": mtaGroup[0].task_id}) as MicrotaskType<'TEXT_TRANSLATION'>
        const sourceSentence = microtask.input!!.data.sentence
        const validationMt: MicrotaskType<'TEXT_TRANSLATION_VALIDATION'> = {
            task_id: targetTask.id,
            input: {data: {source: sourceSentence, translations: mtaGroup.map(mta => (mta.output!!.data as any).translation)}},
            deadline: targetTask.deadline,
            credits: targetTask.params.creditsPerMicrotask as number,
            status: 'INCOMPLETE',
            base_credits: targetTask.params.baseCreditsPerMicrotask as number,
        };
        await BasicModel.insertRecord('microtask', validationMt)
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
    const response = await knex.raw(`SELECT id FROM TASK WHERE scenario_name = 'TEXT_TRANSLATION' AND itags::text like %${gId}%`)
    response.rows.forEach( (id: string) =>  ttTaskMap[gId].push(id))
  })

  // For text translation validation
  const ttvGroupIds = Object.keys(ttvTaskMap)
  await BBPromise.mapSeries(ttvGroupIds, async gId => {
    const response = await knex.raw(`SELECT id FROM TASK WHERE scenario_name = 'TEXT_TRANSLATION_VALIDATION' AND itags::text like %${gId}%`)
    console.log("TTV tassks belonging to single group", response.rows.length)
    response.rows[0].forEach( (id: string) =>  ttvTaskMap[gId] = id)
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



})().finally(() => knex.destroy());
