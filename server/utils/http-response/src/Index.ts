// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Helper functions to set different http response
import { ExtendableContext } from 'koa';

/**
 * All functions here, take the Koa request context as the first argument and
 * set the appropriate response in the context object.
 */

/**
 * Type definition of the error body in case of a non-OK response.
 */
export type ErrorBody = {
  title: string;
  messages: string[];
};

/**
 * Set OK response
 * @param data Response object in case of a successful response
 */
export function OK(ctx: ExtendableContext, data: object) {
  ctx.status = 200;
  ctx.set('Content-type', 'application/json; charset=UTF-8;');
  ctx.body = data;
}

/**
 * Set Bad Request response
 * @param messages List of error messages
 */
export function BadRequest(ctx: ExtendableContext, messages: string | string[]) {
  GenericError(ctx, messages, 400, 'Bad request');
}

/**
 * Set Unauthorized access response
 * @param messages List of error messages
 */
export function Unauthorized(ctx: ExtendableContext, messages: string | string[]) {
  GenericError(ctx, messages, 401, 'Authentication failed');
}

/**
 * Set Forbidden access response
 * @param messages List of error messages
 */
export function Forbidden(ctx: ExtendableContext, messages: string | string[]) {
  GenericError(ctx, messages, 403, 'Access to resource forbidden');
}

/**
 * Set Not found access response
 * @param messages List of error messages
 */
export function NotFound(ctx: ExtendableContext, messages: string | string[]) {
  GenericError(ctx, messages, 404, 'Resource not found');
}

/**
 * Set Unavailable access response
 * @param messages List of error messages
 */
export function Unavailable(ctx: ExtendableContext, messages: string | string[]) {
  GenericError(ctx, messages, 503, 'Resource not available');
}

/**
 * Function to set a generic error
 * @param messages list of messages or a single message
 * @param status HTTP response status code
 * @param title Short title for the message
 */
export function GenericError(
  ctx: ExtendableContext,
  messages: string | string[],
  status = 400,
  title = 'Unknown error'
) {
  const errorBody: ErrorBody = Array.isArray(messages)
    ? {
        title,
        messages,
      }
    : { title, messages: [messages] };
  ctx.status = status;
  ctx.set('Content-type', 'application/json; charset=UTF-8;');
  ctx.body = errorBody;
}

/** Type for the response body */
export type ResponseBody = {
  success: boolean;
  data: object | null;
  message: string;
};
