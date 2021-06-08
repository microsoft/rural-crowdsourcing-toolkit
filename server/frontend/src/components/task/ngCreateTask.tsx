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
import { BaseScenarioInterface, scenarioMap, ScenarioName } from '@karya/core';

// HTML Helpers
import { ColTextInput, SubmitOrCancel } from '../templates/FormInputs';
import { ErrorMessage, ProgressBar } from '../templates/Status';
import { ParameterSection } from '../templates/ParameterRenderer';

// Hoc
import { BackendRequestInitAction } from '../../store/apis/APIs';

import '../../css/task/ngCreateTask.css';

// Create router props
type RouterProps = RouteComponentProps<{}>;

// Load state to props
const mapStateToProps = (state: RootState) => {
  const { data, ...request } = state.all.task;
  return {
    task: data,
    request,
  };
};

// Map dispatch to props
const mapDispatchToProps = (dispatch: any) => {
  return {
    createTask: (task: Task) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task',
        label: 'CREATE',
        request: task,
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
  params: { [id: string]: string | boolean };
  itags: string;
  scenario?: BaseScenarioInterface<any, object, any, object, any>;
};

class CreateTask extends React.Component<CreateTaskProps, CreateTaskState> {
  state: CreateTaskState = {
    task: {
      name: '',
      description: '',
      display_name: '',
    },
    itags: '',
    params: {},
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

  // Handle change in scenario
  handleScenarioChange: ChangeEventHandler<HTMLInputElement> = (e) => {
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

  // Handle input change
  handleInputChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (e) => {
    const task: Task = { ...this.state.task, [e.currentTarget.id]: e.currentTarget.value };
    this.setState({ task });
  };

  // Handle param input change
  handleTagsChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    this.setState({ itags: e.currentTarget.value });
  };

  // Handle param input change
  handleParamInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const params = { ...this.state.params, [e.currentTarget.id]: e.currentTarget.value };
    this.setState({ params });
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
    task.params = this.state.params;
    task.itags = { itags: this.state.itags.split(',') };
    task.language_code = 'EN';
    this.props.createTask(task);
  };

  render() {
    // Generate error with task creation
    const createErrorElement =
      this.props.request.status === 'FAILURE' ? <ErrorMessage message={this.props.request.messages} /> : null;

    // Scenario cards
    const scenarios = Object.values(scenarioMap);
    const { scenario } = this.state;
    const scenarioCards = (
      <div className='scenario-names'>
        {scenarios.map((s) => (
          <label>
            <input type='radio' name='scenario_id' value={s.name} onChange={this.handleScenarioChange} />
            <div className='scenario-card'>
              <span className='scenario-name'>{s.full_name}</span>
              <p className='description'>Description</p>
            </div>
          </label>
        ))}
      </div>
    );

    // task creation form
    let taskForm = null;
    if (scenario !== undefined) {
      // get parameters from the
      const params = scenario.task_input;
      const { assignment_granularity, group_assignment_order, microtask_assignment_order } = scenario;

      const { task } = this.state;
      taskForm = (
        <div id='form'>
          {/** Basic task information */}
          <div className='section'>
            <h2 className='form-heading'>Basic Task Information</h2>
            <div className='row'>
              <ColTextInput
                id='name'
                label='Task name in English'
                width='s4'
                value={task.name}
                onChange={this.handleInputChange}
                required={true}
              />
            </div>
            <div className='row'>
              <ColTextInput
                id='display_name'
                label={`Display Name (to be shown in the app)`}
                width='s4'
                value={task.display_name}
                onChange={this.handleInputChange}
                required={true}
              />
            </div>
            <div className='row'>
              <ColTextInput
                id='tags'
                label={`List of task tags (comma seperated)`}
                width='s4'
                value={this.state.itags}
                onChange={this.handleTagsChange}
                required={true}
              />
            </div>

            <div className='row'>
              <div className='col s8 input-field'>
                <label htmlFor='description'>Task Description</label>
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
            <h2 className='form-heading'>Task Parameters</h2>
            <ParameterSection
              params={params}
              data={this.state.params}
              onChange={this.handleParamInputChange}
              onBooleanChange={this.handleParamBooleanChange}
            />
          </div>

          {/** Assignment parameters */}
          {[assignment_granularity, group_assignment_order, microtask_assignment_order].includes('EITHER') ? (
            <div className='section'>
              <h2 className='form-heading'>Assignment Parameters</h2>
              {assignment_granularity === 'EITHER' ? (
                <div className='row'>
                  <div className='col s6'>
                    <select
                      id='assignment_granularity'
                      value={task.assignment_granularity}
                      onChange={this.handleInputChange}
                      required={true}
                    >
                      <option value='EITHER' disabled={true} className='dropdown-txt'>
                        Select an Assignment Granularity
                      </option>
                      <option value='GROUP'>Assign tasks in group granularity</option>
                      <option value='MICROTASK'>Assign tasks in microtask granularity</option>
                    </select>
                  </div>
                </div>
              ) : null}
              {group_assignment_order === 'EITHER' && assignment_granularity !== 'MICROTASK' ? (
                <div className='row'>
                  <div className='col s6'>
                    <select
                      id='group_assignment_order'
                      value={task.group_assignment_order}
                      onChange={this.handleInputChange}
                      required={true}
                    >
                      <option value='EITHER' disabled={true} className='dropdown-txt'>
                        Select the Group Assignment Order
                      </option>
                      <option value='SEQUENTIAL'>Assign groups in sequence</option>
                      <option value='RANDOM'>Assign groups randomly</option>
                    </select>
                  </div>
                </div>
              ) : null}
              {microtask_assignment_order === 'EITHER' ? (
                <div className='row'>
                  <div className='col s6'>
                    <select
                      id='microtask_assignment_order'
                      value={task.microtask_assignment_order}
                      onChange={this.handleInputChange}
                      required={true}
                    >
                      <option value='EITHER' disabled={true} className='dropdown-txt'>
                        Select the Microtask Assignment Order
                      </option>
                      <option value='SEQUENTIAL'>Assign microtasks in sequence</option>
                      <option value='RANDOM'>Assign microtasks randomly</option>
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
      <div className='white z-depth-1 lpad20' id='main'>
        {createErrorElement}
        <nav id='breadcrumbs-nav'>
          <div className='nav-wrapper' id='nav-wrapper'>
            <div className='col s12'>
              <a href='#!' className='breadcrumb'>
                Tasks
              </a>
              <a href='#!' className='breadcrumb'>
                Create Task
              </a>
            </div>
          </div>
        </nav>
        <form onSubmit={this.handleSubmit}>
          <div className='section'>
            <h1 id='page-title'>Create Task</h1>
            <hr />
            <p className='col s10' id='select-txt'>
              Select a Scenario
            </p>
            <div className='row'>
              <div className='col s8'>{scenarioCards}</div>
            </div>
          </div>
          {taskForm}
        </form>
      </div>
    );
  }
}

export default connector(CreateTask);
