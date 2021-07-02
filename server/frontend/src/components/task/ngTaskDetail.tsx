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

import { scenarioMap, ScenarioName, baseChainMap, ChainName, languageMap, LanguageCode, TaskLink } from '@karya/core';

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
  const task_links = state.all.task_link.data;
  return {
    request,
    tasks: data,
    task: data.find(t => t.id === task_id),
    file_records,
    graph_data,
    task_links,
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

    getTaskLinks: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task_link',
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
  taskLink: TaskLink;
};

class TaskDetail extends React.Component<TaskDetailProps, TaskDetailState> {
  state = {
    files: {},
    show_form: false,
    taskLink: { chain: undefined, to_task: undefined, blocking: false },
  };

  submitInputFiles = () => {
    this.props.submitInputFiles(this.state.files);
    this.setState({ show_form: false });
  };

  componentDidMount() {
    this.props.getFiles();
    this.props.getMicrotasksSummary();
    this.props.getTaskLinks();
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
  handleParamFileChange: ChangeEventHandler<HTMLInputElement> = e => {
    if (e.currentTarget.files) {
      const file = e.currentTarget.files[0];
      const files = { ...this.state.files, [e.currentTarget.id]: file };
      this.setState({ files });
    }
  };

  // Handle select input change
  handleSelectInputChange: ChangeEventHandler<HTMLSelectElement> = e => {
    const taskLink: TaskLink = { ...this.state.taskLink, [e.currentTarget.id]: e.currentTarget.value };
    this.setState({ taskLink });
  };

  handleBooleanChange: ChangeEventHandler<HTMLInputElement> = e => {
    const taskLink: TaskLink = { ...this.state.taskLink, [e.currentTarget.id]: e.currentTarget.checked };
    this.setState({ taskLink });
  };

  handleLinkSubmit: FormEventHandler = e => {
    e.preventDefault();
    const taskLink: TaskLink = { ...this.state.taskLink };
    taskLink.from_task = this.props.task?.id;
    taskLink.grouping = 'EITHER';
    this.props.createTaskLink(taskLink);
  };

  render() {
    const { task } = this.props;
    const { file_records } = this.props;
    const { graph_data } = this.props;
    const { tasks } = this.props;
    const { task_links } = this.props;

    const chain = this.state.taskLink.chain || 0;
    const to_task = this.state.taskLink.to_task || 0;
    const blocking = this.state.taskLink.blocking;

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
                  {r.file_id && r.extras ? (
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
                <th>Status</th>
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
      }
    }

    let task_link_section = null;
    let k = 0;
    let isDisabled = true;
    let chains = Object.values(baseChainMap).filter(chain => chain.fromScenario === task.scenario_name);
    if (chains.length !== 0) {
      task_link_section = (
        <form onSubmit={this.handleLinkSubmit}>
          <div className='section' id='task_link_section'>
            <div className='row'>
              <h2>Chains Added</h2>
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
                    {task_links.map(l => (
                      <tr>
                        <td>{++k}</td>
                        <td>{tasks.find(t => t.id === l.to_task)?.name}</td>
                        <td>{l.chain}</td>
                        <td>{l.blocking ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}

              <div className='col s10 m8 l6'>
                <select id='chain' value={chain} onChange={this.handleSelectInputChange}>
                  <option value={0} disabled={true} selected={true}>
                    Select a chain
                  </option>
                  {chains.map(c => (
                    <option value={c.name} key={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {this.state.taskLink.chain !== undefined ? (
              <>
                {(isDisabled = false)}
                <div className='row'>
                  <div className='col s10 m8 l6'>
                    <select id='to_task' value={to_task} required={true} onChange={this.handleSelectInputChange}>
                      <option value={0} disabled={true} selected={true}>
                        Select a task
                      </option>
                      {tasks
                        .filter(
                          // @ts-ignore
                          t => t.scenario_name === baseChainMap[this.state.taskLink.chain as ChainName].toScenario,
                        )
                        .map(o => (
                          <option value={o.id} key={o.id}>
                            {o.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className='row'>
                  <div className='col s10 m8 l6' id='checkbox-col'>
                    <label htmlFor='blocking'>
                      <input type='checkbox' id='blocking' checked={blocking} onChange={this.handleBooleanChange} />
                      <span>Blocking</span>
                    </label>
                  </div>
                </div>
              </>
            ) : null}
            <button className='btn-flat' id='add-link-btn' disabled={isDisabled}>
              <i className='material-icons left'>add</i>Add chain
            </button>
          </div>
        </form>
      );
    }

    const errorElement =
      this.props.request.status === 'FAILURE' ? <ErrorMessage message={this.props.request.messages} /> : null;

    const scenario = scenarioMap[task.scenario_name as ScenarioName];

    const scenario_name = scenario ? scenario.full_name : '<Loading scenarios>';
    const language = languageMap[task.params.language as LanguageCode].primary_name;

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
              <h1 id='task-title'>{`${task.name}`}</h1>
              <h2 className='subtitle'>
                Scenario: <span>{scenario_name},</span>
              </h2>
              <h2 className='subtitle'>
                Language: <span>{language}</span>
              </h2>
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

          {graph_data.length !== 0 && completed_assignments !== 0 ? (
            <ResponsiveContainer width='90%' height={400}>
              <LineChart data={data} margin={{ top: 60, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='id' tick={false} label='Microtask ID' />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign='top' />
                <Line type='monotone' dataKey='total' stroke='#8884d8' dot={false} />
                <Line type='monotone' dataKey='completed' stroke='#82ca9d' dot={false} />
                <Line type='monotone' dataKey='verified' stroke='#4dd0e1' dot={false} />
                <Line type='monotone' dataKey='cost' stroke='#ea80fc' dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : null}

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

          {jsonInputFile.required || tarInputfile.required ? (
            <>
              <div className='section' id='io-files'>
                <div className='row'>
                  <h2>Input Files Submitted</h2>
                </div>
                {inputFileTable}
                <button className='btn-flat' id='submit-new-btn' onClick={() => this.setState({ show_form: true })}>
                  <i className='material-icons left'>add</i>Submit New
                </button>
                <div className='row'>
                  <h2>Output Files Generated</h2>
                </div>
                {outputFileTable}
                <button
                  className='btn-flat'
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
