// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Task parameter parser
 */

import { File, Files } from 'formidable';
import { ParameterDefinition } from './ParameterTypes';

/**
 * Response type for parameter parser
 *
 * params: Object to be assigned to task.params
 * languageParams: List of identifiers for language parameter
 * uploadParams: List of identifiers for file parameters that are attached
 */
export type ParameterParserResponse = {
  params: { [id: string]: string | string[] | number | boolean | undefined };
  languageParams: string[];
  blobParams: { [id: string]: { ext: string } };
  uploadParams: { [id: string]: { file: File; ext: string } };
};

/**
 * Function to parse all the parameters for a scenario. Returns a parameter
 * object that can be stored as part of the task parameters. Throws any errors
 * up to the caller
 * @param definitions list of parameter definitions
 * @param inputs input object received from the task submission
 *
 * @returns ParameterParserResponse (see def above)
 */
export function parseTaskParameters(
  defs: ParameterDefinition[],
  inputs: any,
  files: Files | undefined
): ParameterParserResponse {
  const errors: string[] = [];

  const params: ParameterParserResponse['params'] = {};
  const uploadParams: ParameterParserResponse['uploadParams'] = {};
  const blobParams: ParameterParserResponse['blobParams'] = {};
  const languageParams: string[] = [];

  // Parse all the parameters
  for (const def of defs) {
    const { identifier } = def;
    const value = inputs[identifier];

    // If a required input is not provided, then extract value from default or
    // add an error
    if (def.required && value === undefined) {
      if (def.default === undefined) {
        errors.push(`Required parameter '${def.name}' not defined`);
      } else {
        params[identifier] = def.default;
      }
      continue;
    }

    switch (def.type) {
      case 'string':
        params[identifier] = value;
        break;

      case 'integer':
        if (value !== undefined) {
          const output = Number.parseInt(value, 10);
          if (isNaN(output)) {
            errors.push(`Invalid input for parameter '${def.name}'. Was expecting an integer`);
          } else {
            params[identifier] = output;
          }
        }
        break;

      case 'float':
        if (value !== undefined) {
          const output = Number.parseFloat(value);
          if (isNaN(output)) {
            errors.push(`Invalid input for parameter '${def.name}'. Was expecting a number`);
          } else {
            params[identifier] = output;
          }
        }
        break;

      case 'language':
        if (value !== undefined) {
          const languageID = Number.parseInt(value, 10);
          if (isNaN(languageID)) {
            errors.push(`Invalid language input for '${def.name}'`);
          } else {
            params[identifier] = languageID;
            languageParams.push(identifier);
          }
        }
        break;

      case 'boolean':
        if (value !== undefined) {
          params[identifier] = value != false;
        }
        break;

      case 'file':
        if (value !== undefined) {
          if (def.attached) {
            if (files && files[identifier]) {
              params[identifier] = value;
              uploadParams[identifier] = {
                ext: def.ext,
                file: files[identifier] as File,
              };
            } else {
              errors.push(`File for '${def.name}' not attached`);
            }
          } else {
            params[identifier] = value;
            blobParams[identifier] = { ext: def.ext };
          }
        }
        break;

      default:
        ((obj: never) => {
          throw new Error(`Unknown parameter type '${def}'`);
        })(def);
    }
  }

  // if there are errors, throw the errors
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  // return params response
  return { params, uploadParams, blobParams, languageParams };
}
