// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Database level generators.

import { DatabaseSpec } from '../SchemaInterface';
import { typescriptTableRecordSpec } from './TableGenerators';

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
  const tsTablesSpec = Object.keys(tables).map((name) => {
    const tableSpec = tables[name as T];
    return typescriptTableRecordSpec(name, tableSpec);
  });

  return `
  import * as Custom from '${customTypePath}';
  
  // Table type interfaces
  ${tsTablesSpec.join('\n')}`;
}
