// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Generate the data for the drop table functions file. To be used by both the
 * backend and frontend.
 */

import { openingComment, prettierOptions, TableType } from '../parsers/Common';
import { tableNames } from '../parsers/TableParser';

import prettier from 'prettier';

/**
 * Generate the data for the drop table functions file
 */
export function dropTableFunctionsFileData(excludedTables: string[]): string {
  let filteredTableNames = tableNames;
  excludedTables.forEach((excludedTable) => {
    filteredTableNames = filteredTableNames.filter((tname) => {
      return excludedTable.indexOf(tname) == -1;
    });
  });
  /** Strings to drop functions for individual table */
  const dropTableFunctionStrings = filteredTableNames.map(
    (tname) => `export async function drop${TableType(tname)}Table() {
    return knex.raw('DROP TABLE IF EXISTS ${tname} CASCADE');
  }`,
  );

  /** Function to drop all tables */
  const dropTableCalls = filteredTableNames
    .map((tname) => `await drop${TableType(tname)}Table();`)
    .join('\n');

  const dropAllTableFunction = `\
  export async function dropAllTables() {
    try {
      ${dropTableCalls}
    } catch(e) {
      logger.error(e);
    }
  }`;

  /** Drop table files data */
  const dropTableFunctionsData = `
  ${openingComment}\n
  import logger from '../utils/Logger';\n
  import { knex } from './Client';\n
  ${dropTableFunctionStrings.join('\n\n')}\n
  ${dropAllTableFunction}`;

  return prettier.format(dropTableFunctionsData, prettierOptions);
}
