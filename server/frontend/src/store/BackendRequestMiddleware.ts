// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Redux middleware to complete backend requests and dispatch relevant actions
 * to the store.
 */

import { backendRequest } from './apis/APIs.auto';
import { AllActions } from './Index';

const backendRequestMiddleware = ({ dispatch }: any) => (next: any) => async (action: AllActions) => {
  // Pass through the request
  const response = await next(action);

  if (action.type !== 'BR_INIT') {
    return response;
  }

  const responseAction = await backendRequest(action);
  dispatch(responseAction);

  return response;
};

export default backendRequestMiddleware;
