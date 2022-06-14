// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// A component that allows user to input a list of strings. Add to the list
// using a text box and controls to remove elements

import { useEffect, useState } from 'react';

// String list input props
type StringListInputProps = {
  id: string;
  label: string;
  data: string[];
  onListChange: (id: string, newData: string[]) => void;
};

// String list input component
export const StringListInput = (props: StringListInputProps) => {
  // Maintain current text state
  const [text, setText] = useState('');
  const textId = `${props.id}-text`;

  // Auto init on mount
  useEffect(() => {
    M.AutoInit();
    M.updateTextFields();
  });

  function onEnter() {
    const value = text.trim();
    if (value) {
      const data = props.data ?? [];
      const newData = [...data];
      if (newData.indexOf(value) < 0) {
        newData.push(value);
        props.onListChange(props.id, newData);
      }
    }
    setText('');
  }

  function onDelete(value: string) {
    const newData = props.data.filter((s) => s !== value);
    props.onListChange(props.id, newData);
  }

  const data = props.data ?? [];

  return (
    <div className='row' key={props.id}>
      <div className='col s10 m8 l5 input-field'>
        <input
          id={textId}
          type='text'
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onEnter();
            }
          }}
        />
        <label htmlFor={textId}>{props.label}</label>
        <div style={{ marginBottom: '20px', marginTop: '-50px' }}>
          {data.map((s) => (
            <div key={s} className='chip'>
              {s}
              <i className='material-icons' onClick={() => onDelete(s)}>
                close
              </i>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
