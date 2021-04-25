// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display the list of boxes in the system. The component also
 * provides an action button to generate a new creation code for a box.
 */

// React stuff
import React, { ChangeEventHandler, FormEventHandler, Fragment } from 'react';

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { compose } from 'redux';

// HTML helpers
import { ColTextInput } from '../templates/FormInputs';
import { ErrorMessage, ProgressBar } from '../templates/Status';
import { TableColumnType, TableList } from '../templates/TableList';

// DB Types
import { Box, BoxRecord } from '@karya/common';

// HoCs
import { BackendRequestInitAction } from '../../store/apis/APIs.auto';
import { DataProps, withData } from '../hoc/WithData';

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

    // get error element
    const errorElement =
      this.props.box.status === 'FAILURE' ? <ErrorMessage message={this.props.box.messages} /> : null;

    // Box table columns
    const tableColumns: Array<TableColumnType<BoxRecord>> = [
      { header: 'Name', type: 'field', field: 'name' },
      { header: 'Location', type: 'field', field: 'location_name' },
      { header: 'Creation Code', type: 'field', field: 'creation_code' },
    ];

    // Registered boxes
    const registeredBoxes = boxes.filter((b) => b.key !== null);
    const boxCreationCodes = boxes.filter((b) => b.key === null);

    // Creation code form
    const { ccForm } = this.state;
    const creationCodeForm = (
      <form onSubmit={this.handleCCFormSubmit}>
        <div className='row valign-wrapper'>
          <ColTextInput
            id='name'
            label='Name of the Box'
            required={true}
            value={ccForm.name}
            onChange={this.handleChange}
            width='s4'
          />
          <div className='col s3'>
            <button className='btn red'>Generate Box Code</button>
          </div>
        </div>
      </form>
    );

    return (
      <div className='tmar20'>
        {errorElement}
        <Fragment>
          <TableList<BoxRecord> columns={tableColumns} rows={registeredBoxes} emptyMessage='No registered boxes' />
          <TableList<BoxRecord>
            columns={tableColumns}
            rows={boxCreationCodes}
            emptyMessage='No box creation codes'
          />{' '}
        </Fragment>
        {this.props.box.status === 'IN_FLIGHT' ? <ProgressBar /> : creationCodeForm}
      </div>
    );
  }
}

export default connector(BoxList);
