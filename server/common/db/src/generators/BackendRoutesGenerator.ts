// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Generate the data for the backend server routes file from the schema.
 */

import * as prettier from 'prettier';
import { routeMap } from '../parsers/APIParser';
import { openingComment, prettierOptions, TableType } from '../parsers/Common';

/**
 * Function to generate the routes file data.
 */

export function backendRoutesFileData(): string {
  // Extra controller imports
  const extraControllerImports: string[] = [];

  /** Generate the route data */
  const tableRoutes = Object.entries(routeMap)
    .map(([tname, routes]) => {
      let needExtraController = false;
      const routeString = routes
        .map((route) => {
          const method = route.httpMethod.toLowerCase();
          needExtraController = route.auto ? needExtraController : true;

          // Middlewares + controller
          const handlers: string[] = [];
          if (route.admin) handlers.push('checkAdmin');
          if (route.auto) handlers.push('setTableName');
          if (route.auto && route.method === 'GET_ALL') {
            handlers.push('setGetFilter');
          }
          if (route.httpMethod === 'POST' || route.httpMethod === 'PUT') {
            handlers.push(
              route.file ? 'BodyParser({multipart: true})' : 'BodyParser()',
            );
          }
          handlers.push(route.controller);

          return `router.${method}('${route.endpoint}', ${handlers.join(
            ', ',
          )});`;
        })
        .join('\n');

      if (needExtraController) extraControllerImports.push(tname);
      return routeString;
    })
    .join('\n\n');

  const extraControllerImportsString = extraControllerImports
    .sort()
    .map(
      (tname) =>
        `import * as ${TableType(
          tname,
        )}Controller from '../controllers/${TableType(tname)}.extra'`,
    )
    .join('\n');

  /** Generate the router file data */
  const routesData = `\
${openingComment}

import BodyParser from 'koa-body';
import Router from 'koa-router';

import { checkAdmin, setGetFilter, setTableName } from './Middlewares';

import { getRecordById, getRecords, insertRecord, updateRecordById } from '../controllers/BasicController';

${extraControllerImportsString}

// create a new router
const router = new Router({ prefix: '/api' });

${tableRoutes}

export default router;
`;

  return prettier.format(routesData, { ...prettierOptions, printWidth: 200 });
}
