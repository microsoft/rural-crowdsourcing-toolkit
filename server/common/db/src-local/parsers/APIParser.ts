// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Parse the backend apis specification and export objects that can be used by
 * the API generator
 */

import * as fs from 'fs';
import * as yaml from 'yaml';

import { TableRecordType, TableType } from './Common';
import { tables } from './TableParser';

/** Read the backend api specification */
const apiFile = `${process.cwd()}/schema/backend-apis.yaml`;
const apiData = fs.readFileSync(apiFile).toString();

/** The API type information */
type AutoMethods = 'CREATE' | 'UPDATE_BY_ID' | 'GET_BY_ID' | 'GET_ALL';
type HTTPMethods = 'GET' | 'PUT' | 'POST';
type Methods = AutoMethods | HTTPMethods;

type APIInfo = {
  auto: {
    [id in AutoMethods]: 'admin' | 'wp';
  };
  extra: {
    method: Methods;
    actor: 'admin' | 'wp';
    label: string;
    endpoint: string;
    auth_header: boolean;
    params?: string;
    request?: string;
    file: boolean;
    controller: string;
    response?: string;
  }[];
};

/** Parse the API Input */
const apiInput: { [id: string]: APIInfo } = yaml.parse(apiData);

/** Route info type */
type RouteInfo = {
  method: Methods;
  httpMethod: HTTPMethods;
  label: string;
  endpoint: string;
  auth_header: boolean;
  admin: boolean;
  auto: boolean;
  file: boolean;
  params: string | undefined;
  request: string | undefined;
  response: string;
  controller: string;
};

/** All Routes */
const routeMap: { [id: string]: RouteInfo[] } = {};

Object.entries(apiInput).forEach(([table, info]) => {
  // If table is not defined
  if (!(table in tables)) {
    console.log(`Warning: '${table}' is not a DB table`);
  }

  const routes: RouteInfo[] = [];

  // Create extra routes first
  if (info.extra) {
    info.extra.forEach((route) => {
      const method = route.method;
      if (route.endpoint === undefined) {
        route.endpoint =
          method === 'GET_BY_ID' || method === 'UPDATE_BY_ID'
            ? `/${table}/:id`
            : `/${table}`;
      }

      if (route.controller === undefined) {
        route.controller =
          method === 'CREATE'
            ? 'insertRecord'
            : method === 'UPDATE_BY_ID'
            ? 'updateRecordById'
            : method === 'GET_BY_ID'
            ? 'getRecordById'
            : method === 'GET_ALL'
            ? 'getRecords'
            : '';
      }

      if (route.controller === '') {
        throw new Error(
          `Undefined controller for ${table} route ${route.method}`,
        );
      }

      const httpMethod: HTTPMethods =
        method === 'CREATE'
          ? 'POST'
          : method === 'UPDATE_BY_ID'
          ? 'PUT'
          : method === 'GET_ALL' || method === 'GET_BY_ID'
          ? 'GET'
          : method;

      if (route.request === undefined) {
        if (httpMethod === 'POST' || httpMethod === 'PUT') {
          route.request = `DBT.${TableType(table)}`;
        }
      }

      if (route.method === 'GET_ALL') {
        if (route.params === undefined) {
          route.params = `DBT.${TableType(table)}`;
        }
      }

      const label = route.label
        ? route.label
        : ['CREATE', 'UPDATE_BY_ID', 'GET_BY_ID', 'GET_ALL'].includes(method)
        ? method
        : undefined;

      if (label === undefined) {
        throw new Error(
          `Label not defined for route '${table}' '${route.method}'`,
        );
      }

      const response = route.response
        ? route.response
        : route.method === 'GET' || route.method === 'GET_ALL'
        ? `DBT.${TableRecordType(table)}[]`
        : `DBT.${TableRecordType(table)}`;

      routes.push({
        method: route.method,
        httpMethod,
        label,
        admin: route.actor === 'admin',
        auto: false,
        file: route.file ? true : false,
        endpoint: route.endpoint,
        auth_header: route.auth_header ? true : false,
        request: route.request,
        params: route.params,
        response,
        controller: `${TableType(table)}Controller.${route.controller}`,
      });
    });
  }

  // Create auto routes
  if (info.auto) {
    Object.entries(info.auto).forEach(([autoMethod, actor]) => {
      const method = autoMethod as AutoMethods;
      let endpoint: string;
      let httpMethod: HTTPMethods;
      let params: string | undefined;
      let request: string | undefined;
      let response: string;
      let controller: string;
      switch (method) {
        case 'CREATE':
          httpMethod = 'POST';
          endpoint = `/${table}`;
          request = `DBT.${TableType(table)}`;
          response = `DBT.${TableRecordType(table)}`;
          controller = 'insertRecord';
          break;
        case 'UPDATE_BY_ID':
          httpMethod = 'PUT';
          endpoint = `/${table}/:id`;
          request = `DBT.${TableType(table)}`;
          response = `DBT.${TableRecordType(table)}`;
          controller = 'updateRecordById';
          break;
        case 'GET_BY_ID':
          httpMethod = 'GET';
          endpoint = `/${table}/:id`;
          response = `DBT.${TableRecordType(table)}`;
          controller = 'getRecordById';
          break;
        case 'GET_ALL':
          httpMethod = 'GET';
          endpoint = `/${table}`;
          params = `DBT.${TableType(table)}`;
          response = `DBT.${TableRecordType(table)}[]`;
          controller = 'getRecords';
          break;
      }
      routes.push({
        method,
        httpMethod,
        label: method,
        admin: actor === 'admin',
        auto: true,
        file: false,
        endpoint,
        auth_header: false,
        request,
        params,
        response,
        controller,
      });
    });
  }

  routeMap[table] = routes;
});

export { routeMap };
