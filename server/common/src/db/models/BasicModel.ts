// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// This file defines basic model functions for all the tables in the database.

import { DbObjectType, DbRecordType, DbTableName } from '@karya/core';
import { knex } from '../Client';

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

/**
 * Get records from a particular table with a set of filters.
 * @param tableName Name of the table
 * @param match Object for exact match
 * @param updateDuration Duration of the updates
 * @param createDuration Duration of creation
 * @param whereIns Where In filters
 * @returns Retrieved records
 */
export async function getRecords<TableName extends DbTableName, ColumnType extends keyof DbRecordType<TableName>>(
  tableName: TableName,
  match: DbObjectType<TableName> | {} = {},
  updateDuration: { from?: string; to?: string } = {},
  createDuration: { from?: string; to?: string } = {},
  whereIns: [c: ColumnType, values: DbRecordType<TableName>[ColumnType][]][] = []
): Promise<DbRecordType<TableName>[]> {
  let query = knex(tableName).where(match);
  // add whereIns
  whereIns.forEach((filter) => {
    query = query.whereIn(filter[0], filter[1]);
  });
  // add udpate duration filter
  const uFrom = updateDuration.from;
  const uTo = updateDuration.to;
  if (uFrom) query = query.where('last_updated_at', '>', uFrom);
  if (uTo) query = query.where('last_updated_at', '<=', uTo);
  // add create duration filter
  const cFrom = createDuration.from;
  const cTo = createDuration.to;
  if (cFrom) query = query.where('created_at', '>', cFrom);
  if (cTo) query = query.where('created_at', '<=', cTo);

  // retrieve the records and return
  const records = await query;
  return records as DbRecordType<TableName>[];
}
