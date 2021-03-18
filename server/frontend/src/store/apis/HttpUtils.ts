// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Helper functions to interact with the backend
 */

import axios, { AxiosError } from 'axios';
import config from '../../config/Index';
import { ErrorBody } from './HttpResponseTypes';

/** Set axios base server URL prefix from config */
const { url } = config.backend;
axios.defaults.baseURL = `${url}/api`;

/** Send credentials with all requests */
axios.defaults.withCredentials = true;

/**
 * Send a backend POST request
 * @param endpoint Request endpoint
 * @param obj Object to be sent with the post request
 * @param headers Headers to be included
 * @param files Files to be attached
 */
export async function POST<RequestType = any, ResponseType = any>(
  endpoint: string,
  obj: RequestType,
  headers: { [id: string]: string } = {},
  files?: { [id: string]: File },
): Promise<ResponseType> {
  if (files === undefined) {
    // If no files, send directly
    const response = await axios.post<ResponseType>(endpoint, obj, { headers });
    return response.data;
  } else {
    // If files, send multipart request
    const data = new FormData();
    data.append('data', JSON.stringify(obj));
    Object.entries(files).forEach(([name, file]) => {
      data.append(name, file);
    });
    const response = await axios.post<ResponseType>(endpoint, data, {
      headers: { 'Content-Type': 'multipart/form-data', ...headers },
    });
    return response.data;
  }
}

/**
 * Send a PUT request to the backend
 * @param endpoint Request endpoint
 * @param obj Object to be sent with request
 * @param files Files to be attached
 */
export async function PUT<RequestType = any, ResponseType = any>(
  endpoint: string,
  obj: RequestType,
  files?: { [id: string]: File },
): Promise<ResponseType> {
  if (files === undefined) {
    // If no files, send directly
    const response = await axios.put<ResponseType>(endpoint, obj);
    return response.data;
  } else {
    // If files, send multipart request
    const data = new FormData();
    data.append('data', JSON.stringify(obj));
    Object.entries(files).forEach(([name, file]) => {
      data.append(name, file);
    });
    const response = await axios.put<ResponseType>(endpoint, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
}

/**
 * Send a GET request to the backend
 * @param endpoint Request end point
 * @param params Query parameters to be sent with the request
 */
export async function GET<ParamsType = any, ResponseType = any>(
  endpoint: string,
  params?: ParamsType,
): Promise<ResponseType> {
  const response = await axios.get<ResponseType>(endpoint, { params });
  return response.data;
}

/**
 * Handle error from axios request
 * @param err Exception error object
 */
export function handleError(err: any) {
  if (err.isAxiosError) {
    const axiosErr = err as AxiosError<ErrorBody>;
    const messages = axiosErr.response
      ? axiosErr.response.data.messages
      : ['Your internet connection down or server down'];
    return messages;
  } else {
    return ['Your internet connection down or server down'];
  }
}
