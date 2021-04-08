// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Functions to handle controller errors */

export function getControllerError(e: any): string {
  if (e.message) {
    e.message;
  }
  return `Unknown error occured`;
}
