// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import M from 'materialize-css';

import React, { ChangeEventHandler, Component, FormEventHandler } from 'react';
import { Redirect, RouteComponentProps } from 'react-router-dom';

/** Redux stuff */
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from '../../store/Index';

/** Import async ops and action creators */
import { BackendRequestInitAction } from '../../store/apis/APIs';

/** Template elements */
import { SubmitOrCancel, TextInput } from '../templates/FormInputs';
import { ErrorMessage, ProgressBar } from '../templates/Status';

/** Google login element */
import GoogleLogin from 'react-google-login';

/** Types needed for database tables */
import { ServerUser } from '@karya/core';

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

/** Router props (for history) */
type RouterProps = RouteComponentProps<{}>;
type OwnProps = RouterProps;

/** map relevant state to props */
const mapStateToProps = (state: RootState) => {
  return { auth: state.all.auth };
};

/** Map dispatch action creators to props */
const mapDispatchToProps = (dispatch: any) => {
  return {
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
};

class SignUp extends Component<SignUpProps, SignUpState> {
  /** Initial state */
  state: SignUpState = {
    wp: {
      access_code: '',
      full_name: '',
      email: '',
    },
    id_token: '',
  };

  /** Handle form cancel */
  handleFormCancel: FormEventHandler = (e) => {
    e.preventDefault();
    const wp: ServerUser = {
      access_code: '',
      full_name: '',
      email: '',
    };
    this.setState({ wp, id_token: '' });
  };

  /** Form ...this.state, field on change handler */
  handleFormChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const updatedWP: ServerUser = { ...this.state.wp, [e.currentTarget.id]: e.currentTarget.value };
    this.setState({ wp: updatedWP });
  };

  /** Form submission */
  handleFormSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    this.props.signUpServerUser(this.state.wp, this.state.id_token);
  };

  /**
   * Function to call on successful login
   */
  onGoogleLoginSuccess = (googleUser: any) => {
    const profile = googleUser.getBasicProfile();
    const id_token = googleUser.getAuthResponse().id_token;

    const wp: ServerUser = {
      access_code: '',
      full_name: profile.getName(),
      email: profile.getEmail(),
    };

    this.setState({ wp, id_token });
  };

  /**
   * Function to call on failed login
   */
  onGoogleLoginFailure = (error: any) => {
    // Dispatch an error?
    console.log(error);
  };

  /** On update, trigger materialize effects  */
  componentDidUpdate() {
    M.updateTextFields();
  }

  render() {
    /** Get relevant objects from state */
    const { wp } = this.state;
    const { auth } = this.props;

    /** auth should be success in this case */
    if (auth.cwp !== null && auth.status === 'SUCCESS') {
      return <Redirect to='/wp-dashboard'></Redirect>;
    }

    /** Generate any error message */
    const errorMessageElement = auth.status === 'FAILURE' ? <ErrorMessage message={auth.messages} /> : null;

    /** Create the signup form; If request already in flight, just display progress bar */
    const signUpForm =
      auth.status === 'IN_FLIGHT' ? (
        <ProgressBar width='s12 m8' />
      ) : (
        <div className='row'>
          <div className='col s12 m8'>
            {/** Display any error message */}
            {errorMessageElement}

            {/** Open ID sign-up field */}
            <div className='card'>
              <div className='card-content'>
                <span className='card-title'>Sign Up with Microsoft/Google</span>
                <p>
                  You can use your Microsoft or Google account to sign up as a work provider. We use these providers
                  only for identity and for some basic profile information to auto-fill the sign-up form.
                </p>
                <div className='section'>
                  <GoogleLogin
                    clientId={googleClientId}
                    buttonText='Sign up with Google'
                    onSuccess={this.onGoogleLoginSuccess}
                    onFailure={this.onGoogleLoginFailure}
                    cookiePolicy={'single_host_origin'}
                  />
                </div>
              </div>
            </div>

            {/** Sign-up form */}
            <div className='card'>
              <div className='card-content'>
                <form onSubmit={this.handleFormSubmit}>
                  <TextInput
                    id='access_code'
                    label='16-Character Access Code*'
                    value={wp.access_code}
                    onChange={this.handleFormChange}
                    required={true}
                    width='s12 m8'
                  />

                  <TextInput
                    id='full_name'
                    label='Full name of the work provider*'
                    value={wp.full_name ?? ''}
                    onChange={this.handleFormChange}
                    required={true}
                    width='s12 m8'
                  />

                  <TextInput
                    id='email'
                    label='E-mail Address'
                    value={wp.email ?? ''}
                    onChange={this.handleFormChange}
                    width='s12 m8'
                  />

                  <SubmitOrCancel
                    submitString='Sign Up!'
                    submitColor='red'
                    cancelAction='call'
                    cancelFunction={this.handleFormCancel}
                  />
                </form>
              </div>
            </div>
          </div>
        </div>
      );

    return signUpForm;
  }
}

export default connector(SignUp);
