// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**  Import all individual reducers */
import allReducer from './AllReducer';

import { combineReducers } from 'redux';

/**  Create the root reducer */
const rootReducer = combineReducers({
  all: allReducer,
});

/** export root reducer and type of the root state */
export default rootReducer;
export type RootState = ReturnType<typeof rootReducer>;
export type AllActions = Parameters<typeof rootReducer>[1];
