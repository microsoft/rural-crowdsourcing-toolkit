// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display the list of boxes in the system. The component also
 * provides an action button to generate a new creation code for a box.
 */

// React stuff
import React, { ChangeEventHandler } from 'react';

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

type BulkPaymentsListState = {
  workers_eligible: {
    [key: string]: boolean;
  };
  all_workers_selected: boolean;
};

// Box list component
class BulkPaymentsList extends React.Component<BulkPaymentsListProps, BulkPaymentsListState> {
  state: BulkPaymentsListState = {
    workers_eligible: {},
    all_workers_selected: true,
  };

  // Initialize materialize fields
  componentDidMount() {
    M.AutoInit();
  }

  // On update, update materialize fields
  componentDidUpdate() {
    M.AutoInit();
  }

  // Handle boolean input change
  handleBooleanChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const workers_eligible = { ...this.state.workers_eligible, [e.currentTarget.id]: e.currentTarget.checked };
    if (!e.currentTarget.checked) {
      const all_workers_selected = false;
      this.setState({ all_workers_selected });
    }
    this.setState({ workers_eligible });
  };

  handleBooleanSelectAll: ChangeEventHandler<HTMLInputElement> = (e) => {
    const workers_eligible = this.state.workers_eligible;
    const all_workers_selected = e.currentTarget.checked;
    if (all_workers_selected) {
      for (let key in workers_eligible) {
        workers_eligible[key] = true;
      }
      this.setState({ workers_eligible });
    }
    this.setState({ all_workers_selected });
  };

  handleMakePaymentBtnClick = () => {
    const requestBody = this.createBulkPaymentsRequestBody();
    this.props.createBulkTransaction(requestBody);
  };

  createBulkPaymentsRequestBody = () => {
    const requestBody: BulkPaymentsTransactionRequest = this.props.payments_eligible_worker.data
      .filter((worker) => this.state.workers_eligible[worker.id] === true)
      .map((worker) => {
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
    const workers_eligible_initial = Object.fromEntries(workers.map((worker) => [worker.id, true]));
    const workers_eligible =
      Object.values(this.state.workers_eligible).length === 0 ? workers_eligible_initial : this.state.workers_eligible;
    const all_workers_selected = this.state.all_workers_selected;

    // get error element
    const errorElement =
      this.props.payments_eligible_worker.status === 'FAILURE' ? (
        <ErrorMessage message={this.props.payments_eligible_worker.messages} />
      ) : null;

    // Box table columns
    const tableColumns: Array<TableColumnType<PaymentEligibleWorkerRecord>> = [
      {
        header: '',
        type: 'function',
        function: (w) => {
          const id = w.id;
          return (
            <label htmlFor={id}>
              <input
                type='checkbox'
                className='filled-in'
                id={id}
                checked={workers_eligible[id]}
                onChange={this.handleBooleanChange}
              />
              <span></span>
            </label>
          );
        },
      },
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
        <div className='basic-table' id='payments-eligible-worker-table'>
          <div className='row' id='select-all-row'>
            <label htmlFor='select-all-checkbox'>
              <input
                type='checkbox'
                className='filled-in'
                id='select-all-checkbox'
                checked={all_workers_selected}
                onChange={this.handleBooleanSelectAll}
              />
              <span></span>
            </label>
          </div>
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
