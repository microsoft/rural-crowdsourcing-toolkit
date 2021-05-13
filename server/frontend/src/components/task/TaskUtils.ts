// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Utility functions for rendering task components */

import { TaskRecord, TaskStatus } from '@karya/core';

// task status function
export const taskStatus = (task: TaskRecord): string => {
  switch (task.status) {
    case 'SUBMITTED':
      return 'Submitted';
    case 'APPROVED':
      return 'Approved';
    case 'COMPLETED':
      return 'Completed';
  }
};

// Statuses in which the task can be edited, validated, or approved
export const editStatuses: TaskStatus[] = ['SUBMITTED'];
export const validateStatuses: TaskStatus[] = ['SUBMITTED'];
export const approveStatuses: TaskStatus[] = ['SUBMITTED'];
