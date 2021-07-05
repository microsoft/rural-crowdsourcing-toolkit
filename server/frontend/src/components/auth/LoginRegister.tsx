// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to log in or register a user
 */

import M from 'materialize-css';

import React, { ChangeEventHandler, FormEventHandler } from 'react';
import { StaticContext } from 'react-router';
import { Redirect, RouteComponentProps } from 'react-router-dom';

/** Redux stuff */
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from '../../store/Index';

/** Import async ops and action creators */
import { BackendRequestInitAction } from '../../store/apis/APIs';

/** Import templates */
import { TextInput } from '../templates/FormInputs';
import { ErrorMessage, ProgressBar } from '../templates/Status';

/** Types needed */
import { AuthHeader } from '../../db/Auth.extra';

/** Types needed for database tables */
import { ServerUser } from '@karya/core';

/** Google login element */
import GoogleLogin from 'react-google-login';
import config from '../../config/Index';

import '../../css/LoginRegister.css';

/** Define Router match params props */
/** Define own props */
type OwnProps = RouteComponentProps<{}, StaticContext, { from: { pathname: string } }>;

/** map relevant state to props */
const mapStateToProps = (state: RootState) => {
  return {
    auth: state.all.auth,
  };
};

/** Map dispatch action creators to props */
const mapDispatchToProps = (dispatch: any) => {
  return {
    signInWorkProvider: (authHeader: AuthHeader) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'auth',
        label: 'SIGN_IN',
        headers: authHeader,
        request: {},
      };
      dispatch(action);
    },

    signUpServerUser: (wp: ServerUser, id_token: string) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'auth',
        label: 'SIGN_UP',
        headers: { 'reg-mechanism': 'google-id-token', 'google-id-token': id_token, 'access-code': wp.access_code! },
        request: wp,
      };
      dispatch(action);
    },
  };
};

/** Create the connector HoC */
const connector = connect(mapStateToProps, mapDispatchToProps);

/** Signup props */
type SignUpProps = OwnProps & ConnectedProps<typeof connector>;

/** Signup state */
type SignUpState = {
  wp: ServerUser;
  id_token: string;
  showProfileDetails: boolean;
};

class LoginRegister extends React.Component<SignUpProps, SignUpState> {
  /** Initial state */
  state: SignUpState = {
    wp: {
      access_code: '',
      full_name: '',
      email: '',
    },
    id_token: '',
    showProfileDetails: false,
  };

  /** Form ...this.state, field on change handler */
  handleFormChange: ChangeEventHandler<HTMLInputElement> = e => {
    const updatedWP: ServerUser = { ...this.state.wp, [e.currentTarget.id]: e.currentTarget.value };
    this.setState({ wp: updatedWP });
  };

  /** Form submission */
  handleFormSubmit: FormEventHandler = e => {
    e.preventDefault();
    this.props.signUpServerUser(this.state.wp, this.state.id_token);
  };

  /**
   * Function to call on successful sign up
   */
  onGoogleSignUpSuccess = (googleUser: any) => {
    const profile = googleUser.getBasicProfile();
    const id_token = googleUser.getAuthResponse().id_token;

    const wp: ServerUser = {
      access_code: this.state.wp.access_code,
      full_name: profile.getName(),
      email: profile.getEmail(),
    };

    const showProfileDetails = true;

    this.setState({ wp, id_token, showProfileDetails });
  };

  /** On update, trigger materialize effects  */
  componentDidUpdate() {
    M.updateTextFields();
  }

  /** On google login success */
  onGoogleLoginSuccess = (googleUser: any) => {
    const id_token = googleUser.getAuthResponse().id_token;
    const authHeader: AuthHeader = { 'reg-mechanism': 'google-id-token', 'google-id-token': id_token };
    this.props.signInWorkProvider(authHeader);
  };

  /** On google login failure */
  onGoogleLoginFailure = (error: any) => {
    // Custom dispatch action to set error message?
    // Or local state for these errors
    // for now, log to console
    console.log(error);
  };

  render() {
    /** Get relevant objects from state */
    const { wp } = this.state;
    const { auth } = this.props;
    const locationState = this.props.location.state;

    const { from } = locationState || { from: { pathname: '/task' } };

    /** If logged in, redirect to original location or the dashboard */
    if (auth.cwp !== null && auth.status === 'SUCCESS') {
      return <Redirect to={from} />;
    }

    /** Generate any error message */
    const errorMessageElement = auth.status === 'FAILURE' ? <ErrorMessage message={auth.messages} /> : null;

    /** Create the form if no request in flight, else progress bar */
    const Form =
      auth.status === 'IN_FLIGHT' ? (
        <ProgressBar width='s12 m8' />
      ) : (
        <main>
          <div id='main-container' className='container'>
            <div className='col s10 offset-s1 m8 offset-m2 card' id='main-card'>
              <div className='card-content'>
                <div className='row'>
                  {/** Display any error message */}
                  {errorMessageElement}

                  <div className='col s12 section' id='login-section'>
                    <span className='card-title' id='login-text'>
                      Existing Users
                    </span>

                    <div id='login-btn'>
                      <GoogleLogin
                        clientId={config.googleOAuthClientID}
                        buttonText='Log in with Google'
                        onSuccess={this.onGoogleLoginSuccess}
                        onFailure={this.onGoogleLoginFailure}
                        cookiePolicy={'single_host_origin'}
                      />
                    </div>
                  </div>

                  <div className='col s12 wrapper'>
                    <div className='or-separator'>
                      <div className='vertical-line'></div>
                      <p id='or'>OR</p>
                      <div className='vertical-line'></div>
                    </div>
                  </div>

                  <div className='col s12 section' id='signup-section'>
                    <span className='card-title'>New User?</span>

                    <form onSubmit={this.handleFormSubmit} id='signup-form'>
                      <p className='col s12 m8 offset-m1' id='enter-code-txt'>
                        Please enter the access code you should have received from the admin below:
                      </p>

                      <TextInput
                        id='access_code'
                        label='16-Character Access Code'
                        value={wp.access_code}
                        onChange={this.handleFormChange}
                        required={true}
                        width='s10 offset-s1 m8 offset-m1'
                      />

                      <div id='choose-btn'>
                        <GoogleLogin
                          clientId={config.googleOAuthClientID}
                          buttonText='Choose a Google account'
                          onSuccess={this.onGoogleSignUpSuccess}
                          onFailure={this.onGoogleLoginFailure}
                          cookiePolicy={'single_host_origin'}
                        />
                      </div>

                      {this.state.showProfileDetails && (
                        <div className='row'>
                          <div className='profile-details col s10 offset-s1 l8 offset-l1'>
                            <input
                              type='text'
                              id='full_name'
                              value={wp.full_name ?? ''}
                              onChange={this.handleFormChange}
                              required={true}
                              disabled={true}
                            />

                            <input
                              type='text'
                              id='email'
                              value={wp.email ?? ''}
                              onChange={this.handleFormChange}
                              required={true}
                              disabled={true}
                            />
                          </div>
                        </div>
                      )}

                      <div id='register-btn-div'>
                        <div className='input-field'>
                          <button
                            className='btn waves-effect waves-light'
                            id='register-btn'
                            disabled={!this.state.showProfileDetails}
                          >
                            Register <i className='material-icons right'>send</i>
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      );

    return Form;
  }
}

export default connector(LoginRegister);
