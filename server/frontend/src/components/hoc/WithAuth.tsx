// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Higher order component to add auth props to a component
 */

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from '../../store/Index';

// DB types
import { WorkProviderRecord } from '@karya/db';

// Map current work provider state to props
const mapStateToProps = (state: RootState) => {
  return {
    cwp: state.all.auth.cwp as Readonly<WorkProviderRecord>,
  };
};

// Create the connector
const connector = connect(mapStateToProps);

// Auth props
export type AuthProps = ConnectedProps<typeof connector>;

// withAuth HoC
export const withAuth = (WrappedComponent: any) => {
  return connector(WrappedComponent);
};
