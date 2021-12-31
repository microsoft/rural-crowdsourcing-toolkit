// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Middlewares for Webhooks (Razorpay)

import Application from "koa";
import * as HttpResponse from '@karya/http-response';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import { envGetString } from "@karya/misc-utils";
import { FINAL_TRANSACTION_STATES, PaymentsTransactionRecord, PayoutResponse, TransactionStatus, TransactionPurpose } from "@karya/core";
import { BasicModel, PaymentsAccountModel } from "@karya/common";

/**
 * Authenticate an incoming webhook request from razorpay.
 */
export const authenticateWebhookRequest: Application.Middleware = async (ctx, next) => {
    try {
        const webhookBody = ctx.request.body
        const webhookSignature = ctx.request.header['x-razorpay-signature'] as string
        const webhookSecret = envGetString('RAZORPAY_WEBHOOK_SECRET')
        verifyWebhookSignature(webhookBody, webhookSignature, webhookSecret)
        console.log("SUCCESSFULLY VERIFIED THE SIGNATURE", webhookBody, webhookSignature, webhookSecret)
        await next()
    } catch(e: any) {
        console.log("VERIFICATION FAILED", e)
        HttpResponse.Unauthorized(ctx, e.message)
        return
    }
};

const verifyWebhookSignature = (webhookBody: Object, webhookSignature: string, webhookSecret: string) => {
    const expectedSignature = hmacSHA256(JSON.stringify(webhookBody), webhookSecret)
    if (expectedSignature.toString() != webhookSignature) {
        throw Error(`Invalid signature for the webhook body`)
    }
}


/**
 * Function to update transaction record on getting a payout update (webhook) from Razorpay
 */

export const updateTransaction: Application.Middleware = async (ctx, next) => {
    const payoutEntity: PayoutResponse = ctx.request.body.payload.payout.entity
    // Get the transaction record with the payout ID
    let transactionRecord: PaymentsTransactionRecord
    try {
        transactionRecord = await BasicModel.getSingle('payments_transaction', {payout_id: payoutEntity.id})
    } catch(e) {
        console.error(e)
        throw e
    }
    const currentStatus = transactionRecord.status
    const razorpayStatus = payoutEntity.status
    // Check if status of record can be updated
    if (FINAL_TRANSACTION_STATES.includes(currentStatus)) {
        console.log(`payout status already in ${currentStatus}, cannot be updated to ${razorpayStatus}`)
        return HttpResponse.OK(ctx, {})
    }
    // Queued status is to be ignored for current processing transactions
    if (currentStatus == TransactionStatus.PROCESSING 
        && razorpayStatus == TransactionStatus.QUEUED) {
            return HttpResponse.OK(ctx, {})
    }

    // Update the transaction record status
    const updatedTransactionRecord = await BasicModel.updateSingle('payments_transaction', { id: transactionRecord.id }, {
        status: razorpayStatus,
        meta: {
            UTR: payoutEntity.utr,
            ...transactionRecord.meta,
            failure_reason: payoutEntity.failure_reason
        }
    })
    
    // Update Account Record status
    if (transactionRecord.purpose == "VERIFICATION") {
        const accountRecord = await BasicModel.getSingle('payments_account', { id: transactionRecord.account_id })
        await PaymentsAccountModel.updateStatusOnTransactionRecordUpdate(updatedTransactionRecord, accountRecord)
    }

    HttpResponse.OK(ctx, ctx.body)
}