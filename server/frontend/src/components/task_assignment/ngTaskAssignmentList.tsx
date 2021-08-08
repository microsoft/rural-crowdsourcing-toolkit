// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display the list of task assignments
 */

// React stuff
import * as React from 'react';
import { Link } from 'react-router-dom';

// Store types and actions
import { TaskAssignmentRecord } from '@karya/core';

// HTML helpers
import { ErrorMessageWithRetry, ProgressBar } from '../templates/Status';
import { TableColumnType, TableList } from '../templates/TableList';

// HoC
import { DataProps, withData } from '../hoc/WithData';

import '../../css/task_assignment/ngTaskAssignmentList.css';

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
        case 'ASSIGNED':
          return <span>Assigned</span>;
        case 'COMPLETED':
          return <span>Completed</span>;
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
      <Link to='/task-assignments/create'>
        <button id='create-assignment-btn' className='btn waves-effect waves-light'>
          Create Assignment <i className='material-icons left'>add</i>
        </button>
      </Link>
    );

    return (
      <div className='row main-row'>
        <div className='col s12'>
          {this.props.task_assignment.status === 'IN_FLIGHT' ? (
            <ProgressBar />
          ) : this.props.task_assignment.status === 'FAILURE' ? (
            { getErrorElement }
          ) : (
            <>
              <h1 className='page-title'>Task Assignments{createTaskAssignmentButton}</h1>
              <div className='basic-table' id='task-assignment-table'>
                <TableList<TaskAssignmentRecord>
                  columns={tableColumns}
                  rows={task_assignments}
                  emptyMessage='There are no task assignments'
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}

export default connector(TaskAssignmentList);
