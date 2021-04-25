// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display the list of tasks for the current work provider.
 */

// React stuff
import * as React from 'react';
import { Link } from 'react-router-dom';

// Store types and actions
import { TaskRecord } from '@karya/common';
import { taskStatus } from './TaskUtils';
import { scenarioMap, ScenarioName } from '@karya/common';
import { languageMap, LanguageCode } from '@karya/common';
// HoCs
import { DataProps, withData } from '../hoc/WithData';

import { ErrorMessageWithRetry, ProgressBar } from '../templates/Status';

// HTML helpers
import { TableColumnType, TableList } from '../templates/TableList';

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
      return scenario === undefined ? 'loading' : scenario.name;
    };

    // langauge tag function
    const languageTag = (task: TaskRecord) => {
      const language = languageMap[task.language_code as LanguageCode];
      return `${language.name} (${language.primary_name})`;
    };

    // task details link
    const taskDetailsLink = (task: TaskRecord) => (
      <Link to={`/task/${task.id}`}>
        <i className='material-icons'>list</i>
      </Link>
    );

    // List of columns in the table
    const tableColumns: Array<TableColumnType<TaskRecord>> = [
      { header: 'Name', type: 'field', field: 'name' },
      { header: 'Description', type: 'field', field: 'description' },
      { header: 'Scenario', type: 'function', function: scenarioTag },
      { header: 'Language', type: 'function', function: languageTag },
      { header: 'Status', type: 'function', function: taskStatus },
      { header: 'Details', type: 'function', function: taskDetailsLink },
    ];

    // create task button
    const createTaskButton = (
      <div className='row'>
        <Link to='/task/create'>
          <button className='btn'>
            Create Task
            <i className='material-icons right'>add</i>
          </button>
        </Link>
      </div>
    );

    return (
      <div>
        {this.props.task.status === 'IN_FLIGHT' ? (
          <ProgressBar />
        ) : this.props.task.status === 'FAILURE' ? (
          { getErrorElement }
        ) : (
          <TableList<TaskRecord>
            columns={tableColumns}
            rows={tasks}
            emptyMessage='You have currently created no tasks'
          />
        )}
        {createTaskButton}
      </div>
    );
  }
}

export default dataConnector(TaskList);
