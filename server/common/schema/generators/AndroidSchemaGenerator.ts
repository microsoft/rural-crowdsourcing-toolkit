// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import cc = require('camelcase');
import * as fs from 'fs';
import * as path from 'path';
import { openingComment, PG2AndroidType } from '../parsers/Common';
import { enums, EnumTypes } from '../parsers/EnumParser';
import { TableInfo, tables } from '../parsers/TableParser';

/**
 * Function to generate and write android model files
 * @param androidPath Android root path
 */
export function androidTablesData(androidPath: string) {
  androidPath = path.join(androidPath, 'database', 'models');
  const excludedTables: string[] = ['work_provider'];
  const enumDataMap: any = {};

  Object.entries(tables).forEach(([tname, tinfo]) => {
    if (excludedTables.includes(tname) || tname === 'box') {
      return;
    }

    const fileWriteData = getFileData(tname, tinfo, excludedTables, false);
    const enumDeclarations = getEnumDeclarations(tname, tinfo, excludedTables, true);
    if (enumDeclarations) {
      Object.keys(enumDeclarations).map((key: string) => {
        if (!enumDataMap[key]) {
          enumDataMap[key] = enumDeclarations[key];
        }
      });
    }
    const fileName = cc(tname);

    // write file data
    fs.writeFileSync(`${androidPath}/${fileName}Record.kt`, deleteTrailingWhitespace(fileWriteData));

    // write partial data
    // saving all enums in different files
    if (Object.values(enumDataMap).length > 0) {
      const enumData = Object.values(enumDataMap).join('\n').trim();
      for (const [key, value] of Object.entries(enumDataMap)) {
        const fileName = cc(key);
        fs.writeFileSync(
          `${androidPath}/${fileName}.kt`,
          `\
${openingComment}

package com.microsoft.research.karya.database.models
${value}
`
        );
      }
    }
  });
}

function getFileData(tname: string, tinfo: TableInfo, excludedTables: string[], partialTableRecord: boolean): string {
  const androidImports = getAndroidImports(partialTableRecord);
  const foreignKeyDeclaration = getForeignKeyDeclarations(tname, tinfo, excludedTables, partialTableRecord);
  const tableDeclaration = getTableDeclarations(tname, tinfo, excludedTables, partialTableRecord);
  /** Table data */
  const fileWriteData = `\
${openingComment}\n
${androidImports}\n
${partialTableRecord ? '' : foreignKeyDeclaration + '\n'}
${tableDeclaration}\n
  `;
  return fileWriteData;
}
function getAndroidImports(partialTableRecord: boolean) {
  const roomImports = `import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey`;
  return `package com.microsoft.research.karya.database.models
import com.google.gson.JsonObject
${partialTableRecord ? '' : roomImports}
import java.math.BigInteger
import com.microsoft.research.karya.database.models.*
`;
}

function getForeignKeyDeclarations(
  tname: string,
  tinfo: TableInfo,
  excludedTables: string[],
  partialTableRecord: boolean
) {
  if (partialTableRecord) {
    return '';
  }
  const foreignKeysIndex: string[] = [];
  const foreignKeys: string[] = [];
  Object.entries(tinfo.fields).map(([fname, finfo]) => {
    if (finfo.ref && excludedTables.indexOf(finfo.ref) == -1 && finfo.ref !== 'box') {
      foreignKeysIndex.push(`Index("${fname}")`);
      foreignKeys.push(`ForeignKey(
            entity = ${cc(finfo.ref)}Record::class,
            parentColumns = arrayOf("id"),
            childColumns = arrayOf("${fname}")
        )`);
    }
  });
  if (foreignKeys.length > 0) {
    return `@Entity(
    tableName = "${tname}", foreignKeys = arrayOf(
    ${foreignKeys.join(',')}
    ), indices = arrayOf(${foreignKeysIndex.join(',')})
)`;
  } else {
    return `@Entity(tableName = "${tname}")`;
  }
}

function getTableDeclarations(
  tname: string,
  tinfo: TableInfo,
  excludedTables: string[],
  partialTableRecord: boolean
): string {
  const fieldString = getColumnsForTable(tname, tinfo, excludedTables, partialTableRecord);
  const tableDeclaration = `data class ${!partialTableRecord ? cc(tname) + 'Record' : cc(tname)}(
    ${fieldString}
    )`;
  return tableDeclaration;
}

function getColumnsForTable(
  tname: string,
  tinfo: TableInfo,
  excludedTables: string[],
  partialTableRecord: boolean
): string {
  /** Table types */
  let enumsString = '';
  let fieldString: string = Object.entries(tinfo.fields)
    .map(([fname, finfo]) => {
      if (getEnumStrings(fname, finfo.type).isEnum) {
        enumsString += getEnumStrings(fname, finfo.type).enumString + '\n';
      }
      if (finfo.ref && excludedTables.indexOf(finfo.ref) != -1) {
        return;
      }
      if (
        finfo.options.includes('not null') ||
        finfo.options.includes('pk') ||
        finfo.type === 'serial' ||
        finfo.type === 'bigserial' ||
        fname === 'id' ||
        fname === 'local_id'
      ) {
        let mandatoryFieldString = '';
        if (fname === 'id' && !partialTableRecord) {
          mandatoryFieldString += `@PrimaryKey\n`;
        }
        let datatype = getDataType(fname, finfo.type);
        if (partialTableRecord) {
          datatype = datatype + '?';
        }
        const typeDeclaration = mandatoryFieldString + `\tvar ${fname}: ${datatype},`;
        return typeDeclaration;
      } else {
        const datatype = getDataType(fname, finfo.type);
        const typeDeclaration = `\tvar ${fname}: ${datatype}?,`;
        return typeDeclaration;
      }
    })
    .join('\n');
  // removing last comma in string field
  fieldString = fieldString.slice(0, fieldString.length - 1);
  return fieldString;
}

function getDataType(name: string, type: string): string {
  let datatype = '';
  if (PG2AndroidType[type]) {
    datatype = PG2AndroidType[type];
  } else if (type in EnumTypes) {
    return `${cc(type)}`;
    datatype = '';
  } else {
    datatype = 'String';
  }
  return datatype;
}

function getEnumStrings(name: string, type: string): { isEnum: boolean; enumString: string } {
  if (type in EnumTypes) {
    const enumString = `\nenum class ${cc(type)} {
    ${enums[type].join(', ')}
}`;
    return { isEnum: true, enumString };
  } else {
    return { isEnum: false, enumString: '' };
  }
}

function getEnumDeclarations(
  tname: string,
  tinfo: TableInfo,
  excludedTables: string[],
  partialTableRecord: boolean
): any {
  /** Table types */
  const enumsMap: any = {};
  Object.entries(tinfo.fields)
    .map(([fname, finfo]) => {
      if (getEnumStrings(fname, finfo.type).isEnum) {
        if (!enumsMap[finfo.type]) {
          const enumString = getEnumStrings(fname, finfo.type).enumString;
          enumsMap[finfo.type] = enumString;
        }
      }
    })
    .join('\n');
  return Object.values(enumsMap).length > 0 ? enumsMap : null;
}

/**
 * Delete all trailing white spaces in the file data
 * @param data File data
 */
function deleteTrailingWhitespace(data: string) {
  return data.replace(/\s+$/, '');
}
