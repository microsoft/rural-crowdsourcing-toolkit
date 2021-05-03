// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Export all auto generated files
export * from './ng-auto/TableInterfaces';
export * from './types/CustomStrings';

// Export the client and setup function
export { knex, setupDbConnection } from './Client';

// Export table create/delete functions
export * as ServerDbFunctions from './ng-auto/ServerTableFunctions';
export * as BoxDbFunctions from './ng-auto/BoxTableFunctions';

// Export basic models
export * as BasicModel from './models/BasicModel';
export * as MicrotaskModel from './models/MicrotaskModel';
export * as MicrotaskGroupModel from './models/MicrotaskGroupModel';

// Temporary fixes
export { ServerUserRecord as WorkProviderRecord } from './ng-auto/TableInterfaces';
export { ServerUser as WorkProvider } from './ng-auto/TableInterfaces';
