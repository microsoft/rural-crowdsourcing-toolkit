// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Middlewares for Webhooks (Razorpay)

import Application from "koa";
import * as HttpResponse from '@karya/http-response';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import { envGetString } from "@karya/misc-utils";

/**
 * Authenticate an incoming webhook request from razorpay.
 */
export const authenticateWebhookRequest: Application.Middleware = async (ctx, next) => {
    try {
        const webhookBody = ctx.request.body
        const webhookSignature = ctx.request.header['X-Razorpay-Signature'] as string
        const webhookSecret = envGetString('RAZORPAY_WEBHOOK_SECRET')
        verifyWebhookSignature(webhookBody, webhookSignature, webhookSecret)
        console.log("SUCCESSFULLY VERIFIED THE SIGNATURE", webhookBody, webhookSignature, webhookSecret)
    } catch(e: any) {
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
    console.log(ctx.body)
    HttpResponse.OK(ctx, ctx.body)
}