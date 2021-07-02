// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display the list of tasks for the current work provider.
 */

// React stuff
import * as React from 'react';
import { Link } from 'react-router-dom';

// Store types and actions
import { TaskRecord } from '@karya/core';
import { taskStatus } from './TaskUtils';
import { scenarioMap, ScenarioName } from '@karya/core';
// HoCs
import { DataProps, withData } from '../hoc/WithData';

import { ErrorMessageWithRetry, ProgressBar } from '../templates/Status';

import { Collapsible, CollapsibleItem } from 'react-materialize';

import '../../css/task/ngTaskList.css';

// Data connector
const dataConnector = withData('task');
type TaskListProps = DataProps<typeof dataConnector>;

// Task list component
class TaskList extends React.Component<TaskListProps> {
  // Render component
  render() {
    const tasks = this.props.task.data;

    // Create error message element if necessary
    const getErrorElement =
      this.props.task.status === 'FAILURE' ? (
        <ErrorMessageWithRetry message={this.props.task.messages} onRetry={this.props.getData('task')} />
      ) : null;

    // scenario tag function
    const scenarioTag = (task: TaskRecord) => {
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

    const header = (task: TaskRecord) => {
      return (
        <>
          <h2 className='task-name'>{task.name}</h2>
          <span className='badge scenario'>{scenarioTag(task)}</span>
          <span className='badge status'>{taskStatus(task)}</span>
          <Link to={`/task/${task.id}`} className='details-link'>
            <span>Details</span>
            <div className='arrow-2'></div>
          </Link>
        </>
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
                {tasks.map(t => (
                  <CollapsibleItem
                    expanded={false}
                    header={header(t)}
                    icon={<i className='material-icons'>done_all</i>}
                    node='div'
                  >
                    {}
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

export default dataConnector(TaskList);
