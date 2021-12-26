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

// Map dispatch to props
const mapDispatchToProps = (dispatch: any) => {
  return {
    generateList: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'payments_eligible_worker',
        label: 'GET_ALL',
      };
      dispatch(action);
    },
  };
};

// Create the connector
const reduxConnector = connect(null, mapDispatchToProps);
const dataConnector = withData('payments_eligible_worker');
const connector = compose(dataConnector, reduxConnector);

// Box list props
type BulkPaymentsListProps = DataProps<typeof dataConnector> & ConnectedProps<typeof reduxConnector>;

// Box list component
class BulkPaymentsList extends React.Component<BulkPaymentsListProps> {

  render() {
    const workers = this.props.payments_eligible_worker.data;
    console.log(workers);

    // get error element
    const errorElement =
      this.props.payments_eligible_worker.status === 'FAILURE' ? <ErrorMessage message={this.props.payments_eligible_worker.messages} /> : null;

    // Box table columns
    const tableColumns: Array<TableColumnType<PaymentEligibleWorkerRecord>> = [
      { header: 'Worker ID', type: 'field', field: 'id' },
      { header: 'Amount ', type: 'field', field: 'amount' },
    ];

    return (
      <div className='row main-row'>
        {errorElement}
        <h1 className='page-title' id='boxes-title'>
          Workers
        </h1>
        {this.props.payments_eligible_worker.status === 'IN_FLIGHT' && <ProgressBar /> }
        <div className='basic-table' id='box-table'>
          <TableList<PaymentEligibleWorkerRecord> columns={tableColumns} rows={workers} emptyMessage='No worker pending for payment' />
        </div>
      </div>
    );
  }
}

export default connector(BulkPaymentsList);
