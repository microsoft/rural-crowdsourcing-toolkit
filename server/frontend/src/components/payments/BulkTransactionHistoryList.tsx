// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display the list of boxes in the system. The component also
 * provides an action button to generate a new creation code for a box.
 */

// React stuff
import React, { ChangeEventHandler, FormEventHandler } from 'react';

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { compose } from 'redux';

// HTML helpers
import { ErrorMessage, ProgressBar } from '../templates/Status';
import { TableColumnType, TableList } from '../templates/TableList';

import { BackendRequestInitAction } from '../../store/apis/APIs';

// HoCs
import { DataProps, withData } from '../hoc/WithData';

// CSS
import '../../css/box/ngBoxList.css';
import { PaymentEligibleWorkerRecord } from '../../store/Views';
import { BulkPaymentsTransactionRecord } from '@karya/core';

// Map dispatch to props
const mapDispatchToProps = (dispatch: any) => {
  return {
    generateList: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'bulk_payments_transaction',
        label: 'GET_ALL',
      };
      dispatch(action);
    },
  };
};

// Create the connector
const reduxConnector = connect(null, mapDispatchToProps);
const dataConnector = withData('bulk_payments_transaction');
const connector = compose(dataConnector, reduxConnector);

// Box list props
type BulkTransactionHistoryListProps = DataProps<typeof dataConnector> & ConnectedProps<typeof reduxConnector>;

// Box list component
class BulkTransactionHistoryList extends React.Component<BulkTransactionHistoryListProps> {

  render() {
    const data = this.props.bulk_payments_transaction.data;
    console.log(data);

    // get error element
    const errorElement =
      this.props.bulk_payments_transaction.status === 'FAILURE' ? <ErrorMessage message={this.props.bulk_payments_transaction.messages} /> : null;

    // Box table columns
    const tableColumns: Array<TableColumnType<BulkPaymentsTransactionRecord>> = [
      { header: 'Batch ID', type: 'field', field: 'id' },
      { header: 'Amount ', type: 'field', field: 'amount' },
      { header: '# of Workers', type: 'field', field: 'n_workers' },
      { header: 'Status', type: 'field', field: 'status' }
    ];

    return (
      <div>
        {errorElement}
        {this.props.bulk_payments_transaction.status === 'IN_FLIGHT' && <ProgressBar /> }
        <div className='basic-table' id='box-table'>
          <TableList<BulkPaymentsTransactionRecord> columns={tableColumns} rows={data} emptyMessage='No bulk transaction has been made' />
        </div>
      </div>
    );
  }
}

export default connector(BulkTransactionHistoryList);
