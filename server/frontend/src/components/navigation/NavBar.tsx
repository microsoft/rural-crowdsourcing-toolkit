// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Navigation bar. Contains all auth related stuff */

/** React stuff */
import React from 'react';
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
      <>
        {auth.status !== 'IN_FLIGHT' ? (
          <nav className='navbar white' id='top-nav'>
            {auth.cwp === null ? (
              <div className='nav-wrapper'>
                <div id='nav-container' className='container'>
                  <ul className='right'>
                    <li>
                      <NavLink to='/login'>Login</NavLink>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <>
                <div className='nav-wrapper'>
                  <div id='nav-container' className='container'>
                    <ul className='right'>
                      <li>
                        <NavLink to='/signout'>Sign Out</NavLink>
                      </li>
                      <li>
                        <button className='btn-floating'>{initials}</button>
                      </li>
                    </ul>
                  </div>
                </div>

                {auth.cwp.role === 'ADMIN' ? (
                  <div className='nav-wrapper' id='tab-bar'>
                    <div className='container'>
                      <ul id='tabs'>
                        <li>
                          <NavLink activeClassName='active-tab' to='/task'>
                            Tasks
                          </NavLink>
                        </li>
                        <li>
                          <NavLink activeClassName='active-tab' to='/task-assignments'>
                            Task Assignment
                          </NavLink>
                        </li>
                        <li>
                          <NavLink activeClassName='active-tab' to='/box'>
                            Box
                          </NavLink>
                        </li>
                        <li>
                          <NavLink activeClassName='active-tab' to='/server_users'>
                            Users
                          </NavLink>
                        </li>
                        <li>
                          <NavLink activeClassName='active-tab' to='/worker'>
                            Workers
                          </NavLink>
                        </li>
                        <li>
                          <NavLink activeClassName='active-tab' to='/reports'>
                            Reports
                          </NavLink>
                        </li>
                        <li>
                          <NavLink activeClassName='active-tab' to='/lang-assets'>
                            Language Assets
                          </NavLink>
                        </li>
                        <li>
                          <NavLink activeClassName='active-tab' to='/payments'>
                            Payments
                          </NavLink>
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : auth.cwp.role === 'COORDINATOR' ? (
                  <div className='nav-wrapper' id='tab-bar'>
                    <div className='container'>
                      <ul id='tabs'>
                        <li>
                          <NavLink activeClassName='active-tab' to='/task'>
                            Tasks
                          </NavLink>
                        </li>
                        <li>
                          <NavLink activeClassName='active-tab' to='/worker'>
                            Workers
                          </NavLink>
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </nav>
        ) : null}
      </>
    );
  }
}

export default connector(NavBar);
