// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Reducer for all the stores
 */

// Reducer type
import { Reducer } from 'redux';

// Actions
import { BackendRequestFailureAction, BackendRequestInitAction, BackendRequestSuccessAction } from './apis/APIs.auto';

// Types for state
import { DbRecordType, DbTableName, WorkProviderRecord } from '@karya/db';

// Table state
type RequestStatus = { status: 'IN_FLIGHT' } | { status: 'SUCCESS' } | { status: 'FAILURE'; messages: string[] };

export type StoreState<Table extends DbTableName> = {
  data: Array<DbRecordType<Table>>;
  last_fetched_at: Date;
} & RequestStatus;

// Construct the store state
export type AllState = {
  [id in DbTableName]: StoreState<id>;
} & {
  auth: { cwp: WorkProviderRecord | null } & RequestStatus;
};

// Store actions
type StoreActions = BackendRequestInitAction | BackendRequestSuccessAction | BackendRequestFailureAction;

// Store reducer
type StoreReducer = Reducer<AllState, StoreActions>;

// Initial state
const initState: AllState = {
  language: { data: [], last_fetched_at: new Date(0), status: 'SUCCESS' },
  work_provider: { data: [], last_fetched_at: new Date(0), status: 'SUCCESS' },
  worker: { data: [], last_fetched_at: new Date(0), status: 'SUCCESS' },
  worker_language_skill: { data: [], last_fetched_at: new Date(0), status: 'SUCCESS' },
  task: { data: [], last_fetched_at: new Date(0), status: 'SUCCESS' },
  task_assignment: { data: [], last_fetched_at: new Date(0), status: 'SUCCESS' },
  microtask: { data: [], last_fetched_at: new Date(0), status: 'SUCCESS' },
  microtask_assignment: { data: [], last_fetched_at: new Date(0), status: 'SUCCESS' },
  microtask_group: { data: [], last_fetched_at: new Date(0), status: 'SUCCESS' },
  microtask_group_assignment: { data: [], last_fetched_at: new Date(0), status: 'SUCCESS' },
  payment_request: { data: [], last_fetched_at: new Date(0), status: 'SUCCESS' },
  payout_info: { data: [], last_fetched_at: new Date(0), status: 'SUCCESS' },
  box: { data: [], last_fetched_at: new Date(0), status: 'SUCCESS' },
  karya_file: { data: [], last_fetched_at: new Date(0), status: 'SUCCESS' },
  auth: { cwp: null, status: 'SUCCESS' },
};

// Reducer function
const storeReducer: StoreReducer = (state = initState, action) => {
  // Temporary
  if (action.type !== 'BR_INIT' && action.type !== 'BR_FAILURE' && action.type !== 'BR_SUCCESS') {
    return state;
  }

  // Init action
  if (action.type === 'BR_INIT') {
    const tableState = state[action.store];
    return { ...state, [action.store]: { ...tableState, status: 'IN_FLIGHT' } };
  }

  // Failure action
  if (action.type === 'BR_FAILURE') {
    const tableState = state[action.store];
    if (action.store === 'auth' && (action.label === 'AUTO_SIGN_IN' || action.label === 'SIGN_OUT')) {
      return { ...state, auth: { ...tableState, cwp: null, status: 'SUCCESS' } };
    } else {
      return { ...state, [action.store]: { ...tableState, status: 'FAILURE', messages: action.messages } };
    }
  }

  // action.type === BR_SUCCESS
  const status = 'SUCCESS';

  // Auth actions
  if (action.store === 'auth') {
    if (action.label === 'SIGN_IN' || action.label === 'SIGN_UP' || action.label === 'AUTO_SIGN_IN') {
      return { ...state, auth: { cwp: action.response, status } };
    }
    if (action.label === 'SIGN_OUT') {
      return { ...state, auth: { cwp: null, status } };
    }
  }

  if (action.store === 'microtask_assignment' && action.label === 'GET_ALL') {
    const assignments = action.response.assignments;
    const files = action.response.files;
    return {
      ...state,
      microtask_assignment: {
        data: assignments.sort(defaultSorter),
        last_fetched_at: new Date(),
        status,
      },
      karya_file: {
        data: files,
        last_fetched_at: new Date(),
        status,
      },
    };
  }

  // GET_ALL action
  if (action.label === 'GET_ALL') {
    const { store, response } = action;
    return { ...state, [store]: { data: response.sort(defaultSorter), last_fetched_at: new Date(), status } };
  }

  const last_fetched_at = state[action.store].last_fetched_at;

  // GET_BY_ID action
  if (action.label === 'GET_BY_ID' || action.label === 'UPDATE_BY_ID' || action.label === 'CREATE') {
    const { store, response } = action;
    const oldData = state[store]?.data || [];
    const data = mergeData(oldData, response);
    return { ...state, [store]: { data, last_fetched_at, status } };
  }

  // Handle custom actions

  // Task table
  if (action.store === 'task') {
    const oldData = state.task?.data || [];
    if (action.label === 'APPROVE' || action.label === 'VALIDATE') {
      const { response } = action;
      const data = mergeData(oldData, response);
      return { ...state, task: { data, last_fetched_at, status } };
    }
  }

  // Work provider table
  if (action.store === 'work_provider') {
    if (action.label === 'GENERATE_CC') {
      const oldData = state.work_provider?.data || [];
      const { response } = action;
      const data = mergeData(oldData, response);
      return { ...state, work_provider: { data, last_fetched_at, status } };
    }
  }

  // Box table
  if (action.store === 'box') {
    const oldData = state.box?.data || [];
    if (action.label === 'GENERATE_CC') {
      const { response } = action;
      const data = mergeData(oldData, response);
      return { ...state, box: { data, last_fetched_at, status } };
    }
  }

  // Microtask extra
  if (action.store === 'microtask') {
    if (action.label === 'GET_ALL_WITH_COMPLETED') {
      return { ...state, microtask: { data: action.response, last_fetched_at, status } };
    }
  }

  // All action should be covered by now
  ((obj: never) => {
    // This is a typescript check
  })(action);
  throw new Error('Should never have come here');
};

/**
 * Merge an updated record with a set of existing records
 * @param data Array of records
 * @param updatedRecord Updated record
 */
function mergeData<RecordType extends { id: string }>(
  data: RecordType[] | undefined,
  updatedRecord: RecordType,
): RecordType[] {
  // If data is not yet defined, return singleton
  if (data === undefined) {
    return [updatedRecord];
  }

  // Attempt to find id in data
  const index = data.findIndex((record) => record.id === updatedRecord.id);
  index >= 0 ? (data[index] = updatedRecord) : data.push(updatedRecord);
  return data;
}

/**
 * Default sorting function based on when the record was created
 * @param r1 Record 1
 * @param r2 Record 2
 */
const defaultSorter = (r1: DbRecordType<DbTableName>, r2: DbRecordType<DbTableName>) =>
  r1.created_at < r2.created_at ? -1 : 1;

// Export the reducer
export default storeReducer;
