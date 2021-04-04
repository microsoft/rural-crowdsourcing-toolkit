// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Script to generate files from the specifications.

import fs from 'fs';
import { tableInterfacesFileData } from './generators/TableInterfacesGenerator';

const SRC_FOLDER = `${process.cwd()}/src`;

// Write the table interfaces file. This file contains all the type definitions
// for the karya database tables.
const tableInterfacesFile = `${SRC_FOLDER}/TableInterfaces.ts`;
fs.writeFileSync(tableInterfacesFile, tableInterfacesFileData());
