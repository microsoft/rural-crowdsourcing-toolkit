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
import { languageString, TaskRecordType } from '@karya/core';
import { taskStatus } from './TaskUtils';
import { scenarioMap, ScenarioName } from '@karya/core';

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

// Task list component
class TaskList extends React.Component<TaskListProps> {
  componentDidMount() {
    this.props.getTasksSummary();
  }

  // Render component
  render() {
    const tasks = this.props.task.data as TaskRecordType[];
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
