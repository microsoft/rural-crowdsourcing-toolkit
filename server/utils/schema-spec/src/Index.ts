// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for schema specification module

export * from './SchemaInterface';

import { knexDbSpec, typescriptDbInterface } from './generators/DatabaseGenerators';
import prettier, { Options as PrettierOptions } from 'prettier';
import fs from 'fs';
import { DatabaseSpec } from './SchemaInterface';

// Read the formatter config
const prettierconfig: PrettierOptions = {
  parser: 'typescript',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  printWidth: 120,
};

const format = (source: string) => prettier.format(source, prettierconfig);

/**
 * Write the database typescript interface into a given file
 * @param dbSpec Database specification
 * @param fileName Path to the file to write the typescript interface
 */
export function writeTypescriptInterfaceFile<T extends string, S extends string, O extends string>(
  dbSpec: DatabaseSpec<T, S, O>,
  customTypePath: string,
  fileName: string
) {
  const data = typescriptDbInterface(dbSpec, customTypePath);
  fs.writeFileSync(fileName, format(data));
}

/**
 * Write the database create table functions into a given file
 * @param dbSpec Database specification
 * @param fileName Path to the destination file
 */
export function writeTableFunctionsFile<T extends string, S extends string, O extends string>(
  dbSpec: DatabaseSpec<T, S, O>,
  knexClientPath: string,
  fileName: string
) {
  const data = knexDbSpec(dbSpec, knexClientPath);
  fs.writeFileSync(fileName, format(data));
}
