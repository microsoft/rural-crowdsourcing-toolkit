// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Column level generators.

import { TableColumnSpec, TableColumnType } from '../SchemaInterface';

/**
 * Return the typescript type for a specific column
 * @param ctype Table column type
 * @param name Name of the column
 * @returns Type script type for the column
 */
function typescriptType<T extends string, S extends string, O extends string>(
  ctype: TableColumnType<T, S, O>,
  name: string
): string {
  switch (ctype[0]) {
    case 'bigserial':
      return 'string';
    case 'bigint':
      return 'string';
    case 'float':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'string':
      return ctype[2] ? `Custom.${ctype[2]}` : 'string';
    case 'text':
      return 'string';
    case 'timestamp':
      return 'string';
    case '>':
      return 'string';
    case 'stringarray':
      return `{ ${name}: string[] }`;
    case 'kv':
      return '{ [id: string]: string }';
    case 'object':
      return ctype[1] ? `Custom.${ctype[1]}` : 'object';
  }
}

/**
 * Generate typescript definition for a column given a spec
 * @param spec Specification of the column
 * @returns Typescript description for the column
 */
export function typescriptColumnSpec<T extends string, S extends string, O extends string>(
  spec: TableColumnSpec<T, S, O>
): string {
  const name = spec[0];
  const ctype = spec[1];
  const nullable = spec[3];
  const tsType = typescriptType(ctype, name);
  return nullable == 'nullable' ? `${name}: ${tsType} | null` : `${name}: ${tsType}`;
}
