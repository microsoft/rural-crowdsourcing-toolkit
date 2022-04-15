// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display the required workers' data
 */

// React stuff
import * as React from 'react';

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { compose } from 'redux';
import { RootState } from '../../store/Index';

// Store types and actions
import { LanguageCode, languageMap, TaskRecord, WorkerRecord } from '@karya/core';

import { BackendRequestInitAction } from '../../store/apis/APIs';

// HTML Helpers
import { ColTextInput } from '../templates/FormInputs';
import { ErrorMessageWithRetry, ProgressBar } from '../templates/Status';

// HoCs
import { DataProps, withData } from '../hoc/WithData';
import { AuthProps, withAuth } from '../hoc/WithAuth';

// Recharts library
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// For CSV file download
import { CSVLink } from 'react-csv';

// CSS
import '../../css/worker/WorkerOverview.css';
import { TableColumnType, TableList } from '../templates/TableList';

// Pagination
import Pagination from 'react-js-pagination';

// Data connector
const dataConnector = withData('task', 'box');

// Map state to props
const mapStateToProps = (state: RootState) => {
  const workers_data = state.all.worker.data;
  const status = state.all.worker.status;
  return { workers_data, status };
};

// Map dispatch to props
const mapDispatchToProps = (dispatch: any) => {
  return {
    // For getting workers' data
    getWorkersSummary: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'worker',
        label: 'GET_ALL',
      };
      dispatch(action);
    },

    // disable worker
    disableWorker: (worker_id: string) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'worker',
        label: 'DISABLE_WORKER',
        worker_id,
        request: {},
      };
      dispatch(action);
    },

    // generate workers
    generateWorkers: (box_id: string, num_codes: number, language: LanguageCode, tags: string[]) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'worker',
        label: 'GENERATE_WORKERS',
        request: {
          box_id,
          num_codes,
          language,
          tags,
        },
      };
      dispatch(action);
    },
  };
};

// Create the connector
const reduxConnector = connect(mapStateToProps, mapDispatchToProps);
const connector = compose(withAuth, dataConnector, reduxConnector);

type WorkerOverviewProps = DataProps<typeof dataConnector> & ConnectedProps<typeof reduxConnector> & AuthProps;

// component state
type WorkerOverviewState = {
  tags_filter: Array<string>;
  box_id_filter?: string;
  task_filter?: TaskRecord;
  phone_no_input: string;
  access_code_input: string;
  sort_by?: string;
  show_reg?: string;
  graph_display: { assigned: boolean; completed: boolean; verified: boolean; earned: boolean };
  worker_table: {
    total_rows_per_page: number;
    current_page: number;
  };
  num_codes: string;
  language: LanguageCode | '';
};

// Task list component
class WorkerOverview extends React.Component<WorkerOverviewProps, WorkerOverviewState> {
  // Initial state
  state: WorkerOverviewState = {
    tags_filter: [],
    phone_no_input: '',
    access_code_input: '',
    graph_display: { assigned: true, completed: true, verified: true, earned: false },
    worker_table: {
      total_rows_per_page: 10,
      current_page: 1,
    },
    num_codes: '',
    language: '',
  };

  componentDidMount() {
    this.props.getWorkersSummary();
    M.updateTextFields();
    M.AutoInit();
  }

  componentDidUpdate() {
    M.updateTextFields();
    M.AutoInit();
  }

  // Handle tags change
  handleTagsChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const tags_filter = Array.from(e.currentTarget.selectedOptions, (o) => o.value);
    this.setState({ tags_filter });
  };

  // Handle task change
  handleTaskChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const task_id = e.currentTarget.value;
    const task_filter = this.props.task.data.find((t) => t.id === task_id) as TaskRecord;
    this.setState({ task_filter });
  };

  // Handle box id change
  handleBoxIdChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const box_id_filter = e.currentTarget.value;
    this.setState({ box_id_filter });
  };

  // Handle language change
  handleLanguageChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const language = e.currentTarget.value as LanguageCode;
    this.setState({ language });
  };

  // Handle input change
  handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    this.setState({ ...this.state, [e.currentTarget.id]: e.currentTarget.value });
  };

  // Handle change in sorting parameter
  handleSortByChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const sort_by = e.currentTarget.value;
    this.setState({ sort_by });
  };

  // Handle change in show_reg
  handleShowRegChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const show_reg = e.currentTarget.value;
    this.setState({ show_reg });
  };

  // Handle boolean input change
  handleBooleanChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const graph_display = { ...this.state.graph_display, [e.currentTarget.id]: e.currentTarget.checked };
    this.setState({ graph_display });
  };

  generateWorkers = () => {
    const box_id = this.state.box_id_filter || this.props.box.data[0].id;
    const num_codes = Number.parseInt(this.state.num_codes, 10);
    const language = this.state.language as LanguageCode;
    const task = this.state.task_filter;
    const tags = task ? this.state.tags_filter.concat(task.itags.itags) : this.state.tags_filter;
    this.props.generateWorkers(box_id, num_codes, language, tags);
  };

  // Render component
  render() {
    type Extras = { assigned: number; completed: number; verified: number; earned: number };
    var workers = this.props.workers_data as (WorkerRecord & { extras: Extras })[];
    const tasks = this.props.task.data;
    const { task_filter } = this.state;
    const tags_filter = task_filter ? this.state.tags_filter.concat(task_filter.itags.itags) : this.state.tags_filter;
    const { box_id_filter } = this.state;
    const task_id_filter = task_filter ? task_filter.id : 0;
    const { phone_no_input } = this.state;
    const { access_code_input } = this.state;
    const { sort_by } = this.state;
    const { graph_display } = this.state;
    const { show_reg } = this.state;

    // Getting all the box ids as an array with no duplicates
    const boxIds_duplicates = workers.map((w) => w.box_id);
    const boxIds = Array.from(new Set([...boxIds_duplicates]));

    // Filtering workers by tags
    workers = workers.filter((w) => tags_filter.every((val) => w.tags.tags.includes(val)));

    // Getting all the tasks' tags as a single flat array with no duplicates
    const tags_array = workers.map((w) => w.tags.tags);
    const arr: string[] = [];
    const tags_duplicates = arr.concat(...tags_array);
    const tags = Array.from(new Set([...tags_duplicates]));

    // Filtering workers by box id
    if (box_id_filter !== undefined && box_id_filter !== 'all') {
      workers = workers.filter((w) => w.box_id === box_id_filter);
    }

    // Filtering workers by phone number
    if (phone_no_input !== undefined && phone_no_input !== '') {
      workers = workers.filter((w) => w.phone_number?.startsWith(phone_no_input));
    }

    // Filtering workers by access code
    if (access_code_input !== undefined && access_code_input !== '') {
      workers = workers.filter((w) => w.access_code?.startsWith(access_code_input));
    }

    // Filtering registered or unregistered workers
    if (show_reg === 'yes') {
      workers = workers.filter((w) => w.reg_mechanism !== null);
    } else if (show_reg === 'no') {
      workers = workers.filter((w) => w.reg_mechanism === null);
    }

    // Sorting the workers
    if (sort_by !== undefined) {
      sort_by === 'completed'
        ? (workers = workers.sort((prev, next) => prev.extras.completed - next.extras.completed))
        : (workers = workers.sort((prev, next) => prev.extras.verified - next.extras.verified));
    }

    // Worker diable icon
    const disableWorker = (w: WorkerRecord) => {
      const tags = w.tags.tags;
      const disabled = tags.indexOf('_DISABLED_') >= 0;
      return disabled ? (
        <span>Disabled</span>
      ) : (
        <button>
          <span className='material-icons' onClick={() => this.props.disableWorker(w.id)}>
            delete
          </span>
        </button>
      );
    };

    // Worker Table Columns
    var workerTableColumns: Array<TableColumnType<WorkerRecord & { extras: Extras }> | null> = [
      { type: 'field', field: 'id', header: 'ID' },
      { type: 'field', field: 'access_code', header: 'Access Code' },
      // { type: 'function', header: 'Registered', function: (w) => (!!w.reg_mechanism).toString() },
      { type: 'field', field: 'phone_number', header: 'Phone Number' },
      graph_display.assigned
        ? { type: 'function', header: 'Assigned', function: (w) => w.extras.assigned.toString() }
        : null,
      graph_display.completed
        ? { type: 'function', header: 'Completed', function: (w) => w.extras.completed.toString() }
        : null,
      graph_display.verified
        ? { type: 'function', header: 'Verified', function: (w) => w.extras.verified.toString() }
        : null,
      graph_display.earned ? { type: 'function', header: 'Earned', function: (w) => w.extras.earned.toString() } : null,
      this.props.cwp.role === 'ADMIN' ? { type: 'function', header: 'Disable', function: disableWorker } : null,
    ];

    // Filtering null values out of worker table columns
    workerTableColumns = workerTableColumns.filter((col) => col !== null);

    // Data to be fed into graph
    var data = workers.map((w) => ({
      id: `I${w.id}`,
      access_code: `A${w.access_code}`,
      phone_number: `P${w.phone_number}`,
      gender: w.gender,
      yob: w.year_of_birth,
      ...w.extras,
    }));

    const exportFileTime = new Date().toISOString().replace(/:/, '-').split('.')[0];
    const exportFileName = `worker-data-${exportFileTime}.csv`;

    // Create error message element if necessary
    const getErrorElement =
      this.props.status === 'FAILURE' ? (
        <ErrorMessageWithRetry message={['Unable to fetch the data']} onRetry={this.props.getWorkersSummary} />
      ) : null;

    return (
      <div className='row main-row'>
        <div className='col s12'>
          {this.props.status === 'IN_FLIGHT' ? (
            <ProgressBar />
          ) : this.props.status === 'FAILURE' ? (
            <div>{getErrorElement}</div>
          ) : (
            <>
              <h1 className='page-title' id='workers-title'>
                Workers
              </h1>
              <div className='row' id='filter_row'>
                <div className='col s10 m8 l4'>
                  <select multiple={true} id='tags_filter' value={tags_filter} onChange={this.handleTagsChange}>
                    <option value='' disabled={true} selected={true}>
                      Filter workers by tags
                    </option>
                    {tags.map((t) => (
                      <option value={t} key={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='col s10 m8 l3'>
                  <select id='box_id_filter' value={box_id_filter} onChange={this.handleBoxIdChange}>
                    <option value='' disabled={true} selected={true}>
                      Filter workers by box ID
                    </option>
                    <option value='all'>All boxes</option>
                    {boxIds.map((i) => (
                      <option value={i} key={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='col s10 m8 l3'>
                  <select id='task_id_filter' value={task_id_filter} onChange={this.handleTaskChange}>
                    <option value={0} disabled={true}>
                      Filter workers by task
                    </option>
                    {tasks.map((t) => (
                      <option value={t.id} key={t.id}>
                        {t.name}
                      </option>
                    ))}
                    <option value={undefined}>None</option>
                  </select>
                </div>
              </div>
              {this.props.cwp.role === 'ADMIN' ? (
                <div className='row' id='gen_worker_row'>
                  <ColTextInput
                    id='num_codes'
                    value={this.state.num_codes}
                    onChange={this.handleInputChange}
                    label='Number of Workers'
                    width='s4 m2 l2'
                  />
                  <div className='col s10 m8 l3'>
                    <select id='language' value={this.state.language} onChange={this.handleLanguageChange}>
                      <option value={''} disabled={true}>
                        Choose Language
                      </option>
                      {Object.entries(languageMap).map(([code, info]) => (
                        <option value={code} key={code}>
                          {`${info.name} (${info.primary_name})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='col s10 m8 l3'>
                    <button className='btn' onClick={this.generateWorkers}>
                      Generate Workers
                    </button>
                  </div>
                </div>
              ) : null}

              <div className='row' id='text_filter_row'>
                <ColTextInput
                  id='phone_no_input'
                  value={this.state.phone_no_input}
                  onChange={this.handleInputChange}
                  label='Filter by phone number'
                  width='s10 m8 l4'
                  required={false}
                />
                <ColTextInput
                  id='access_code_input'
                  value={this.state.access_code_input}
                  onChange={this.handleInputChange}
                  label='Filter by access code'
                  width='s10 m8 l4'
                  required={false}
                />
              </div>

              <CSVLink data={data} filename={exportFileName} className='btn' id='download-btn'>
                <i className='material-icons left'>download</i>Download data
              </CSVLink>

              <div className='row' id='sort_row'>
                <p>Sort by: </p>
                <label key='completed'>
                  <input
                    type='radio'
                    className='with-gap'
                    name='sort_by'
                    value='completed'
                    onChange={this.handleSortByChange}
                  />
                  <span>Completed</span>
                </label>
                <label key='verified'>
                  <input
                    type='radio'
                    className='with-gap'
                    name='sort_by'
                    value='verified'
                    onChange={this.handleSortByChange}
                  />
                  <span>Verified</span>
                </label>
              </div>
              <div className='row' id='display_row'>
                <p>Display: </p>
                <label htmlFor='assigned'>
                  <input
                    type='checkbox'
                    className='filled-in'
                    id='assigned'
                    checked={graph_display.assigned}
                    onChange={this.handleBooleanChange}
                  />
                  <span>Assigned</span>
                </label>
                <label htmlFor='completed'>
                  <input
                    type='checkbox'
                    className='filled-in'
                    id='completed'
                    checked={graph_display.completed}
                    onChange={this.handleBooleanChange}
                  />
                  <span>Completed</span>
                </label>
                <label htmlFor='verified'>
                  <input
                    type='checkbox'
                    className='filled-in'
                    id='verified'
                    checked={graph_display.verified}
                    onChange={this.handleBooleanChange}
                  />
                  <span>Verified</span>
                </label>
                <label htmlFor='earned'>
                  <input
                    type='checkbox'
                    className='filled-in'
                    id='earned'
                    checked={graph_display.earned}
                    onChange={this.handleBooleanChange}
                  />
                  <span>Earned</span>
                </label>
              </div>
              <div className='row' id='reg_row'>
                <p>Show: </p>
                <label key='registered'>
                  <input
                    type='radio'
                    className='with-gap'
                    name='show_reg'
                    value='yes'
                    onChange={this.handleShowRegChange}
                  />
                  <span>Registered</span>
                </label>
                <label key='unregistered'>
                  <input
                    type='radio'
                    className='with-gap'
                    name='show_reg'
                    value='no'
                    onChange={this.handleShowRegChange}
                  />
                  <span>Unregistered</span>
                </label>
                <label key='all'>
                  <input
                    type='radio'
                    className='with-gap'
                    name='show_reg'
                    value='all'
                    onChange={this.handleShowRegChange}
                  />
                  <span>All</span>
                </label>
              </div>

              <div className='basic-table' id='worker-table'>
                <TableList<WorkerRecord & { extras: Extras }>
                  columns={workerTableColumns as TableColumnType<WorkerRecord & { extras: Extras }>[]}
                  rows={workers.slice(
                    (this.state.worker_table.current_page - 1) * this.state.worker_table.total_rows_per_page,
                    this.state.worker_table.current_page * this.state.worker_table.total_rows_per_page,
                  )}
                  emptyMessage='No Workers'
                />
                <Pagination
                  activePage={this.state.worker_table.current_page}
                  itemsCountPerPage={this.state.worker_table.total_rows_per_page}
                  totalItemsCount={workers.length}
                  pageRangeDisplayed={5}
                  onChange={(pageNo) =>
                    this.setState((prevState) => ({
                      worker_table: {
                        ...prevState.worker_table,
                        current_page: pageNo,
                      },
                    }))
                  }
                />
              </div>
              <ResponsiveContainer width='90%' height={400}>
                <LineChart data={data} margin={{ top: 30, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='id' tick={false} label='Worker ID' />
                  <YAxis />
                  <Tooltip />
                  <Legend verticalAlign='top' />
                  {graph_display.assigned && <Line type='monotone' dataKey='assigned' stroke='#8884d8' dot={false} />}
                  {graph_display.completed && <Line type='monotone' dataKey='completed' stroke='#82ca9d' dot={false} />}
                  {graph_display.verified && <Line type='monotone' dataKey='verified' stroke='#4dd0e1' dot={false} />}
                  {graph_display.earned && <Line type='monotone' dataKey='earned' stroke='#ea80fc' dot={false} />}
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>
    );
  }
}

export default connector(WorkerOverview);
