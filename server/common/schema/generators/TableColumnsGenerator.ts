// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Generate the list of columns for each table.
 */

import { openingComment, prettierOptions } from '../parsers/Common';
import { tables } from '../parsers/TableParser';

import prettier from 'prettier';

export function tableColumnListFileData(): string {
  const tableColumns: { [id: string]: string[] } = {};
  Object.entries(tables).forEach(([tname, tinfo]) => {
    tableColumns[tname] = Object.keys(tinfo.fields);
  });

  const tableColumnsData = `
${openingComment}

import { DbTableName } from './TableInterfaces';

export const tableColumns: { [key in DbTableName]: string[]} = ${JSON.stringify(tableColumns)}`;

  return prettier.format(tableColumnsData, prettierOptions);
}
