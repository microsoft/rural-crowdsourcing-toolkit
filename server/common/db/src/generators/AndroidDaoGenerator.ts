// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import cc = require('camelcase');
import * as fs from 'fs';
import * as path from 'path';
import ucc = require('uppercamelcase');
import { openingComment, PG2AndroidType } from '../parsers/Common';
import { enums, EnumTypes } from '../parsers/EnumParser';
import { TableInfo, tables } from '../parsers/TableParser';
// const upperCamelCase = require('uppercamelcase');
/**
 * Function to generate and return the data for the table file
 */
export function tableDaosData(androidPath: string) {
  androidPath = path.join(androidPath, 'database', 'daos');
  const excludedTables: string[] = ['work_provider', 'box'];
  const tableTypeStrings = Object.entries(tables).map(([tname, tinfo]) => {
    if (excludedTables.indexOf(tname) == -1) {
      const fileWriteData = getFileData(tname, tinfo, excludedTables, false);
      const fileName = ucc(tname);
      fs.writeFileSync(
        `${androidPath}/${fileName}Dao.kt`,
        fileWriteData,
        'utf-8',
      );
    }
  });
}

function getFileData(
  tname: string,
  tinfo: TableInfo,
  excludedTables: string[],
  partialTableRecord: boolean,
): string {
  const className = ucc(tname) + 'Record';
  const androidExports = getAndroidExports(className);
  const DaoDeclaration = getDaoDeclarations(tname, tinfo, className);
  /** Table data */
  const fileWriteData = `\
${openingComment}\n
${androidExports}\n
${DaoDeclaration}\n
`;
  return fileWriteData;
}
function getAndroidExports(className: string) {
  return `package com.microsoft.research.karya.database.daos
import androidx.room.Dao
import androidx.room.Query
import androidx.room.Transaction
import com.microsoft.research.karya.database.models.${className}
import java.math.BigInteger
`;
}

function getDaoDeclarations(
  tname: string,
  tinfo: TableInfo,
  className: string,
): string {
  let dataTypeForId = '';
  Object.entries(tinfo.fields).forEach(([fname, finfo]) => {
    if (fname === 'id') {
      dataTypeForId = PG2AndroidType[finfo.type];
    }
  });
  const daos = `@Dao
interface ${ucc(tname)}Dao : BasicDao<${className}> {

    @Query("SELECT * FROM ${tname}")
    suspend fun getAll(): List<${className}>

    @Query("SELECT * FROM ${tname} WHERE id == :id")
    suspend fun getById(id:${dataTypeForId}): ${className}

    /**
     * Upsert a [record] in the table
     */
    @Transaction
    suspend fun upsert(record: ${className}) {
        insertForUpsert(record)
        updateForUpsert(record)
    }

    /**
     * Upsert a list of [records] in the table
     */
    @Transaction
    suspend fun upsert(records: List<${className}>) {
        insertForUpsert(records)
        updateForUpsert(records)
    }
}`;
  return daos;
}
