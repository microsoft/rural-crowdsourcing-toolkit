// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Utility functions for rendering task components */

import { TaskRecord, TaskStatus } from '@karya/db';

// task status function
export const taskStatus = (task: TaskRecord): string => {
  switch (task.status) {
    case 'created':
      return 'Created';
    case 'submitted':
      return 'Submitted';
    case 'validating':
      return 'Validation in Progress';
    case 'validated':
      return 'Validated';
    case 'invalid':
      return 'Invalid';
    case 'approving':
      return 'Approval in Progress';
    case 'approved':
      return 'Approved';
    case 'assigned':
      return 'Assigned';
    case 'completed':
      return 'Completed';
  }
};

// Statuses in which the task can be edited, validated, or approved
export const editStatuses: TaskStatus[] = ['created', 'invalid', 'submitted', 'validated'];
export const validateStatuses: TaskStatus[] = ['submitted'];
export const approveStatuses: TaskStatus[] = ['validated'];
