// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Helper to render a parameter definition spec to a section in the form.

import { ParameterDefinition } from '@karya/parameter-specs';
import { ChangeEventHandler } from 'react';
import { ColTextInput } from './FormInputs';

type ParamterSectionProps = {
  params: ParameterDefinition[];
  data: { [id: string]: string | boolean };
  onChange: ChangeEventHandler;
  onBooleanChange: ChangeEventHandler;
};

export const ParameterSection = (props: ParamterSectionProps) => {
  return (
    <div>
      {props.params.map((param) => {
        switch (param.type) {
          case 'string':
          case 'int':
          case 'float':
            return (
              <div className='row'>
                <ColTextInput
                  key={param.id}
                  id={param.id}
                  label={param.label}
                  width='s4'
                  onChange={props.onChange}
                  required={param.required}
                />
              </div>
            );
          case 'boolean':
            return (
              <div className='col s4 input-field'>
                <label>
                  <input type='checkbox' id={param.id} onChange={props.onBooleanChange} />
                  <span>{param.label}</span>
                </label>
              </div>
            );
        }
      })}
    </div>
  );
};
