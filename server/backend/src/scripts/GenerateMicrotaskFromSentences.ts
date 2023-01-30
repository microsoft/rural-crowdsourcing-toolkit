// This file generates microtask given an array of sentence json objects


/**
 * 1. Load the sentences
 * 2. Divide into sets of 36 sentences each
 * 3. Put those sets into an array
 * 4. Iterate through that array 6 times. Inside that for loop:
 *      i) Create microtasks for task id $i, assign that set to Anootator $j (iteration variable for set j)
 *      ii) Perform a cyclic rotation
 * 5. Create functions for creating microtasks for all those tasks
 * 6. Create functions for creating the assignemnets
 */

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Update transaction record status for the payouts that were created but 
// their webhooks couldn't be received.

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, setupBlobStore, BasicModel } from '@karya/common';
import {
    TaskRecordType,
    MicrotaskType,
    MicrotaskRecord,
  } from '@karya/core';
import * as fs from 'fs';
import { Promise as BBPromise } from 'bluebird';

const SET_SIZE = 36;

type TaskMap = {
    quiz: string,
    baseline: string,
    post_edited: string,
    static_bow: string,
    dynamic_bow: string,
    next_word_bow: string,
    next_word_dropdown: string
}

type Sentence = {
    sentence: string,
    providedTranslation: string,
    bow: string[]
}

const QUIZ_QUESTIONS = [
  { "question": "Please enter your name", "type": "text", "key": "name" },
  { "question": "Specify your gender", "type": "mcq", "key": "gender", "options": ["male", "female"] },
  { "question": "How old are you?", "type": "text", "key": "age" }
]

const createMicrotasksForBaseline = async (sets: Sentence[], taskIdMap: TaskMap) => {
    const task_id = taskIdMap["baseline"]
    const task = await BasicModel.getSingle('task', {id: task_id}) as TaskRecordType<'TEXT_TRANSLATION'>
    const microtasks: MicrotaskRecord[] = []
    await BBPromise.mapSeries(sets, async (obj) => {
        const mt: MicrotaskType<'TEXT_TRANSLATION'> = {
            task_id,
            input: { data: {sentence: obj.sentence, providedTranslation: "", bow: ""} },
            deadline: task.deadline,
            credits: task.params.creditsPerMicrotask,
            status: 'INCOMPLETE',
            base_credits: task.params.baseCreditsPerMicrotask,
        };
        const microtaskRecord = await BasicModel.insertRecord('microtask', mt)
        microtasks.push(microtaskRecord)
    })
    return microtasks
}

const createMicrotasksForPostEdited = async (sets: Sentence[], taskIdMap: TaskMap) => {
    const task_id = taskIdMap["post_edited"]
    const task = await BasicModel.getSingle('task', {id: task_id}) as TaskRecordType<'TEXT_TRANSLATION'>
    const microtasks: MicrotaskRecord[] = []
    await BBPromise.mapSeries(sets, async (obj) => {
        const mt: MicrotaskType<'TEXT_TRANSLATION'> = {
            task_id,
            input: { data: {sentence: obj.sentence, providedTranslation: obj.providedTranslation, bow: ""} },
            deadline: task.deadline,
            credits: task.params.creditsPerMicrotask,
            status: 'INCOMPLETE',
            base_credits: task.params.baseCreditsPerMicrotask,
        };
        const microtaskRecord = await BasicModel.insertRecord('microtask', mt)
        microtasks.push(microtaskRecord)
    })
    return microtasks
}

const createMicrotasksForStaticBOW = async (sets: Sentence[], taskIdMap: TaskMap) => {
    const task_id = taskIdMap["static_bow"]
    const task = await BasicModel.getSingle('task', {id: task_id}) as TaskRecordType<'TEXT_TRANSLATION'>
    const microtasks: MicrotaskRecord[] = []
    await BBPromise.mapSeries(sets, async (obj) => {
        const mt: MicrotaskType<'TEXT_TRANSLATION'> = {
            task_id,
            input: { data: {sentence: obj.sentence, providedTranslation: obj.providedTranslation, bow: ""} },
            deadline: task.deadline,
            credits: task.params.creditsPerMicrotask,
            status: 'INCOMPLETE',
            base_credits: task.params.baseCreditsPerMicrotask,
        };
        const microtaskRecord = await BasicModel.insertRecord('microtask', mt)
        microtasks.push(microtaskRecord)
    })
    return microtasks
}

const createMicrotasksForDynamicBOW = async (sets: Sentence[], taskIdMap: TaskMap) => {
    const task_id = taskIdMap["dynamic_bow"]
    const task = await BasicModel.getSingle('task', {id: task_id}) as TaskRecordType<'TEXT_TRANSLATION'>
    const microtasks: MicrotaskRecord[] = []
    await BBPromise.mapSeries(sets, async (obj) => {
        const mt: MicrotaskType<'TEXT_TRANSLATION'> = {
            task_id,
            input: { data: {sentence: obj.sentence, providedTranslation: obj.providedTranslation, bow: ""} },
            deadline: task.deadline,
            credits: task.params.creditsPerMicrotask,
            status: 'INCOMPLETE',
            base_credits: task.params.baseCreditsPerMicrotask,
        };
        const microtaskRecord = await BasicModel.insertRecord('microtask', mt)
        microtasks.push(microtaskRecord)
    })
    return microtasks
}

const createMicrotasksForNextWordBOW = async (sets: Sentence[], taskIdMap: TaskMap) => {
    const task_id = taskIdMap["next_word_bow"]
    const task = await BasicModel.getSingle('task', {id: task_id}) as TaskRecordType<'TEXT_TRANSLATION'>
    const microtasks: MicrotaskRecord[] = []
    await BBPromise.mapSeries(sets, async (obj) => {
        const mt: MicrotaskType<'TEXT_TRANSLATION'> = {
            task_id,
            input: { data: {sentence: obj.sentence, providedTranslation: obj.providedTranslation, bow: ""} },
            deadline: task.deadline,
            credits: task.params.creditsPerMicrotask,
            status: 'INCOMPLETE',
            base_credits: task.params.baseCreditsPerMicrotask,
        };
        const microtaskRecord = await BasicModel.insertRecord('microtask', mt)
        microtasks.push(microtaskRecord)
    })
    return microtasks
}

const createMicrotasksForNextWordDropDown = async (sets: Sentence[], taskIdMap: TaskMap) => {
    const task_id = taskIdMap["next_word_dropdown"]
    const task = await BasicModel.getSingle('task', {id: task_id}) as TaskRecordType<'TEXT_TRANSLATION'>
    const microtasks: MicrotaskRecord[] = []
    await BBPromise.mapSeries(sets, async (obj) => {
        const mt: MicrotaskType<'TEXT_TRANSLATION'> = {
            task_id,
            input: { data: {sentence: obj.sentence, providedTranslation: obj.providedTranslation, bow: ""} },
            deadline: task.deadline,
            credits: task.params.creditsPerMicrotask,
            status: 'INCOMPLETE',
            base_credits: task.params.baseCreditsPerMicrotask,
        };
        const microtaskRecord = await BasicModel.insertRecord('microtask', mt)
        microtasks.push(microtaskRecord)
    })
    return microtasks
}

const createMicrotasksForQuiz = async (taskIdMap: TaskMap) => {
    const task_id = taskIdMap["quiz"]
    const task = await BasicModel.getSingle('task', {id: task_id}) as TaskRecordType<'QUIZ'>
    const microtasks: MicrotaskRecord[] = []
    await BBPromise.mapSeries(QUIZ_QUESTIONS, async (questionObj: any) => {
      const mt: MicrotaskType<'QUIZ'> = {
        task_id: task.id,
        input: { data: questionObj },
        deadline: task.deadline,
        credits: task.params.creditsPerMicrotask,
        status: 'INCOMPLETE',
        base_credits: task.params.baseCreditsPerMicrotask,
      };
      const microtask = await BasicModel.insertRecord('microtask', mt)
      microtasks.push(microtask)
    })
    return microtasks
}

/** Main Script */
(async () => {
    setupDbConnection();
    const sentencesFile = process.argv[2];
    const workerIdsFile = process.argv[3];
    const taskIdMapFile = process.argv[4]
    if (sentencesFile == '' || sentencesFile == undefined) {
      console.log('Invalid sentences file');
      process.exit();
    }
  
    if (workerIdsFile == '' || workerIdsFile == undefined) {
      console.log('Invalid worker Ids file');
      process.exit();
    }
  
    if (taskIdMapFile == '' || taskIdMapFile == undefined) {
      console.log('Invalid task Id file');
      process.exit();
    }
    // 1. Read file
    const sentencesString = fs.readFileSync(sentencesFile).toString();
    const sentencesJsonArray: Sentence[] = JSON.parse(sentencesString)
  
    const workerIds = fs.readFileSync(workerIdsFile).toString().split('\n').filter(id => id.length);
  
    const taskIdMapString = fs.readFileSync(taskIdMapFile).toString();
    const taskIdMap: TaskMap = JSON.parse(taskIdMapString)
  
    // 2. Determine if length of JSONArray is divisible by SET_SIZE
    if (sentencesJsonArray.length % SET_SIZE != 0) {
      console.log(`Invalid length of input array, not divisible by ${SET_SIZE}`);
      process.exit();
    }
  
    // 2. Divide into groups of 36 sentences
    const sets: Sentence[][] = []
    const numberOfSets = sentencesJsonArray.length/SET_SIZE
  
    if (numberOfSets != workerIds.length) {
      console.log(`Invalid number of sets for given workers: Number of sets possible: ${SET_SIZE} and number of workers: ${workerIds.length}`);
      process.exit();
    }
  
    for(var i = 0; i < numberOfSets; i++) {
      // 3. Put those sets into an array
      sets.push(sentencesJsonArray.slice(i*SET_SIZE, (i+1)*SET_SIZE))
    }
  
    const microtaskCreationFunctions = [
      createMicrotasksForBaseline,
      createMicrotasksForPostEdited,
      createMicrotasksForStaticBOW,
      createMicrotasksForDynamicBOW,
      createMicrotasksForNextWordBOW,
      createMicrotasksForNextWordDropDown
  ]
  // Create microtasks for quiz
  createMicrotasksForQuiz(taskIdMap)
  
  for (var interfaceIdx = 0; interfaceIdx < 6; interfaceIdx++) {
    var createMicrotasks = microtaskCreationFunctions[interfaceIdx]
    for(var setIdx = 0; setIdx < sets.length; setIdx++) {
        var microtasks = await createMicrotasks(sets[setIdx]!!, taskIdMap)
      //   await assignMicrotasks(microtasks, workerIds[setIdx])
    }
    // Rotate the set
    const firstSet = sets.shift()!!
    sets.push(firstSet)
  }
})().finally(() => knex.destroy());

