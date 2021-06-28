// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to list details of a task and allow actions
 */

// React stuff
import React, { ChangeEventHandler } from 'react';
import { RouteComponentProps, Link } from 'react-router-dom';

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
  const file_records = state.all.task_op.data;
  const graph_data = state.all.microtask_assignment.data;
  return {
    request,
    task: data.find(t => t.id === task_id),
    file_records,
    graph_data,
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
      };
      dispatch(action);
    },

    generateOutput: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task_op',
        label: 'CREATE',
        task_id,
        request: {},
      };
      dispatch(action);
    },

    getMicrotasksSummary: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'microtask_assignment',
        label: 'GET_ALL',
        task_id,
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
    this.props.getMicrotasksSummary();
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
    const { file_records } = this.props;
    const { graph_data } = this.props;

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

    let inputFileTable = null;
    let outputFileTable = null;
    let files_submitted = false;
    let i = 0,
      j = 0;
    if (file_records.length !== 0) {
      inputFileTable = (
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
            {file_records.map(r =>
              r.op_type === 'PROCESS_INPUT' ? (
                <tr>
                  <td>{++i}</td>
                  <td>File{i}</td>
                  <td>{r.status}</td>
                  <td>{r.created_at}</td>
                  {r.file_id ? (
                    <td>
                      {
                        // @ts-ignore
                        <a href={r.extras.url}>
                          <span className='material-icons left'>file_download</span>
                        </a>
                      }
                    </td>
                  ) : (
                    <td></td>
                  )}
                </tr>
              ) : null,
            )}
          </tbody>
        </table>
      );

      files_submitted = true;
      if (i !== file_records.length) {
        outputFileTable = (
          <table id='output-table'>
            <thead>
              <tr>
                <th>ID</th>
                <th>Output File</th>
                <th>Time of Creation</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {file_records.map(r =>
                r.op_type === 'GENERATE_OUTPUT' ? (
                  <tr>
                    <td>{++j}</td>
                    <td>File{j}</td>
                    <td>{r.created_at}</td>
                    {r.file_id ? (
                      <td>
                        {
                          // @ts-ignore
                          <a href={r.extras.url}>
                            <span className='material-icons left'>file_download</span>
                          </a>
                        }
                      </td>
                    ) : (
                      <td></td>
                    )}
                  </tr>
                ) : null,
              )}
            </tbody>
          </table>
        );
      }
    }

    const errorElement =
      this.props.request.status === 'FAILURE' ? <ErrorMessage message={this.props.request.messages} /> : null;

    const scenario = scenarioMap[task.scenario_name as ScenarioName];

    const scenario_name = scenario ? scenario.full_name : '<Loading scenarios>';
    const language_name = '<Remove this>';

    const microtasks = graph_data.length;
    // @ts-ignore
    const completed_assignments = graph_data.reduce((prev, current) => prev + current.extras.completed, 0);
    // @ts-ignore
    const cost = graph_data.reduce((prev, current) => prev + current.cost, 0);
    // @ts-ignore
    const data = graph_data.map(m => ({ ...m.extras, cost: m.cost, id: m.id }));

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
              <Link to='/task' className='breadcrumb'>
                Tasks
              </Link>
              <p className='breadcrumb'>{task.name}</p>
            </div>
          </div>
        </nav>

        <div id='all-content'>
          <div className='row'>
            <div className='col s12'>
              <h1 id='task-title'>{`${task.name} (${task.display_name})`}</h1>
              <h2 id='desc'>{task.description}</h2>
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

          {graph_data.length !== 0 ? (
            <ResponsiveContainer width='90%' height={400}>
              <LineChart data={data} margin={{ top: 50, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='id' tick={false} label='MICROTASK ID' />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign='top' />
                <Line type='monotone' dataKey='total' stroke='#f8bbd0' dot={false} />
                <Line type='monotone' dataKey='completed' stroke='#8884d8' dot={false} />
                <Line type='monotone' dataKey='verified' stroke='#82ca9d' dot={false} />
                <Line type='monotone' dataKey='cost' stroke='#80deea' dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : null}

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
              <div className='section' id='io-files'>
                <div className='row'>
                  <h2>Input Files Submitted</h2>
                </div>
                {inputFileTable}
                <button className='btn' id='submit-new-btn' onClick={() => this.setState({ show_form: true })}>
                  <i className='material-icons left'>add</i>
                  Submit New
                </button>
                <div className='row'>
                  <h2>Output Files Generated</h2>
                </div>
                {outputFileTable}
                <button
                  className='btn'
                  id='generate-btn'
                  onClick={this.props.generateOutput}
                  disabled={!files_submitted}
                >
                  <i className='material-icons left'>add</i>
                  Generate New
                </button>
              </div>

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
                    <div className='col s12 file-field input-field'>
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
                    <div className='col s12 file-field input-field'>
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
            </>
          ) : null}
        </div>
      </div>
    );
  }
}

export default connector(TaskDetail);
