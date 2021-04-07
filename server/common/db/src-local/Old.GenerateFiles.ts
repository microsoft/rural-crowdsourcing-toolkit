// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Generator all auto-generatable files from the schema.
 */

import { tableDaosData } from './generators/AndroidDaoGenerator';
import { androidTablesData } from './generators/AndroidSchemaGenerator';
import { backendAPISpecsFileData } from './generators/BackendAPIGenerator';
import { backendRoutesFileData } from './generators/BackendRoutesGenerator';
import { createTableFunctionsFileData } from './generators/CreateTableFunctionsGenerator';
import { dropTableFunctionsFileData } from './generators/DropFunctionsGenerator';
import { routesFileData } from './generators/RoutesGenerator';
import { tableColumnListFileData } from './generators/TableColumnsGenerator';
import { tableFilterColumnsFileData } from './generators/TableGetFilterGenerator';
import { tableInterfacesFileData } from './generators/TableInterfacesGenerator';
import { tableListFileData } from './generators/TableListGenerator';

import * as cp from 'child_process';
import * as fs from 'fs';

// Path to ktlint
const ktlint = `./tools/ktlint`;

const paths: { [id: string]: string } = {
  createTableFunctions: 'ROOT/src/db/CreateTableFunctions.auto.ts',
  dropTableFunctions: 'ROOT/src/db/DropTableFunctions.auto.ts',
  tableInterfaces: 'ROOT/src/db/TableInterfaces.auto.ts',
  tableList: 'ROOT/src/db/TableList.auto.ts',
  tableColumns: 'ROOT/src/db/TableColumns.auto.ts',
  tableFilterColumns: 'ROOT/src/db/TableFilterColumns.auto.ts',
  apis: 'ROOT/src/store/apis/APIs.auto.ts',
  routes: 'ROOT/src/routes/Routes.auto.ts',
  android: 'ROOT/app/src/main/java/com/microsoft/research/karya',
};

const target = process.argv[2];
const rootFolder = process.argv[3];

if (!target || !rootFolder) {
  process.stdout.write(`USAGE: ${process.argv[0]} ${process.argv[1]} <backend|frontend|box> <root-of-resp-repo>\n`);
  process.exit();
}

for (const path of Object.keys(paths)) {
  paths[path] = paths[path].replace('ROOT', rootFolder);
}
const excludedTables: string[] = [''];
if (target === 'backend') {
  /** Write all backend related files */
  // fs.writeFileSync(
  //   paths.createTableFunctions,
  //       createTableFunctionsFileData('backend', excludedTables),
  // );
  fs.writeFileSync(paths.dropTableFunctions, dropTableFunctionsFileData(excludedTables));
  fs.writeFileSync(paths.routes, backendRoutesFileData());
  fs.writeFileSync(paths.tableInterfaces, tableInterfacesFileData(excludedTables));
  fs.writeFileSync(paths.tableList, tableListFileData());
  fs.writeFileSync(paths.tableColumns, tableColumnListFileData());
  fs.writeFileSync(paths.tableFilterColumns, tableFilterColumnsFileData());
} else if (target === 'frontend') {
  /** Write all front end related files */
  fs.writeFileSync(paths.apis, backendAPISpecsFileData());
  fs.writeFileSync(paths.tableInterfaces, tableInterfacesFileData(excludedTables));
} else if (target === 'box') {
  excludedTables.push('work_provider');
  /** Write box related files */
  // fs.writeFileSync(
  //   paths.createTableFunctions,
  //   createTableFunctionsFileData('box', excludedTables),
  // );
  fs.writeFileSync(paths.dropTableFunctions, dropTableFunctionsFileData(excludedTables));
  fs.writeFileSync(paths.routes, routesFileData('box'));
  fs.writeFileSync(paths.tableInterfaces, tableInterfacesFileData(excludedTables));
  fs.writeFileSync(paths.tableList, tableListFileData());
  fs.writeFileSync(paths.tableColumns, tableColumnListFileData());
  fs.writeFileSync(paths.tableFilterColumns, tableFilterColumnsFileData());
} else if (target === 'android') {
  androidTablesData(paths.android);
  tableDaosData(paths.android);
  try {
    cp.execSync(`${ktlint} -a -F ${paths.android}/Database/Models`);
  } catch (e) {
    console.log(`There are ktlint errors`);
  }
  try {
    cp.execSync(`${ktlint} -a -F ${paths.android}/Database/Daos`);
  } catch (e) {
    console.log(`There are ktlint errors`);
  }
}
