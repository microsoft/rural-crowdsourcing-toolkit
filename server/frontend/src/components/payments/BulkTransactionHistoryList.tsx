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
import { ColTextInput } from '../templates/FormInputs';

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
  batch_id_input: string;
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
    batch_id_input: '',
  };

  // Initialize materialize fields
  componentDidMount() {
    M.updateTextFields();
    M.AutoInit();
  }

  // On update, update materialize fields
  componentDidUpdate() {
    M.updateTextFields();
    M.AutoInit();
  }

  // Handle input change
  handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    this.setState({ ...this.state, [e.currentTarget.id]: e.currentTarget.value });
  };

  render() {
    var data: BulkTransactionTableRecord[] = this.props.bulk_payments_transaction.data
      .map((item) => {
        return {
          ...item,
          created_at: new Date(item.created_at).toDateString(),
          failedForWorkerIds: item.meta ? ((item.meta as any).failedForWorkerIds as string) : null,
        };
      })
      .reverse();

    // Filtering data by batch ID
    const { batch_id_input } = this.state;
    if (batch_id_input !== undefined && batch_id_input !== '') {
      data = data.filter((t) => t.id.startsWith(batch_id_input));
    }

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
        <div className='row' id='text_filter_row'>
          <ColTextInput
            id='batch_id_input'
            value={this.state.batch_id_input}
            onChange={this.handleInputChange}
            label='Filter by batch ID'
            width='s10 m8 l4'
            required={false}
          />
        </div>
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
