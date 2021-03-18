/**
 * Parse the tables.yaml specification and export objects that can be used by
 * different generators
 */

import * as fs from 'fs';
import * as yaml from 'yaml';

/** Read the data from the table specification file */
const tablesFile = `${process.cwd()}/src/schema/tables.yaml`;
const tablesData = fs.readFileSync(tablesFile).toString();

/** Parse the table information */

type TableInputInfo = {
  fields: string[];
};

const tablesInput: { [id: string]: TableInputInfo } = yaml.parse(tablesData);
const tableNames = Object.keys(tablesInput);

/** Expand the information to create exportable object */

type FieldInfo = {
  type: string;
  len?: number;
  ref?: string;
  options: (
    | 'unique'
    | 'not null'
    | 'pk'
    | 'now'
    | 'false'
    | 'true'
    | 'eon'
    | 'empty'
    | 'filter'
  )[];
};

type Methods = 'post' | 'put' | 'getbyid' | 'get';

export type TableInfo = {
  fields: { [id: string]: FieldInfo };
  unique?: string[][];
  apis?: { [key in Methods]?: 'admin' | 'wp' };
  boxapis?: { [key in Methods]?: 'admin' | 'wp' };
  getfilter?: string[];
};

const tables: { [id: string]: TableInfo } = {};

for (const table of tableNames) {
  const { fields, ...other } = tablesInput[table];
  const fieldsInfo: { [id: string]: FieldInfo } = {};

  /** Add created_at and last_updated_at fields */
  fields.push('created_at, timestamp, not null, now');
  fields.push('last_updated_at, timestamp, not null, now');

  for (const field of fields) {
    const params = field.split(',').map((f) => f.trim());
    // @ts-ignore
    const fname: string = params.shift();
    // @ts-ignore
    const ftype: string = params.shift();

    const info: FieldInfo = { type: ftype, options: [] };

    // @ts-ignore
    if (ftype == 'varchar') info.len = Number.parseInt(params.shift(), 10);
    if (ftype == '>') {
      info.ref = params.shift() as string;
      // in case of self reference update the table prematurely to reflect keys
      if (info.ref == table) {
        tables[table] = { fields: fieldsInfo, ...other };
      }
      const refType = tables[info.ref].fields['id'].type;
      info.type =
        refType === 'serial'
          ? 'int'
          : refType === 'bigserial'
          ? 'bigint'
          : refType;
    }

    // @ts-ignore
    info.options = params;

    // if it is a nullable json, add 'empty' as a default
    if (ftype === 'json') {
      if (!info.options.includes('not null')) {
        info.options.push('not null');
        info.options.push('empty');
      }
    }

    fieldsInfo[fname] = info;
  }

  tables[table] = { fields: fieldsInfo, ...other };
}

/** Export the objects */
export { tables, tableNames, FieldInfo };
