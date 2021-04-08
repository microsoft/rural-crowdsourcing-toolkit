// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Generate the data for the create table functions file. To be used by both the
 * backend and frontend.
 */

import prettier from 'prettier';

import { openingComment, prettierOptions, TableType } from '../parsers/Common';
import { enums, EnumTypes } from '../parsers/EnumParser';
import { FieldInfo, tableNames, tables } from '../parsers/TableParser';

/**
 * Function to generate knex string for a field
 * @param name name of the field
 * @param info Information regarding the field
 */
function KnexField(name: string, info: FieldInfo) {
  /** Type string */
  const typeString =
    info.type === 'serial'
      ? `specificType('${name}', 'SERIAL')`
      : info.type === 'varchar'
      ? `specificType('${name}', 'VARCHAR(${info.len})')`
      : info.type === 'json'
      ? `json('${name}')`
      : info.type === 'text'
      ? `text('${name}')`
      : info.type === 'boolean'
      ? `boolean('${name}')`
      : info.type === 'bigserial'
      ? `specificType('${name}', 'BIGSERIAL')`
      : info.type === 'int'
      ? `integer('${name}')`
      : info.type === 'bigint'
      ? `bigInteger('${name}')`
      : info.type === 'timestamp'
      ? `timestamp('${name}', { useTz: true })`
      : info.type === 'bytea'
      ? `specificType('${name}', 'BYTEA')`
      : info.type === 'float'
      ? `float('${name}')`
      : info.type in EnumTypes
      ? `enu('${name}', ['${enums[info.type].join(`', '`)}'])`
      : undefined;

  if (typeString === undefined) {
    throw Error(`Unknown type '${info.type}'`);
  }

  /** Options string */
  let optionString = info.options
    .map((option) =>
      option === 'unique'
        ? '.unique()'
        : option === 'not null'
        ? '.notNullable()'
        : option === 'pk'
        ? '.primary()'
        : option === 'now'
        ? '.defaultTo(knex.fn.now())'
        : option === 'false'
        ? '.defaultTo(false)'
        : option === 'true'
        ? '.defaultTo(true)'
        : option === 'eon'
        ? '.defaultTo(new Date(0).toISOString())'
        : option === 'empty'
        ? `.defaultTo('{}')`
        : option === 'filter'
        ? ''
        : `unknown option '${option}'`
    )
    .join('');

  /** Foreign key string */
  let refString = info.ref ? `\ntable.foreign('${name}').references('${info.ref}.id')` : '';
  return `table.${typeString}${optionString};${refString}`;
}

const withoutLocalId = `
if (server == 'backend') {
  table.specificType('id', 'BIGSERIAL').primary();
} else {
  table.bigInteger('id').primary();
}
`;

const withLocalId = `
if (server == 'backend') {
  table.bigInteger('id').primary();
  table.bigInteger('local_id');
} else {
  table.bigInteger('id').primary();
  table.specificType('local_id', 'BIGSERIAL');
}
`;

export function createTableFunctionsFileData(): string {
  /** Generate the create table function string for each table */
  const createTableStrings = Object.entries(tables).map(([tname, tinfo]) => {
    /** Update the types for local_id and id depending on server */
    const fields = { ...tinfo.fields };
    const idString = 'local_id' in fields ? withLocalId : withoutLocalId;

    const computeIDTrigger =
      'local_id' in tinfo.fields || tname === 'karya_file' ? `await knex.raw(computeIDTrigger('${tname}'))` : '';

    delete fields['id'];
    delete fields['local_id'];

    /** Generrate the field strings */
    const fieldStrings = Object.entries(fields)
      .map(([fname, finfo]) => KnexField(fname, finfo))
      .join('\n');

    /** Generate the unique constraints */
    const uniqueConstraintStrings = tinfo.unique
      ? tinfo.unique.map((cols) => `table.unique(['${cols.join(`', '`)}'])`).join('\n')
      : '';

    /** Generate the create table function */
    return `export async function create${TableType(tname)}Table(server: 'backend' | 'box') {
      await knex.schema.createTable('${tname}', async table => {
        ${idString}
        ${fieldStrings}
        ${uniqueConstraintStrings}
      });
      await knex.raw(onUpdateCheckTrigger('${tname}'));
      ${computeIDTrigger}
    }`;
  });

  /** Function to create all tables */
  const createTableCalls = tableNames.map((tname) => `await create${TableType(tname)}Table(server)`).join('\n');
  const createAllTablesString = `export async function createAllTables(server: 'backend' | 'box') {
      await createCheckLastUpdatedFunction();
      await createComputeIDFunction();
      ${createTableCalls}
  }`;

  /** Generate the file data */
  const createTableFunctionsData = `\
  ${openingComment}

  import { knex } from '../Client';

/**
 * Create a trigger to check the last_updated_at column is increasing. Cannot
 * apply update from the past
 * @param tableName Name of the table
 */
function onUpdateCheckTrigger(tableName: string) {
  return \`CREATE TRIGGER \${tableName}_check_updated_at BEFORE UPDATE ON \${tableName} FOR EACH ROW EXECUTE PROCEDURE check_last_updated_column();\`;
}

/**
 * Create the update function for the updating last_updated_at column of tables
 */
async function createCheckLastUpdatedFunction() {
  return knex.raw(\`CREATE OR REPLACE FUNCTION check_last_updated_column()
  RETURNS TRIGGER AS $$
  BEGIN
  IF NEW.last_updated_at < OLD.last_updated_at THEN
  RAISE EXCEPTION 'Update from the past';
  END IF;
  RETURN NEW;
  END;
  $$ language 'plpgsql';\`);
}

/**
 * Create the compute function for ID from local id and box id
 */
async function createComputeIDFunction() {
  return knex.raw(\`CREATE OR REPLACE FUNCTION compute_id()
  RETURNS TRIGGER AS $$
  BEGIN
  IF NEW.box_id IS NULL THEN
  NEW.id = 0;
  ELSE
  NEW.id = NEW.box_id;
  END IF;
  NEW.id = (NEW.id << 48) + NEW.local_id;
  RETURN NEW;
  END;
  $$ language 'plpgsql';\`);
}

/**
 * Create a trigger to update the last_updated_at column for a table
 * @param tableName Name of the table
 */
function computeIDTrigger(tableName: string) {
  return \`CREATE TRIGGER \${tableName}_compute_id BEFORE INSERT ON \${tableName} FOR EACH ROW EXECUTE PROCEDURE compute_id();\`;
}


  ${createTableStrings.join('\n\n')}

  ${createAllTablesString}
  `;

  return prettier.format(createTableFunctionsData, prettierOptions);
}
