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
import { languageString, TaskRecordType, scenarioMap, ScenarioName } from '@karya/core';
import { taskStatus } from './TaskUtils';

// HoCs
import { DataProps, withData } from '../hoc/WithData';

import { BackendRequestInitAction } from '../../store/apis/APIs';

import { ErrorMessageWithRetry, ProgressBar } from '../templates/Status';
import { Collapsible, CollapsibleItem } from 'react-materialize';

import '../../css/task/ngTaskList.css';

// Data connector
const dataConnector = withData('task');

// Map state to props
const mapStateToProps = (state: RootState) => {
  const tasks_summary = state.all.microtask_assignment.data;
  return { tasks_summary };
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
  };
};

// Create the connector
const reduxConnector = connect(mapStateToProps, mapDispatchToProps);
const connector = compose(dataConnector, reduxConnector);

type TaskListProps = DataProps<typeof dataConnector> & ConnectedProps<typeof reduxConnector>;

// component state
type TaskListState = {
  tags_filter: Array<string>;
  scenario_filter?: ScenarioName;
};

// Task list component
class TaskList extends React.Component<TaskListProps, TaskListState> {
  // Initial state
  state: TaskListState = {
    tags_filter: [],
  };

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
  };

  // Handle scenario change
  handleScenarioChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const scenario_filter = e.currentTarget.value as ScenarioName;
    this.setState({ scenario_filter });
  };

  // Render component
  render() {
    var tasks = this.props.task.data as TaskRecordType[];
    const tags_filter = this.state.tags_filter;
    const scenarios = Object.values(scenarioMap);
    const scenario_filter = this.state.scenario_filter;
    // Filtering tasks by tags
    tasks = tasks.filter((t) => tags_filter.every((val) => t.itags.itags.includes(val)));
    // Getting the tasks' tags as a single flat array with no duplicates
    const tags_array = tasks.map((task) => task.itags.itags);
    const arr: string[] = [];
    const tags_duplicates = arr.concat(...tags_array);
    const tags = Array.from(new Set([...tags_duplicates]));
    // Filtering tasks by scenario
    if (scenario_filter !== undefined) {
      tasks = tasks.filter((t) => t.scenario_name === scenario_filter);
    }
    // Getting summary info of tasks from props
    const tasks_summary = this.props.tasks_summary;

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
      <Link to='/task/create'>
        <button id='create-task-btn' className='btn waves-effect waves-light'>
          Create Task <i className='material-icons left'>add</i>
        </button>
      </Link>
    );

    const header = (task: TaskRecordType) => {
      return (
        <>
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
              <span>
                {task_data(task) !== undefined
                  ? // @ts-ignore
                    task_data(task).extras.completed
                  : 0}
              </span>
            </p>
          </div>
          <div className='body-col'>
            <p>
              Verified Assignments:
              <span>
                {task_data(task) !== undefined
                  ? // @ts-ignore
                    task_data(task).extras.verified
                  : 0}
              </span>
            </p>
          </div>
          <div className='body-col'>
            <p>
              Total Cost:
              <span>
                {task_data(task) !== undefined
                  ? // @ts-ignore
                    task_data(task).extras.cost
                  : 0}
              </span>
            </p>
          </div>
        </div>
      );
    };

    return (
      <div className='row' id='main-row'>
        <div className='col s12'>
          {this.props.task.status === 'IN_FLIGHT' ? (
            <ProgressBar />
          ) : this.props.task.status === 'FAILURE' ? (
            { getErrorElement }
          ) : (
            <>
              <h1 id='page-title'>Tasks{createTaskButton}</h1>
              <div className='row' id='filter_row'>
                <div className='col s10 m8 l5'>
                  <select multiple={true} id='tags_filter' value={tags_filter} onChange={this.handleTagsChange}>
                    <option value='' disabled={true}>
                      Filter tasks by tags
                    </option>
                    {tags.map((t) => (
                      <option value={t} key={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='col s10 m8 l5'>
                  <select id='scenario_filter' value={scenario_filter} onChange={this.handleScenarioChange}>
                    <option value='' disabled={true}>
                      Filter tasks by scenario
                    </option>
                    {scenarios.map((s) => (
                      <option value={s.name} key={s.name}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Collapsible accordion={false}>
                {tasks.map((t) => (
                  <CollapsibleItem
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
