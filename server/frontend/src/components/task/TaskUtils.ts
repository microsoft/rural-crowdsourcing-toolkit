// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Utility functions for rendering task components */

import { TaskRecord, TaskStatus } from '@karya/common';

// task status function
export const taskStatus = (task: TaskRecord): string => {
  switch (task.status) {
    case 'submitted':
      return 'Submitted';
    case 'approved':
      return 'Approved';
    case 'completed':
      return 'Completed';
  }
};

// Statuses in which the task can be edited, validated, or approved
export const editStatuses: TaskStatus[] = ['submitted'];
export const validateStatuses: TaskStatus[] = ['submitted'];
export const approveStatuses: TaskStatus[] = ['submitted'];
