// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * The component allows the user to make bulk payments. 
 * Component contains BulkTranasctionHistory component and BulkPaymentsList component.
 */

// React stuff
import React from 'react';

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

  handleHistoryBtnClick = () => {
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
				  <Button onClick={this.handleHistoryBtnClick}>View History</Button>
        </div>
  
				{  
          this.state.visibleEntity === 'workerList' ? (
            <div className='worker-list-section'>
              {/*// @ts-ignore */}
              <BulkPaymentsList />
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