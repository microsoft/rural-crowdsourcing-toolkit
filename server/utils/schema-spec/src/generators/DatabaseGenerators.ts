// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Database level generators.

import { DatabaseSpec } from '../SchemaInterface';
import { knexTableSpec, typescriptTableName, typescriptTableRecordSpec } from './TableGenerators';

/**
 * Generate the typescript table interfaces for the entire database.
 * @param spec Full database specification
 * @param customTypePath Path to the file that defines the custom object/string types
 */
export function typescriptDbInterface<T extends string, S extends string, O extends string>(
  spec: DatabaseSpec<T, S, O>,
  customTypePath: string
): string {
  const tables = spec.tables;
  const tableNames = Object.keys(tables);

  // Table record types
  const tsTablesSpec = tableNames.map((name) => {
    const tableSpec = tables[name as T];
    return typescriptTableRecordSpec(name, tableSpec);
  });

  // Table object types
  const tableObjectTypes = tableNames.map((name) => {
    const tsTableName = typescriptTableName(name);
    return `export type ${tsTableName} = Partial<${tsTableName}Record>`;
  });

  // Db record map
  const tableRecordMap = tableNames.map((name) => {
    const tsTableName = typescriptTableName(name);
    return `T extends '${name}' ? ${tsTableName}Record `;
  });

  // Db object map
  const tableObjectMap = tableNames.map((name) => {
    const tsTableName = typescriptTableName(name);
    return `T extends '${name}' ? ${tsTableName} `;
  });

  return `
  import * as Custom from '${customTypePath}';

  // Table record type interfaces
  ${tsTablesSpec.join('\n')}

  // Table object types
  ${tableObjectTypes.join('\n')}

  // Table name type
  export type DbTableName = '${tableNames.join(`'|'`)}';

  // Db record map
  export type DbRecordType<T extends DbTableName> = ${tableRecordMap.join(':')} : never;

  // Db object map
  export type DbObjectType<T extends DbTableName> = ${tableObjectMap.join(':')} : never;
  `;
}

/**
 * Generate the table functions for all the tables
 * @param spec Full database specification
 */
export function knexDbSpec<T extends string, S extends string, O extends string>(
  spec: DatabaseSpec<T, S, O>,
  knexClientPath: string
): string {
  // Create DB level functions
  const dbFunctions =
    spec.functions?.map(([name, body]) => {
      return `async function create${name}Function() {
      return knex.raw(\`${body}\`)
    }`;
    }) || [];

  const dbFunctionCalls =
    spec.functions?.map(([name, body]) => {
      return `await create${name}Function()`;
    }) || [];

  const tables = spec.tables;
  const knexTableSpecs = Object.keys(tables).map((name) => {
    const tableSpec = tables[name as T];
    return knexTableSpec(name, tableSpec);
  });

  const createTableCalls = Object.keys(tables).map((name) => {
    const tsTableName = typescriptTableName(name);
    return `await create${tsTableName}Table()`;
  });

  const dropTableCalls = Object.keys(tables).map((name) => {
    const tsTableName = typescriptTableName(name);
    return `await drop${tsTableName}Table()`;
  });

  return `
  import { knex } from '${knexClientPath}';

  // Db level functions
  ${dbFunctions.join('\n')}

  // Table functions
  ${knexTableSpecs.join('\n')}

  // Create all tables
  export async function createAllTables() {
    ${dbFunctionCalls.join('\n')}
    ${createTableCalls.join('\n')}
  }

  // Drop all tables
  export async function dropAllTables() {
    ${dropTableCalls.join('\n')}
  }
  `;
}
