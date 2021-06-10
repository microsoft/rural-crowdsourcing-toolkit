// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to list details of a task and allow actions
 */

// React stuff
import React, { ChangeEventHandler } from 'react';
import { RouteComponentProps } from 'react-router-dom';

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { compose } from 'redux';
import { RootState } from '../../store/Index';

import { scenarioMap, ScenarioName } from '@karya/core';

// Utils
import { taskStatus } from './TaskUtils';

// HoCs
import { AuthProps, withAuth } from '../hoc/WithAuth';

// HTML helpers
import { BackendRequestInitAction } from '../../store/apis/APIs';
import { ErrorMessage, ProgressBar } from '../templates/Status';

import { languageMap } from '@karya/core';

/** Props */

// Router props
type RouteParams = { id: string };
type RouterProps = RouteComponentProps<RouteParams>;

// Own props
type OwnProps = RouterProps;

// Map state to props
const mapStateToProps = (state: RootState, ownProps: OwnProps) => {
  const task_id = ownProps.match.params.id;
  const { data, ...request } = state.all.task;
  return {
    request,
    task: data.find((t) => t.id === task_id),
  };
};

// Map dispatch to props
const mapDispatchToProps = (dispatch: any, ownProps: OwnProps) => {
  const task_id = ownProps.match.params.id;
  return {
    getTask: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task',
        label: 'GET_ALL',
        params: {},
      };
      dispatch(action);
    },

    submitInputFiles: (files: { [id: string]: File }) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task_op',
        label: 'SUBMIT_INPUT_FILE',
        task_id,
        request: {},
        files,
      };
      dispatch(action);
    },
  };
};

// Create the connector
const reduxConnector = connect(mapStateToProps, mapDispatchToProps);
const connector = compose(withAuth, reduxConnector);

// Task detail props
type TaskDetailProps = OwnProps & AuthProps & ConnectedProps<typeof reduxConnector>;

type TaskDetailState = {
  files: { [id: string]: File };
};

class TaskDetail extends React.Component<TaskDetailProps, TaskDetailState> {
  state = {
    files: {},
  };

  submitInputFiles = () => {
    this.props.submitInputFiles(this.state.files);
  };

  componentDidMount() {
    if (this.props.task === undefined) {
      this.props.getTask();
    }
  }

  // Handle file change
  handleParamFileChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.currentTarget.files) {
      const file = e.currentTarget.files[0];
      const files = { ...this.state.files, [e.currentTarget.id]: file };
      this.setState({ files });
    }
  };

  render() {
    const { task } = this.props;

    // If request in flight, show progress bar
    if (this.props.request.status === 'IN_FLIGHT') {
      return (
        <div className='row white z-depth-1'>
          <ProgressBar />
        </div>
      );
    }

    // If the operation has failed, return failure bar
    if (task === undefined) {
      return (
        <div className='row white z-depth-1'>
          <ErrorMessage message={['Unable to fetch requested task']} />
        </div>
      );
    }

    const errorElement =
      this.props.request.status === 'FAILURE' ? <ErrorMessage message={this.props.request.messages} /> : null;

    const scenario = scenarioMap[task.scenario_name as ScenarioName];
    const language = languageMap['EN'];

    const scenario_name = scenario ? scenario.full_name : '<Loading scenarios>';
    const language_name = language ? `${language.name} (${language.primary_name})` : '<Loading languages>';

    const jsonInputFile = scenario.task_input_file.json;
    const tarInputfile = scenario.task_input_file.tgz;

    return (
      <div className='white z-depth-1 lpad20 bpad20'>
        {errorElement !== null ? (
          <div className='section'>
            <div className='row'>{errorElement}</div>
          </div>
        ) : null}

        <div className='section'>
          <div className='row' style={{ marginBottom: '0px' }}>
            <div className='col m6'>
              <h5>
                {`${task.name} (${task.display_name})`}
                <i className='material-icons right' onClick={this.props.getTask}>
                  refresh
                </i>
              </h5>
              <p>{task.description}</p>
            </div>
          </div>
        </div>

        <div className='section'>
          <div className='row' style={{ marginBottom: '0px' }}>
            <div className='col s4'>
              <h6>
                Scenario: <span>{scenario_name}</span>
              </h6>
            </div>
          </div>
          <div className='row' style={{ marginBottom: '0px' }}>
            <div className='col s4'>
              <h6>
                Language: <span>{language_name}</span>
              </h6>
            </div>
          </div>
        </div>

        <div className='section'>
          <div className='row'>
            <div className='col'>
              <h6 className='red-text'>Assignment Parameters</h6>
            </div>
          </div>
          <div className='row' style={{ marginBottom: '0px' }}>
            <div className='col'>Assignment Granularity: </div>
            <div className='col'>{task.assignment_granularity}</div>
          </div>
          {task.assignment_granularity === 'GROUP' ? (
            <div className='row' style={{ marginBottom: '0px' }}>
              <div className='col'>Group Assignment Order: </div>
              <div className='col'>{task.group_assignment_order}</div>
            </div>
          ) : null}
          <div className='row' style={{ marginBottom: '0px' }}>
            <div className='col'>Microtask Assignment Order: </div>
            <div className='col'>{task.microtask_assignment_order}</div>
          </div>
        </div>

        <div className='section'>
          <div className='row' style={{ marginBottom: '0px' }}>
            <div className='col'>
              <span className='red-text'>Task Status: </span>
              <span>{taskStatus(task)}</span>
            </div>
          </div>
        </div>

        {jsonInputFile.required || tarInputfile.required ? (
          <div className='secion'>
            <div className='row'>
              <div className='col'>
                <h6 className='red-text'>Submit New Input Files</h6>
              </div>
            </div>
            {jsonInputFile.required ? (
              <div className='row'>
                <div className='col s4  file-field input-field'>
                  <div className='btn btn-small'>
                    <i className='material-icons'>attach_file</i>
                    <input type='file' id='json' onChange={this.handleParamFileChange} />
                  </div>
                  <div className='file-path-wrapper'>
                    <label htmlFor='json-name'>Task JSON File</label>
                    <input id='json-name' type='text' className='file-path validate' />
                  </div>
                </div>
              </div>
            ) : null}
            {tarInputfile.required ? (
              <div className='row'>
                <div className='col s4  file-field input-field'>
                  <div className='btn btn-small'>
                    <i className='material-icons'>attach_file</i>
                    <input type='file' id='tgz' onChange={this.handleParamFileChange} />
                  </div>
                  <div className='file-path-wrapper'>
                    <label htmlFor='tgz-name'>Task TGZ File</label>
                    <input id='tgz-name' type='text' className='file-path validate' />
                  </div>
                </div>
              </div>
            ) : null}
            <div className='row'>
              <button className='btn' onClick={this.submitInputFiles}>
                Submit Input Files
                <i className='material-icons right'>send</i>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}

export default connector(TaskDetail);
