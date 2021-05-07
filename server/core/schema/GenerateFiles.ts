// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Script to generate files from the specifications.

import { writeTypescriptInterfaceFile, writeTableFunctionsFile } from '@karya/schema-spec';
import { karyaBoxDb, karyaServerDb } from './specs/KaryaDb';

const TYPES_FOLDER = `${process.cwd()}/src/auto`;
const TABLE_FUNCTIONS_FOLDER = `${process.cwd()}/../common/src/db/auto/`;

// Table interfaces files
const tableInterfacesFile = `${TYPES_FOLDER}/TableInterfaces.ts`;
writeTypescriptInterfaceFile(karyaServerDb, '../types/Custom', tableInterfacesFile);

// Server create table function
const serverTableFunctionsFile = `${TABLE_FUNCTIONS_FOLDER}/ServerTableFunctions.ts`;
writeTableFunctionsFile(karyaServerDb, '../Client', serverTableFunctionsFile);

// Box create table function
const boxTableFunctionsFile = `${TABLE_FUNCTIONS_FOLDER}/BoxTableFunctions.ts`;
writeTableFunctionsFile(karyaBoxDb, '../Client', boxTableFunctionsFile);
