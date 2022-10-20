// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Update transaction record status for the payouts that were created but 
// their webhooks couldn't be received.

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, setupBlobStore, BasicModel } from '@karya/common';
import { FINAL_TRANSACTION_STATES, PaymentsTransactionRecord, PayoutResponse } from '@karya/core';
import { razorPayAxios } from '../Queue/HttpUtils';
import { updateTransactionRecord } from '../webhook-controllers/payments/RazorpayController';

const RAZORPAY_CONTACTS_RELATIVE_URL = 'payouts';

/** Main Script */
(async () => {
  setupDbConnection();
  // get records with non final states
  const knexResponse = await knex.raw(`SELECT * from payments_transaction WHERE STATUS IN (${FINAL_TRANSACTION_STATES.toString()})`)
  const transactionRecords: PaymentsTransactionRecord[] = knexResponse.rows

  for (const transactionRecord of transactionRecords) {
    const payoutId = transactionRecord.id
    const razorpayResponse = await razorPayAxios.get<PayoutResponse>(`${RAZORPAY_CONTACTS_RELATIVE_URL}/${transactionRecord.payout_id}`)
    await updateTransactionRecord(razorpayResponse.data)
  }

})().finally(() => knex.destroy());
