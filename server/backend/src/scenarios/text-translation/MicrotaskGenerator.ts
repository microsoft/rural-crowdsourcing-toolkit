// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Microtask generator for the speech-data scenario. The function assumes that
// the task has already been validated.

import { Microtask, MicrotaskGroup }from '../../db/TableInterfaces.auto'
import * as BlobStore from '../../utils/AzureBlob';
import { MicrotaskGeneratorResponse } from '../common/ScenarioInterface';
import { TextTranslationTask } from './ParamDefinitions'

import * as BasicModel from '../../models/BasicModel';

export async function generateMicrotasks(
    task: TextTranslationTask,
): Promise<MicrotaskGeneratorResponse> {

    try {
        const {sentenceFile, creditsPerTranslation, needVerification } = task.params
        const sentenceFileData = await BlobStore.downloadBlobAsText(sentenceFile);
        const sentences: string[] = JSON.parse(sentenceFileData)

        if (needVerification) {
            // TODO: Chain Verification task when one is created
        }

        const microtasks = sentences.map(sentence => {
            const m_info: Microtask = {
              task_id: task.id,
              input: { data: sentence },
              deadline: task.deadline,
              credits: creditsPerTranslation,
              status: 'incomplete',
            };
            return { m_info };
          });

          return { success: true, microtaskGroups: [{ mg_info: null, microtasks }] }
    } catch (e) {
        return {
            success: false,
            message: 'Unknown error while generating microtasks',
        }
    }
    
}