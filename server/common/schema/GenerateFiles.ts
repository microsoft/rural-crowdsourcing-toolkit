// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Script to generate files from the specifications.

import fs from 'fs';
import { tableInterfacesFileData } from './generators/TableInterfacesGenerator';
import { createTableFunctionsFileData } from './generators/CreateTableFunctionsGenerator';
import { dropTableFunctionsFileData } from './generators/DropFunctionsGenerator';

import { writeTypescriptInterfaceFile, writeTableFunctionsFile } from '@karya/schema-spec';
import { karyaBoxDb, karyaServerDb } from './specs/KaryaDb';

const SRC_FOLDER = `${process.cwd()}/src/db/auto`;

// Write the table interfaces file. This file contains all the type definitions
// for the karya database tables.
const tableInterfacesFile = `${SRC_FOLDER}/TableInterfaces.ts`;
fs.writeFileSync(tableInterfacesFile, tableInterfacesFileData());

// Write the table column list into a file
const createFunctionsFile = `${SRC_FOLDER}/CreateFunctions.ts`;
fs.writeFileSync(createFunctionsFile, createTableFunctionsFileData());

// Write the table column list into a file
const dropFunctionsFile = `${SRC_FOLDER}/DropFunctions.ts`;
fs.writeFileSync(dropFunctionsFile, dropTableFunctionsFileData());

// -- NEW Model

const NG_SRC_FOLDER = `${process.cwd()}/src/db/ng-auto`;

// Table interfaces files
const ngTableInterfacesFile = `${NG_SRC_FOLDER}/TableInterfaces.ts`;
writeTypescriptInterfaceFile(karyaServerDb, '../types/Custom', ngTableInterfacesFile);

// Server create table function
const ngServerTableFunctionsFile = `${NG_SRC_FOLDER}/ServerTableFunctions.ts`;
writeTableFunctionsFile(karyaServerDb, '../Client', ngServerTableFunctionsFile);

// Box create table function
const ngBoxTableFunctionsFile = `${NG_SRC_FOLDER}/BoxTableFunctions.ts`;
writeTableFunctionsFile(karyaBoxDb, '../Client', ngBoxTableFunctionsFile);
