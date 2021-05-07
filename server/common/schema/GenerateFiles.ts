// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Script to generate files from the specifications.

import { writeTypescriptInterfaceFile, writeTableFunctionsFile } from '@karya/schema-spec';
import { karyaBoxDb, karyaServerDb } from './specs/KaryaDb';

// -- NEW Model

const NG_SRC_FOLDER = `${process.cwd()}/src/db/ng-auto`;

// Table interfaces files
// const ngTableInterfacesFile = `${NG_SRC_FOLDER}/TableInterfaces.ts`;
// writeTypescriptInterfaceFile(karyaServerDb, '../types/Custom', ngTableInterfacesFile);

// Server create table function
const ngServerTableFunctionsFile = `${NG_SRC_FOLDER}/ServerTableFunctions.ts`;
writeTableFunctionsFile(karyaServerDb, '../Client', ngServerTableFunctionsFile);

// Box create table function
const ngBoxTableFunctionsFile = `${NG_SRC_FOLDER}/BoxTableFunctions.ts`;
writeTableFunctionsFile(karyaBoxDb, '../Client', ngBoxTableFunctionsFile);
