// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// List of end points for webhook endpoints.

import Application from 'koa';
import BodyParser from 'koa-body';
import Router from 'koa-router';
import * as RazorpayController from '../webhook-controllers/payments/RazorpayController';

export const webhookRouter = new Router();

// payments webhooks
webhookRouter.post(
  '/payments/razorpay/payouts',
  BodyParser(),
  RazorpayController.authenticateWebhookRequest,
  RazorpayController.updateTransactionMiddleware
);
