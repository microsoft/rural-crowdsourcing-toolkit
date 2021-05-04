// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to create a new task. On success, the component redirects to the
 * task list page.
 */

// React stuff
import React, { ChangeEventHandler, FormEventHandler } from 'react';
import { RouteComponentProps } from 'react-router-dom';

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from '../../store/Index';

// Store types and actions
import { Task } from '@karya/core';
import { ScenarioInterface, scenarioMap, ScenarioName } from '@karya/core';
import { languageMap, LanguageCode } from '@karya/core';

// HTML Helpers
import { ColTextInput, SubmitOrCancel } from '../templates/FormInputs';
import { ErrorMessage, ProgressBar } from '../templates/Status';

// Hoc
import { BackendRequestInitAction } from '../../store/apis/APIs.auto';

// Create router props
type RouterProps = RouteComponentProps<{}>;

// Load state to props
const mapStateToProps = (state: RootState) => {
  const { data, ...request } = state.all.task;
  return {
    request,
  };
};

// Map dispatch to props
const mapDispatchToProps = (dispatch: any) => {
  return {
    createTask: (task: Task, files: { [id: string]: File }) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task',
        label: 'CREATE',
        request: task,
        files,
      };
      dispatch(action);
    },
  };
};

// create the connector
const reduxConnector = connect(mapStateToProps, mapDispatchToProps);
const connector = reduxConnector;

// component prop type
type CreateTaskProps = RouterProps & ConnectedProps<typeof reduxConnector>;

// component state
type CreateTaskState = {
  task: Task;
  params: { [id: string]: string | number | boolean };
  scenario?: ScenarioInterface;
  language_code?: LanguageCode;
  files: { [id: string]: File };
};

class CreateTask extends React.Component<CreateTaskProps, CreateTaskState> {
  state: CreateTaskState = {
    task: {
      name: '',
      description: '',
      display_name: '',
    },
    params: {},
    files: {},
  };

  // reset task data
  resetTask = () => {
    const task: Task = {
      name: '',
      description: '',
      display_name: '',
    };
    this.setState({ task });
  };

  // On mount, reset form
  componentDidMount() {
    M.updateTextFields();
    M.AutoInit();
  }

  // On update, update materialize fields
  componentDidUpdate(prevProps: CreateTaskProps) {
    if (prevProps.request.status === 'IN_FLIGHT' && this.props.request.status === 'SUCCESS') {
      this.props.history.push('/task');
    } else {
      M.updateTextFields();
      M.AutoInit();
    }
  }

  // Handle change in scenario or language
  handleScenarioChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const scenario_name = e.currentTarget.value as ScenarioName;
    const scenario = scenarioMap[scenario_name];
    this.setState({ scenario });
    const task: Task = {
      name: '',
      description: '',
      display_name: '',
      scenario_name,
      assignment_granularity: scenario.assignment_granularity,
      group_assignment_order: scenario.group_assignment_order,
      microtask_assignment_order: scenario.microtask_assignment_order,
    };
    this.setState({ task });
  };

  // Handle language change
  handleLanguageChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const language_code = e.currentTarget.value as LanguageCode;
    const task: Task = { ...this.state.task, display_name: '' };
    this.setState({ language_code, task });
  };

  // Handle input change
  handleInputChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (e) => {
    const task: Task = { ...this.state.task, [e.currentTarget.id]: e.currentTarget.value };
    this.setState({ task });
  };

  // Handle param input change
  handleParamInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const params = { ...this.state.params, [e.currentTarget.id]: e.currentTarget.value };
    this.setState({ params });
  };

  // Handle file change
  handleParamFileChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.currentTarget.files) {
      const file = e.currentTarget.files[0];
      const files = { ...this.state.files, [e.currentTarget.id]: file };
      const params = { ...this.state.params, [e.currentTarget.id]: file.name };
      this.setState({ files, params });
    }
  };

  // Handle boolean change
  handleParamBooleanChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const params = { ...this.state.params, [e.currentTarget.id]: e.currentTarget.checked };
    this.setState({ params });
  };

  // Handle form submission
  handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    const task: Task = { ...this.state.task };
    task.scenario_name = this.state.scenario?.name;
    task.language_code = this.state.language_code;
    task.params = this.state.params;
    this.props.createTask(task, this.state.files);
  };

  // render a parameter
  /*  renderTaskParameter(param: ParameterDefinition) {
    switch (param.type) {
      case 'string':
        return (
          <ColTextInput
            id={param.identifier}
            label={param.name}
            width='s4'
            onChange={this.handleParamInputChange}
            required={param.required}
          />
        );
      case 'integer':
        return (
          <ColTextInput
            id={param.identifier}
            label={param.name}
            width='s4'
            onChange={this.handleParamInputChange}
            required={param.required}
          />
        );
      case 'float':
        return (
          <ColTextInput
            id={param.identifier}
            label={param.name}
            width='s4'
            onChange={this.handleParamInputChange}
            required={param.required}
          />
        );
      case 'file':
        return (
          <div className='col s4  file-field input-field'>
            <div className='btn btn-small'>
              <i className='material-icons'>attach_file</i>
              <input type='file' id={param.identifier} onChange={this.handleParamFileChange} />
            </div>
            <div className='file-path-wrapper'>
              <label htmlFor={`${param.identifier}-name`}>{param.name}</label>
              <input id={`${param.identifier}-name`} type='text' className='file-path validate' />
            </div>
          </div>
        );
      case 'boolean':
        return (
          <div className='col s4 input-field'>
            <label>
              <input type='checkbox' id={param.identifier} onChange={this.handleParamBooleanChange} />
              <span>{param.name}</span>
            </label>
          </div>
        );
    }
  } */

  render() {
    // Generate error with task creation
    const createErrorElement =
      this.props.request.status === 'FAILURE' ? <ErrorMessage message={this.props.request.messages} /> : null;

    // Scenarios drop down
    const scenarios = Object.values(scenarioMap);
    const { scenario } = this.state;
    const scenario_name = scenario ? scenario.name : 'null';
    const scenarioDropDown = (
      <div>
        <select id='scenario_id' value={scenario_name} onChange={this.handleScenarioChange}>
          <option value='null' disabled={true}>
            Select a Scenario
          </option>
          {scenarios.map((s) => (
            <option value={s.name} key={s.name}>
              {s.full_name}
            </option>
          ))}
        </select>
      </div>
    );

    // languages drop down
    const languages = Object.values(languageMap);
    const language_code = this.state.language_code ?? 'null';
    const languageDropDown = (
      <div>
        <select id='language_code' value={language_code} onChange={this.handleLanguageChange}>
          <option value='null' disabled={true}>
            Select a Language
          </option>
          {languages.map((l) => (
            <option value={l.code} key={l.code}>
              {`${l.name} (${l.primary_name})`}
            </option>
          ))}
        </select>
      </div>
    );

    // task creation form
    let taskForm = null;
    if (scenario !== undefined && language_code !== 'null') {
      // get parameters from the
      const params = scenario.task_input;
      const { assignment_granularity, group_assignment_order, microtask_assignment_order } = scenario;
      const language = languageMap[language_code];

      const { task } = this.state;
      taskForm = (
        <div>
          {/** Basic task information */}
          <div className='section'>
            <h5 className='red-text'>Basic Task Information</h5>
            <div className='row'>
              <ColTextInput
                id='name'
                label='Task name in English'
                width='s4'
                value={task.name}
                onChange={this.handleInputChange}
                required={true}
              />
              <ColTextInput
                id='primary_language_name'
                label={`Task name in ${language.name} (${language.primary_name})`}
                width='s4'
                value={task.display_name}
                onChange={this.handleInputChange}
                required={true}
              />
            </div>

            <div className='row'>
              <div className='col s8 input-field'>
                <label htmlFor='description'>Task Description in English</label>
                <textarea
                  id='description'
                  className='materialize-textarea'
                  value={task.description}
                  onChange={this.handleInputChange}
                  required={true}
                ></textarea>
              </div>
            </div>
          </div>

          {/** Task parameter */}
          <div className='section'>
            <h5 className='red-text'>Task Parameters</h5>
          </div>

          {/** Assignment parameters */}
          {[assignment_granularity, group_assignment_order, microtask_assignment_order].includes('either') ? (
            <div className='section'>
              <h5 className='red-text'>Assignment Parameters</h5>
              {assignment_granularity === 'either' ? (
                <div className='row'>
                  <div className='col s4'>
                    <select
                      id='assignment_granularity'
                      value={task.assignment_granularity}
                      onChange={this.handleInputChange}
                      required={true}
                    >
                      <option value='either' disabled={true}>
                        Select an Assignment Granularity
                      </option>
                      <option value='group'>Assign tasks in group granularity</option>
                      <option value='microtask'>Assign tasks in microtask granularity</option>
                    </select>
                  </div>
                </div>
              ) : null}
              {group_assignment_order === 'either' && assignment_granularity !== 'microtask' ? (
                <div className='row'>
                  <div className='col s4'>
                    <select
                      id='group_assignment_order'
                      value={task.group_assignment_order}
                      onChange={this.handleInputChange}
                      required={true}
                    >
                      <option value='either' disabled={true}>
                        Select the Group Assignment Order
                      </option>
                      <option value='sequential'>Assign groups in sequence</option>
                      <option value='random'>Assign groups randomly</option>
                    </select>
                  </div>
                </div>
              ) : null}
              {microtask_assignment_order === 'either' ? (
                <div className='row'>
                  <div className='col s4'>
                    <select
                      id='microtask_assignment_order'
                      value={task.microtask_assignment_order}
                      onChange={this.handleInputChange}
                      required={true}
                    >
                      <option value='either' disabled={true}>
                        Select the Microtask Assignment Order
                      </option>
                      <option value='sequential'>Assign microtasks in sequence</option>
                      <option value='random'>Assign microtasks randomly</option>
                    </select>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/** Submit-cancel button */}
          {this.props.request.status === 'IN_FLIGHT' ? (
            <ProgressBar />
          ) : (
            <SubmitOrCancel submitString='Submit Task' cancelAction='link' cancelLink='/task' />
          )}
        </div>
      );
    }

    return (
      <div className='white z-depth-1 lpad20'>
        {createErrorElement}
        <form onSubmit={this.handleSubmit}>
          <div className='section'>
            <h5 className='red-text'>Scenario and Language Information</h5>
            <div className='row'>
              <div className='col s4'>{scenarioDropDown}</div>
              <div className='col s4 offset-s1'>{languageDropDown}</div>
            </div>
          </div>
          {taskForm}
        </form>
      </div>
    );
  }
}

export default connector(CreateTask);
