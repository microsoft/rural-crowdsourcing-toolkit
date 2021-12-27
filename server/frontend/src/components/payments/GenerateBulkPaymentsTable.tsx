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
import { Button } from 'react-materialize';
import BulkPaymentsList from './BulkPaymentsList';
import BulkTransactionHistoryList from './BulkTransactionHistoryList';

class GenerateBulkPaymentsTable extends React.Component {

	state: { visibleEntity?: 'workerList' | 'history' } = {}

	handleGenerateListClick = () => {
		this.setState((state, props) => ({ visibleEntity: 'workerList' }))
	}

  handleHistoryButtonClick = () => {
    this.setState((state, props) => ({ visibleEntity: 'history' }))
  }



  render() {

    return (
      <div className='row main-row'>
        <h1 className='page-title' id='boxes-title'>
          Bulk Payments
        </h1>
				<p>Generate list of workers with their amount earned to pay them in bulk</p>
				<Button onClick={this.handleGenerateListClick}>Generate List</Button>
				<Button onClick={this.handleHistoryButtonClick}>View History</Button>
  
				{  
          this.state.visibleEntity === 'workerList' ? (
            <div className='worker-list-section'>
              {/*// @ts-ignore */}
              <BulkPaymentsList />
              <Button>Make Payment</Button>
            </div>
          ) : this.state.visibleEntity === 'history' ? (
            // @ts-ignore
            <BulkTransactionHistoryList />
          ) : null
        }
      </div>
    );
  }
}

export default GenerateBulkPaymentsTable;
