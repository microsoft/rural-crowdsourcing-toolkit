// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * HoC to fetch data for a store and feed the relevant data and status to a
 * component
 */

// React stuff
import React from 'react';

// Redux stuff
import { connect } from 'react-redux';
import { store } from '../../index';
import { AllState } from '../../store/AllReducer';
import { DbParamsType } from '../../store/apis/APIs.auto';
import { RootState } from '../../store/Index';

// Types
import { DbTableName } from '@karya/core';

/**
 * Type listing the additional props that will be attached to a component when
 * using this HoC. All requested tables are mapped. In addtion, a dispatcher
 * that will allow the component to re-fetch the data if necessary.
 */
type WithDataProps<Table extends DbTableName> = Pick<AllState, Table> & {
  getData: (table: Table) => () => any;
};

/**
 * This HoC take a list of DB tables and maps all information in the store to
 * the wrapped component.
 * @param tables List of tables that need to be mapped to the component
 */
export const withData = <Table extends DbTableName>(...tables: Table[]) => (
  WrappedComponent: any,
): React.ComponentType<WithDataProps<Table>> => {
  // Filter all relevant tables from the root state to props
  const mapStateToProps = (state: RootState) => {
    // @ts-ignore
    const returnState: Pick<AllState, Table> = {};
    tables.forEach((table) => {
      returnState[table] = state.all[table];
    });
    return returnState;
  };

  // Dispatch function to force fetch values of a table from the backend
  const mapDispatchToProps = (dispatch: typeof store.dispatch) => {
    return {
      getData: (table: Table) => (params: DbParamsType<Table> | {} = {}) =>
        dispatch({
          type: 'BR_INIT',
          store: table,
          label: 'GET_ALL',
          params,
        }),
    };
  };

  // Wrapper component
  class DataWrapper extends React.Component<WithDataProps<Table>> {
    // On mount, fetch data if it has never been fetched. Wrapped components can
    // use the getData(table) function to force fetch data if needed.
    componentDidMount() {
      tables.forEach((table) => {
        if (this.props[table].last_fetched_at < new Date(1)) {
          this.props.getData(table)();
        }
      });
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  }

  // @ts-ignore
  return connect(mapStateToProps, mapDispatchToProps)(DataWrapper);
};

// Infer data props from the wrapper
type GetProps<C> = C extends React.ComponentType<infer P> ? P : never;
export type DataProps<D extends (...args: any) => React.ComponentType<any>> = GetProps<ReturnType<D>>;
