// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display the list of bulk transaction history.
 */

// React stuff
import React from 'react';

// HTML helpers
import { ErrorMessage, ProgressBar } from '../templates/Status';
import { TableColumnType, TableList } from '../templates/TableList';

// HoCs
import { DataProps, withData } from '../hoc/WithData';

// CSS
import { BulkPaymentsTransactionRecord } from '@karya/core';
import { CSVLink } from 'react-csv';
import Pagination from 'react-js-pagination';

// Create the connector
const connector = withData('bulk_payments_transaction');

// Box list props
type BulkTransactionHistoryListProps = DataProps<typeof connector>;
type BulkTransactionTableRecord = BulkPaymentsTransactionRecord & { failedForWorkerIds: string | null };

type BulkTransactionHistoryListState = {
  bulk_transaction_history_table: {
    total_rows_per_page: number;
    current_page: number;
  };
};

// Box list component
class BulkTransactionHistoryList extends React.Component<
  BulkTransactionHistoryListProps,
  BulkTransactionHistoryListState
> {
  state: BulkTransactionHistoryListState = {
    bulk_transaction_history_table: {
      total_rows_per_page: 10,
      current_page: 1,
    },
  };

  render() {
    const data: BulkTransactionTableRecord[] = this.props.bulk_payments_transaction.data
      .map((item) => {
        return {
          ...item,
          created_at: new Date(item.created_at).toDateString(),
          failedForWorkerIds: item.meta ? ((item.meta as any).failedForWorkerIds as string) : null,
        };
      })
      .reverse();
    console.log(data);

    // get error element
    const errorElement =
      this.props.bulk_payments_transaction.status === 'FAILURE' ? (
        <ErrorMessage message={this.props.bulk_payments_transaction.messages} />
      ) : null;

    // Box table columns
    const tableColumns: Array<TableColumnType<BulkTransactionTableRecord>> = [
      { header: 'Batch ID', type: 'field', field: 'id' },
      { header: 'Amount ', type: 'field', field: 'amount' },
      { header: '# of Workers', type: 'field', field: 'n_workers' },
      { header: 'Status', type: 'field', field: 'status' },
      { header: 'Failure for Workers', type: 'field', field: 'failedForWorkerIds' },
      { header: 'Created at', type: 'field', field: 'created_at' },
    ];

    return (
      <div>
        {errorElement}
        {this.props.bulk_payments_transaction.status === 'IN_FLIGHT' && <ProgressBar />}
        <CSVLink data={data} filename='bulkTransactionHistoryData' className='btn' id='download-btn'>
          <i className='material-icons left'>download</i>Download data
        </CSVLink>
        <div className='basic-table'>
          <TableList<BulkTransactionTableRecord>
            columns={tableColumns}
            rows={data.slice(
              (this.state.bulk_transaction_history_table.current_page - 1) *
                this.state.bulk_transaction_history_table.total_rows_per_page,
              this.state.bulk_transaction_history_table.current_page *
                this.state.bulk_transaction_history_table.total_rows_per_page,
            )}
            emptyMessage='No bulk transaction has been made'
          />
          <Pagination
            activePage={this.state.bulk_transaction_history_table.current_page}
            itemsCountPerPage={this.state.bulk_transaction_history_table.total_rows_per_page}
            totalItemsCount={data.length}
            pageRangeDisplayed={5}
            onChange={(pageNo) =>
              this.setState((prevState) => ({
                bulk_transaction_history_table: {
                  ...prevState.bulk_transaction_history_table,
                  current_page: pageNo,
                },
              }))
            }
          />
        </div>
      </div>
    );
  }
}

export default connector(BulkTransactionHistoryList);
