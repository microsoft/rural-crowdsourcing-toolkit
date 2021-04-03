// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Generate the list of tables. Mainly for ordering of updates.
 */

import { openingComment, prettierOptions } from '../parsers/Common';
import { tables } from '../parsers/TableParser';

import prettier from 'prettier';

export function tableListFileData(): string {
  const tableListData = `
${openingComment}

import { DbTableName } from './TableInterfaces.auto';

export const tableList: DbTableName[] = ${JSON.stringify(Object.keys(tables))}`;

  return prettier.format(tableListData, prettierOptions);
}
