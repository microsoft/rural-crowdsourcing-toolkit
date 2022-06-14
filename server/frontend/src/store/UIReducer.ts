// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Reducer for global UI state
 */

import { Reducer } from 'redux';
import { ScenarioName } from '@karya/core';

// State type
export type UIState = {
  task_filter: {
    tags_filter: Array<string>;
    scenario_filter?: ScenarioName | 'all';
    show_completed: boolean;
  };
};

const initState: UIState = {
  task_filter: {
    tags_filter: [],
    scenario_filter: 'all',
    show_completed: false,
  },
};

// UI State actions
export type UpdateTaskFilterAction = {
  type: 'UPDATE_TASK_FILTER';
  filter: UIState['task_filter'];
};

type UIActions = UpdateTaskFilterAction;

// UI reducer
const uiReducer: Reducer<UIState, UIActions> = (state = initState, action) => {
  if (action.type !== 'UPDATE_TASK_FILTER') return state;

  // Update task filter
  if (action.type === 'UPDATE_TASK_FILTER') {
    return { ...state, task_filter: action.filter };
  }

  return state;
};

export default uiReducer;
