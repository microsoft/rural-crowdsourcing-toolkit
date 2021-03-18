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
function KnexField(name: string, info: FieldInfo, excludedTables: string[]) {
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
        : `unknown option '${option}'`,
    )
    .join('');

  /** Foreign key string */
  let refString = info.ref
    ? `\ntable.foreign('${name}').references('${info.ref}.id')`
    : '';
  if (info.ref && excludedTables.indexOf(info.ref) != -1) {
    refString = '';
    optionString = '';
  }
  return `table.${typeString}${optionString};${refString}`;
}

export function createTableFunctionsFileData(
  server: 'backend' | 'box',
  excludedTables: string[],
): string {
  /*Exclude tables that don't need to be created */
  if (server == 'box') {
    excludedTables.push('work_provider');
  }
  let filteredTableNames = tableNames;
  excludedTables.forEach((excludedTable) => {
    delete tables[excludedTable];
    filteredTableNames = filteredTableNames.filter((tname) => {
      return excludedTable.indexOf(tname) == -1;
    });
  });
  /** Generate the create table function string for each table */
  const createTableStrings = Object.entries(tables).map(([tname, tinfo]) => {
    /** Update the types for local_id and id depending on server */
    const fields = { ...tinfo.fields };
    if (server === 'backend' && tname !== 'karya_file') {
      // all local_ids are int/bigint
      if ('local_id' in fields) {
        fields.local_id.type =
          fields.local_id.type === 'serial'
            ? 'int'
            : fields.local_id.type === 'bigserial'
            ? 'bigint'
            : fields.local_id.type;
      }
    }
    if (server === 'box') {
      // all ids are int/bigint
      fields.id.type =
        fields.id.type === 'serial'
          ? 'int'
          : fields.id.type === 'bigserial'
          ? 'bigint'
          : fields.id.type;
    }

    /** Generrate the field strings */
    const fieldStrings = Object.entries(fields)
      .map(([fname, finfo]) => KnexField(fname, finfo, excludedTables))
      .join('\n');

    /** Generate the unique constraints */
    const uniqueConstraintStrings = tinfo.unique
      ? tinfo.unique
          .map((cols) => `table.unique(['${cols.join(`', '`)}'])`)
          .join('\n')
      : '';

    /** Generate the create table function */
    const computeIDTrigger =
      (server === 'box' && 'local_id' in tinfo.fields) || tname === 'karya_file'
        ? `await knex.raw(computeIDTrigger('${tname}'))`
        : '';
    return `export async function create${TableType(tname)}Table() {
      await knex.schema.createTable('${tname}', async table => {
        ${fieldStrings}
        ${uniqueConstraintStrings}
      });
      await knex.raw(onUpdateCheckTrigger('${tname}'));
      ${computeIDTrigger}
    }`;
  });

  /** Function to create all tables */
  const createTableCalls = filteredTableNames
    .map((tname) => `await create${TableType(tname)}Table()`)
    .join('\n');
  const createAllTablesString = `export async function createAllTables() {
    try {
      await createCheckLastUpdatedFunction();
      await createComputeIDFunction();
      ${createTableCalls}
    } catch(e) {
      logger.error(e);
    }
  }`;

  /** Generate the file data */
  const createTableFunctionsData = `\
  ${openingComment}

  import { knex } from './Client';

  import logger from '../utils/Logger';

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
