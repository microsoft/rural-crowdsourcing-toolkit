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
import { ColTextInput } from '../templates/FormInputs';

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
type BulkPaymentsListProps = DataProps<typeof dataConnector> &
  ConnectedProps<typeof reduxConnector> & { postClick: () => void };

type BulkPaymentsListState = {
  workers_eligible: {
    [key: string]: boolean;
  };
  all_workers_selected: boolean;
  worker_id_input: string;
  unique_id_input: string;
  access_code_input: string;
  phone_number_input: string;
};

// Box list component
class BulkPaymentsList extends React.Component<BulkPaymentsListProps, BulkPaymentsListState> {
  state: BulkPaymentsListState = {
    workers_eligible: {},
    all_workers_selected: true,
    worker_id_input: '',
    unique_id_input: '',
    access_code_input: '',
    phone_number_input: '',
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

  handleWorkersEligibleIsEmpty = () => {
    const workers_eligible_initial = Object.fromEntries(
      this.props.payments_eligible_worker.data.map((worker) => {
        return [worker.id, true];
      }),
    );
    if (Object.values(this.state.workers_eligible).length === 0) {
      // eslint-disable-next-line react/no-direct-mutation-state
      this.state.workers_eligible = workers_eligible_initial;
    }
  };

  // Handle input change
  handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    this.setState({ ...this.state, [e.currentTarget.id]: e.currentTarget.value });
  };

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
    this.props.postClick();
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
    this.handleWorkersEligibleIsEmpty();

    const workers = this.props.payments_eligible_worker.data;
    const totalAmount = workers.reduce((acc, worker) => {
      var checked = this.state.workers_eligible[worker.id];
      if (checked) {
        acc += worker.amount;
      }
      return acc;
    }, 0);

    const { all_workers_selected } = this.state;
    const { worker_id_input } = this.state;
    const { access_code_input } = this.state;
    const { phone_number_input } = this.state;
    const { unique_id_input } = this.state;

    // Filtering workers by worker ID
    var workers_filtered = workers;
    if (worker_id_input !== undefined && worker_id_input !== '') {
      workers_filtered = workers.filter((w) => w.id.startsWith(worker_id_input));
    }

    if (access_code_input !== undefined && access_code_input !== '') {
      workers_filtered = workers.filter((w) => w.access_code.startsWith(access_code_input));
    }

    if (phone_number_input !== undefined && phone_number_input !== '') {
      workers_filtered = workers.filter((w) => w.phone_number!.startsWith(phone_number_input));
    }

    if (unique_id_input !== undefined && unique_id_input !== '') {
      workers_filtered = workers.filter((w) => w.unique_id!.startsWith(unique_id_input));
    }

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
                checked={this.state.workers_eligible[id]}
                onChange={this.handleBooleanChange}
              />
              <span></span>
            </label>
          );
        },
      },
      { header: 'Worker IDs', type: 'field', field: 'id' },
      { header: 'Unique ID', type: 'field', field: 'unique_id' },
      { header: 'Access Code ', type: 'field', field: 'access_code' },
      { header: 'Phone Number ', type: 'field', field: 'phone_number' },
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
        <div className='row' id='worker-id-search-row'>
          <ColTextInput
            id='unique_id_input'
            value={this.state.unique_id_input}
            onChange={this.handleInputChange}
            label='Search by unique ID'
            width='s10 m8 l4'
            required={false}
          />
          <ColTextInput
            id='worker_id_input'
            value={this.state.worker_id_input}
            onChange={this.handleInputChange}
            label='Search by worker ID'
            width='s10 m8 l4'
            required={false}
          />
          <ColTextInput
            id='access_code_input'
            value={this.state.access_code_input}
            onChange={this.handleInputChange}
            label='Search by access code'
            width='s10 m8 l4'
            required={false}
          />
          <ColTextInput
            id='phone_number_input'
            value={this.state.phone_number_input}
            onChange={this.handleInputChange}
            label='Search by phone number'
            width='s10 m8 l4'
            required={false}
          />
        </div>
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
            rows={workers_filtered.sort((a, b) => {
              return a.amount > b.amount ? -1 : 1;
            })}
            emptyMessage='No worker pending for payment'
          />
        </div>
        {makePaymentButton}
      </div>
    );
  }
}

export default connector(BulkPaymentsList);
