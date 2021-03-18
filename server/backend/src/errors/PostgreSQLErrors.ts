// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { requestLogger } from '../utils/Logger';

/**
 * Function to convert error received from PG into a more parsable message
 * @param error Error received from query execution
 */
export function getPGError(error: any): string {
  if (error.code === '23502') {
    return `${error.column} cannot be empty`;
  } else if (error.code === '23503') {
    return `Invalid value for ${error.column}`;
  } else if (error.code === '23505') {
    return `Column(s) ${error.constraint} have to be unique`;
  } else {
    return `Unknown error occured`;
  }
}

/**
 * Function to log PG error and set a flag to indicate that
 * @param error Error from the database
 */
export function logPGError(error: any) {
  error['karya_message'] = getPGError(error);
  error['isPGError'] = true;
  requestLogger.error(error);
}
