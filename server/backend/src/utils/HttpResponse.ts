// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Helper functions to set different http response

import config from '../config/Index';
import { KaryaHTTPContext } from '../controllers/KoaContextType';

import { isArray } from 'util';
import { ErrorBody } from './HttpResponseTypes';

/**
 * All functions here, take the Koa request context as the first argument and
 * set the appropriate response in the context object.
 */

/**
 * Set OK response
 * @param data Response object in case of a successful response
 */
export function OK(ctx: KaryaHTTPContext, data: object) {
  ctx.status = 200;
  ctx.set('Content-type', 'application/json; charset=UTF-8;');
  ctx.body = data;
}

/**
 * Set Bad Request response
 * @param messages List of error messages
 */
export function BadRequest(ctx: KaryaHTTPContext, messages: string | string[]) {
  GenericError(ctx, messages, 400, 'Bad request');
}

/**
 * Set Unauthorized access response
 * @param messages List of error messages
 */
export function Unauthorized(
  ctx: KaryaHTTPContext,
  messages: string | string[],
) {
  GenericError(ctx, messages, 401, 'Authentication failed');
}

/**
 * Set Forbidden access response
 * @param messages List of error messages
 */
export function Forbidden(ctx: KaryaHTTPContext, messages: string | string[]) {
  GenericError(ctx, messages, 403, 'Access to resource forbidden');
}

/**
 * Set Not found access response
 * @param messages List of error messages
 */
export function NotFound(ctx: KaryaHTTPContext, messages: string | string[]) {
  GenericError(ctx, messages, 404, 'Resource not found');
}

/**
 * Set Unavailable access response
 * @param messages List of error messages
 */
export function Unavailable(
  ctx: KaryaHTTPContext,
  messages: string | string[],
) {
  GenericError(ctx, messages, 503, 'Resource not available');
}

/**
 * Function to set a generic error
 * @param messages list of messages or a single message
 * @param status HTTP response status code
 * @param title Short title for the message
 */
export function GenericError(
  ctx: KaryaHTTPContext,
  messages: string | string[],
  status = 400,
  title = 'Unknown error',
) {
  const errorBody: ErrorBody = isArray(messages)
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

/**
 * Set a cookie in the HTTP response
 * @param ctx Koa context
 * @param key key of the cookie
 * @param value value of the cookie
 */
export function setCookie(
  ctx: KaryaHTTPContext,
  key: string,
  value: string | undefined,
) {
  if (value !== undefined) {
    const { maxAge, ...cookieOptions } = config.cookieOptions;
    const addMilliseconds = maxAge || 15 * 60 * 1000;
    const expires = new Date();
    expires.setMilliseconds(expires.getMilliseconds() + addMilliseconds);
    ctx.cookies.set(key, value, { ...cookieOptions, expires });
  }
  // Else do something
}

/**
 * Reset a cookie in the HTTP response
 * @param ctx Koa context
 * @param key key of the cookie
 * @param value value of the cookie
 */
export function resetCookie(ctx: KaryaHTTPContext, key: string) {
  const { maxAge, ...cookieOptions } = config.cookieOptions;
  ctx.cookies.set(key, '', { ...cookieOptions, expires: new Date(0) });
}
