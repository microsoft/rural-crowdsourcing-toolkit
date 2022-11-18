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
import { Promise as BBPromise } from 'bluebird';

const RAZORPAY_CONTACTS_RELATIVE_URL = 'payouts';

/** Main Script */
(async () => {
  setupDbConnection();
  const formattedFinalStates = FINAL_TRANSACTION_STATES.map((state, idx, arr) => `'${state}'`);
  // get records with non final states
  const knexResponse = await knex.raw(
    `SELECT * from payments_transaction WHERE STATUS NOT IN (${formattedFinalStates})`
  );
  const transactionRecords: PaymentsTransactionRecord[] = knexResponse.rows;

  await BBPromise.mapSeries(transactionRecords, async (transactionRecord) => {
    const payout_id = transactionRecord.payout_id;
    if (payout_id == null) {
      console.log(`Cannot update transaction ${transactionRecord.id}: No payout ID`);
      return;
    }
    const razorpayResponse = await razorPayAxios.get<PayoutResponse>(`${RAZORPAY_CONTACTS_RELATIVE_URL}/${payout_id}`);
    await updateTransactionRecord(razorpayResponse.data);
  });
})().finally(() => knex.destroy());
