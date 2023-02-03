// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Disable a set of access codes

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, BasicModel } from '@karya/common';
import * as fs from 'fs';
import { MicrotaskType, Task, TaskAssignment, TaskAssignmentRecord, TaskRecord } from '@karya/core';
import { Promise as BBPromise } from 'bluebird';

const SENTENCE_SET_SIZE = 36
const NUMBER_OF_GROUPS = 3
const NUMBER_OF_INTERFACES = 6

type Sentence = {
    sentence: string,
    providedTranslation: string,
    BOW: string[]
}

const createTaskAssignment = async (task: TaskRecord) => {
    const box = await BasicModel.getSingle('box', {})
    const taskAssignmentObj: TaskAssignment = {
        task_id: task.id,
        box_id: box.id,
        policy: task.policy,
        params: {
            n: task.params.n,
            maxMicrotaskPerUser: task.params.maxMicrotasksPerUser
        },
        deadline: null,
        status: "COMPLETED",
        extras: null
    }
    await BasicModel.insertRecord("task_assignment", taskAssignmentObj)
}

const createInterfaceTasks = async (groupId: number, workerId: number, interfaceId: number, taskTemplate: {[key: string]: Task}, sentenceSubset: Sentence[]) => {
    const keys = Object.keys(taskTemplate)
    const taskKey = keys[interfaceId-1]
    const taskObject: Task = {
        ...taskTemplate[taskKey],
        name: `$A${workerId}I${interfaceId}_${taskTemplate[taskKey].name}`,
        work_provider_id: "-1",
        itags: {itags: ["INMT_STUDY", `A${workerId}`, `I${interfaceId}`, `G${groupId}`]},
        status: "SUBMITTED",
    }
    const task = await BasicModel.insertRecord('task', taskObject)
    await createTaskAssignment(task)

    // create microtask template
    const mtTemplate: MicrotaskType<'TEXT_TRANSLATION'> = {
        task_id: task.id,
        deadline: task.deadline,
        credits: task.params.creditsPerMicrotask as number,
        status: 'INCOMPLETE',
        base_credits: task.params.baseCreditsPerMicrotask as number,
    };
    // create microtask
    await BBPromise.mapSeries(sentenceSubset, async (obj) => {
        var input: any = {input: {}}
        switch(taskKey) {
            case "BASELINE": 
                input = { input: {data: {sentence: obj.sentence, providedTranslation: "", bow: ""} } }
                break
            case "POST_EDITED": 
                input = { input: {data: {sentence: obj.sentence, providedTranslation: obj.providedTranslation, bow: ""} } }
                break
            case "STATIC_BOW":
                input = { input: {data: {sentence: obj.sentence, providedTranslation: "", bow: obj.BOW.join(' ')} } }
                break
            case "DYNAMIC_BOW":
                input = { input: {data: {sentence: obj.sentence, providedTranslation: "", bow: ""} } }
                break
            case "NEXT_BOW":
                input = { input: {data: {sentence: obj.sentence, providedTranslation: "", bow: ""} } }
                break
            case "NEXT_WORD_DROPDOWN":
                input = { input: {data: {sentence: obj.sentence, providedTranslation: "", bow: ""} } }
                break
        }
        const mt = {
            ...mtTemplate,
            ...input
        }
        await BasicModel.insertRecord('microtask', mt)
    })

    return task
}

const createQuizTask = async ( taskTemplate: {[key: string]: Task}) => {
    // create QUIZ task
    const partialQuizTask = taskTemplate['QUIZ']
    const quizTaskObj: Task = {
        ...partialQuizTask,
        work_provider_id: "-1",
        itags: {itags: ["INMT_STUDY"]},
        status: "SUBMITTED",
    }
    const quizTask = await BasicModel.insertRecord('task', quizTaskObj)
    await createTaskAssignment(quizTask)
}

const createScoringTasks = async ( taskTemplate: {[key: string]: Task}) => {
    const partialQuizTask = taskTemplate['QUIZ']
    // create scoring tasks
    // 1. create model scoring task
    const partialScoringTask = taskTemplate['SCORING']
    const modelScoringTaskObj: Task = {
        ...partialScoringTask,
        name: "MODEL_OUTPUT_SCORING",
        work_provider_id: "-1",
        itags: {itags: ["INMT_STUDY"]},
        status: "SUBMITTED"
    }
    const modelScoringTask = await BasicModel.insertRecord('task', modelScoringTaskObj)
    await createTaskAssignment(modelScoringTask)
    // 2. Create chain scoring tasks
    for (var i=0; i<3; i++) {
        const scoringTaskObj: Task = {
            ...partialQuizTask,
            name: `GROUP_${i}_SCORING`,
            work_provider_id: "-1",
            itags: {itags: ["INMT_STUDY", `G${i+1}`]},
            status: "SUBMITTED"
        }
        const scoringTask = await BasicModel.insertRecord('task', scoringTaskObj)
        await createTaskAssignment(scoringTask)
    }
}


/** Main -1 to reset the DB */
(async () => {
  setupDbConnection();

  
  const sentencesFile = process.argv[2];
  if (sentencesFile == '' || sentencesFile == undefined) {
    console.log('Invalid sentences file');
    process.exit();
  }

  const workerIdFile = process.argv[3];
  if (workerIdFile == '' || workerIdFile == undefined) {
    console.log('Invalid worker ID file');
    process.exit();
  }

  const interfaceTaskTemplateFile = process.argv[4];
  if (interfaceTaskTemplateFile == '' || interfaceTaskTemplateFile == undefined) {
    console.log('Invalid interface task template file');
    process.exit();
  }

  const nonInterfaceTasksTemplateFile = process.argv[5];
  if (nonInterfaceTasksTemplateFile == '' || nonInterfaceTasksTemplateFile == undefined) {
    console.log('Invalid non interface task template file');
    process.exit();
  }
  // Read sentence file
  const sentencesString = fs.readFileSync(sentencesFile).toString();
  const sentencesJsonArray: Sentence[] = JSON.parse(sentencesString)

  // Read worker file
  const workerIds = fs.readFileSync(workerIdFile).toString().split('\n').filter(id => id.length);

  // Read interface template file
  const interfaceTaskTemplate: {[key: string]: Task} = JSON.parse(fs.readFileSync(interfaceTaskTemplateFile).toString())

  // Read non interface template file
  const nonInterfaceTaskTemplate: {[key: string]: Task} = JSON.parse(fs.readFileSync(nonInterfaceTasksTemplateFile).toString())


  const numberOfWorkers = workerIds.length
  if (numberOfWorkers%3 != 0) {
    console.log(`Invalid worker length: ${numberOfWorkers}, should be divisble by three`);
    process.exit();
  }

  if (sentencesJsonArray.length %SENTENCE_SET_SIZE != 0 && sentencesJsonArray.length != numberOfWorkers) {
    console.log(`Invalid sentence length: ${sentencesJsonArray.length}`);
    process.exit();
  }

  const sentenceSet: Sentence[][] = []

  for (var g=0; g<(sentencesJsonArray.length)/SENTENCE_SET_SIZE; g++) {
    sentenceSet.push(sentencesJsonArray.slice(g*SENTENCE_SET_SIZE, (g+1)*SENTENCE_SET_SIZE))
  }

  const workerSetLength = numberOfWorkers/NUMBER_OF_GROUPS

  // Start Task creation
  // 1. Create quiz task
  await createQuizTask(nonInterfaceTaskTemplate)

  // 2. Create translation tasks
  for (var g=0; g<NUMBER_OF_GROUPS; g++) {
    const sentenceSubset = sentenceSet.slice(g*NUMBER_OF_INTERFACES, (g+1)*NUMBER_OF_INTERFACES)
    console.log(sentenceSubset.length, "YES", sentenceSet.length)
    for (var w=(g*workerSetLength); w<(g+1)*workerSetLength; w++) {
        for (var s = 0; s<6; s++) {
            const task = await createInterfaceTasks(g+1, w+1, s+1, interfaceTaskTemplate, sentenceSubset[s])
        }
        // Rotate the set
        const firstSet = sentenceSet.shift()!!
        sentenceSet.push(firstSet)
    }
  }

  //3. Create scoring tasks
  await createScoringTasks(nonInterfaceTaskTemplate)

})().finally(() => knex.destroy());
