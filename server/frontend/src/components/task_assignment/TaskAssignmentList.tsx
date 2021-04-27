// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display the list of task assignments
 */

// React stuff
import * as React from 'react';
import { Link } from 'react-router-dom';

// Store types and actions
import { TaskAssignmentRecord } from '@karya/common';

// HTML helpers
import { ErrorMessageWithRetry, ProgressBar } from '../templates/Status';
import { TableColumnType, TableList } from '../templates/TableList';

// HoC
import { DataProps, withData } from '../hoc/WithData';

// Hoc connectors
const connector = withData('task_assignment');

type TaskAssignmentListProps = DataProps<typeof connector>;

class TaskAssignmentList extends React.Component<TaskAssignmentListProps> {
  render() {
    const task_assignments = this.props.task_assignment.data;

    // Create error message if get fails
    const getErrorElement =
      this.props.task_assignment.status === 'FAILURE' ? (
        <ErrorMessageWithRetry
          message={this.props.task_assignment.messages}
          onRetry={this.props.getData('task_assignment')}
        />
      ) : null;

    // Task assignment status
    const taskAssignmentStatus = (ta: TaskAssignmentRecord) => {
      switch (ta.status) {
        case 'assigned':
          return 'Assigned';
        case 'completed':
          return 'Completed';
      }
    };

    // List of columns to be displayed
    const tableColumns: Array<TableColumnType<TaskAssignmentRecord>> = [
      { header: 'Task', type: 'field', field: 'task_id' },
      { header: 'Box', type: 'field', field: 'box_id' },
      { header: 'Policy', type: 'field', field: 'policy' },
      { header: 'Status', type: 'function', function: taskAssignmentStatus },
    ];

    // create task assignment button
    const createTaskAssignmentButton = (
      <div className='row'>
        <Link to='/task-assignments/create'>
          <button className='btn'>
            Create Task Assignment
            <i className='material-icons right'>add</i>
          </button>
        </Link>
      </div>
    );

    return (
      <div>
        {this.props.task_assignment.status === 'IN_FLIGHT' ? (
          <ProgressBar />
        ) : this.props.task_assignment.status === 'FAILURE' ? (
          { getErrorElement }
        ) : (
          <TableList<TaskAssignmentRecord>
            columns={tableColumns}
            rows={task_assignments}
            emptyMessage='There are no task assignments'
          />
        )}
        {createTaskAssignmentButton}
      </div>
    );
  }
}

export default connector(TaskAssignmentList);
