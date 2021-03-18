// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Describe the component
 */

import React from 'react';

/** Redux stuff */
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from '../../store/Index';

/** Import async ops and action creators */

/** Define Router match params props */
/** Define own props */

/** map relevant state to props */
const mapStateToProps = (state: RootState) => {
  return {};
};

/** Map dispatch action creators to props */
const mapDispatchToProps = (dispatch: any /** Replace with dispatch op type here */) => {
  return {};
};

/** Create the connector HoC */
const connector = connect(mapStateToProps, mapDispatchToProps);

/** Combine component props */
type MyComponentProps = ConnectedProps<typeof connector> /** & other props */;

/** State for the component */
/** Status of outstanding async requests must go here */
type MyComponentState = {};

/** LanguageList component */
class MyComponent extends React.Component<MyComponentProps, MyComponentState> {
  // Set the initial request status to 'SUCCESS'
  state: MyComponentState = {};

  // On mount, dispatch actions
  componentDidMount() {
    return;
  }

  render() {
    return null;
  }
}

export default connector(MyComponent);
