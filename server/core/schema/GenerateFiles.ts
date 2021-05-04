// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Script to generate files from the specifications.

import { writeTypescriptInterfaceFile, writeTableFunctionsFile } from '@karya/schema-spec';
import { karyaBoxDb, karyaServerDb } from './specs/KaryaDb';

const TYPES_FOLDER = `${process.cwd()}/src/auto`;

// Table interfaces files
const ngTableInterfacesFile = `${TYPES_FOLDER}/TableInterfaces.ts`;
writeTypescriptInterfaceFile(karyaServerDb, '../types/Custom', ngTableInterfacesFile);

// Server create table function
/*
const ngServerTableFunctionsFile = `${NG_SRC_FOLDER}/ServerTableFunctions.ts`;
writeTableFunctionsFile(karyaServerDb, '../Client', ngServerTableFunctionsFile);

// Box create table function
const ngBoxTableFunctionsFile = `${NG_SRC_FOLDER}/BoxTableFunctions.ts`;
writeTableFunctionsFile(karyaBoxDb, '../Client', ngBoxTableFunctionsFile);
*/
