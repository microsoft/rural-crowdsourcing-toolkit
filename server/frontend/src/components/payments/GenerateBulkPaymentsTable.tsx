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
  state: {
    visibleEntity?: 'workerList' | 'history';
    tableCollapsed: boolean;
  } = {
    tableCollapsed: true,
  };

  handleGenerateListClick = () => {
    this.setState((state, props) => ({
      visibleEntity: 'workerList',
      tableCollapsed: false,
    }));
  };

  handleHistoryBtnClick = () => {
    this.setState((state, props) => ({
      visibleEntity: 'history',
      tableCollapsed: false,
    }));
  };

  handleTableCollapseClick = () => {
    this.setState((state, props) => ({
      ...state,
      tableCollapsed: true,
    }));
  };

  render() {
    const collapseTableButton = !this.state.tableCollapsed ? (
      <a href='#' onClick={this.handleTableCollapseClick}>
        Collapse Table
      </a>
    ) : null;

    return (
      <div className='row main-row'>
        <h1 className='page-title'>Bulk Payments</h1>
        <p className='table-headline'>Generate list of workers with their amount earned to pay them in bulk</p>
        <div className='header-buttons'>
          <Button onClick={this.handleGenerateListClick}>Generate List</Button>
          <Button onClick={this.handleHistoryBtnClick}>View History</Button>
        </div>
        <br />
        {collapseTableButton}
        {!this.state.tableCollapsed ? (
          this.state.visibleEntity === 'workerList' ? (
            <div className='worker-list-section'>
              {/*// @ts-ignore */}
              <BulkPaymentsList postClick={this.handleHistoryBtnClick} />
            </div>
          ) : this.state.visibleEntity === 'history' ? (
            // @ts-ignore
            <BulkTransactionHistoryList />
          ) : null
        ) : null}
      </div>
    );
  }
}

export default GenerateBulkPaymentsTable;
