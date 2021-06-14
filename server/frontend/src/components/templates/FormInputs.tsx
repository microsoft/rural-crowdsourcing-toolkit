// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Helper components for form inputs based on extracted patterns
 */

import React, { ChangeEventHandler, FormEventHandler } from 'react';
import { Link } from 'react-router-dom';

/**
 * Text input field
 */

type TextInputProps = {
  label: string;
  id: string;
  required?: boolean;
  value?: string;
  onChange?: ChangeEventHandler;
  width?: string;
  disabled?: boolean;
};

export const TextInput = (props: TextInputProps) => {
  const { label, width, ...inputProps } = props;
  const inputWidth = width ? width : 's12';
  return (
    <div className='row'>
      <div className={`col ${inputWidth} input-field`}>
        <input type='text' {...inputProps} />
        <label htmlFor={props.id}>{label}</label>
      </div>
    </div>
  );
};

export const ColTextInput = (props: TextInputProps) => {
  const { label, width, ...inputProps } = props;
  const inputWidth = width ? width : 's12';
  return (
    <div className={`col ${inputWidth} input-field`}>
      <input type='text' {...inputProps} />
      <label htmlFor={props.id}>{label}</label>
    </div>
  );
};

/**
 * Submit or cancel button
 */

type SubmitOrCancelProps =
  | {
      submitString: string;
      submitColor?: string;
      cancelAction: 'link';
      cancelLink: string;
    }
  | {
      submitString: string;
      submitColor?: string;
      cancelAction: 'call';
      cancelFunction: FormEventHandler;
    };

export const SubmitOrCancel = (props: SubmitOrCancelProps) => {
  const { submitString } = props;
  const submitColor = props.submitColor ? props.submitColor : '';

  return (
    <div className='row'>
      <div className='input-field'>
        <button className={`btn ${submitColor}`}>
          {submitString} <i className='material-icons right'>send</i>
        </button>
        {props.cancelAction === 'link' ? (
          <Link to={props.cancelLink}>
            <button className='btn grey lighten-2 black-text lmar20'>Cancel</button>
          </Link>
        ) : (
          <button className='btn grey lighten-2 black-text lmar20' onClick={props.cancelFunction}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Submit button
 */

type SubmitProps = {
  submitString: string;
  submitColor?: string;
  disabled?: boolean;
};

export const Submit = (props: SubmitProps) => {
  const { submitString } = props;
  const submitColor = props.submitColor ? props.submitColor : '';
  const disabled = props.disabled ? props.disabled : false;

  return (
    <div className='input-field'>
      <button className={`btn ${submitColor}`} disabled={disabled}>
        {submitString} <i className='material-icons right'>send</i>
      </button>
    </div>
  );
};
