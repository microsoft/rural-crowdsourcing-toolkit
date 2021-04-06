// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// This file defines basic model functions for all the tables in the database.

import { knex, DbObjectType, DbRecordType, DbTableName } from '../index';

/**
 * Function to insert a new record into the table. Returns the inserted record
 * @param tableName name of the table
 * @param record record to be inserted
 */
export async function insertRecord<TableName extends DbTableName>(
  tableName: TableName,
  object: DbObjectType<TableName>
): Promise<DbRecordType<TableName>> {
  const response = await knex(tableName).insert(object).returning('*');
  const insertedRecord: DbRecordType<TableName> = response[0];
  return insertedRecord;
}

/**
 * Function to retrive a set of records that match the specified condition
 * @param tableName name of the table
 * @param match object representing the match condition
 */
export async function getRecords<TableName extends DbTableName>(
  tableName: TableName,
  match: DbObjectType<TableName>
): Promise<DbRecordType<TableName>[]> {
  const response = await knex(tableName).where(match).select();
  const retrievedRecords: DbRecordType<TableName>[] = response;
  return retrievedRecords;
}

/**
 * Function to fetch a single record from a table. The function assumes that the
 * match condition points only to a single record and just fetches the first
 * record. There are no additional checks.
 * @param tableName Name of the table
 * @param match Match object representing the single record
 */
export async function getSingle<TableName extends DbTableName>(
  tableName: TableName,
  match: DbObjectType<TableName>
): Promise<DbRecordType<TableName>> {
  const response = await knex(tableName).where(match).first();

  // if undefined response, throw error
  if (response === undefined) {
    throw {
      isPGError: true,
      custom: true,
      message: `Requested record not found`,
      table: tableName,
      match,
    };
  }

  return response as DbRecordType<TableName>;
}

/**
 * Function to update a set of matching records with the specified updates
 * @param tableName name of the table
 * @param match object representing the match condition
 * @param updates object representing the required updates
 */
export async function updateRecords<TableName extends DbTableName>(
  tableName: TableName,
  match: DbObjectType<TableName>,
  updates: DbObjectType<TableName>
): Promise<DbRecordType<TableName>[]> {
  // set last updated to current time
  updates.last_updated_at = new Date().toISOString();
  // attempt to update the records
  const response = await knex(tableName).where(match).update(updates).returning('*');
  // return all the updated records
  const updatedRecords: DbRecordType<TableName>[] = response;
  return updatedRecords;
}

/**
 * Function to update a single record inside a table. The function assumes that
 * the match object points to a single record.
 * @param tableName Name of the table
 * @param match Match object pointing to the record to be updated
 * @param updates Updates for the object
 */
export async function updateSingle<TableName extends DbTableName>(
  tableName: TableName,
  match: DbObjectType<TableName>,
  updates: DbObjectType<TableName>
): Promise<DbRecordType<TableName>> {
  // set last_updated_at to current time
  updates.last_updated_at = new Date().toISOString();
  // update the record
  const response = await knex(tableName).where(match).update(updates).returning('*');
  // if undefined response, throw error
  if (response === undefined || response.length === 0) {
    throw {
      isPGError: true,
      custom: true,
      message: `Requested record not found`,
      table: tableName,
      match,
    };
  }
  // return the updated record
  const record: DbRecordType<TableName> = response[0];
  return record;
}

/**
 * Function to remove all records from a table with a matching condition
 * @param tableName Name of the table
 * @param match Match condition for the records
 */
export async function removeRecords<TableName extends DbTableName>(
  tableName: TableName,
  match: DbObjectType<TableName>
): Promise<number> {
  // delete records
  const response = await knex(tableName).where(match).delete();
  return response;
}

/**
 * Get all the records from a table that have been updated since the time
 * provided as an argument
 * @param tableName Name of the table
 * @param from From time to get the updates
 * @param match Optional match filter for the records
 */
export async function getUpdatesSince<TableName extends DbTableName>(
  tableName: TableName,
  from: string,
  match: DbObjectType<TableName> | {} = {},
  to: string | undefined = undefined
): Promise<DbRecordType<TableName>[]> {
  // Retrieve the records
  if (to == undefined) {
    const response = await knex(tableName).where(match).where('last_updated_at', '>', from).select();
    return response as DbRecordType<TableName>[];
  } else {
    const response = await knex(tableName)
      .where(match)
      .where('last_updated_at', '>', from)
      .where('last_updated_at', '<=', to)
      .select();
    return response as DbRecordType<TableName>[];
  }
}

/**
 * Get all the records from a table that have been created since the time
 * provided as an argument
 * @param tableName Name of the table
 * @param from From time to get the updates
 * @param match Optional match filter for the records
 */
export async function getCreatedSince<TableName extends DbTableName>(
  tableName: TableName,
  from: string,
  match: DbObjectType<TableName> | {} = {}
): Promise<DbRecordType<TableName>[]> {
  // Retrieve the records
  const response = await knex(tableName).where(match).where('created_at', '>', from).select();
  return response as DbRecordType<TableName>[];
}

/**
 * Get all the records from a table with a where in filter
 * @param tableName Name of the table
 * @param column Column to apply where in clause
 * @param values Values to fitler out
 */
export async function getRecordsWhereIn<
  TableName extends DbTableName,
  ColumnType extends keyof DbRecordType<TableName>
>(
  tableName: TableName,
  column: ColumnType,
  values: DbRecordType<TableName>[ColumnType][],
  filter: DbObjectType<TableName> | {} = {}
): Promise<DbRecordType<TableName>[]> {
  // Retrieve the records
  const response = await knex(tableName).whereIn(column, values).where(filter).select();
  return response as DbRecordType<TableName>[];
}

/**
 * Get all the records from a table with a where in filter and updates since
 * filter
 * @param tableName Name of the table
 * @param column Column to apply where in clause
 * @param values Values to fitler out
 * @param from Get updates from
 */
export async function getRecordsWhereInUpdatedSince<
  TableName extends DbTableName,
  ColumnType extends keyof DbRecordType<TableName>
>(
  tableName: TableName,
  column: ColumnType,
  values: DbRecordType<TableName>[ColumnType][],
  from: string,
  filter: DbObjectType<TableName> | {} = {}
): Promise<DbRecordType<TableName>[]> {
  const response = await knex(tableName)
    .whereIn(column, values)
    .where(filter)
    .where('last_updated_at', '>', from)
    .select();
  return response as DbRecordType<TableName>[];
}

/**
 * Upsert a record into a table and return the resulting record
 * @param tableName Name of the table
 * @param object Object to upsert
 */
export async function upsertRecord<TableName extends DbTableName>(
  tableName: TableName,
  object: DbRecordType<TableName>
): Promise<DbRecordType<TableName>> {
  const { id, ...updates } = object;
  const insertQuery = knex(tableName).insert(object);
  const updateQuery = knex
    .queryBuilder()
    .update(updates)
    .where({ [`${tableName}.id`]: id });
  const upsertQuery = knex.raw(`? ON CONFLICT ("id") DO ? RETURNING *`, [insertQuery, updateQuery]);
  const upsertResponse = await upsertQuery;
  return upsertResponse.rows[0] as DbRecordType<TableName>;
}
