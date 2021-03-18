// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component, Fragment } from 'react';
import { BrowserRouter } from 'react-router-dom';
import './css/App.css';
import './css/Common.css';

import Routes from './Routes';

import NavBar from './components/navigation/NavBar';
import SidePane from './components/navigation/SidePane';

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Fragment>
          <header>
            <div className='navbar-fixed'>
              <NavBar />
            </div>
            <ul className='sidenav sidenav-fixed'>
              <li>
                <div id='logo'>PROJECT KARYA</div>
              </li>
              <li>
                <SidePane />
              </li>
            </ul>
          </header>
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
