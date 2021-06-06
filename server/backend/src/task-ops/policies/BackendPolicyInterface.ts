// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend policy interface

import {
  AssignmentRecordType,
  BasePolicyInterface,
  MicrotaskRecordType,
  PolicyName,
  PolicyParamsType,
  TaskRecord,
} from '@karya/core';

export interface BackendPolicyInterface<PN extends PolicyName> extends BasePolicyInterface<PN, PolicyParamsType<PN>> {
  /**
   * Determine the verification status of a set of completed assignments.
   * Returns a list of assignments with their verification status, and a
   * corresponding set of microtasks that can be marked as
   * @param assignments List of completed assignments
   * @param microtask List of microtasks with completed assignments
   * @param task Task record
   */
  verify(
    assignments: AssignmentRecordType[],
    microtasks: MicrotaskRecordType[],
    task: TaskRecord<PolicyParamsType<PN>>
  ): Promise<[AssignmentRecordType[], MicrotaskRecordType[]]>;
}
