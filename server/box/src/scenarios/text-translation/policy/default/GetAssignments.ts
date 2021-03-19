// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    MicrotaskGroupRecord,
    MicrotaskRecord,
} from '../../../../db/TableInterfaces.auto';
import * as MicroTaskModel from '../../../../models/MicroTaskModel';
import { IPolicy } from '../../../common/PolicyInterface'
import { TextTranslationDefaultPolicyParams } from './Index';

/**
 * Assign work to the worker at a microtask granularity.
 * @param worker Worker record
 * @param task Task record
 * @param taskAssignment Task assignment record
 * @param policy Policy record
 */
 export const getAssignableMicrotasks: IPolicy['getAssignableMicrotasks'] = async (
    worker,
    task,
    taskAssignment,
    policy,
  ): Promise<MicrotaskRecord[]> => {
    const taskAssignmentParams = taskAssignment.params as TextTranslationDefaultPolicyParams;
    const numTranslations = taskAssignmentParams.numRecordings;

    // get available microtasks
    const microtasks = await MicroTaskModel.getAssignableMicrotasks(
        task,
        worker,
        numTranslations,
    );
    return microtasks;
  };

/**
 * Return assignable stories (groups) to a worker. Not applicable to the text
 * translation scenario.
 * @param worker Worker record
 * @param task Task record
 * @param taskAssignment Task assignment record
 * @param policy Policy record
 */
export const getAssignableMicrotaskGroups: IPolicy['getAssignableMicrotaskGroups'] = async (
    worker,
    task,
    taskAssignment,
    policy,
  ): Promise<MicrotaskGroupRecord[]> => {
    throw new Error('Text Translation scenario performs microtask level assignments');
  };