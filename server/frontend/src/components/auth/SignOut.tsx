// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Describe the component
 */

import React from 'react';
import { Redirect, RouteComponentProps } from 'react-router-dom';

/** Redux stuff */
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from '../../store/Index';

/** Templates */
import { ErrorMessage, ProgressBar } from '../templates/Status';

/** Import async ops and action creators */
import { BackendRequestInitAction } from '../../store/apis/APIs';

/** Define Router match params props */
type RouterProps = RouteComponentProps<{}>;
/** Define own props */
type OwnProps = RouterProps;

/** map relevant state to props */
const mapStateToProps = (state: RootState) => {
  return { auth: state.all.auth };
};

/** Map dispatch action creators to props */
const mapDispatchToProps = (dispatch: any) => {
  return {
    signOutWorkProvider: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'auth',
        label: 'SIGN_OUT',
        request: {},
      };
      dispatch(action);
    },
  };
};

/** Create the connector HoC */
const connector = connect(mapStateToProps, mapDispatchToProps);

/** Combine component props */
type SignOutProps = ConnectedProps<typeof connector> & OwnProps;

/** LanguageList component */
class SignOut extends React.Component<SignOutProps> {
  // On mount, dispatch actions
  componentDidMount() {
    this.props.signOutWorkProvider();
  }

  render() {
    const { auth } = this.props;

    if (auth.status === 'SUCCESS' && auth.cwp === null) {
      return <Redirect to='/'></Redirect>;
    }

    return (
      <div className='row'>
        <div className='col s12 m8'>
          <div className='card'>
            <div className='card-content'>
              {auth.status === 'IN_FLIGHT' ? (
                <ProgressBar />
              ) : auth.status === 'FAILURE' ? (
                <ErrorMessage message={auth.messages} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connector(SignOut);
