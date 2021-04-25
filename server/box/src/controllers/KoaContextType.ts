// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Defining the Koa context type with the appropriate state */

import { ParameterizedContext } from 'koa';
import { DbTableName, WorkerRecord } from '@karya/common';

/** Karya state */
type KaryaState = {
  tableName: DbTableName;
  filter: object;
  current_user: WorkerRecord;
};

/** Karya-specific context for Koa */
export type KaryaHTTPContext = ParameterizedContext<KaryaState>;
export type KaryaMiddleware = (ctx: KaryaHTTPContext, next: () => Promise<any>) => void;
