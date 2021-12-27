// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * The component allows the user to make bulk payments. 
 * Component contains BulkTranasctionHistory component and BulkPaymentsList component.
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
import '../../css/payments/Payments.css';
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
				<p className='table-headline'>Generate list of workers with their amount earned to pay them in bulk</p>
        <div className='header-buttons'>
				  <Button onClick={this.handleGenerateListClick}>Generate List</Button>
				  <Button onClick={this.handleHistoryButtonClick}>View History</Button>
        </div>
  
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
