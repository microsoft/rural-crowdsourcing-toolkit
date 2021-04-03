/**
 * Generate the data for the backend server routes file from the schema.
 */

import { openingComment } from '../parsers/Common';
import { tables } from '../parsers/TableParser';

/**
 * Function to generate the routes file data.
 */

export function routesFileData(server: 'backend' | 'box'): string {
  /** Generate the route data */
  const tableRoutes = Object.entries(tables)
    .filter(([tname, tinfo]) =>
      server == 'backend' ? tinfo.apis : tinfo.boxapis,
    )
    .map(([tname, tinfo]) => {
      /** If no apis return */
      if (!tinfo.apis && !tinfo.boxapis) return [];
      let tableApis: any;
      if (server == 'backend') {
        tableApis = tinfo.apis;
      } else {
        tableApis = tinfo.boxapis;
      }
      return Object.entries(tableApis)
        .map(([method, actor]) => {
          const middlewares = [];
          if (actor === 'admin') middlewares.push('checkAdmin');
          middlewares.push('setTableName');
          const middleWareString = middlewares.join(', ');

          return method === 'post'
            ? `router.post('/${tname}/', ${middleWareString}, BodyParser(), insertRecord);`
            : method === 'put'
            ? `router.put('/${tname}/:id', ${middleWareString}, BodyParser(), updateRecordById);`
            : method === 'getbyid'
            ? `router.get('/${tname}/:id', ${middleWareString}, getRecordById);`
            : method === 'get'
            ? `router.get('/${tname}/', ${middleWareString}, setGetFilter, getRecords);`
            : '';
        })
        .join('\n');
    })
    .join('\n\n');

  /** Generate the router file data */
  const routesData = `\
${openingComment}

import BodyParser from 'koa-body';
import Router from 'koa-router';

import { setGetFilter, setTableName } from './Middlewares';

import { getRecordById, getRecords, insertRecord, updateRecordById } from '../controllers/BasicController';

// create a new router
const router = new Router();

${tableRoutes}

export default router;
`;

  return routesData;
}
