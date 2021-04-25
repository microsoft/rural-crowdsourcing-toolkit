// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Generate the list of fields that can be provided as a filter on a GET query
 * to a table.
 */

import { openingComment, prettierOptions } from '../parsers/Common';
import { tables } from '../parsers/TableParser';

import prettier from 'prettier';

export function tableFilterColumnsFileData(): string {
  const tableFilterColumns: { [id: string]: string[] } = {};
  Object.entries(tables).forEach(([tname, tinfo]) => {
    tableFilterColumns[tname] = Object.keys(tinfo.fields).filter((field) =>
      tinfo.fields[field].options.includes('filter')
    );
  });

  const tableFilterColumnsData = `
${openingComment}

import { DbRecordType, DbTableName } from './TableInterfaces';

export const tableFilterColumns: { [key in DbTableName]: (keyof DbRecordType<key>)[]} = ${JSON.stringify(
    tableFilterColumns
  )}
`;

  return prettier.format(tableFilterColumnsData, prettierOptions);
}
