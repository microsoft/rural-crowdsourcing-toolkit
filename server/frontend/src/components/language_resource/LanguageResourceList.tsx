// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to show the list of all scenarios
 */

import React, { ChangeEventHandler, Component, FormEventHandler } from 'react';
import { compose } from 'redux';

import { RouteComponentProps } from 'react-router-dom';

/** Redux stuff */
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from '../../store/Index';

/** HTML helper components */
import { SubmitOrCancel, TextInput } from '../templates/FormInputs';
import { ErrorMessage, ProgressBar } from '../templates/Status';
import { TableColumnType, TableList } from '../templates/TableList';

// HoC
import { DataProps, withData } from '../hoc/WithData';

import { LanguageResource, LanguageResourceRecord } from '@karya/db';
import { BackendRequestInitAction } from '../../store/apis/APIs.auto';

/** Define Router match params props */
type MatchParams = { id: string };
type RouterProps = RouteComponentProps<MatchParams>;

/** Define own props */
type OwnProps = RouterProps;

/** map relevant state to props */
const mapStateToProps = (state: RootState, ownProps: OwnProps) => {
  let lrFilter: LanguageResource;
  let resources: LanguageResourceRecord[];
  const id = ownProps.match.params.id;
  const scenario_id = Number.parseInt(id, 10);
  if (scenario_id === 0) {
    lrFilter = { core: true };
    resources = state.all.language_resource.data.filter((lr) => lr.core === true);
  } else {
    lrFilter = { scenario_id };
    resources = state.all.language_resource.data.filter((lr) => lr.scenario_id === scenario_id);
  }
  return { lrFilter, resources };
};

/** Map dispatch action creators to props */
const mapDispatchToProps = (dispatch: any) => {
  return {
    createLanguageResource: (languageResource: LanguageResource) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'language_resource',
        label: 'CREATE',
        request: languageResource,
      };
      dispatch(action);
    },
    updateLanguageResource: (id: number, languageResource: LanguageResource) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'language_resource',
        label: 'UPDATE_BY_ID',
        id,
        request: languageResource,
      };
      dispatch(action);
    },
  };
};

/** Create the connector HoC */
const reduxConnector = connect(mapStateToProps, mapDispatchToProps);
const dataConnector = withData('language_resource');
const connector = compose(dataConnector, reduxConnector);

/** Language resource list props */
type LanguageResourceListProps = OwnProps & DataProps<typeof dataConnector> & ConnectedProps<typeof reduxConnector>;

/** State for the component */
/** Status of outstanding async requests must go here */
type LanguageResourceListState = {
  formResource: LanguageResource;
};

/** LanguageList component */
class LanguageResourceList extends Component<LanguageResourceListProps, LanguageResourceListState> {
  // Set the initial request status to 'SUCCESS'
  state: LanguageResourceListState = {
    formResource: {
      name: '',
      description: '',
      type: 'string_resource',
      string_resource_id: null,
      required: true,
      ...this.props.lrFilter,
    },
  };

  /** Handle form cancel */
  handleCancel: FormEventHandler = (e) => {
    e.preventDefault();
    this.resetForm();
  };

  /** Function to reset the form */
  resetForm = () => {
    const formResource: LanguageResource = {
      name: '',
      description: '',
      type: 'string_resource',
      string_resource_id: null,
      required: true,
      ...this.props.lrFilter,
    };
    this.setState({ formResource });
  };

  /** Method to generate the required toggle button for each resource */
  requiredToggle = (lr: LanguageResource) => {
    const disableToggle = lr.name === 'scenario_name' || lr.name === 'scenario_description';
    return (
      <div className='switch'>
        <label>
          <input
            name={`${lr.id}`}
            type='checkbox'
            checked={lr.required}
            disabled={disableToggle}
            onChange={this.handleRequiredToggle}
          />
          <span className='lever'></span>
          <span>{lr.required ? 'Yes' : 'No'}</span>
        </label>
      </div>
    );
  };

  /** Handle required toggle switch */
  handleRequiredToggle: ChangeEventHandler<HTMLInputElement> = (e) => {
    const updatedLRId = Number.parseInt(e.currentTarget.name, 10);
    const lRRecord = this.props.resources.find((lr) => lr.id === updatedLRId) as LanguageResource;
    const updatedLR: LanguageResource = { id: updatedLRId, required: !lRRecord.required };
    this.props.updateLanguageResource(updatedLRId, updatedLR);
  };

  /** Method to generate the edit button for each resource */
  editButton = (lr: LanguageResource) => {
    if (lr.name === 'scenario_name' || lr.name === 'scenario_description') return null;
    return (
      <button className='btn-floating btn-small grey' onClick={(e) => this.handleEditClick(lr)}>
        <i className='material-icons'>edit</i>
      </button>
    );
  };

  handleEditClick = (lr: LanguageResource) => {
    this.setState({ formResource: lr });
  };

  /** Handle change in text input */
  handleChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    const updates: LanguageResource = { [e.currentTarget.id]: e.currentTarget.value };
    if (e.currentTarget.id === 'type') {
      if (e.currentTarget.value === 'file_resource') {
        updates.string_resource_id = this.props.resources.filter((r) => r.type === 'string_resource')[0].id;
      } else {
        updates.string_resource_id = null;
      }
    }
    const formResource = {
      ...this.state.formResource,
      ...updates,
    };
    this.setState({ formResource });
  };

  /** Handle form submission */
  handleSubmit: FormEventHandler = (e) => {
    // prevent default action
    e.preventDefault();

    const { formResource } = this.state;
    if (formResource.id) {
      this.props.updateLanguageResource(formResource.id, formResource);
    } else {
      this.props.createLanguageResource(formResource);
    }
  };

  /** On update, update materialize fields */
  componentDidUpdate(prevProps: LanguageResourceListProps) {
    if (prevProps.language_resource.status === 'IN_FLIGHT' && this.props.language_resource.status === 'SUCCESS') {
      this.resetForm();
    }
    M.updateTextFields();
    M.AutoInit();
  }

  render() {
    const { resources } = this.props;
    const { data, ...request } = this.props.language_resource;

    /** Generate any error message for get request */
    const errorMessageElement = request.status === 'FAILURE' ? <ErrorMessage message={request.messages} /> : null;

    const tableColumns: Array<TableColumnType<LanguageResource>> = [
      { header: 'Name', type: 'field', field: 'name' },
      { header: 'Description', type: 'field', field: 'description' },
      { header: 'Type', type: 'field', field: 'type' },
      { header: 'Required', type: 'function', function: this.requiredToggle },
      { header: 'Edit', type: 'function', function: this.editButton },
    ];

    const { formResource } = this.state;
    const submitString = formResource.id ? 'Update Resource' : 'Create New Resource';

    const createUpdateResourceForm = (
      <form onSubmit={this.handleSubmit}>
        <TextInput
          label='Name of the resource ( alpha-numeric and _ )'
          id='name'
          required={true}
          value={formResource.name}
          onChange={this.handleChange}
          width='s8 m6'
        />

        <div className='row'>
          <p className='col'>
            <label>
              <input
                name='type'
                id='type'
                type='radio'
                value='string_resource'
                checked={formResource.type === 'string_resource'}
                onChange={this.handleChange}
              />
              <span>String Resource</span>
            </label>
          </p>
          <p className='col'>
            <label>
              <input
                name='type'
                id='type'
                type='radio'
                value='file_resource'
                checked={formResource.type === 'file_resource'}
                onChange={this.handleChange}
              />
              <span>File Resource</span>
            </label>
          </p>
        </div>

        <TextInput
          label='Description of the resource'
          id='description'
          required={true}
          value={formResource.description}
          onChange={this.handleChange}
        />

        {formResource.type === 'string_resource' ? null : (
          <div className='row'>
            <div className='input-field col s6 m4 l3'>
              <p>
                <label htmlFor='string_resource_id'>Associated string language resource</label>
                <select
                  id='string_resource_id'
                  value={formResource.string_resource_id as number}
                  onChange={this.handleChange}
                >
                  {resources
                    .filter((r) => r.type === 'string_resource')
                    .map((r) => (
                      <option value={r.id} key={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </p>
            </div>
          </div>
        )}

        {request.status === 'IN_FLIGHT' ? (
          <ProgressBar />
        ) : (
          <SubmitOrCancel submitString={submitString} cancelAction='call' cancelFunction={this.handleCancel} />
        )}
      </form>
    );

    return (
      <div className='lmar20 tmar20'>
        {errorMessageElement}
        <TableList<LanguageResource>
          columns={tableColumns}
          rows={resources}
          emptyMessage={`There are no resources for this scenario`}
        />
        {createUpdateResourceForm}
      </div>
    );
  }
}

export default connector(LanguageResourceList);
