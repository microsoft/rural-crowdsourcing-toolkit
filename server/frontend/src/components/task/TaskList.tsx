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
import { languageString, TaskRecordType, MicrotaskAssignmentRecord, scenarioMap, ScenarioName } from '@karya/core';
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
  return { tasks_summary, task_filter };
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
  };
};

// Create the connector
const reduxConnector = connect(mapStateToProps, mapDispatchToProps);
const connector = compose(dataConnector, reduxConnector);

type TaskListProps = DataProps<typeof dataConnector> & ConnectedProps<typeof reduxConnector>;

// Task list component
class TaskList extends React.Component<TaskListProps, {}> {
  // Initial state
  state = {};

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

  // Render component
  render() {
    let tasks = this.props.task.data as TaskRecordType[];
    const scenarios = Object.values(scenarioMap);
    const tags_filter = this.props.task_filter.tags_filter;
    const scenario_filter = this.props.task_filter.scenario_filter;

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

    const header = (task: TaskRecordType) => {
      return (
        <>
          <span>{task.id}</span>
          <h2 className='task-name'>{task.name}</h2>
          <span className='badge language'>{languageString(task)}</span>
          <span className='badge scenario'>{scenarioTag(task)}</span>
          <span className='badge status'>{taskStatus(task)}</span>
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
              <h1 className='page-title'>Tasks{createTaskButton}</h1>
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
                      id='show_completed'
                      onChange={this.toggleShowCompleted}
                      checked={this.props.task_filter.show_completed}
                    />
                    <span>Show Completed</span>
                  </label>
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
