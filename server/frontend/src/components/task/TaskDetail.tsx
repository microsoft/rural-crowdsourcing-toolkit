// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to list details of a task and allow actions
 */

// React stuff
import React, { ChangeEventHandler, FormEventHandler } from 'react';
import { RouteComponentProps, Link } from 'react-router-dom';

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { compose } from 'redux';
import { RootState } from '../../store/Index';

// Store types and actions
import {
  scenarioMap,
  ScenarioName,
  baseChainMap,
  ChainName,
  languageString,
  TaskRecordType,
  TaskOpRecord,
  TaskLink,
  MicrotaskRecordType,
  WorkerRecord,
} from '@karya/core';

// Utils
import { taskStatus } from './TaskUtils';

// HoCs
import { AuthProps, withAuth } from '../hoc/WithAuth';
import { DataProps, withData } from '../hoc/WithData';

import { BackendRequestInitAction } from '../../store/apis/APIs';
import { ErrorMessage, ProgressBar } from '../templates/Status';

import CreateTaskAssignment from '../task_assignment/CreateTaskAssignment';

// Recharts library
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// For CSV file download
import { CSVLink } from 'react-csv';

// CSS
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
  const graph_data = state.all.microtask.data;
  const task_links = state.all.task_link.data;
  const workers_data = state.all.worker.data;
  return {
    auth: state.all.auth,
    request,
    tasks: data,
    task: data.find((t) => t.id === task_id),
    file_records,
    graph_data,
    task_links,
    workers_data,
  };
};

// Map dispatch to props
const mapDispatchToProps = (dispatch: any, ownProps: OwnProps) => {
  const task_id = ownProps.match.params.id;
  return {
    // For getting all the tasks including the current one
    getTask: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task',
        label: 'GET_ALL',
        params: {},
      };
      dispatch(action);
    },

    // For submitting input files
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

    // For getting both input and output files
    getFiles: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task_op',
        label: 'GET_ALL',
        task_id,
      };
      dispatch(action);
    },

    // For generating new output files
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

    // For displaying data in graph and table
    getMicrotasksSummary: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'microtask',
        label: 'GET_ALL',
        task_id,
      };
      dispatch(action);
    },

    // To create new task link
    createTaskLink: (tl: TaskLink) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task_link',
        label: 'CREATE',
        request: tl,
        task_id,
      };
      dispatch(action);
    },

    // To get all task links
    getTaskLinks: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task_link',
        label: 'GET_ALL',
        task_id,
      };
      dispatch(action);
    },

    // For displaying workers graph
    getWorkersTaskSummary: (force_refresh: boolean) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'worker',
        label: 'GET_ALL',
        task_id,
        force_refresh,
      };
      dispatch(action);
    },

    // mark task as completed
    markComplete: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task',
        label: 'MARK_COMPLETE',
        task_id,
        request: {},
      };
      dispatch(action);
    },
  };
};

// Create the connector
const reduxConnector = connect(mapStateToProps, mapDispatchToProps);
const dataConnector = withData('task_assignment', 'box');
const connector = compose(withAuth, reduxConnector, dataConnector);

// Task detail props
type TaskDetailProps = OwnProps & AuthProps & ConnectedProps<typeof reduxConnector> & DataProps<typeof dataConnector>;

// component state
type TaskDetailState = {
  files: { [id: string]: File };
  show_input_form: boolean;
  show_link_form: boolean;
  show_assignment_form: boolean;
  taskLink: TaskLink;
  taskLinkError: string;
};

class TaskDetail extends React.Component<TaskDetailProps, TaskDetailState> {
  // Initial state
  state = {
    files: {},
    show_input_form: false,
    show_link_form: false,
    show_assignment_form: false,
    taskLink: { chain: undefined, to_task: undefined, blocking: false },
    taskLinkError: '',
  };

  // Submit input files and close the form on successful submission only
  submitInputFiles: FormEventHandler = (e) => {
    e.preventDefault();
    this.props.submitInputFiles(this.state.files);
    this.setState({ show_input_form: false });
  };

  // Get all the data to display. Also initialize materialize fields
  componentDidMount() {
    this.props.getFiles();
    this.props.getMicrotasksSummary();
    this.props.getTaskLinks();
    this.props.getWorkersTaskSummary(false);
    if (this.props.task === undefined) {
      this.props.getTask();
    }
    M.AutoInit();
  }

  // On update, update materialize fields
  componentDidUpdate() {
    M.AutoInit();
  }

  // Handle file change
  handleParamFileChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.currentTarget.files) {
      const file = e.currentTarget.files[0];
      const files = { ...this.state.files, [e.currentTarget.id]: file };
      this.setState({ files });
    }
  };

  // Handle select input change
  handleSelectInputChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const taskLink: TaskLink = { ...this.state.taskLink, [e.currentTarget.id]: e.currentTarget.value };
    this.setState({ taskLink });
  };

  // Handle boolean input change
  handleBooleanChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const taskLink: TaskLink = { ...this.state.taskLink, [e.currentTarget.id]: e.currentTarget.checked };
    this.setState({ taskLink });
  };

  // Handle task link submission
  handleLinkSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    const taskLink: TaskLink = { ...this.state.taskLink };
    taskLink.from_task = this.props.task?.id;
    taskLink.grouping = 'EITHER';
    if (!taskLink.chain || !taskLink.to_task) {
      this.setState({ taskLinkError: 'Please select the required values' });
      return;
    }
    this.props.createTaskLink(taskLink);
    this.setState({ show_link_form: false });
  };

  refreshWorkersTaskSummary = () => {
    this.props.getWorkersTaskSummary(true);
  };

  render() {
    const { auth } = this.props;

    // Getting all the data from props
    const { task } = this.props;
    type fileExtras = { url: string };
    const file_records = this.props.file_records as (TaskOpRecord & { extras: fileExtras })[];
    const { tasks } = this.props;
    const { task_links } = this.props;
    const task_assignments_all = this.props.task_assignment.data;
    const boxes = this.props.box.data;

    type Extras = { assigned: number; completed: number; verified: number; cost: number };
    const graph_data = this.props.graph_data as (MicrotaskRecordType & { extras: Extras })[];

    type workerExtras = { assigned: number; completed: number; verified: number; earned: number };
    const workers_data = this.props.workers_data as (WorkerRecord & { extras: workerExtras })[];

    // Task link form values
    const chain = this.state.taskLink.chain || '';
    const to_task = this.state.taskLink.to_task || '';
    const blocking = this.state.taskLink.blocking;
    const taskLinkError = this.state.taskLinkError;

    // If request in flight, show progress bar
    if (this.props.request.status === 'IN_FLIGHT') {
      return (
        <div className='row white'>
          <ProgressBar />
        </div>
      );
    }

    // If the operation has failed, return failure bar
    if (task === undefined) {
      return (
        <div className='row white'>
          <ErrorMessage message={['Unable to fetch requested task']} />
        </div>
      );
    }

    // Input file table and output file table
    let inputFileTable = null;
    let outputFileTable = null;
    let i = 0,
      j = 0;
    // Show input file table if there are submitted files already
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
            {/** Show only input task op data */}
            {file_records.map((r) =>
              r.op_type === 'PROCESS_INPUT' ? (
                <tr key={r.id}>
                  <td>{++i}</td>
                  <td>File{i}</td>
                  <td>{r.status}</td>
                  <td>{r.created_at.toLocaleString()}</td>
                  {r.file_id && r.extras ? (
                    <td>
                      {
                        <a href={r.extras.url} download>
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

      // Show the output table if there are file records left after the input ones
      outputFileTable = (
          <table id='output-table'>
            <thead>
              <tr>
                <th>ID</th>
                <th>Output File</th>
                <th>Status</th>
                <th>Time of Creation</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {/** Show only output task op data */}
              {file_records.map((r) =>
                r.op_type === 'GENERATE_OUTPUT' ? (
                  <tr>
                    <td>{++j}</td>
                    <td>File{j}</td>
                    <td>{r.status}</td>
                    <td>{r.created_at.toLocaleString()}</td>
                    {r.file_id ? (
                      <td>
                        {
                          <a href={r.extras.url} download>
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

    // Task link table and creation form
    let task_link_section = null;
    let k = 0;
    // Get all chains that can originate from this task given its scenario
    let chains = Object.values(baseChainMap).filter((chain) => chain.fromScenario === task.scenario_name);
    if (chains.length !== 0) {
      task_link_section = (
        <div className='section' id='task_link_section'>
          <div className='row'>
            <h2>Chains Added</h2>
          </div>
          {/** Show task link table if task links exist */}
          {task_links.length !== 0 ? (
            <table id='task-link-table'>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>To Task</th>
                  <th>Chain</th>
                  <th>Blocking</th>
                </tr>
              </thead>
              <tbody>
                {task_links.map((l) => (
                  <tr key={l.id}>
                    <td>{++k}</td>
                    {/** Get task name from id */}
                    <td>{tasks.find((t) => t.id === l.to_task)?.name}</td>
                    <td>{baseChainMap[l.chain].full_name}</td>
                    <td>{l.blocking ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {/** Task link form */}
          <div id='link-form' style={{ display: this.state.show_link_form === true ? 'block' : 'none' }}>
            <form onSubmit={this.handleLinkSubmit}>
              <p id='task-link-error'>{taskLinkError}</p>
              <div className='row'>
                <div className='col s10'>
                  <select id='chain' value={chain} onChange={this.handleSelectInputChange}>
                    <option value='' disabled={true}>
                      Select a chain
                    </option>
                    {chains.map((c) => (
                      <option value={c.name} key={c.name}>
                        {c.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/** When chain is selected show the rest of the form */}
              {this.state.taskLink.chain !== undefined ? (
                <>
                  <div className='row'>
                    <div className='col s10'>
                      <select id='to_task' value={to_task} onChange={this.handleSelectInputChange}>
                        <option value='' disabled={true}>
                          Select a task
                        </option>
                        {/** Show all tasks that belong to the required scenario as options */}
                        {tasks
                          .filter(
                            (t) => t.scenario_name === baseChainMap[this.state.taskLink.chain! as ChainName].toScenario,
                          )
                          .map((o) => (
                            <option value={o.id} key={o.id}>
                              {o.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div className='row'>
                    <div className='col s10' id='checkbox-col'>
                      <label htmlFor='blocking'>
                        <input
                          type='checkbox'
                          className='filled-in'
                          id='blocking'
                          checked={blocking}
                          onChange={this.handleBooleanChange}
                        />
                        <span>Blocking</span>
                      </label>
                    </div>
                  </div>
                </>
              ) : null}
              <div className='row' id='btn-row1'>
                <button className='btn' id='add-chain-btn'>
                  Add chain
                </button>
                <button
                  type='button'
                  className='btn cancel-btn'
                  onClick={() => this.setState({ show_link_form: false, taskLinkError: '' })}
                >
                  Cancel
                  <i className='material-icons right'>close</i>
                </button>
              </div>
            </form>
          </div>
          <button className='btn-flat' id='add-link-btn' onClick={() => this.setState({ show_link_form: true })}>
            <i className='material-icons left'>add</i>Add chain
          </button>
        </div>
      );
    }

    // Task assignment table and creation form
    let task_assignment_section = null;
    const task_assignments = task_assignments_all.filter((ta) => ta.task_id === task.id);
    task_assignment_section = (
      <div className='section' id='task_assignment_section'>
        <div className='row'>
          <h2>Assignments Created</h2>
        </div>
        {/** Show task assignment table if task assignments exist */}
        {task_assignments.length !== 0 ? (
          <table id='task-assignment-table'>
            <thead>
              <tr>
                <th>Box</th>
                <th>Policy</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {task_assignments.map((ta) => (
                <tr key={ta.id}>
                  <td>{boxes.find((b) => b.id === ta.box_id)?.name}</td>
                  <td>{ta.policy}</td>
                  <td>{ta.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {/* * Task assignment form */}
        <div id='assignment-form' style={{ display: this.state.show_assignment_form === true ? 'block' : 'none' }}>
          <CreateTaskAssignment
            // @ts-ignore
            task_id={task.id}
            close_form_func={() => this.setState({ show_assignment_form: false })}
          />
        </div>
        <button
          className='btn-flat'
          id='add-assignment-btn'
          onClick={() => this.setState({ show_assignment_form: true })}
        >
          <i className='material-icons left'>add</i>Create assignment
        </button>
      </div>
    );

    const errorElement =
      this.props.request.status === 'FAILURE' ? <ErrorMessage message={this.props.request.messages} /> : null;

    // Get basic task details
    const scenario = scenarioMap[task.scenario_name as ScenarioName];
    const scenario_name = scenario ? scenario.full_name : '<Loading scenarios>';
    const language = languageString(task as TaskRecordType);

    const microtasks = graph_data.length;
    const completed_assignments = graph_data.reduce((prev, current) => prev + current.extras.completed, 0);
    const verified_assignments = graph_data.reduce((prev, current) => prev + current.extras.verified, 0);
    const cost = graph_data.reduce((prev, current) => prev + current.extras.cost, 0);
    const data = graph_data.map((m) => ({ ...m.extras, id: m.id }));

    const workers_graph_data = workers_data.map((w) => ({
      id: w.id,
      access_code: w.access_code,
      phone_number: w.phone_number,
      ...w.extras,
    }));

    const jsonInputFile = scenario.task_input_file.json;
    const tarInputfile = scenario.task_input_file.tgz;

    return (
      <div className='white lpad20 main'>
        {errorElement !== null ? (
          <div className='section'>
            <div className='row'>{errorElement}</div>
          </div>
        ) : null}

        {/** Breadcrumbs for navigation shown only if person is work provider */}
        {auth.cwp !== null && auth.cwp.role === 'WORK_PROVIDER' ? (
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
        ) : null}

        <div className='row'>
          <div className='col s12'>
            <h1 id='task-title'>{`${task.name}`}</h1>
            <h2 className='subtitle'>
              Scenario: <span>{scenario_name},</span>
            </h2>
            <h2 className='subtitle'>
              Language: <span>{language}</span>
            </h2>
          </div>
        </div>

        {task.status !== 'COMPLETED' ? (
          <div className='row'>
            <div className='col offset-s1'>
              <button className='btn waves-effect waves-light' onClick={this.props.markComplete}>
                Mark Complete
              </button>
            </div>
          </div>
        ) : null}

        {/** Microtask summary data table */}
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
            <h2>Verified Assignments</h2>
            <p>{verified_assignments}</p>
          </div>
          <div className='number-col'>
            <h2>Total Cost</h2>
            <p>{cost}</p>
          </div>
        </div>

        {/** Recharts graph showing total, completed, verified assignments, and cost by microtask id */}
        {graph_data.length !== 0 && completed_assignments !== 0 ? (
          <>
            <ResponsiveContainer width='90%' height={400}>
              <LineChart data={data} margin={{ top: 60, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='id' tick={false} label='Microtask ID' />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign='top' />
                <Line type='monotone' dataKey='assigned' stroke='#8884d8' dot={false} />
                <Line type='monotone' dataKey='completed' stroke='#82ca9d' dot={false} />
                <Line type='monotone' dataKey='verified' stroke='#4dd0e1' dot={false} />
                {/* <Line type='monotone' dataKey='cost' stroke='#ea80fc' dot={false} /> */}
              </LineChart>
            </ResponsiveContainer>

            <CSVLink data={data} filename={'graph-data.csv'} className='btn' id='download-data-btn'>
              <i className='material-icons left'>download</i>Download data
            </CSVLink>
          </>
        ) : null}

        {/** Recharts graph showing total, completed, verified assignments, and earned amount by worker id */}
        {workers_graph_data.length !== 0 ? (
          <>
            <ResponsiveContainer width='90%' height={400}>
              <LineChart data={workers_graph_data} margin={{ top: 60, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='id' tick={false} label='Worker ID' />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign='top' />
                <Line type='monotone' dataKey='assigned' stroke='#8884d8' dot={false} />
                <Line type='monotone' dataKey='completed' stroke='#82ca9d' dot={false} />
                <Line type='monotone' dataKey='verified' stroke='#4dd0e1' dot={false} />
                {/* <Line type='monotone' dataKey='earned' stroke='#ea80fc' dot={false} /> */}
              </LineChart>
            </ResponsiveContainer>

            <CSVLink data={workers_graph_data} filename={'workers-data.csv'} className='btn' id='download-data-btn'>
              <i className='material-icons left'>download</i>Download data
            </CSVLink>
            <button className='btn' id='refresh-wtsummary-btn' onClick={this.refreshWorkersTaskSummary}>
              <i className='material-icons left'>refresh</i>Refresh data
            </button>
          </>
        ) : null}

        {/** Basic task info section */}
        <div className='section'>
          <div className='row'>
            <table id='task-details'>
              <tr>
                <td>Description</td>
                <td>{task.description}</td>
              </tr>
              <tr>
                <td>Display Name</td>
                <td>{task.display_name}</td>
              </tr>
              <tr>
                <td>Task Status</td>
                <td>{taskStatus(task)}</td>
              </tr>
              <tr>
                <td>Assignment Parameters</td>
                <td></td>
              </tr>
              <tr>
                <td>Assignment Granularity</td>
                <td>{task.assignment_granularity}</td>
              </tr>
              {task.assignment_granularity === 'GROUP' ? (
                <>
                  <tr>
                    <td>Group Assignment Order</td>
                    <td>{task.group_assignment_order}</td>
                  </tr>
                </>
              ) : null}
              <tr>
                <td>Microtask Assignment Order</td>
                <td>{task.microtask_assignment_order}</td>
              </tr>
            </table>
          </div>
        </div>

        {task_link_section}

        {/** Display input and output file section if task requires input files */}
        {jsonInputFile.required || tarInputfile.required ? (
          <>
            <div className='section' id='i-files'>
              <div className='row'>
                <h2>Input Files Submitted</h2>
              </div>
              {inputFileTable}
              <button className='btn-flat' id='submit-new-btn' onClick={() => this.setState({ show_input_form: true })}>
                <i className='material-icons left'>add</i>Submit New
              </button>
            </div>
            <div className='section' id='o-files'>
              <div className='row'>
                <h2>Output Files Generated</h2>
              </div>
              {outputFileTable}
              <button
                className='btn-flat'
                id='generate-btn'
                onClick={this.props.generateOutput}
              >
                <i className='material-icons left'>add</i>
                Generate New
              </button>
            </div>

            {/** Floating form for submission of input files */}
            <div id='submit-form' style={{ display: this.state.show_input_form === true ? 'block' : 'none' }}>
              <form onSubmit={this.submitInputFiles}>
                <p>Kindly upload the following files.</p>
                {jsonInputFile.required ? (
                  <div className='row'>
                    <p>
                      <i>{jsonInputFile.description}</i>
                    </p>
                    <div className='col s12 file-field input-field'>
                      <div className='btn btn-small'>
                        <i className='material-icons'>attach_file</i>
                        <input type='file' id='json' onChange={this.handleParamFileChange} required={true} />
                      </div>
                      <div className='file-path-wrapper'>
                        <label htmlFor='json-name'>Task JSON File</label>
                        <input id='json-name' type='text' disabled={true} className='file-path validate' />
                      </div>
                    </div>
                  </div>
                ) : null}
                {tarInputfile.required ? (
                  <div className='row'>
                    <p>
                      <i>{tarInputfile.description}</i>
                    </p>
                    <div className='col s12 file-field input-field'>
                      <div className='btn btn-small'>
                        <i className='material-icons'>attach_file</i>
                        <input type='file' id='tgz' onChange={this.handleParamFileChange} required={true} />
                      </div>
                      <div className='file-path-wrapper'>
                        <label htmlFor='tgz-name'>Task TGZ File</label>
                        <input id='tgz-name' type='text' disabled={true} className='file-path validate' />
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className='row' id='btn-row2'>
                  <button className='btn' id='upload-btn'>
                    Upload
                    <i className='material-icons right'>upload</i>
                  </button>
                  <button
                    type='reset'
                    className='btn cancel-btn'
                    onClick={() => this.setState({ show_input_form: false, files: {} })}
                  >
                    Cancel
                    <i className='material-icons right'>close</i>
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : null}

        {task_assignment_section}
      </div>
    );
  }
}

export default connector(TaskDetail);
