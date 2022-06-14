// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Module to help with parameter specification.

import Joi from 'joi';

type ParameterType =
  | { type: 'string' }
  | { type: 'int' }
  | { type: 'float' }
  | { type: 'boolean' }
  | { type: 'enum'; list: [string, string][] }
  | { type: 'list' }
  | { type: 'time' }
  | { type: 'date' };

/**
 * Parameter specification
 *
 * id: Identifier for the parameter. Should be unique within an array of parameters.
 * type: Type of the parameter. Used to define the Joi Schema type
 * label: Label for the parameter. Used as label in React text input
 * description: Full description of the parameter. Used as part of React text input
 * required: Indicated if the parameter is required or optional
 */
export type ParameterDefinition<T> = {
  id: Extract<T, string>;
  label: string;
  description: string;
  required: boolean;
} & ParameterType;

/**
 * Array of parameter definitions
 */
export type ParameterArray<T> = ParameterDefinition<keyof T>[];

/**
 * Converts a parameter array to a Joi schema that can be used to
 * validate an object of that type.
 * @param params List of parameters
 */
export function joiSchema<ParamsType>(params: ParameterArray<ParamsType>): Joi.ObjectSchema<ParamsType> {
  const schemaMap: Joi.SchemaMap<ParamsType> = {};
  params.forEach((param) => {
    const { id, label, description, required } = param;
    let base: Joi.StringSchema | Joi.BooleanSchema | Joi.NumberSchema | Joi.ArraySchema;
    switch (param.type) {
      case 'string':
        base = Joi.string();
        break;
      case 'boolean':
        base = Joi.boolean();
        break;
      case 'int':
        base = Joi.number().integer();
        break;
      case 'float':
        base = Joi.number();
        break;
      case 'enum': {
        const values = param.list.map((l) => l[0]);
        base = Joi.string().valid(...values);
        break;
      }
      case 'list':
        base = Joi.array().items(Joi.string());
        break;
      case 'time':
        base = Joi.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/);
        break;
      case 'date':
        base = Joi.string().regex(/^\d\d\d\d-\d\d-\d\d$/);
        break;
    }
    base = base.label(label).description(description);
    schemaMap[id] = required ? base.required() : base;
  });
  return Joi.object(schemaMap);
}
