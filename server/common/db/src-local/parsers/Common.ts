// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import cc = require('camelcase');
import prettier from 'prettier';

import { EnumTypes } from './EnumParser';

/** Prettier options for formatting the generated files */
export const prettierOptions: prettier.Options = {
  parser: 'typescript',
  singleQuote: true,
  trailingComma: 'all',
};

/** Opening comment on the generated files */
export const openingComment = `\
/**
 * This file was auto-generated using specs and scripts in the db-schema
 * repository. DO NOT EDIT DIRECTLY.
 */`;

/** TS types for postgres fields */
export const PG2TSType: { [id: string]: string } = {
  serial: 'number',
  varchar: 'string',
  json: 'object',
  any: 'object | string',
  array: 'object | string',
  text: 'string',
  boolean: 'boolean',
  bigserial: 'string',
  int: 'number',
  bigint: 'string',
  timestamp: 'string',
  bytea: 'string',
  float: 'number',
  ...EnumTypes,
};

/** TS types for postgres fields */
export const PG2AndroidType: { [id: string]: string } = {
  serial: 'Int',
  varchar: 'String',
  text: 'String',
  boolean: 'Boolean',
  bigserial: 'String',
  int: 'Int',
  bigint: 'String',
  timestamp: 'String',
  bytea: 'String',
  float: 'Float',
  json: 'JsonObject',
};

/**
 * Return the TS table type given a table name
 * @param name Name of the table
 */
export function TableType(name: string): string {
  return cc(name, { pascalCase: true });
}

/**
 * Return the TS table record type given a table name
 * @param name Name of the table
 */
export function TableRecordType(name: string): string {
  return `${TableType(name)}Record`;
}
