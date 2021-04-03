// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Parse the enums.yaml file and export a ready data structure
 */

import cc = require('camelcase');
import * as fs from 'fs';
import * as yaml from 'yaml';

/** Read the data from the enum specification file */
const enumFile = `${process.cwd()}/schema/enums.yaml`;
const enumData = fs.readFileSync(enumFile).toString();

/** Extract the enum dictionary */
const enums: { [id: string]: string[] } = yaml.parse(enumData);

/** Create the enum types and export it */
const EnumTypes: { [id: string]: string } = {};
for (const name of Object.keys(enums)) {
  EnumTypes[name] = cc(name, { pascalCase: true });
}

/** Export relevant variables */
export { enums, EnumTypes };
