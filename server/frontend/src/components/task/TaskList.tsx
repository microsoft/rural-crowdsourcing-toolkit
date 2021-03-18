// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display the list of tasks for the current work provider.
 */

// React stuff
import * as React from 'react';
import { Link } from 'react-router-dom';

// Store types and actions
import { TaskRecord } from '../../db/TableInterfaces.auto';
import { taskStatus } from './TaskUtils';

// HoCs
import { DataProps, withData } from '../hoc/WithData';

import { ErrorMessageWithRetry, ProgressBar } from '../templates/Status';

// HTML helpers
import { TableColumnType, TableList } from '../templates/TableList';

// Data connector
const dataConnector = withData('language', 'scenario', 'task');
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
    const scenarios = this.props.scenario.data;
    const scenarioTag = (task: TaskRecord) => {
      const scenario = scenarios.find((s) => s.id === task.scenario_id);
      return scenario === undefined ? 'loading' : scenario.name;
    };

    // langauge tag function
    const languages = this.props.language.data;
    const languageTag = (task: TaskRecord) => {
      const language = languages.find((l) => l.id === task.language_id);
      return language === undefined ? 'loading' : `${language.name} (${language.primary_language_name})`;
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
