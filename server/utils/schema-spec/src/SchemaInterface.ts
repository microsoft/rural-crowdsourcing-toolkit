// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Definition of the interface for specifying a relational database schema.

/**
 * Table column type
 */
export type TableColumnType<TableName extends string, CustomStringType = string, CustomObjectType = string> =
  | ['bigserial']
  | ['bigint', number?]
  | ['float', number?]
  | ['boolean', boolean?]
  | ['string', number, CustomStringType?]
  | ['text']
  | ['timestamp', ('eon' | 'now')?]
  | ['>', TableName]
  | ['stringarray']
  | ['kv']
  | ['object', CustomObjectType?];

/**
 * Table column specification
 */
export type TableColumnSpec<TableName extends string, CustomStringType = string, CustomObjectType = string> = [
  string,
  TableColumnType<TableName, CustomStringType, CustomObjectType>,
  'unique' | 'not unique',
  'nullable' | 'not nullable',
  'mutable' | 'not mutable'
];

/**
 * Table specification
 */
export type TableSpec<TableName extends string, CustomStringType = string, CustomObjectType = string> = {
  columns: TableColumnSpec<TableName, CustomStringType, CustomObjectType>[];
  triggers?: string[];
};

/**
 * Database specification
 */
export type DatabaseSpec<TableName extends string, CustomStringType = string, CustomObjectType = string> = {
  version: string;
  tables: { [key in TableName]: TableSpec<TableName, CustomStringType, CustomObjectType> };
  functions?: Array<[string, string]>;
};
