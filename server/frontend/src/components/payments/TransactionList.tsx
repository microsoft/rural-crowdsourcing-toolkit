// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display the list of bulk transaction history.
 */

// React stuff
import React from 'react';

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { compose } from 'redux';

// HTML helpers
import { ErrorMessage, ProgressBar } from '../templates/Status';
import { TableColumnType, TableList } from '../templates/TableList';

// HoCs
import { DataProps, withData } from '../hoc/WithData';

// CSS
import { PaymentsTransactionRecord } from '@karya/core';

// Create the connector
const connector = withData('payments_transaction');

// Box list props
type TransactionListProps = DataProps<typeof connector>;

type TransactionTableRecord = PaymentsTransactionRecord & {failure_reason: string | null}

// Box list component
class TransactionList extends React.Component<TransactionListProps> {
  render() {
    const data: TransactionTableRecord[] = this.props.payments_transaction.data.map(item => {
      return {
        ...item,
        failure_reason: item.meta ? ((item.meta as any).failure_reason) as string : null
      }
    });
    console.log(data);

    // get error element
    const errorElement =
      this.props.payments_transaction.status === 'FAILURE' ? <ErrorMessage message={this.props.payments_transaction.messages} /> : null;

    // Box table columns
    const tableColumns: Array<TableColumnType<TransactionTableRecord>> = [
      { header: 'Worker ID', type: 'field', field: 'worker_id' },
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
        <h1 className='page-title'>
        Transactions History
        </h1>
        <h3></h3>
        {errorElement}
        {this.props.payments_transaction.status === 'IN_FLIGHT' && <ProgressBar /> }
        <div className='basic-table'>
          <TableList<TransactionTableRecord> columns={tableColumns} rows={data} emptyMessage='No transaction has been made' />
        </div>
      </div>
    );
  }
}

export default connector(TransactionList);
