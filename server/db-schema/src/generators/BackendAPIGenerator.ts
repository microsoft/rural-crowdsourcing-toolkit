/**
 * Generate the auto-generatable APIs for the backend server.
 */

import prettier from 'prettier';
import { routeMap } from '../parsers/APIParser';
import { openingComment, prettierOptions } from '../parsers/Common';

/**
 * Function to generate the backend server API file data
 */
export function backendAPISpecsFileData() {
  const initActions: string[] = [];
  const successActions: string[] = [];
  const extraEndpoint: string[] = [];
  const queryParamsType: string[] = [];

  Object.entries(routeMap).forEach(([tname, routes]) => {
    routes.forEach((route) => {
      const store = `'${tname}'`;
      const queryParams = route.params ? `params: ${route.params};` : '';
      const request = route.request ? `request: ${route.request};` : '';
      const response = `response: ${route.response};`;
      const files = route.file
        ? `files: { [id: string] : File};`
        : route.httpMethod === 'POST' || route.httpMethod === 'PUT'
        ? 'files?: undefined;'
        : '';
      const authHeader = route.auth_header
        ? `headers: { 'auth-provider': DBT.AuthProviderType; 'id-token': string; };`
        : '';
      const pathParams =
        route.method === 'GET_BY_ID' ||
        route.method === 'UPDATE_BY_ID' ||
        route.endpoint.indexOf(':id') > 0
          ? `id: number;`
          : '';

      initActions.push(`{
        type: 'BR_INIT';
        store: ${store};
        label: '${route.label}';
        ${authHeader} ${queryParams} ${pathParams} ${request} ${files} }`);

      successActions.push(`{
        type: 'BR_SUCCESS';
        store: ${store};
        label: '${route.label}';
        ${response} }`);

      if (route.method === 'GET_ALL') {
        queryParamsType.push(`Table extends ${store} ? '${route.params}'`);
      }

      if (
        !['CREATE', 'UPDATE_BY_ID', 'GET_BY_ID', 'GET_ALL'].includes(
          route.label,
        )
      ) {
        let responseQuery: string;
        const header = route.auth_header ? 'action.headers' : '{}';
        const endpoint =
          route.endpoint.indexOf(':id') > 0
            ? `'${route.endpoint}'.replace(':id', action.id.toString())`
            : `'${route.endpoint}'`;
        switch (route.httpMethod) {
          case 'POST':
            responseQuery = `await POST(${endpoint}, action.request, ${header}, action.files)`;
            break;
          case 'PUT':
            responseQuery = `await PUT(${endpoint}, action.request, action.files)`;
            break;
          case 'GET':
            responseQuery = `await GET(${endpoint}, action.params)`;
            break;
        }

        extraEndpoint.push(`\
        if (action.store === ${store} && action.label === '${route.label}') {
          return {
            type: 'BR_SUCCESS',
            store,
            label,
            response: ${responseQuery}
          } as BackendRequestSuccessAction;
        }`);
      }
    });
  });

  const backendEndPointsFileData = `\
${openingComment}

import * as DBT from '../../db/TableInterfaces.auto';
import { GET, handleError, POST, PUT } from './HttpUtils';

export type DbParamsType<Table extends DBT.DbTableName> = ${queryParamsType.join(
    ':',
  )} : never;

export type BackendRequestInitAction = ${initActions.join(' | ')};

export type StoreList = BackendRequestInitAction['store'];

export type BackendRequestSuccessAction = ${successActions.join(' | ')};

export type BackendRequestFailureAction = {
  type: 'BR_FAILURE';
  label: BackendRequestInitAction['label'];
  store: StoreList;
  messages: string[];
};

export async function backendRequest(action: BackendRequestInitAction): Promise<BackendRequestSuccessAction | BackendRequestFailureAction> {
  const { store, label } = action;
  try {
    // GET_BY_ID actions
    if (action.label === 'GET_BY_ID') {
      const endpoint = \`\${store}/\${action.id.toString()}\`;
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
        response: await GET(store, action.params)
      } as BackendRequestSuccessAction;
    }

    // UPDATE_BY_ID actions
    if (action.label === 'UPDATE_BY_ID') {
      const endpoint = \`\${store}/\${action.id.toString()}\`;
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await PUT(endpoint, action.request, action.files)
      } as BackendRequestSuccessAction;
    }

    // CREATE actions
    if (action.label === 'CREATE') {
      return {
        type: 'BR_SUCCESS',
        store,
        label,
        response: await POST(store, action.request, {}, action.files)
      } as BackendRequestSuccessAction;
    }

    ${extraEndpoint.join('\n')}

    throw new Error(\`Unknown request type '\${label}' to '\${store}'\`);

  } catch(err: any) {
    const messages = handleError(err);
    return {
      type: 'BR_FAILURE',
      label: action.label,
      store: action.store,
      messages
    }
  }
}
  `;

  return prettier.format(backendEndPointsFileData, prettierOptions);
}
