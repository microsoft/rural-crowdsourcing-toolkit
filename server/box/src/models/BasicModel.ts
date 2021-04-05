// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// This file defines basic model functions for all the tables in the database.

import box_id from '../config/box_id';
import { knex } from '../db/Client';
import {
  BoxUpdatableTables,
  DbObjectType,
  DbRecordType,
  DbTableName,
} from '@karya/db';
import { logPGError } from '../errors/PostgreSQLErrors';

/**
 * Function to insert a new record into the table
 * @param tableName name of the table
 * @param record record to be inserted
 */
export async function insertRecord<
  TableName extends BoxUpdatableTables | 'box'
>(
  tableName: TableName,
  object: DbObjectType<TableName>,
): Promise<DbRecordType<TableName>> {
  const insertObject = tableName === 'box' ? object : { ...object, box_id };
  try {
    // attempt inserting the record into the table
    const response = await knex(tableName)
      .insert(insertObject)
      .returning('*');

    // on successful insertion, first element of response array contains
    // inserted object
    const insertedRecord: DbRecordType<TableName> = response[0];
    return insertedRecord;
  } catch (e) {
    logPGError(e);
    throw e;
  }
}

/**
 * Function to retrive a set of records that match the specified condition
 * @param tableName name of the table
 * @param match object representing the match condition
 */
export async function getRecords<TableName extends DbTableName>(
  tableName: TableName,
  match: DbObjectType<TableName>,
): Promise<DbRecordType<TableName>[]> {
  try {
    // attempt to retrieve the records from the database
    const response = await knex(tableName)
      .where(match)
      .select();

    // return all retrived records
    const retrievedRecords: DbRecordType<TableName>[] = response;
    return retrievedRecords;
  } catch (e) {
    logPGError(e);
    throw e;
  }
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
  match: DbObjectType<TableName>,
): Promise<DbRecordType<TableName>> {
  try {
    // get record from the db
    const response = await knex(tableName)
      .where(match)
      .first();

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
  } catch (e) {
    logPGError(e);
    throw e;
  }
}

/**
 * Function to update a set of matching records with the specified updates
 * @param tableName name of the table
 * @param match object representing the match condition
 * @param updates object representing the required updates
 */
export async function updateRecords<
  TableName extends BoxUpdatableTables | 'box'
>(
  tableName: TableName,
  match: DbObjectType<TableName>,
  updates: DbObjectType<TableName>,
): Promise<DbRecordType<TableName>[]> {
  const updatesObject = tableName === 'box' ? updates : { ...updates, box_id };

  // last_updated_at from updates
  updates.last_updated_at = new Date().toISOString();

  try {
    // attempt to update the records
    const response = await knex(tableName)
      .where(match)
      .update(updatesObject)
      .returning('*');

    // return all the updated records
    const updatedRecords: DbRecordType<TableName>[] = response;
    return updatedRecords;
  } catch (e) {
    logPGError(e);
    throw e;
  }
}

/**
 * Function to update a single record inside a table. The function assumes that
 * the match object points to a single record.
 * @param tableName Name of the table
 * @param match Match object pointing to the record to be updated
 * @param updates Updates for the object
 */
export async function updateSingle<
  TableName extends BoxUpdatableTables | 'box'
>(
  tableName: TableName,
  match: DbObjectType<TableName>,
  updates: DbObjectType<TableName>,
): Promise<DbRecordType<TableName>> {
  // last_udpated_at from updates
  updates.last_updated_at = new Date().toISOString();

  try {
    // update the record
    const response = await knex(tableName)
      .where(match)
      .update(updates)
      .returning('*');

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
  } catch (e) {
    logPGError(e);
    throw e;
  }
}

/**
 * Function to remove all records from a table with a matching condition
 * @param tableName Name of the table
 * @param match Match condition for the records
 */
export async function removeRecords<TableName extends DbTableName>(
  tableName: TableName,
  match: DbObjectType<TableName>,
): Promise<number> {
  try {
    // delete records
    const response = await knex(tableName)
      .where(match)
      .delete();
    return response;
  } catch (e) {
    logPGError(e);
    throw e;
  }
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
  to: string | undefined = undefined,
): Promise<DbRecordType<TableName>[]> {
  try {
    // Retrieve the records
    if (to == undefined) {
      const response = await knex(tableName)
        .where(match)
        .where('last_updated_at', '>', from)
        .select();
      return response as DbRecordType<TableName>[];
    } else {
      const response = await knex(tableName)
        .where(match)
        .where('last_updated_at', '>', from)
        .where('last_updated_at', '<=', to)
        .select();
      return response as DbRecordType<TableName>[];
    }
  } catch (e) {
    logPGError(e);
    throw e;
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
  match: DbObjectType<TableName> | {} = {},
): Promise<DbRecordType<TableName>[]> {
  try {
    // Retrieve the records
    const response = await knex(tableName)
      .where(match)
      .where('created_at', '>', from)
      .select();
    return response as DbRecordType<TableName>[];
  } catch (e) {
    logPGError(e);
    throw e;
  }
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
  filter: DbObjectType<TableName> | {} = {},
): Promise<DbRecordType<TableName>[]> {
  try {
    // Retrieve the records
    const response = await knex(tableName)
      .whereIn(column, values)
      .where(filter)
      .select();
    return response as DbRecordType<TableName>[];
  } catch (e) {
    logPGError(e);
    throw e;
  }
}

/**
 * Upsert a record into a table and return the resulting record
 * @param tableName Name of the table
 * @param object Object to upsert
 */
export async function upsertRecord<TableName extends DbTableName>(
  tableName: TableName,
  object: DbRecordType<TableName>,
): Promise<DbRecordType<TableName>> {
  const { id, ...updates } = object;
  const insertQuery = knex(tableName).insert(object);
  const updateQuery = knex
    .queryBuilder()
    .update(updates)
    .where({ [`${tableName}.id`]: id });
  const upsertQuery = knex.raw(`? ON CONFLICT ("id") DO ? RETURNING *`, [
    insertQuery,
    updateQuery,
  ]);
  const upsertResponse = await upsertQuery;
  return upsertResponse.rows[0] as DbRecordType<TableName>;
}
