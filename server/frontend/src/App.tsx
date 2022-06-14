// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component, Fragment } from 'react';
import { BrowserRouter } from 'react-router-dom';
import './css/App.css';
import './css/Common.css';

import Routes from './Routes';

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Fragment>
          <div className='row'>{Routes}</div>
        </Fragment>
      </BrowserRouter>
    );
  }
}
export default App;
