// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Helper functions to interact with the backend
 */

import axios, { AxiosError, ResponseType as AxiosResponseType } from 'axios';
import * as FormData from 'form-data';
import { File } from 'formidable';
import fetch, { RequestInit } from 'node-fetch';
import config from '../config/Index';
import { authHeader, this_box } from '../config/ThisBox';
import { ErrorBody } from './HttpResponseTypes';

/**
 * Helper function to send a backend request using the fetch library
 * @param resource Endpoint to fetch from the backend
 * @param params Parameters of the request
 */
export async function BackendFetch<ResponseType = any>(
  resource: string,
  params: RequestInit,
): Promise<ResponseType> {
  const headers = params.headers
    ? { ...params.headers, ...authHeader }
    : { ...authHeader };
  const response = await fetch(`${config.serverUrl}/api${resource}`, {
    ...params,
    headers,
    timeout: 0,
  });
  const data = (await response.json()) as ResponseType;
  if (response.status >= 200 && response.status < 300) {
    return data;
  }

  throw new Error(JSON.stringify(data));
}

/** Set axios base server URL prefix from config */
const url = config.serverUrl;
axios.defaults.baseURL = `${url}/api`;

export { axios };

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
  files?: { [id: string]: File },
): Promise<ResponseType> {
  if (files === undefined) {
    // If no files, send directly
    const response = await axios.post<ResponseType>(endpoint, obj, {
      headers: {
        'box-id': this_box.id,
        'id-token': this_box.key,
      },
    });
    return response.data;
  } else {
    // If files, send multipart request
    const data = new FormData();
    data.append('data', JSON.stringify(obj));
    Object.entries(files).forEach(([name, file]) => {
      data.append(name, file);
    });
    const response = await axios.post<ResponseType>(endpoint, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'box-id': this_box.id,
        'id-token': this_box.key,
      },
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
  contentType: string = 'application/json; charset=utf-8',
): Promise<ResponseType> {
  if (files === undefined) {
    // If no files, send directly
    const response = await axios.put<ResponseType>(endpoint, obj, {
      headers: {
        'box-id': this_box.id,
        'id-token': this_box.key,
        'content-type': contentType,
      },
    });
    return response.data;
  } else {
    // If files, send multipart request
    const data = new FormData();
    data.append('data', JSON.stringify(obj));
    Object.entries(files).forEach(([name, file]) => {
      data.append(name, file);
    });
    const response = await axios.put<ResponseType>(endpoint, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'box-id': this_box.id,
        'id-token': this_box.key,
      },
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
  responseType: AxiosResponseType = 'json',
): Promise<ResponseType> {
  const response = await axios.get<ResponseType>(endpoint, {
    params,
    headers: {
      'box-id': this_box.id,
      'id-token': this_box.key,
    },
    responseType,
  });
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
