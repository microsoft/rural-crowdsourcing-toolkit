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
          <main>
            <div id='main-container' className='container'>
              <div className='row'>{Routes}</div>
            </div>
          </main>
        </Fragment>
      </BrowserRouter>
    );
  }
}
export default App;
