// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * List of resources for story-speech scenario
 *
 * The resources are specified as a list of string resource objects. Each string
 * resource object can optionally be attached with a set of file resource
 * object. For all resources, the core and scenario_id fields are inferred from
 * the parent folder. The required field is set to true unless explicitly
 * specified in the record.
 */

import { ResourceSpec } from '../Index';

/**
 * List of story-speech resources
 */
export const resources: ResourceSpec[] = [];
