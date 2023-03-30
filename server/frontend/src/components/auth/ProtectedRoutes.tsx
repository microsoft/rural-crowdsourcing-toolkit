// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Protecter routes: Requires a user to be logged in; Redirects it not.
 */

// Import react stuff
import React from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';

// Import redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from '../../store/Index';

// Map auth state to props
const mapStateToProps = (state: RootState) => {
  return { cwp: state.all.auth.cwp };
};

// Get connector
const connector = connect(mapStateToProps);

/**
 * Admin routes: User should be logged in and should be an admin.
 */
type AdminRouteProps = RouteProps & ConnectedProps<typeof connector>;

const LocalAdminRoute = (adminProps: AdminRouteProps) => {
  const { component, cwp, ...rest } = adminProps;

  if (cwp && cwp.role === 'ADMIN') {
    return <Route {...rest} component={component} />;
  } else if (cwp) {
    return <Redirect to='/unauthorized' />;
  } else {
    return <Redirect to={{ pathname: '/login', state: { from: adminProps.location } }} />;
  }
};

export const AdminRoute = connector(LocalAdminRoute);

/**
 * Work provider routes: User should be logged in
 */

type WorkProviderRouteProps = RouteProps & ConnectedProps<typeof connector>;

const LocalWorkProviderRoute = (wpProps: WorkProviderRouteProps) => {
  const { component, cwp, ...rest } = wpProps;

  if (cwp) {
    return <Route {...rest} component={component} />;
  } else {
    return <Redirect to={{ pathname: '/login', state: { from: wpProps.location } }} />;
  }
};

export const WorkProviderRoute = connector(LocalWorkProviderRoute);
