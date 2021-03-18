// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Functions to handle controller errors */

import { getPGError } from './PostgreSQLErrors';

export function getControllerError(e: any): string {
  if (e.isPGError) {
    return getPGError(e);
  }
  return `Unknown error occured`;
}
