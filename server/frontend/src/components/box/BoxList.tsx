// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display the list of boxes in the system. The component also
 * provides an action button to generate a new creation code for a box.
 */

// React stuff
import React, { ChangeEventHandler, FormEventHandler } from 'react';

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { compose } from 'redux';

// HTML helpers
import { ColTextInput } from '../templates/FormInputs';
import { ErrorMessage, ProgressBar } from '../templates/Status';
import { TableColumnType, TableList } from '../templates/TableList';

// DB Types
import { Box, BoxRecord } from '@karya/core';

import { BackendRequestInitAction } from '../../store/apis/APIs';

// HoCs
import { DataProps, withData } from '../hoc/WithData';

// CSS
import '../../css/box/ngBoxList.css';

// Map dispatch to props
const mapDispatchToProps = (dispatch: any) => {
  return {
    generateBoxCC: (box: Box) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'box',
        label: 'GENERATE_CC',
        request: box,
      };
      dispatch(action);
    },
  };
};

// Create the connector
const reduxConnector = connect(null, mapDispatchToProps);
const dataConnector = withData('box');
const connector = compose(dataConnector, reduxConnector);

// Box list props
type BoxListProps = DataProps<typeof dataConnector> & ConnectedProps<typeof reduxConnector>;

// Box list state
type BoxListState = {
  ccForm: Box;
};

// Box list component
class BoxList extends React.Component<BoxListProps, BoxListState> {
  state: BoxListState = {
    ccForm: { name: '' },
  };

  // Clear form
  clearForm = () => {
    this.setState({ ccForm: { name: '' } });
  };

  // Handle form change
  handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const ccForm = { ...this.state.ccForm, [e.currentTarget.id]: e.currentTarget.value };
    this.setState({ ccForm });
  };

  // Handle form submit
  handleCCFormSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    this.props.generateBoxCC(this.state.ccForm);
  };

  // On mount, get boxes and update text fields
  componentDidMount() {
    M.updateTextFields();
  }

  // On update, update text fields
  componentDidUpdate(prevProps: BoxListProps) {
    if (prevProps.box.status === 'IN_FLIGHT' && this.props.box.status === 'SUCCESS') {
      this.clearForm();
    }
    M.updateTextFields();
  }

  render() {
    const boxes = this.props.box.data;
    console.log(boxes);

    // get error element
    const errorElement =
      this.props.box.status === 'FAILURE' ? <ErrorMessage message={this.props.box.messages} /> : null;

    // Box registered or not
    const boxRegistrationStatus = (b: BoxRecord) => {
      const status = b.reg_mechanism !== null ? 'Yes' : 'No';
      return status;
    };

    // Box table columns
    const tableColumns: Array<TableColumnType<BoxRecord>> = [
      { header: 'Name', type: 'field', field: 'name' },
      { header: 'Location', type: 'field', field: 'location' },
      { header: 'Access Code', type: 'field', field: 'access_code' },
      { header: 'Registered', type: 'function', function: boxRegistrationStatus },
    ];

    // Creation code form
    const { ccForm } = this.state;
    const creationCodeForm = (
      <form onSubmit={this.handleCCFormSubmit} id='boxcode-form'>
        <div className='row'>
          <ColTextInput
            id='name'
            label='Name of the Box'
            required={true}
            value={ccForm.name ?? 'Unnamed'}
            onChange={this.handleChange}
            width='s4'
          />
          <button className='btn' id='gen-boxcode-btn'>
            <i className='material-icons left'>add</i>Generate Box Code
          </button>
        </div>
      </form>
    );

    return (
      <div className='row main-row'>
        {errorElement}
        <h1 className='page-title' id='boxes-title'>
          Boxes
        </h1>
        {this.props.box.status === 'IN_FLIGHT' ? <ProgressBar /> : creationCodeForm}
        <div className='basic-table' id='box-table'>
          <TableList<BoxRecord> columns={tableColumns} rows={boxes} emptyMessage='No boxes created' />
        </div>
      </div>
    );
  }
}

export default connector(BoxList);
