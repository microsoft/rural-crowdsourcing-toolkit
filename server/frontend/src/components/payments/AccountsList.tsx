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
import { PaymentsAccountRecord } from '@karya/core';
import { CSVLink } from 'react-csv';
import Pagination from 'react-js-pagination';
import { ColTextInput } from '../templates/FormInputs';

// Create the connector
const connector = withData('payments_account');

// Box list props
type AccountsListProps = DataProps<typeof connector>;

type AccountsListState = {
  tableCollapsed: boolean;
  accounts_table: {
    total_rows_per_page: number;
    current_page: number;
  };
  worker_id_input: string;
  fund_id_input: string;
};

type AccountsTableRecord = PaymentsAccountRecord & { failure_reason: string | null };

// Box list component
class AccountsList extends React.Component<AccountsListProps, AccountsListState> {
  state: AccountsListState = {
    tableCollapsed: false,
    accounts_table: {
      total_rows_per_page: 10,
      current_page: 1,
    },
    worker_id_input: '',
    fund_id_input: '',
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
    var data: AccountsTableRecord[] = this.props.payments_account.data
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
      data = data.filter((a) => a.worker_id?.startsWith(worker_id_input));
    }

    // Filtering data by fund ID
    const { fund_id_input } = this.state;
    if (fund_id_input !== undefined && fund_id_input !== '') {
      data = data.filter((a) => a.fund_id?.startsWith(fund_id_input));
    }

    // get error element
    const errorElement =
      this.props.payments_account.status === 'FAILURE' ? (
        <ErrorMessage message={this.props.payments_account.messages} />
      ) : null;

    // Box table columns
    const tableColumns: Array<TableColumnType<AccountsTableRecord>> = [
      { header: 'Worker ID', type: 'field', field: 'worker_id' },
      { header: 'Fund ID ', type: 'field', field: 'fund_id' },
      { header: 'Account Type', type: 'field', field: 'account_type' },
      { header: 'Status', type: 'field', field: 'status' },
      { header: 'Active', type: 'field', field: 'active' },
      { header: 'Failure Reason', type: 'field', field: 'failure_reason' },
      { header: 'Created at', type: 'field', field: 'created_at' },
    ];

    return (
      <div>
        <h1 className='page-title'>Accounts History</h1>
        <CSVLink data={data} filename='accountsData' className='btn' id='download-btn'>
          <i className='material-icons left'>download</i>Download data
        </CSVLink>
        <br />
        <a href='#' onClick={this.handleTableCollapseClick}>
          {collapseTableText}
        </a>
        {errorElement}
        {this.props.payments_account.status === 'IN_FLIGHT' && <ProgressBar />}
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
                id='fund_id_input'
                value={this.state.fund_id_input}
                onChange={this.handleInputChange}
                label='Filter by fund ID'
                width='s10 m8 l4'
                required={false}
              />
            </div>
            <div className='basic-table'>
              <TableList<AccountsTableRecord>
                columns={tableColumns}
                rows={data.slice(
                  (this.state.accounts_table.current_page - 1) * this.state.accounts_table.total_rows_per_page,
                  this.state.accounts_table.current_page * this.state.accounts_table.total_rows_per_page,
                )}
                emptyMessage='No account has been created'
              />
              <Pagination
                activePage={this.state.accounts_table.current_page}
                itemsCountPerPage={this.state.accounts_table.total_rows_per_page}
                totalItemsCount={data.length}
                pageRangeDisplayed={5}
                onChange={(pageNo) =>
                  this.setState((prevState) => ({
                    accounts_table: {
                      ...prevState.accounts_table,
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

export default connector(AccountsList);
