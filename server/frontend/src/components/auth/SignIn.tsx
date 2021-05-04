// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to sign in an already registered user
 */

import React from 'react';
import { StaticContext } from 'react-router';
import { Redirect, RouteComponentProps } from 'react-router-dom';

/** Redux stuff */
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from '../../store/Index';

/** Import async ops and action creators */
import { BackendRequestInitAction } from '../../store/apis/APIs.auto';

/** Import templates */
import { ErrorMessage, ProgressBar } from '../templates/Status';

/** Types needed */
import { AuthHeader } from '../../db/Auth.extra';

/** Google login element */
import GoogleLogin from 'react-google-login';
import config from '../../config/Index';

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
  };
};

/** Create the connector HoC */
const connector = connect(mapStateToProps, mapDispatchToProps);

/** Combine component props */
type SignInProps = ConnectedProps<typeof connector> & OwnProps;

/** LanguageList component */
class SignIn extends React.Component<SignInProps> {
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
    /** Get relevant props from state */
    const { auth } = this.props;
    const locationState = this.props.location.state;

    const { from } = locationState || { from: { pathname: '/dashboard' } };

    /** If signed in, redirect to original location or the dashboard */
    if (auth.cwp !== null && auth.status === 'SUCCESS') {
      return <Redirect to={from} />;
    }

    /** Generate any error message */
    const errorMessageElement = auth.status === 'FAILURE' ? <ErrorMessage message={auth.messages} /> : null;

    /** Create the sign in form if no request in flight, else progress bar */
    const signInForm =
      auth.status === 'IN_FLIGHT' ? (
        <ProgressBar width='s12 m8' />
      ) : (
        <div className='row'>
          <div className='col s12 m8'>
            {/** Display any error message */}
            {errorMessageElement}

            {/** Open ID sign-in field */}
            <div className='card'>
              <div className='card-content'>
                <span className='card-title'>Sign In with Microsoft/Google</span>
                <div className='section'>
                  <GoogleLogin
                    clientId={config.googleOAuthClientID}
                    buttonText='Sign in with Google'
                    onSuccess={this.onGoogleLoginSuccess}
                    onFailure={this.onGoogleLoginFailure}
                    cookiePolicy={'single_host_origin'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    return signInForm;
  }
}

export default connector(SignIn);
