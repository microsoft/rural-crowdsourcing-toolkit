// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Defining the Koa context type with the appropriate state */

import { ParameterizedContext } from 'koa';
import { BoxRecord, DbTableName, WorkProviderRecord } from '@karya/db';

/** Karya state */
type KaryaState = {
  tableName: DbTableName;
  filter: object;
  current_user: WorkProviderRecord;
  current_box: BoxRecord;
};

/** Karya-specific context for Koa */
export type KaryaHTTPContext = ParameterizedContext<KaryaState>;
export type KaryaMiddleware = (ctx: KaryaHTTPContext, next: () => Promise<any>) => void;
