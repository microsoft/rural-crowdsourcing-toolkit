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

// Create the connector
const connector = withData('bulk_payments_transaction');

// Box list props
type BulkTransactionHistoryListProps = DataProps<typeof connector>;
type BulkTransactionTableRecord = BulkPaymentsTransactionRecord & {failedForWorkerIds: string | null}


// Box list component
class BulkTransactionHistoryList extends React.Component<BulkTransactionHistoryListProps> {
  render() {
    const data: BulkTransactionTableRecord[] = this.props.bulk_payments_transaction.data.map( item => {
      return {
        ...item,
        created_at: new Date(item.created_at).toDateString(),
        failedForWorkerIds: item.meta ? ((item.meta as any).failedForWorkerIds) as string : null
      }
    });
    console.log(data);

    // get error element
    const errorElement =
      this.props.bulk_payments_transaction.status === 'FAILURE' ? <ErrorMessage message={this.props.bulk_payments_transaction.messages} /> : null;

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
        {this.props.bulk_payments_transaction.status === 'IN_FLIGHT' && <ProgressBar /> }
        <div className='basic-table'>
          <TableList<BulkTransactionTableRecord> columns={tableColumns} rows={data} emptyMessage='No bulk transaction has been made' />
        </div>
      </div>
    );
  }
}

export default connector(BulkTransactionHistoryList);
