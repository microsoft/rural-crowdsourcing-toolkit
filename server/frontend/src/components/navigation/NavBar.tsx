// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Navigation bar. Contains all auth related stuff */

/** React stuff */
import React, { Fragment } from 'react';
import { NavLink } from 'react-router-dom';

/** Redux stuff */
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from '../../store/Index';

/** import css */
import '../../css/navigation/NavBar.css';

/** Map current work provider from state to props */
const mapStateToProps = (state: RootState) => {
  return { auth: state.all.auth };
};

/** connector */
const connector = connect(mapStateToProps);

/** Navbar props */
type NavBarProps = ConnectedProps<typeof connector>;

class NavBar extends React.Component<NavBarProps> {
  render() {
    const { auth } = this.props;

    const initials = auth.cwp === null ? '' : (auth.cwp.full_name as string)[0];
    return (
      <nav className='navbar white'>
        <div className='nav-wrapper'>
          <div id='nav-container' className='container'>
            {auth.status !== 'IN_FLIGHT' ? (
              <ul id='nav-mobile' className='right'>
                {auth.cwp === null ? (
                  <Fragment>
                    <li>
                      <NavLink to='/signup'>Sign Up</NavLink>
                    </li>{' '}
                    <li>
                      <NavLink to='/signin'>Sign In</NavLink>
                    </li>
                  </Fragment>
                ) : (
                  <Fragment>
                    <li>
                      <NavLink to='/signout'>Sign Out</NavLink>
                    </li>
                    <li>
                      <NavLink to='/dashboard'>
                        <button className='btn-floating teal'>{initials}</button>
                      </NavLink>
                    </li>
                  </Fragment>
                )}
              </ul>
            ) : null}
          </div>
        </div>
      </nav>
    );
  }
}

export default connector(NavBar);
