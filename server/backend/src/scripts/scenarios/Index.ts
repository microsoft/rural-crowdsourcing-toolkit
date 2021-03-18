// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Initial specification of resources list for the core platform and various
 * scenarios. This information is used to initialize a DB with the resources
 * when the DB is reset.
 *
 * This file defines the resource spec type.
 */

import { LanguageResource } from '../../db/TableInterfaces.auto';

/**
 * Resource specification type
 *
 * A spec item specifies a string resource and optionally a list of file
 * resources that are tied to the string resource.
 */
export type ResourceSpec = {
  str: LanguageResource;
  files?: LanguageResource[];
};
