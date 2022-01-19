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
import { PaymentEligibleWorkerRecord } from '../../data/Views';
import { BulkPaymentsTransactionRequest } from '../../data/Index';
import { Button } from 'react-materialize';

// Map dispatch to props
const mapDispatchToProps = (dispatch: any) => {
  return {
    createBulkTransaction: (requestBody: BulkPaymentsTransactionRequest) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'bulk_payments_transaction',
        label: 'CREATE',
        request: requestBody,
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
  handleMakePaymentBtnClick = () => {
    const requestBody = this.createBulkPaymentsRequestBody();
    this.props.createBulkTransaction(requestBody);
  };

  createBulkPaymentsRequestBody = () => {
    const requestBody: BulkPaymentsTransactionRequest = this.props.payments_eligible_worker.data.map((worker) => {
      return {
        workerId: worker.id,
        amount: worker.amount,
      };
    });

    return requestBody;
  };

  render() {
    const workers = this.props.payments_eligible_worker.data;
    const totalAmount = workers.reduce((acc, item) => item.amount + acc, 0);

    // get error element
    const errorElement =
      this.props.payments_eligible_worker.status === 'FAILURE' ? (
        <ErrorMessage message={this.props.payments_eligible_worker.messages} />
      ) : null;

    // Box table columns
    const tableColumns: Array<TableColumnType<PaymentEligibleWorkerRecord>> = [
      { header: 'Worker ID', type: 'field', field: 'id' },
      { header: 'Amount ', type: 'field', field: 'amount' },
    ];

    const makePaymentButton = workers.length ? (
      <Button onClick={this.handleMakePaymentBtnClick}>Make Payment</Button>
    ) : null;

    return (
      <div>
        {errorElement}
        {this.props.payments_eligible_worker.status === 'IN_FLIGHT' && <ProgressBar />}
        <br />
        <b className='table-headline'>{workers.length ? `Total Amount: ₹${totalAmount}` : undefined}</b>
        <div className='basic-table' id='box-table'>
          <TableList<PaymentEligibleWorkerRecord>
            columns={tableColumns}
            rows={workers}
            emptyMessage='No worker pending for payment'
          />
        </div>
        {makePaymentButton}
      </div>
    );
  }
}

export default connector(BulkPaymentsList);
