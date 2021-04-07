// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Generate the data for table interfaces file. This will be used in the backend
 * and the frontend.
 */

import { enums, EnumTypes } from '../parsers/EnumParser';
import { tableNames, tables } from '../parsers/TableParser';

import { openingComment, PG2TSType, prettierOptions, TableType } from '../parsers/Common';

import prettier from 'prettier';

/**
 * Function to generate and return the data for the table interfaces file
 */
export function tableInterfacesFileData(excludedTables: string[] = []): string {
  let filteredTableNames = tableNames;
  excludedTables.forEach((excludedTable) => {
    delete tables[excludedTable];
    filteredTableNames = filteredTableNames.filter((tname) => {
      return excludedTable.indexOf(tname) == -1;
    });
  });
  /** Enum types */
  const enumTypeStrings = Object.entries(enums).map(
    ([ename, values]) => `export type ${EnumTypes[ename]} = '${values.join(`' | '`)}'`
  );

  const boxUpdatableTables: string[] = [];

  /** Table types */
  const tableTypeStrings = Object.entries(tables).map(([tname, tinfo]) => {
    if (tinfo.fields['box_id']) {
      boxUpdatableTables.push(tname);
    }
    const fieldString = Object.entries(tinfo.fields)
      .map(([fname, finfo]) => {
        if (
          finfo.options.includes('not null') ||
          finfo.options.includes('pk') ||
          finfo.type === 'serial' ||
          finfo.type === 'bigserial' ||
          fname === 'id' ||
          fname === 'local_id'
        ) {
          return `${fname}: ${PG2TSType[finfo.type]}`;
        }
        return `${fname}: ${PG2TSType[finfo.type]} | null`;
      })
      .join('\n');
    return `export type ${TableType(tname)}Record = { ${fieldString} }`;
  });

  /** Table partial types */
  const tablePartialsTypeString = filteredTableNames
    .map((tname) => `export type ${TableType(tname)} = Partial<${TableType(tname)}Record>`)
    .join('\n');

  /** Table name type */
  const tableNameTypeString = `export type DbTableName = '${filteredTableNames.join(`' | '`)}'`;

  /** Table name to type template */
  const tableNameToRecordTypeString = `export type DbRecordType<tableName extends DbTableName> = ${filteredTableNames
    .map((t) => `tableName extends '${t}' ? ${TableType(t)}Record`)
    .join(' : ')} : never`;

  /** Table name to type template */
  const tableNameToObjectTypeString = `export type DbObjectType<tableName extends DbTableName> = ${filteredTableNames
    .map((t) => `tableName extends '${t}' ? ${TableType(t)}`)
    .join(' : ')} : never`;

  /** Box updatable tables */
  const boxUpdatableTablesString = `export type BoxUpdatableTables = '${boxUpdatableTables.join(`' | '`)}'`;

  /** Table Interfaces data */
  const tableInterfaces = `\
${openingComment}\n
${enumTypeStrings.join('\n\n')}\n
${tableTypeStrings.join('\n\n')}\n
${tablePartialsTypeString}\n
${tableNameTypeString}\n
${tableNameToRecordTypeString}\n
${tableNameToObjectTypeString}\n
${boxUpdatableTablesString}\n
`;

  return prettier.format(tableInterfaces, prettierOptions);
}
