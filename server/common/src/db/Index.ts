// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Export all auto generated files
export * from './auto/TableInterfaces';

// Export the client and setup function
export { knex, setupDbConnection } from './Client';

// Export table create/delete functions
export { createAllTables } from './auto/CreateFunctions';
export { dropAllTables } from './auto/DropFunctions';

// Export basic models
export * as BasicModel from './models/BasicModel';
export * as MicrotaskModel from './models/MicrotaskModel';
export * as MicrotaskGroupModel from './models/MicrotaskGroupModel';
