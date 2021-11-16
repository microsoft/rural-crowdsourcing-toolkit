// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display the list of tasks for the current work provider.
 */

// React stuff
import * as React from 'react';
import { Link } from 'react-router-dom';

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { compose } from 'redux';
import { RootState } from '../../store/Index';

// Store types and actions
import {
  languageString,
  Task,
  TaskRecordType,
  MicrotaskAssignmentRecord,
  scenarioMap,
  ScenarioName,
} from '@karya/core';
import { taskStatus } from './TaskUtils';

// HoCs
import { DataProps, withData } from '../hoc/WithData';

import { BackendRequestInitAction } from '../../store/apis/APIs';

import { ErrorMessageWithRetry, ProgressBar } from '../templates/Status';
import { Collapsible, CollapsibleItem } from 'react-materialize';

import '../../css/task/ngTaskList.css';
import { UpdateTaskFilterAction } from '../../store/UIReducer';

// Data connector
const dataConnector = withData('task');

// Map state to props
const mapStateToProps = (state: RootState) => {
  const tasks_summary = state.all.microtask_assignment.data;
  const task_filter = state.ui.task_filter;
  const { ...request } = state.all.task;
  return { tasks_summary, task_filter, request };
};

// Map dispatch to props
const mapDispatchToProps = (dispatch: any) => {
  return {
    // For getting summary of tasks
    getTasksSummary: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'microtask_assignment',
        label: 'GET_ALL',
      };
      dispatch(action);
    },

    // Update task filter
    updateTaskFilter: (filter: UpdateTaskFilterAction['filter']) => {
      const action: UpdateTaskFilterAction = {
        type: 'UPDATE_TASK_FILTER',
        filter,
      };
      dispatch(action);
    },

    // Create new task
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

// Create the connector
const reduxConnector = connect(mapStateToProps, mapDispatchToProps);
const connector = compose(dataConnector, reduxConnector);

type TaskListProps = DataProps<typeof dataConnector> & ConnectedProps<typeof reduxConnector>;

// Task list component
class TaskList extends React.Component<TaskListProps, {}> {
  // Initial state
  state = { show_json_form: false, json_file: undefined, importError: '' };

  componentDidMount() {
    this.props.getTasksSummary();
    M.AutoInit();
  }

  componentDidUpdate() {
    M.AutoInit();
  }

  // Handle tags change
  handleTagsChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const tags_filter = Array.from(e.currentTarget.selectedOptions, (o) => o.value);
    this.setState({ tags_filter });
    const task_filter = { ...this.props.task_filter, tags_filter };
    this.props.updateTaskFilter(task_filter);
  };

  // Handle scenario change
  handleScenarioChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const scenario_filter = e.currentTarget.value as ScenarioName | 'all';
    this.setState({ scenario_filter });
    const task_filter = { ...this.props.task_filter, scenario_filter };
    this.props.updateTaskFilter(task_filter);
  };

  toggleShowCompleted = () => {
    const show_completed = !this.props.task_filter.show_completed;
    this.setState({ show_completed });
    const task_filter = { ...this.props.task_filter, show_completed };
    this.props.updateTaskFilter(task_filter);
  };

  clearFilters = () => {
    const scenario_filter: 'all' = 'all';
    const tags_filter: Array<string> = [];
    const show_completed = false;
    const task_filter = { scenario_filter, tags_filter, show_completed };
    this.props.updateTaskFilter(task_filter);
  };

  // Handle file change
  handleParamFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.currentTarget.files) {
      const json_file = e.currentTarget.files[0];
      this.setState({ json_file });
    }
  };

  // Create task from JSON
  submitTaskJSON: React.FormEventHandler = (e) => {
    e.preventDefault();
    // Create a reader and the handler
    const reader = new FileReader();
    reader.onload = async (re) => {
      if (!re.target || !re.target.result) {
        this.setState({ importError: 'Invalid file' });
        return;
      }
      const text = re.target.result;
      try {
        const task: Task = JSON.parse(text as string);
        this.props.createTask(task);
        this.setState({ show_json_form: false });
      } catch (e) {
        this.setState({ importError: 'Invalid JSON file' });
      }
    };
    // @ts-ignore
    reader.readAsText(this.state.json_file);
  };

  // Render component
  render() {
    let tasks = this.props.task.data as TaskRecordType[];
    const scenarios = Object.values(scenarioMap);
    const tags_filter = this.props.task_filter.tags_filter;
    const scenario_filter = this.props.task_filter.scenario_filter;
    const importError = this.state.importError;

    // Filter by completed
    if (!this.props.task_filter.show_completed) {
      tasks = tasks.filter((t) => t.status !== 'COMPLETED');
    }

    // Filtering tasks by tags
    tasks = tasks.filter((t) => tags_filter.every((val) => t.itags.itags.includes(val)));

    // Getting the tasks' tags as a single flat array with no duplicates
    const tags_array = tasks.map((task) => task.itags.itags);
    const arr: string[] = [];
    const tags_duplicates = arr.concat(...tags_array);
    const tags = Array.from(new Set([...tags_duplicates]));

    // Filtering tasks by scenario
    if (scenario_filter !== undefined && scenario_filter !== 'all') {
      tasks = tasks.filter((t) => t.scenario_name === scenario_filter);
    }

    // Getting summary info of tasks from props
    type Extras = { assigned: number; completed: number; verified: number; cost: number };
    const tasks_summary = this.props.tasks_summary as (MicrotaskAssignmentRecord & { extras: Extras })[];

    // Create error message element if necessary
    const getErrorElement =
      this.props.task.status === 'FAILURE' ? (
        <ErrorMessageWithRetry message={this.props.task.messages} onRetry={this.props.getData('task')} />
      ) : null;

    // scenario tag function
    const scenarioTag = (task: TaskRecordType) => {
      const scenario = scenarioMap[task.scenario_name as ScenarioName];
      return scenario === undefined ? 'loading' : scenario.full_name;
    };

    // create task button
    const createTaskButton = (
      <Link to='/task/create' id='create-task-link'>
        <button className='btn waves-effect waves-light'>
          Create Task <i className='material-icons left'>add</i>
        </button>
      </Link>
    );

    // create task from JSON button
    const createTaskFromJSONButton = (
      <button className='btn' id='create-task-json-btn' onClick={() => this.setState({ show_json_form: true })}>
        Import From JSON <i className='material-icons left'>add</i>
      </button>
    );

    const createTaskFromJSONForm = (
      <div id='json-form' style={{ display: this.state.show_json_form === true ? 'block' : 'none' }}>
        <form onSubmit={this.submitTaskJSON}>
          <div className='row'>
            <p>
              <i>Please submit a JSON file to create a task.</i>
            </p>
            <p id='import-error'>{importError}</p>
            <div className='col s12 file-field input-field'>
              <div className='btn btn-small'>
                <i className='material-icons'>attach_file</i>
                <input type='file' id='json' onChange={this.handleParamFileChange} required={true} />
              </div>
              <div className='file-path-wrapper'>
                <label htmlFor='json-name'>JSON File</label>
                <input id='json-name' type='text' disabled={true} className='file-path validate' />
              </div>
            </div>
          </div>
          <div className='row' id='btn-row'>
            <button className='btn' id='upload-btn'>
              Upload
              <i className='material-icons right'>upload</i>
            </button>
            <button
              type='reset'
              className='btn cancel-btn'
              onClick={() => this.setState({ show_json_form: false, importError: '', json_file: undefined })}
            >
              Cancel
              <i className='material-icons right'>close</i>
            </button>
          </div>
        </form>
      </div>
    );

    const header = (task: TaskRecordType) => {
      return (
        <>
          <span className='task-id'>{task.id}</span>
          <h2 className='task-name'>{task.name}</h2>
          <span className='badge language'>{languageString(task)}</span>
          <span className='badge scenario'>{scenarioTag(task)}</span>
          <span className='badge status'>{taskStatus(task)}</span>
          <Link to={{ pathname: `/task/edit/${task.id}`, state: task }} className='edit-task-link'>
            <span className='material-icons'>edit</span>
          </Link>
          <Link to={{ pathname: '/task/create', state: task }} className='copy-task-link'>
            <span className='material-icons'>content_copy</span>
          </Link>
          <Link to={`/task/${task.id}`} className='details-link'>
            <span>Details</span>
            <div className='arrow-2'></div>
          </Link>
        </>
      );
    };

    const task_data = (task: TaskRecordType) => tasks_summary.find((t) => t.task_id === task.id);

    const body = (task: TaskRecordType) => {
      return (
        <div className='row'>
          <div className='body-col'>
            <p>
              Completed Assignments:
              <span>{task_data(task) !== undefined ? task_data(task)!.extras.completed : 0}</span>
            </p>
          </div>
          <div className='body-col'>
            <p>
              Verified Assignments:
              <span>{task_data(task) !== undefined ? task_data(task)!.extras.verified : 0}</span>
            </p>
          </div>
          <div className='body-col'>
            <p>
              Total Cost:
              <span>{task_data(task) !== undefined ? task_data(task)!.extras.cost : 0}</span>
            </p>
          </div>
        </div>
      );
    };

    return (
      <div className='row main-row'>
        <div className='col s12'>
          {this.props.task.status === 'IN_FLIGHT' ? (
            <ProgressBar />
          ) : this.props.task.status === 'FAILURE' ? (
            { getErrorElement }
          ) : (
            <>
              <h1 className='page-title'>
                Tasks{createTaskButton}
                {createTaskFromJSONButton}
              </h1>

              {createTaskFromJSONForm}

              <div className='row valign-wrapper' id='filter_row'>
                <div className='col s10 m4 l3'>
                  <select multiple={true} id='tags_filter' value={tags_filter} onChange={this.handleTagsChange}>
                    <option value='' disabled={true} selected={true}>
                      Filter tasks by tags
                    </option>
                    {tags.map((t) => (
                      <option value={t} key={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='col s10 m4 l3'>
                  <select id='scenario_filter' value={scenario_filter} onChange={this.handleScenarioChange}>
                    <option value='' disabled={true} selected={true}>
                      Filter tasks by scenario
                    </option>
                    <option value='all'>All scenarios</option>
                    {scenarios.map((s) => (
                      <option value={s.name} key={s.name}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='col s10 m4 l3'>
                  <label>
                    <input
                      type='checkbox'
                      className='filled-in'
                      id='show_completed'
                      onChange={this.toggleShowCompleted}
                      checked={this.props.task_filter.show_completed}
                    />
                    <span>Show Completed</span>
                  </label>
                </div>
                <div className='col s10 m4 l3'>
                  <button className='btn-flat' id='clear-filters-btn' onClick={this.clearFilters}>
                    Clear Filters
                  </button>
                </div>
              </div>
              <Collapsible accordion={false} className='no-autoinit'>
                {tasks.map((t) => (
                  <CollapsibleItem
                    key={t.id}
                    expanded={false}
                    header={header(t)}
                    icon={<i className='material-icons'>done_all</i>}
                    node='div'
                  >
                    {body(t)}
                  </CollapsibleItem>
                ))}
              </Collapsible>
            </>
          )}
        </div>
      </div>
    );
  }
}

export default connector(TaskList);
