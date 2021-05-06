// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Module to help with parameter specification.

import Joi from 'joi';

export type ParameterDefinition = {
  id: string;
  type: 'string' | 'int' | 'float' | 'boolean';
  label: string;
  description: string;
  required: boolean;
};

/**
 * Converts a parameter definition list to a Joi schema that can be used to
 * validate an object of that type.
 * @param params List of parameters
 */
export function joiSchema(params: ParameterDefinition[]): Joi.ObjectSchema {
  const schemaMap: Joi.SchemaMap = {};
  params.forEach((param) => {
    const { id, label, description, required } = param;
    let base: Joi.StringSchema | Joi.BooleanSchema | Joi.NumberSchema;
    switch (param.type) {
      case 'string':
        base = Joi.string();
        break;
      case 'boolean':
        base = Joi.boolean();
        break;
      case 'int':
        base = Joi.number().integer().positive();
        break;
      case 'float':
        base = Joi.number().positive();
        break;
    }
    base = base.label(label).description(description);
    schemaMap[id] = required ? base.required() : base;
  });
  return Joi.object(schemaMap);
}
