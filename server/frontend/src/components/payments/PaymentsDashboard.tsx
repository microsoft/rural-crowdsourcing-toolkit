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
import GenerateBulkPaymentsTable from './GenerateBulkPaymentsTable';
import TransactionList from './TransactionList';

class PaymentsDashboard extends React.Component {
  render() {
    return (
      <div>
        <GenerateBulkPaymentsTable />
        <hr />
        {/** @ts-ignore */}
        <TransactionList />
      </div>
    );
  }
}

export default PaymentsDashboard;
