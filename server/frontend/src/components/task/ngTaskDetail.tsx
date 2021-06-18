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

// Recharts library
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// @ts-ignore
import data from './graph.json';

import '../../css/task/ngTaskDetail.css';

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
  const records = state.all.task_op.data;
  return {
    request,
    task: data.find(t => t.id === task_id),
    records,
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

    getFiles: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task_op',
        label: 'GET_ALL',
        task_id,
        params: {},
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
  show_form: boolean;
};

class TaskDetail extends React.Component<TaskDetailProps, TaskDetailState> {
  state = {
    files: {},
    show_form: false,
  };

  submitInputFiles = () => {
    this.props.submitInputFiles(this.state.files);
    this.setState({ show_form: false });
  };

  componentDidMount() {
    this.props.getFiles();
    if (this.props.task === undefined) {
      this.props.getTask();
    }
  }

  // Handle file change
  handleParamFileChange: ChangeEventHandler<HTMLInputElement> = e => {
    if (e.currentTarget.files) {
      const file = e.currentTarget.files[0];
      const files = { ...this.state.files, [e.currentTarget.id]: file };
      this.setState({ files });
    }
  };

  render() {
    const { task } = this.props;
    const { records } = this.props;

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

    let inputFilesTable = null;
    let i = 0;
    if (records.length !== 0) {
      inputFilesTable = (
        <div className='section' id='io-files'>
          <div className='row'>
            <h2>Input Files Submitted</h2>
          </div>
          <table id='input-table'>
            <thead>
              <tr>
                <th>ID</th>
                <th>Input File</th>
                <th>Status</th>
                <th>Time of Submission</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr>
                  <td>{++i}</td>
                  <td>File{i}</td>
                  <td>{r.status}</td>
                  <td>{r.created_at}</td>
                  {r.extras ? (
                    <td>
                      {
                        // @ts-ignore
                        <a href={r.extras.url}>
                          <i className='material-icons left'>file_download</i>
                        </a>
                      }
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    const errorElement =
      this.props.request.status === 'FAILURE' ? <ErrorMessage message={this.props.request.messages} /> : null;

    const scenario = scenarioMap[task.scenario_name as ScenarioName];

    const scenario_name = scenario ? scenario.full_name : '<Loading scenarios>';
    const language_name = '<Remove this>';

    const microtasks = data.length;
    const completed_assignments = data.reduce((prev, current) => prev + current.completed, 0);
    const cost = data.reduce((prev, current) => prev + current.earned, 0);

    const jsonInputFile = scenario.task_input_file.json;
    const tarInputfile = scenario.task_input_file.tgz;

    return (
      <div className='white z-depth-1 lpad20' id='main'>
        {errorElement !== null ? (
          <div className='section'>
            <div className='row'>{errorElement}</div>
          </div>
        ) : null}
        <nav id='breadcrumbs-nav'>
          <div className='nav-wrapper' id='nav-wrapper'>
            <div className='col s12'>
              <a href='#!' className='breadcrumb'>
                Tasks
              </a>
              <p className='breadcrumb'>{task.name}</p>
            </div>
          </div>
        </nav>

        <div id='all-content'>
          <div className='row'>
            <div className='col s12'>
              <h1 id='task-title'>{`${task.name} (${task.display_name})`}</h1>
              <h2 id='description'>{task.description}</h2>
            </div>
          </div>

          <div className='row'>
            <div className='number-col'>
              <h2>Microtasks</h2>
              <p>{microtasks}</p>
            </div>
            <div className='number-col'>
              <h2>Completed Assignments</h2>
              <p>{completed_assignments}</p>
            </div>
            <div className='number-col'>
              <h2>Total Cost</h2>
              <p>{cost}</p>
            </div>
          </div>

          <ResponsiveContainer width='90%' height={400}>
            <LineChart data={data} margin={{ top: 50, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='id' tick={false} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type='monotone' dataKey='completed' stroke='#8884d8' dot={false} />
              <Line type='monotone' dataKey='verified' stroke='#82ca9d' dot={false} />
              <Line type='monotone' dataKey='earned' stroke='#ffb74d' dot={false} />
            </LineChart>
          </ResponsiveContainer>

          <div className='section' id='task-details'>
            <div className='row' id='task-details-row'>
              <div id='task-details-col'>
                <h2>
                  Scenario: <span>{scenario_name}</span>
                </h2>
                <h2>
                  Language: <span>{language_name}</span>
                </h2>
                <h2>
                  Task Status: <span>{taskStatus(task)}</span>
                </h2>
              </div>

              <div id='task-details-col'>
                <h2>Assignment Parameters</h2>
                <h3>
                  Assignment Granularity: <span>{task.assignment_granularity}</span>
                </h3>
                {task.assignment_granularity === 'GROUP' ? (
                  <>
                    <h3>
                      Group Assignment Order: <span>{task.group_assignment_order}</span>
                    </h3>
                  </>
                ) : null}
                <h3>
                  Microtask Assignment Order: <span>{task.microtask_assignment_order}</span>
                </h3>
              </div>
            </div>
          </div>

          {jsonInputFile.required || tarInputfile.required ? (
            <>
              {inputFilesTable}

              <div
                className='card'
                id='submit-form'
                style={{ display: this.state.show_form === true ? 'block' : 'none' }}
              >
                {jsonInputFile.required ? (
                  <div className='row'>
                    <p>Kindly upload a JSON file.</p>
                    <p>
                      <i>Description of file</i>
                    </p>
                    <div className='col s8 file-field input-field'>
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
                    <div className='col s8 file-field input-field'>
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
                <div className='row' id='btns-row'>
                  <button className='btn red lighten-1' onClick={this.submitInputFiles}>
                    Upload
                    <i className='material-icons right'>upload</i>
                  </button>
                  <button
                    className='btn grey lighten-2 black-text lmar20'
                    onClick={() => this.setState({ show_form: false })}
                  >
                    Cancel
                    <i className='material-icons right'>close</i>
                  </button>
                </div>
              </div>
              <button className='btn' id='submit-new-btn' onClick={() => this.setState({ show_form: true })}>
                <i className='material-icons left'>add</i>
                Submit New
              </button>
            </>
          ) : null}
        </div>
      </div>
    );
  }
}

export default connector(TaskDetail);
