/**
 * This file was auto-generated using specs and scripts in the db-schema
 * repository. DO NOT EDIT DIRECTLY.
 */

import * as DBT from '@karya/core';
import { AuthHeader } from '../../db/Auth.extra';
import { GET, handleError, POST, PUT } from './HttpUtils';

export type DbParamsType<Table extends DBT.DbTableName> = Table extends 'server_user'
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
      store: 'server_user';
      label: 'GENERATE_CC';
      request: DBT.ServerUser;
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
    };

export type StoreList = BackendRequestInitAction['store'];

export type BackendRequestSuccessAction =
  | {
      type: 'BR_SUCCESS';
      store: 'server_user';
      label: 'GENERATE_CC';
      response: DBT.ServerUserRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'server_user';
      label: 'GET_ALL';
      response: DBT.ServerUserRecord[];
    }
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
      store: 'task_assignment';
      label: 'CREATE';
      response: DBT.TaskAssignmentRecord;
    }
  | {
      type: 'BR_SUCCESS';
      store: 'task_assignment';
      label: 'GET_ALL';
      response: DBT.TaskAssignmentRecord[];
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

    if (action.store === 'server_user' && action.label === 'GENERATE_CC') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST('/server_user/generate/cc', action.request, {}, action.files),
      } as BackendRequestSuccessAction;
    }
    if (action.store === 'auth' && action.label === 'SIGN_UP') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await PUT('/server_user/update/cc', action.request, action.files),
      } as BackendRequestSuccessAction;
    }
    if (action.store === 'auth' && action.label === 'SIGN_IN') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST('/server_user/sign/in', action.request, action.headers, action.files),
      } as BackendRequestSuccessAction;
    }
    if (action.store === 'auth' && action.label === 'AUTO_SIGN_IN') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST('/server_user/sign/in', action.request, {}, action.files),
      } as BackendRequestSuccessAction;
    }
    if (action.store === 'auth' && action.label === 'SIGN_OUT') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await PUT('/server_user/sign/out', action.request, action.files),
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
