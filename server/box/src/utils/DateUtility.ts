// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import moment = require('moment');
export function getPostgresDateFormat(date: Date): string {
  return moment(new Date())
    .format('YYYY-MM-DD HH:mm:ss')
    .toString();
}
