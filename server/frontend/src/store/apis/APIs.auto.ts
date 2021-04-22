/**
 * This file was auto-generated using specs and scripts in the db-schema
 * repository. DO NOT EDIT DIRECTLY.
 */

import * as DBT from '@karya/db';
import { GET, handleError, POST, PUT } from './HttpUtils';

export type DbParamsType<Table extends DBT.DbTableName> = Table extends 'language'
  ? 'DBT.Language'
  : Table extends 'work_provider'
  ? 'DBT.WorkProvider'
  : Table extends 'box'
  ? 'DBT.Box'
  : Table extends 'worker'
  ? 'DBT.Worker'
  : Table extends 'karya_file'
  ? 'DBT.KaryaFile'
  : Table extends 'task'
  ? 'DBT.Task'
  : Table extends 'microtask_group'
  ? 'DBT.MicrotaskGroup'
  : Table extends 'microtask'
  ? 'DBT.Microtask'
  : Table extends 'task_assignment'
  ? 'DBT.TaskAssignment'
  : Table extends 'microtask_group_assignment'
  ? 'DBT.MicrotaskGroupAssignment'
  : Table extends 'microtask_assignment'
  ? 'DBT.MicrotaskAssignment & { limit?: number; }'
  : Table extends 'payout_info'
  ? 'DBT.PayoutInfo'
  : Table extends 'payment_request'
  ? 'DBT.PayoutInfo & DBT.PaymentRequest'
  : never;

export type BackendRequestInitAction =
  | {
      type: 'BR_INIT';
      store: 'language';
      label: 'CREATE';
      request: DBT.Language;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'language';
      label: 'UPDATE_BY_ID';
      id: string;
      request: DBT.Language;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'language';
      label: 'GET_BY_ID';
      id: string;
    }
  | {
      type: 'BR_INIT';
      store: 'language';
      label: 'GET_ALL';
      params: DBT.Language;
    }
  | {
      type: 'BR_INIT';
      store: 'work_provider';
      label: 'GET_BY_ID';
      id: string;
    }
  | {
      type: 'BR_INIT';
      store: 'work_provider';
      label: 'UPDATE_BY_ID';
      id: string;
      request: DBT.WorkProvider;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'work_provider';
      label: 'GENERATE_CC';
      request: DBT.WorkProvider;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'work_provider';
      label: 'GET_ALL';
      params: DBT.WorkProvider;
    }
  | {
      type: 'BR_INIT';
      store: 'auth';
      label: 'SIGN_UP';
      request: DBT.WorkProvider;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'auth';
      label: 'SIGN_IN';
      headers: { 'auth-provider': DBT.AuthProviderType; 'id-token': string };
      request: {};
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'auth';
      label: 'AUTO_SIGN_IN';
      request: {};
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'auth';
      label: 'SIGN_OUT';
      request: {};
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'box';
      label: 'GENERATE_CC';
      request: DBT.Box;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'box';
      label: 'UPDATE_BY_ID';
      id: string;
      request: DBT.Box;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'box';
      label: 'GET_BY_ID';
      id: string;
    }
  | {
      type: 'BR_INIT';
      store: 'box';
      label: 'GET_ALL';
      params: DBT.Box;
    }
  | {
      type: 'BR_INIT';
      store: 'worker';
      label: 'UPDATE_BY_ID';
      id: string;
      request: DBT.Worker;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'worker';
      label: 'GET_BY_ID';
      id: string;
    }
  | {
      type: 'BR_INIT';
      store: 'worker';
      label: 'GET_ALL';
      params: DBT.Worker;
    }
  | {
      type: 'BR_INIT';
      store: 'karya_file';
      label: 'CREATE';
      request: DBT.KaryaFile;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'karya_file';
      label: 'UPDATE_BY_ID';
      id: string;
      request: DBT.KaryaFile;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'karya_file';
      label: 'GET_BY_ID';
      id: string;
    }
  | {
      type: 'BR_INIT';
      store: 'karya_file';
      label: 'GET_ALL';
      params: DBT.KaryaFile;
    }
  | {
      type: 'BR_INIT';
      store: 'task';
      label: 'CREATE';
      request: DBT.Task;
      files: { [id: string]: File };
    }
  | {
      type: 'BR_INIT';
      store: 'task';
      label: 'GET_BY_ID';
      id: string;
    }
  | {
      type: 'BR_INIT';
      store: 'task';
      label: 'UPDATE_BY_ID';
      id: string;
      request: DBT.Task;
      files: { [id: string]: File };
    }
  | {
      type: 'BR_INIT';
      store: 'task';
      label: 'GET_ALL';
      params: DBT.Task;
    }
  | {
      type: 'BR_INIT';
      store: 'task';
      label: 'VALIDATE';
      id: string;
      request: {};
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'task';
      label: 'APPROVE';
      id: string;
      request: {};
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'microtask_group';
      label: 'GET_BY_ID';
      id: string;
    }
  | {
      type: 'BR_INIT';
      store: 'microtask_group';
      label: 'GET_ALL';
      params: DBT.MicrotaskGroup;
    }
  | {
      type: 'BR_INIT';
      store: 'microtask';
      label: 'GET_BY_ID';
      id: string;
    }
  | {
      type: 'BR_INIT';
      store: 'microtask';
      label: 'GET_ALL';
      params: DBT.Microtask;
    }
  | {
      type: 'BR_INIT';
      store: 'microtask';
      label: 'GET_ALL_WITH_COMPLETED';
      params: DBT.Microtask;
    }
  | {
      type: 'BR_INIT';
      store: 'task_assignment';
      label: 'CREATE';
      request: DBT.TaskAssignment;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'task_assignment';
      label: 'UPDATE_BY_ID';
      id: string;
      request: DBT.TaskAssignment;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'task_assignment';
      label: 'GET_BY_ID';
      id: string;
    }
  | {
      type: 'BR_INIT';
      store: 'task_assignment';
      label: 'GET_ALL';
      params: DBT.TaskAssignment;
    }
  | {
      type: 'BR_INIT';
      store: 'microtask_group_assignment';
      label: 'UPDATE_BY_ID';
      id: string;
      request: DBT.MicrotaskGroupAssignment;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'microtask_group_assignment';
      label: 'GET_BY_ID';
      id: string;
    }
  | {
      type: 'BR_INIT';
      store: 'microtask_group_assignment';
      label: 'GET_ALL';
      params: DBT.MicrotaskGroupAssignment;
    }
  | {
      type: 'BR_INIT';
      store: 'microtask_assignment';
      label: 'GET_ALL';
      params: DBT.MicrotaskAssignment & { limit?: number };
    }
  | {
      type: 'BR_INIT';
      store: 'microtask_assignment';
      label: 'UPDATE_BY_ID';
      id: string;
      request: DBT.MicrotaskAssignment;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'microtask_assignment';
      label: 'GET_BY_ID';
      id: string;
    }
  | {
      type: 'BR_INIT';
      store: 'payout_info';
      label: 'UPDATE_BY_ID';
      id: string;
      request: DBT.PayoutInfo;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'payout_info';
      label: 'GET_BY_ID';
      id: string;
    }
  | {
      type: 'BR_INIT';
      store: 'payout_info';
      label: 'GET_ALL';
      params: DBT.PayoutInfo;
    }
  | {
      type: 'BR_INIT';
      store: 'payment_request';
      label: 'GET_ALL';
      params: DBT.PayoutInfo & DBT.PaymentRequest;
    }
  | {
      type: 'BR_INIT';
      store: 'payment_request';
      label: 'UPDATE_BY_ID';
      id: string;
      request: DBT.PaymentRequest;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'payment_request';
      label: 'GET_BY_ID';
      id: string;
    };

export type StoreList = BackendRequestInitAction['store'];

export type BackendRequestSuccessAction =
  | {
      type: 'BR_SUCCESS';
      store: 'language';
      label: 'CREATE';
      response: DBT.LanguageRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'language';
      label: 'UPDATE_BY_ID';
      response: DBT.LanguageRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'language';
      label: 'GET_BY_ID';
      response: DBT.LanguageRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'language';
      label: 'GET_ALL';
      response: DBT.LanguageRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'work_provider';
      label: 'GET_BY_ID';
      response: DBT.WorkProviderRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'work_provider';
      label: 'UPDATE_BY_ID';
      response: DBT.WorkProviderRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'work_provider';
      label: 'GENERATE_CC';
      response: DBT.WorkProviderRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'work_provider';
      label: 'GET_ALL';
      response: DBT.WorkProviderRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'auth';
      label: 'SIGN_UP';
      response: DBT.WorkProviderRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'auth';
      label: 'SIGN_IN';
      response: DBT.WorkProviderRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'auth';
      label: 'AUTO_SIGN_IN';
      response: DBT.WorkProviderRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'auth';
      label: 'SIGN_OUT';
      response: {};
    }
  | {
      type: 'BR_SUCCESS';
      store: 'box';
      label: 'GENERATE_CC';
      response: DBT.BoxRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'box';
      label: 'UPDATE_BY_ID';
      response: DBT.BoxRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'box';
      label: 'GET_BY_ID';
      response: DBT.BoxRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'box';
      label: 'GET_ALL';
      response: DBT.BoxRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'worker';
      label: 'UPDATE_BY_ID';
      response: DBT.WorkerRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'worker';
      label: 'GET_BY_ID';
      response: DBT.WorkerRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'worker';
      label: 'GET_ALL';
      response: DBT.WorkerRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'karya_file';
      label: 'CREATE';
      response: DBT.KaryaFileRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'karya_file';
      label: 'UPDATE_BY_ID';
      response: DBT.KaryaFileRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'karya_file';
      label: 'GET_BY_ID';
      response: DBT.KaryaFileRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'karya_file';
      label: 'GET_ALL';
      response: DBT.KaryaFileRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'task';
      label: 'CREATE';
      response: DBT.TaskRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'task';
      label: 'GET_BY_ID';
      response: DBT.TaskRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'task';
      label: 'UPDATE_BY_ID';
      response: DBT.TaskRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'task';
      label: 'GET_ALL';
      response: DBT.TaskRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'task';
      label: 'VALIDATE';
      response: DBT.TaskRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'task';
      label: 'APPROVE';
      response: DBT.TaskRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'microtask_group';
      label: 'GET_BY_ID';
      response: DBT.MicrotaskGroupRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'microtask_group';
      label: 'GET_ALL';
      response: DBT.MicrotaskGroupRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'microtask';
      label: 'GET_BY_ID';
      response: DBT.MicrotaskRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'microtask';
      label: 'GET_ALL';
      response: DBT.MicrotaskRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'microtask';
      label: 'GET_ALL_WITH_COMPLETED';
      response: DBT.MicrotaskRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'task_assignment';
      label: 'CREATE';
      response: DBT.TaskAssignmentRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'task_assignment';
      label: 'UPDATE_BY_ID';
      response: DBT.TaskAssignmentRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'task_assignment';
      label: 'GET_BY_ID';
      response: DBT.TaskAssignmentRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'task_assignment';
      label: 'GET_ALL';
      response: DBT.TaskAssignmentRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'microtask_group_assignment';
      label: 'UPDATE_BY_ID';
      response: DBT.MicrotaskGroupAssignmentRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'microtask_group_assignment';
      label: 'GET_BY_ID';
      response: DBT.MicrotaskGroupAssignmentRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'microtask_group_assignment';
      label: 'GET_ALL';
      response: DBT.MicrotaskGroupAssignmentRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'microtask_assignment';
      label: 'GET_ALL';
      response: {
        assignments: DBT.MicrotaskAssignmentRecord[];
        files: DBT.KaryaFileRecord[];
      };
    }
  | {
      type: 'BR_SUCCESS';
      store: 'microtask_assignment';
      label: 'UPDATE_BY_ID';
      response: DBT.MicrotaskAssignmentRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'microtask_assignment';
      label: 'GET_BY_ID';
      response: DBT.MicrotaskAssignmentRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'payout_info';
      label: 'UPDATE_BY_ID';
      response: DBT.PayoutInfoRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'payout_info';
      label: 'GET_BY_ID';
      response: DBT.PayoutInfoRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'payout_info';
      label: 'GET_ALL';
      response: DBT.PayoutInfoRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'payment_request';
      label: 'GET_ALL';
      response: DBT.PaymentRequestRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'payment_request';
      label: 'UPDATE_BY_ID';
      response: DBT.PaymentRequestRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'payment_request';
      label: 'GET_BY_ID';
      response: DBT.PaymentRequestRecord;
    };

export type BackendRequestFailureAction = {
  type: 'BR_FAILURE';
  label: BackendRequestInitAction['label'];
  store: StoreList;
  messages: string[];
};

export async function backendRequest(
  action: BackendRequestInitAction,
): Promise<BackendRequestSuccessAction | BackendRequestFailureAction> {
  const { store, label } = action;
  try {
    // GET_BY_ID actions
    if (action.label === 'GET_BY_ID') {
      const endpoint = `${store}/${action.id}`;
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET(endpoint),
      } as BackendRequestSuccessAction;
    }

    // GET_ALL actions
    if (action.label === 'GET_ALL') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET(store, action.params),
      } as BackendRequestSuccessAction;
    }

    // UPDATE_BY_ID actions
    if (action.label === 'UPDATE_BY_ID') {
      const endpoint = `${store}/${action.id}`;
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await PUT(endpoint, action.request, action.files),
      } as BackendRequestSuccessAction;
    }

    // CREATE actions
    if (action.label === 'CREATE') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST(store, action.request, {}, action.files),
      } as BackendRequestSuccessAction;
    }

    if (action.store === 'work_provider' && action.label === 'GENERATE_CC') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST('/work_provider/generate/cc', action.request, {}, action.files),
      } as BackendRequestSuccessAction;
    }
    if (action.store === 'auth' && action.label === 'SIGN_UP') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await PUT('/work_provider/update/cc', action.request, action.files),
      } as BackendRequestSuccessAction;
    }
    if (action.store === 'auth' && action.label === 'SIGN_IN') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST('/work_provider/sign/in', action.request, action.headers, action.files),
      } as BackendRequestSuccessAction;
    }
    if (action.store === 'auth' && action.label === 'AUTO_SIGN_IN') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST('/work_provider/sign/in', action.request, {}, action.files),
      } as BackendRequestSuccessAction;
    }
    if (action.store === 'auth' && action.label === 'SIGN_OUT') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await PUT('/work_provider/sign/out', action.request, action.files),
      } as BackendRequestSuccessAction;
    }
    if (action.store === 'box' && action.label === 'GENERATE_CC') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST('/box/generate/cc', action.request, {}, action.files),
      } as BackendRequestSuccessAction;
    }
    if (action.store === 'task' && action.label === 'VALIDATE') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await PUT('/task/:id/validate'.replace(':id', action.id), action.request, action.files),
      } as BackendRequestSuccessAction;
    }
    if (action.store === 'task' && action.label === 'APPROVE') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await PUT('/task/:id/approve'.replace(':id', action.id), action.request, action.files),
      } as BackendRequestSuccessAction;
    }
    if (action.store === 'microtask' && action.label === 'GET_ALL_WITH_COMPLETED') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET('/microtasks_with_completed_assignments/', action.params),
      } as BackendRequestSuccessAction;
    }

    throw new Error(`Unknown request type '${label}' to '${store}'`);
  } catch (err: any) {
    const messages = handleError(err);
    return {
      type: 'BR_FAILURE',
      label: action.label,
      store: action.store,
      messages,
    };
  }
}
