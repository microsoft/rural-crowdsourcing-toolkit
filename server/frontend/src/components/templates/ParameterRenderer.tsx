// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Helper to render a parameter definition spec to a section in the form.

import { ParameterArray } from '@karya/parameter-specs';
import { ChangeEventHandler } from 'react';
import { ColTextInput } from './FormInputs';

type ParameterSectionProps = {
  params: ParameterArray<any>;
  data: { [id: string]: string | boolean };
  onChange: ChangeEventHandler;
  onBooleanChange: ChangeEventHandler;
};

export const ParameterSection = (props: ParameterSectionProps) => {
  return (
    <div>
      {props.params.map((param) => {
        switch (param.type) {
          case 'string':
          case 'int':
          case 'float':
            return (
              <div className='row' key={param.id}>
                <ColTextInput
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
          case 'enum':
            return (
              <div className='col s4 input-field'>
                <select id={param.id} onChange={props.onChange}>
                  <option value='null' disabled={true} selected={true}>
                    {param.label}
                  </option>
                  {param.list.map(([value, label]) => {
                    return (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          default:
            ((obj: never) => {
              // Unhandled parameter type
            })(param);
            return null;
        }
      })}
    </div>
  );
};
