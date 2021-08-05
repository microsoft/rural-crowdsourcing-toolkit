// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Table component to show a list of records */

import React from 'react';

/**
 * A TableList for a RecordType is specified using two entries:
 * 1) columns: definition of each column in the table,
 * 2) rows: list of records from the table that should be shown.
 *
 * Each column can either be a field in the record or a function that computes a
 * react element from the record object.
 */

export type TableColumnType<Record> =
  | {
      type: 'field';
      header: string;
      field: keyof Record;
    }
  | {
      type: 'function';
      header: string;
      function: (record: Record) => JSX.Element | string | null;
    };

/**
 * TableList props
 * columns: List of columns in the table
 * rows: List of records to be displayed
 * emptyMessage: message to be shown in case there are no records
 */
type TableListProps<Record> = {
  columns: Array<TableColumnType<Record>>;
  rows: Record[];
  emptyMessage: string;
};

const TableList = <Record extends object>(props: TableListProps<Record>) => {
  const { columns, rows, emptyMessage } = props;

  /** If table is empty, simply return the message */
  if (rows.length === 0) return <div className='section'>{emptyMessage}</div>;

  /** Generate the table  */
  return (
    <div className='tablelist-container'>
      <table className='highlight compact tablelist'>
        <thead>
          <tr>
            {columns.map((col, colid) => (
              <th key={colid}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowid) => (
            <tr key={rowid}>
              {columns.map((col, colid) => (
                <td key={colid}>{col.type === 'field' ? row[col.field] : col.function(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export { TableList };
