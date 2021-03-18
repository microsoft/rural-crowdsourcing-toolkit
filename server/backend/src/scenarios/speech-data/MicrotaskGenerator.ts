// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Microtask generator for the speech-data scenario. The function assumes that
// the task has already been validated.

import { Microtask, Task } from '../../db/TableInterfaces.auto';
import * as BlobStore from '../../utils/AzureBlob';
import { MicrotaskGeneratorResponse } from '../common/ScenarioInterface';
import { SpeechDataTask } from './ParamDefinitions';
import {
  SpeechVerificationScenario,
  SpeechVerificationTask,
} from '../speech-verification/Index';
import * as BasicModel from '../../models/BasicModel';

export async function generateMicrotasks(
  task: SpeechDataTask,
): Promise<MicrotaskGeneratorResponse> {
  try {
    const { sentenceFile, creditsPerRecording, needVerification } = task.params;
    const sentenceFileData = await BlobStore.downloadBlobAsText(sentenceFile);
    const sentences: string[] = JSON.parse(sentenceFileData);

    // If verification is needed, create a verification task
    if (needVerification) {
      const verificationParams: SpeechVerificationTask['params'] = {
        fromSpeechTask: true,
        speechTaskId: task.id,
        numVerifications: 1,
        creditsPerVerification: 0.5,
      };

      const verificationTask: Task = {
        work_provider_id: task.work_provider_id,
        language_id: task.language_id,
        scenario_id: SpeechVerificationScenario.id,
        name: `Verification for ${task.name}`,
        description: task.description,
        primary_language_name: task.primary_language_name,
        primary_language_description: task.primary_language_description,
        params: verificationParams,
        assignment_granularity: 'microtask',
        group_assignment_order: 'either',
        microtask_assignment_order: 'sequential',
        status: 'approved',
      };

      const verificationTaskRecord = await BasicModel.insertRecord(
        'task',
        verificationTask,
      );
      const taskParams = task.params;
      taskParams.verificationTaskId = verificationTaskRecord.id;
      taskParams.outputFiles = [];
      await BasicModel.updateSingle(
        'task',
        { id: task.id },
        { params: taskParams },
      );
    }

    const microtasks = sentences.map(sentence => {
      const m_info: Microtask = {
        task_id: task.id,
        input: { data: sentence },
        deadline: task.deadline,
        credits: creditsPerRecording,
        status: 'incomplete',
      };
      return { m_info };
    });

    return { success: true, microtaskGroups: [{ mg_info: null, microtasks }] };
  } catch (e) {
    return {
      success: false,
      message: 'Unknown error while generating microtasks',
    };
  }
}
