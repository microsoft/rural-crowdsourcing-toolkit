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

import { PaymentsTransactionRecord } from '@karya/core';
import { CSVLink } from 'react-csv';
import Pagination from 'react-js-pagination';
import { ColTextInput } from '../templates/FormInputs';

// Create the connector
const connector = withData('payments_transaction_table');

// Box list props
type TransactionListProps = DataProps<typeof connector>;

type TransactionListState = {
  tableCollapsed: boolean;
  transaction_table: {
    total_rows_per_page: number;
    current_page: number;
  };
  unique_id_input: string;
  worker_id_input: string;
  bulk_id_input: string;
  account_id_input: string;
  payout_id_input: string;
};

type TransactionTableRecord = PaymentsTransactionRecord & 
  { 
    unique_id: string | null,
    failure_reason: string | null
  };

// Box list component
class TransactionList extends React.Component<TransactionListProps, TransactionListState> {
  state: TransactionListState = {
    tableCollapsed: false,
    transaction_table: {
      total_rows_per_page: 10,
      current_page: 1,
    },
    worker_id_input: '',
    unique_id_input: '',
    bulk_id_input: '',
    account_id_input: '',
    payout_id_input: '',
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

  handleTableCollapseClick = () => {
    const showTable = !this.state.tableCollapsed;
    this.setState((state, props) => ({
      tableCollapsed: showTable,
    }));
  };

  render() {
    var data: TransactionTableRecord[] = this.props.payments_transaction_table.data
      .map((item) => {
        return {
          ...item,
          created_at: new Date(item.created_at).toDateString(),
          failure_reason: item.meta ? ((item.meta as any).failure_reason as string) : null,
        };
      })
      .reverse();

    const collapseTableText = this.state.tableCollapsed ? 'Show Table' : 'Collapse Table';

    // Filtering data by worker ID
    const { worker_id_input } = this.state;
    if (worker_id_input !== undefined && worker_id_input !== '') {
      data = data.filter((t) => t.worker_id.startsWith(worker_id_input));
    }

    // Filtering data by bulk ID
    const { bulk_id_input } = this.state;
    if (bulk_id_input !== undefined && bulk_id_input !== '') {
      data = data.filter((t) => t.bulk_id?.startsWith(bulk_id_input));
    }

    // Filtering data by account ID
    const { account_id_input } = this.state;
    if (account_id_input !== undefined && account_id_input !== '') {
      data = data.filter((t) => t.account_id.startsWith(account_id_input));
    }

    // Filtering data by payout ID
    const { payout_id_input } = this.state;
    if (payout_id_input !== undefined && payout_id_input !== '') {
      data = data.filter((t) => t.payout_id?.startsWith(payout_id_input));
    }

    // get error element
    const errorElement =
      this.props.payments_transaction_table.status === 'FAILURE' ? (
        <ErrorMessage message={this.props.payments_transaction_table.messages} />
      ) : null;

    // Box table columns
    const tableColumns: Array<TableColumnType<TransactionTableRecord>> = [
      { header: 'Worker ID', type: 'field', field: 'worker_id' },
      { header: 'Unique ID', type: 'field', field: 'unique_id' },
      { header: 'Bulk ID ', type: 'field', field: 'bulk_id' },
      { header: 'Amount ', type: 'field', field: 'amount' },
      { header: 'Account ID', type: 'field', field: 'account_id' },
      { header: 'Mode', type: 'field', field: 'mode' },
      { header: 'Purpose', type: 'field', field: 'purpose' },
      { header: 'Payout ID', type: 'field', field: 'payout_id' },
      { header: 'Status', type: 'field', field: 'status' },
      { header: 'Failure Reason', type: 'field', field: 'failure_reason' },
      { header: 'Created at', type: 'field', field: 'created_at' },
    ];

    return (
      <div>
        <h1 className='page-title'>Transactions History</h1>
        <CSVLink data={data} filename='transactionsData' className='btn' id='download-btn'>
          <i className='material-icons left'>download</i>Download data
        </CSVLink>
        <br />
        <a href='#' onClick={this.handleTableCollapseClick}>
          {collapseTableText}
        </a>
        {errorElement}
        {this.props.payments_transaction_table.status === 'IN_FLIGHT' && <ProgressBar />}
        {!this.state.tableCollapsed && (
          <>
            <div className='row' id='text_filter_row'>
              <ColTextInput
                id='worker_id_input'
                value={this.state.worker_id_input}
                onChange={this.handleInputChange}
                label='Filter by worker ID'
                width='s10 m8 l4'
                required={false}
              />
              <ColTextInput
                id='unique_id_input'
                value={this.state.unique_id_input}
                onChange={this.handleInputChange}
                label='Filter by unique ID'
                width='s10 m8 l4'
                required={false}
              />
              <ColTextInput
                id='bulk_id_input'
                value={this.state.bulk_id_input}
                onChange={this.handleInputChange}
                label='Filter by bulk ID'
                width='s10 m8 l4'
                required={false}
              />
              <ColTextInput
                id='account_id_input'
                value={this.state.account_id_input}
                onChange={this.handleInputChange}
                label='Filter by account ID'
                width='s10 m8 l4'
                required={false}
              />
              <ColTextInput
                id='payout_id_input'
                value={this.state.payout_id_input}
                onChange={this.handleInputChange}
                label='Filter by payout ID'
                width='s10 m8 l4'
                required={false}
              />
            </div>
            <div className='basic-table'>
              <TableList<TransactionTableRecord>
                columns={tableColumns}
                rows={data.slice(
                  (this.state.transaction_table.current_page - 1) * this.state.transaction_table.total_rows_per_page,
                  this.state.transaction_table.current_page * this.state.transaction_table.total_rows_per_page,
                )}
                emptyMessage='No transaction has been made'
              />
              <Pagination
                activePage={this.state.transaction_table.current_page}
                itemsCountPerPage={this.state.transaction_table.total_rows_per_page}
                totalItemsCount={data.length}
                pageRangeDisplayed={5}
                onChange={(pageNo) =>
                  this.setState((prevState) => ({
                    transaction_table: {
                      ...prevState.transaction_table,
                      current_page: pageNo,
                    },
                  }))
                }
              />
            </div>
          </>
        )}
      </div>
    );
  }
}

export default connector(TransactionList);
