// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Script to generate files from the specifications.

import fs from 'fs';
import { tableInterfacesFileData } from './generators/TableInterfacesGenerator';
import { tableColumnListFileData } from './generators/TableColumnsGenerator';
import { tableFilterColumnsFileData } from './generators/TableGetFilterGenerator';
import { tableListFileData } from './generators/TableListGenerator';
import { createTableFunctionsFileData } from './generators/CreateTableFunctionsGenerator';
import { dropTableFunctionsFileData } from './generators/DropFunctionsGenerator';

const SRC_FOLDER = `${process.cwd()}/src/db/auto`;

// Write the table interfaces file. This file contains all the type definitions
// for the karya database tables.
const tableInterfacesFile = `${SRC_FOLDER}/TableInterfaces.ts`;
fs.writeFileSync(tableInterfacesFile, tableInterfacesFileData());

// Write the table list file
const tableListFile = `${SRC_FOLDER}/TableList.ts`;
fs.writeFileSync(tableListFile, tableListFileData());

// Write the table column list into a file
const tableColumnsFile = `${SRC_FOLDER}/TableColumns.ts`;
fs.writeFileSync(tableColumnsFile, tableColumnListFileData());

// Write the table column list into a file
const tableFilterColumnsFile = `${SRC_FOLDER}/TableFilterColumns.ts`;
fs.writeFileSync(tableFilterColumnsFile, tableFilterColumnsFileData());

// Write the table column list into a file
const createFunctionsFile = `${SRC_FOLDER}/CreateFunctions.ts`;
fs.writeFileSync(createFunctionsFile, createTableFunctionsFileData());

// Write the table column list into a file
const dropFunctionsFile = `${SRC_FOLDER}/DropFunctions.ts`;
fs.writeFileSync(dropFunctionsFile, dropTableFunctionsFileData());
