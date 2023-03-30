// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display the list of work providers in the system. The component also
 * provides an action button to generate a creation code.
 */

import React, { ChangeEventHandler, FormEventHandler } from 'react';

import { connect, ConnectedProps } from 'react-redux';
import { compose } from 'redux';

import { ColTextInput } from '../templates/FormInputs';
import { ErrorMessage, ProgressBar } from '../templates/Status';
import { TableColumnType, TableList } from '../templates/TableList';

import { AuthProviderName } from '../auth/Auth.extra';
import { ServerUser, ServerUserRecord } from '@karya/core';

import { BackendRequestInitAction } from '../../store/apis/APIs';
import { DataProps, withData } from '../hoc/WithData';

// CSS
import '../../css/work_provider/ngWorkProviderList.css';

/** Map get languages action creator to props */
const mapDispatchToProps = (dispatch: any) => {
  return {
    generateServerUserCC: (wp: ServerUser) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'server_user',
        label: 'GENERATE_CC',
        request: wp,
      };
      dispatch(action);
    },
  };
};

/** Create the connector HoC */
const reduxConnector = connect(null, mapDispatchToProps);
const dataConnector = withData('server_user');
const connector = compose(dataConnector, reduxConnector);

/** LanugageList has only connected props */
type ServerUserListProps = DataProps<typeof dataConnector> & ConnectedProps<typeof reduxConnector>;

/** Component only tracks status of existing request */
type ServerUserListState = {
  ccForm: ServerUser;
};

/** ServerUserList component */
class ServerUserList extends React.Component<ServerUserListProps, ServerUserListState> {
  // setup creation code state
  state: ServerUserListState = {
    ccForm: { full_name: '', email: '', phone_number: '' },
  };

  // clear form
  clearForm = () => {
    const ccForm: ServerUser = { full_name: '', email: '', phone_number: '' };
    this.setState({ ccForm });
  };

  // handle form change
  handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const ccForm = { ...this.state.ccForm, [e.currentTarget.id]: e.currentTarget.value };
    this.setState({ ccForm });
  };

  // handle form submit
  handleCCFormSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    this.props.generateServerUserCC(this.state.ccForm);
  };

  // On mount, get all work providers
  componentDidMount() {
    M.updateTextFields();
  }

  // On update, update text fields
  componentDidUpdate(prevProps: ServerUserListProps) {
    if (prevProps.server_user.status === 'IN_FLIGHT' && this.props.server_user.status === 'SUCCESS') {
      this.clearForm();
    }
    M.updateTextFields();
  }

  render() {
    const server_users = this.props.server_user.data;

    /** Extract error message element */
    const errorMessageElement =
      this.props.server_user.status === 'FAILURE' ? (
        <div>
          <ErrorMessage message={this.props.server_user.messages} />
        </div>
      ) : null;

    const tableColumns: Array<TableColumnType<ServerUserRecord>> = [
      { header: 'Admin', type: 'function', function: (wp) => (wp.role === 'ADMIN' ? 'Yes' : 'No') },
      { type: 'field', field: 'full_name', header: 'Name' },
      { type: 'field', field: 'email', header: 'Email' },
      { type: 'function', header: 'Registration Type', function: (wp) => AuthProviderName(wp.reg_mechanism) },
      { type: 'field', field: 'access_code', header: 'Access Code' },
    ];

    /** Function to sort the work providers */
    const sortServerUsers = (a: ServerUserRecord, b: ServerUserRecord) => {
      if (a.role === b.role) {
        return new Date(a.created_at) < new Date(b.created_at) ? 1 : -1;
      }
      return a.role === 'ADMIN' ? -1 : 1;
    };

    /** Sorted list work providers */
    const sortedServerUsers = server_users.sort(sortServerUsers);

    /** Creation code form */
    const { ccForm } = this.state;
    const creationCodeForm = (
      <div className='section'>
        <form onSubmit={this.handleCCFormSubmit} id='cc-form'>
          <div className='row'>
            <ColTextInput
              id='full_name'
              label='Full Name'
              required={true}
              value={ccForm.full_name ?? 'Unnamed'}
              onChange={this.handleChange}
              width='s3'
            />
            <ColTextInput
              id='email'
              label='Email'
              required={true}
              value={ccForm.email ?? 'No mail'}
              onChange={this.handleChange}
              width='s4'
            />
            <div className='col s3'>
              <button className='btn' id='gen-cc-btn'>
                <i className='material-icons left'>add</i>Generate Code
              </button>
            </div>
          </div>
        </form>
      </div>
    );

    return (
      <div className='row main-row'>
        {errorMessageElement}
        <h1 className='page-title' id='wp-title'>
          Work Providers
        </h1>
        {this.props.server_user.status === 'IN_FLIGHT' ? <ProgressBar /> : creationCodeForm}
        <div className='basic-table' id='wp-table'>
          <TableList<ServerUserRecord>
            columns={tableColumns}
            rows={sortedServerUsers}
            emptyMessage='No work providers'
          />
        </div>
      </div>
    );
  }
}

export default connector(ServerUserList);
