// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Definitions of the task and policy parameter types
 */

/**
 * Parameter types:
 *
 * Basic parameters: integer, float, string; These parameters are provided as a
 * string input
 *
 * Language parameter: Language ID in the system; Provided as a string input
 *
 * File parameter: Any file associated with the task. This paramter takes two
 * additional options: 'max_size' and attached. max_size defines the maximum
 * size of the file. 'attached' indicates if the file will be attached to the
 * task creation or update requests or if it will be directly uploaded by the
 * browser to the blob store. In the later case, the input params object must
 * contain the blob URL.
 */
type ParameterType =
  | {
      type: 'integer';
      default?: number;
    }
  | {
      type: 'float';
      default?: number;
    }
  | {
      type: 'string';
      default?: string;
    }
  | {
      type: 'boolean';
      default?: boolean;
    }
  | {
      type: 'language';
      default?: undefined;
    }
  | {
      type: 'file';
      max_size: number;
      attached: boolean;
      ext: string;
      default?: undefined;
    };

/**
 * Parameter definition type. Adds a set of common parameters to the parameter
 * types.
 *
 * identifier: Key used to locate the parameter inside the params object
 * name: Full name of the parameter
 * description: A detailed description of the parameter
 * required: Flag to state if the parameter is required or optional
 */
type ParameterInfo = {
  identifier: string;
  name: string;
  description: string;
  required: boolean;
};

export type ParameterDefinition = ParameterType & ParameterInfo;
