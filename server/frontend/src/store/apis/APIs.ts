/**
 * This file was auto-generated using specs and scripts in the db-schema
 * repository. DO NOT EDIT DIRECTLY.
 */

import * as DBT from '@karya/core';
import { LanguageCode } from '@karya/core';
import { AuthHeader } from '../../components/auth/Auth.extra';
import { BulkPaymentsTransactionRequest } from '../../data/Index';
import { ViewName } from '../../data/Views';
import { GET, handleError, POST, PUT } from './HttpUtils';

export type DbParamsType<Table extends DBT.DbTableName | ViewName> = Table extends 'server_user'
  ? 'DBT.ServerUser'
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
  : never;

export type BackendRequestInitAction =
  | {
      type: 'BR_INIT';
      store: 'auth';
      headers: AuthHeader;
      label: 'SIGN_UP';
      request: DBT.ServerUser;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'auth';
      label: 'SIGN_IN';
      headers: AuthHeader;
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
      store: 'server_user';
      label: 'GET_ALL';
      params: DBT.ServerUser;
    }
  | {
      type: 'BR_INIT';
      store: 'server_user';
      label: 'GENERATE_CC';
      request: DBT.ServerUser;
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
      label: 'GET_ALL';
      params: DBT.Box;
    }
  | {
      type: 'BR_INIT';
      store: 'task';
      label: 'CREATE';
      request: DBT.Task;
      files?: undefined;
    }
  | {
      type: 'BR_INIT';
      store: 'task';
      label: 'EDIT_TASK';
      request: DBT.Task;
      task_id: string;
      files?: undefined;
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
      label: 'MARK_COMPLETE';
      task_id: string;
      request: {};
    }
  | {
      type: 'BR_INIT';
      store: 'task_op';
      label: 'SUBMIT_INPUT_FILE';
      task_id: string;
      request: {};
      files: { [id: string]: File };
    }
  | {
      type: 'BR_INIT';
      store: 'task_op';
      label: 'CREATE';
      task_id: string;
      request: {};
    }
  | {
      type: 'BR_INIT';
      store: 'task_op';
      label: 'GET_ALL';
      task_id: string;
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
      label: 'GET_ALL';
      params: DBT.TaskAssignment;
    }
  | {
      type: 'BR_INIT';
      store: 'microtask';
      label: 'GET_ALL';
      task_id: string;
    }
  | {
      type: 'BR_INIT';
      store: 'task_link';
      label: 'CREATE';
      request: DBT.TaskLink;
      task_id: string;
    }
  | {
      type: 'BR_INIT';
      store: 'task_link';
      label: 'GET_ALL';
      task_id: string;
    }
  | {
      type: 'BR_INIT';
      store: 'microtask_assignment';
      label: 'GET_ALL';
    }
  | {
      type: 'BR_INIT';
      store: 'worker';
      label: 'GET_ALL';
      task_id?: string;
    }
  | {
      type: 'BR_INIT';
      store: 'karya_file';
      label: 'CREATE_LANGUAGE_ASSET';
      code: LanguageCode;
      files: { [id: string]: File };
      request: {};
    }
  | {
      type: 'BR_INIT';
      store: 'karya_file';
      label: 'GET_LANGUAGE_ASSETS';
    }
  | {
      type: 'BR_INIT';
      store: 'payments_transaction';
      label: 'GET_ALL'
    } 
  | 
    {
      type: 'BR_INIT';
      store: 'payments_eligible_worker';
      label: 'GET_ALL';
    }
  |
    {
      type: 'BR_INIT';
      store: 'bulk_payments_transaction';
      label: 'GET_ALL';
    }
  |
    {
      type: 'BR_INIT';
      store: 'bulk_payments_transaction';
      request: BulkPaymentsTransactionRequest;
      label: 'CREATE';
    };

export type StoreList = BackendRequestInitAction['store'];

export type BackendRequestSuccessAction =
  | {
      type: 'BR_SUCCESS';
      store: 'auth';
      label: 'SIGN_UP';
      response: DBT.ServerUserRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'auth';
      label: 'SIGN_IN';
      response: DBT.ServerUserRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'auth';
      label: 'AUTO_SIGN_IN';
      response: DBT.ServerUserRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'auth';
      label: 'SIGN_OUT';
      response: {};
    }
  | {
      type: 'BR_SUCCESS';
      store: 'server_user';
      label: 'GET_ALL';
      response: DBT.ServerUserRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'server_user';
      label: 'GENERATE_CC';
      response: DBT.ServerUserRecord;
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
      label: 'GET_ALL';
      response: DBT.BoxRecord[];
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
      label: 'EDIT_TASK';
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
      label: 'MARK_COMPLETE';
      response: DBT.TaskRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'task_op';
      label: 'SUBMIT_INPUT_FILE';
      response: DBT.TaskOpRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'task_op';
      label: 'CREATE';
      response: DBT.TaskOpRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'task_op';
      label: 'GET_ALL';
      response: DBT.TaskOpRecord[];
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
      label: 'GET_ALL';
      response: DBT.TaskAssignmentRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'microtask_assignment';
      label: 'GET_ALL';
      response: any;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'task_link';
      label: 'CREATE';
      response: DBT.TaskLinkRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'task_link';
      label: 'GET_ALL';
      response: DBT.TaskLinkRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'microtask_assignment';
      label: 'GET_ALL';
      response: DBT.MicrotaskAssignmentRecord[];
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
      label: 'CREATE_LANGUAGE_ASSET';
      response: DBT.KaryaFileRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'karya_file';
      label: 'GET_LANGUAGE_ASSETS';
      response: DBT.KaryaFileRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'payments_transaction';
      label: 'GET_ALL';
      response: DBT.PaymentsTransaction[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'payments_eligible_worker';
      label: 'GET_ALL';
      response: (DBT.WorkerRecord & {amount: number})[] ;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'bulk_payments_transaction';
      label: 'GET_ALL';
      response: DBT.BulkPaymentsTransactionRecord[];
    }
  | {
      type: 'BR_SUCCESS';
      store: 'bulk_payments_transaction';
      label: 'CREATE';
      response: DBT.BulkPaymentsTransactionRecord;
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
    // Server user registration
    if (action.store === 'auth' && action.label === 'SIGN_UP') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await PUT('/server_user/register', action.request, action.files, action.headers),
      } as BackendRequestSuccessAction;
    }

    // Server user login
    if (action.store === 'auth' && action.label === 'SIGN_IN') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET('/server_user/login', {}, action.headers),
      } as BackendRequestSuccessAction;
    }

    // Server user auto login (with id token)
    if (action.store === 'auth' && action.label === 'AUTO_SIGN_IN') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET('/server_user'),
      } as BackendRequestSuccessAction;
    }

    // Server user logout
    if (action.store === 'auth' && action.label === 'SIGN_OUT') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET('/server_user/logout'),
      } as BackendRequestSuccessAction;
    }

    // Get all server users
    if (action.store === 'server_user' && action.label === 'GET_ALL') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET('/server_users'),
      } as BackendRequestSuccessAction;
    }

    // Create new server user record
    if (action.store === 'server_user' && action.label === 'GENERATE_CC') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST('/server_users', action.request, {}),
      } as BackendRequestSuccessAction;
    }

    // Get all boxes
    if (action.store === 'box' && action.label === 'GET_ALL') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET('/boxes'),
      } as BackendRequestSuccessAction;
    }

    // Create a new box
    if (action.store === 'box' && action.label === 'GENERATE_CC') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST('/boxes', action.request, {}),
      } as BackendRequestSuccessAction;
    }

    // Get all tasks
    if (action.store === 'task' && action.label === 'GET_ALL') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET('/tasks'),
      } as BackendRequestSuccessAction;
    }

    // Create a new task
    if (action.store === 'task' && action.label === 'CREATE') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST('/tasks', action.request),
      } as BackendRequestSuccessAction;
    }

    // Edit a task
    if (action.store === 'task' && action.label === 'EDIT_TASK') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await PUT(`/task/${action.task_id}`, action.request),
      } as BackendRequestSuccessAction;
    }

    // Mark a task as completed
    if (action.store === 'task' && action.label === 'MARK_COMPLETE') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await PUT(`/task/${action.task_id}/mark_complete`, {}),
      } as BackendRequestSuccessAction;
    }

    // Submit input files for a task
    if (action.store === 'task_op' && action.label === 'SUBMIT_INPUT_FILE') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST(`/task/${action.task_id}/input_files`, {}, {}, action.files),
      } as BackendRequestSuccessAction;
    }

    // Create output generation task op for a task
    if (action.store === 'task_op' && action.label === 'CREATE') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST(`/task/${action.task_id}/output_file`, {}),
      } as BackendRequestSuccessAction;
    }

    // Get input and output files of a task
    if (action.store === 'task_op' && action.label === 'GET_ALL') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET(`/task/${action.task_id}/input_files`),
      } as BackendRequestSuccessAction;
    }

    // Get all task assignments
    if (action.store === 'task_assignment' && action.label === 'GET_ALL') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET('/task_assignments', action.params),
      } as BackendRequestSuccessAction;
    }

    // Create new task assignment
    if (action.store === 'task_assignment' && action.label === 'CREATE') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST('/task_assignments', action.request, {}),
      } as BackendRequestSuccessAction;
    }

    // Get all microtask info for a particular task
    if (action.store === 'microtask' && action.label === 'GET_ALL') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET(`/task/${action.task_id}/microtask_summary`),
      } as BackendRequestSuccessAction;
    }

    // Get all task links
    if (action.store === 'task_link' && action.label === 'GET_ALL') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET(`/task/${action.task_id}/task_links`),
      } as BackendRequestSuccessAction;
    }

    // Create new task assignment
    if (action.store === 'task_link' && action.label === 'CREATE') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST(`/task/${action.task_id}/task_links`, action.request),
      } as BackendRequestSuccessAction;
    }

    // Get summary info for all tasks
    if (action.store === 'microtask_assignment' && action.label === 'GET_ALL') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET('/task/summary'),
      } as BackendRequestSuccessAction;
    }

    // Get summary info for workers
    if (action.store === 'worker' && action.label === 'GET_ALL') {
      if (action.task_id !== undefined) {
        return {
          type: 'BR_SUCCESS',
          store,
          label,
          response: await GET(`/task/${action.task_id}/worker_summary`),
        } as BackendRequestSuccessAction;
      } else {
        return {
          type: 'BR_SUCCESS',
          store,
          label,
          response: await GET('/worker/summary'),
        } as BackendRequestSuccessAction;
      }
    }

    // Submit new language asset file
    if (action.store === 'karya_file' && action.label === 'CREATE_LANGUAGE_ASSET') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST(`/lang-assets/${action.code}`, {}, {}, action.files),
      } as BackendRequestSuccessAction;
    }

    // Get language asset files
    if (action.store === 'karya_file' && action.label === 'GET_LANGUAGE_ASSETS') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET('/lang-assets'),
      } as BackendRequestSuccessAction;
    }

    // Get payment transaction records
    if (action.store === 'payments_transaction' && action.label === 'GET_ALL') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET('/payments/transactions'),
      } as BackendRequestSuccessAction;
    }

    // Get bulk payment transaction records
    if (action.store === 'bulk_payments_transaction' && action.label === 'GET_ALL') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET('/payments/transactions/bulk_payments'),
      } as BackendRequestSuccessAction;
    }

    // Create new bulk payment transaction
    if (action.store === 'bulk_payments_transaction' && action.label === 'CREATE') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST('/payments/transactions/bulk_payments', action.request),
      } as BackendRequestSuccessAction;
    }

    // Get payable workers with their respective amount
    if (action.store === 'payments_eligible_worker' && action.label === 'GET_ALL') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await GET('/payments/worker/eligible'),
      } as BackendRequestSuccessAction;
    }

    ((obj: never) => {
      throw new Error(`Unknown request type '${label}' to '${store}'`);
    })(action);
  } catch (err) {
    const messages = handleError(err);
    return {
      type: 'BR_FAILURE',
      label: action.label,
      store: action.store,
      messages,
    };
  }
}
