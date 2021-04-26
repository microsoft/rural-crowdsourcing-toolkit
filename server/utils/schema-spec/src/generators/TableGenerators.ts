// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Table level generators.

import camelcase from 'camelcase';
import { TableSpec } from '../SchemaInterface';
import { typescriptColumnSpec } from './ColumnGenerators';

/**
 * Generate the typescript name for a table. Converts given name to pascal case.
 * @param name Name of the table
 * @returns Typescript name for the table
 */
export function typescriptTableName(name: string): string {
  return camelcase(name, { pascalCase: true });
}

/**
 * Generate the typescript table record spec for a table
 * @param name Name of the table
 * @param spec Spec for the table
 * @param suffix Suffix to be appended to the table type name
 */
export function typescriptTableRecordSpec<T extends string, S extends string, O extends string>(
  name: string,
  spec: TableSpec<T, S, O>,
  suffix: string = 'Record'
): string {
  const columns = spec.columns;
  const tsColSpecs = columns.map((column) => typescriptColumnSpec(column));
  const tableType = typescriptTableName(name);
  return `
  export type ${tableType}${suffix} = {
    ${tsColSpecs.join('\n')}
  }`;
}
