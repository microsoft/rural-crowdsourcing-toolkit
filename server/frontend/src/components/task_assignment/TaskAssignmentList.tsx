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
const connector = withData('task_assignment', 'task', 'box');

type TaskAssignmentListProps = DataProps<typeof connector>;

class TaskAssignmentList extends React.Component<TaskAssignmentListProps> {
  render() {
    const task_assignments = this.props.task_assignment.data;
    const tasks = this.props.task.data;
    const boxes = this.props.box.data;

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

    // Task name
    const taskName = (ta: TaskAssignmentRecord) => {
      const task = tasks.find((t) => t.id === ta.task_id);
      if (task !== undefined) {
        return task.name;
      } else {
        return 'Undefined';
      }
    };

    // Box name
    const boxName = (ta: TaskAssignmentRecord) => {
      const box = boxes.find((b) => b.id === ta.box_id);
      if (box !== undefined) {
        return box.name;
      } else {
        return 'Undefined';
      }
    };

    // List of columns to be displayed
    const tableColumns: Array<TableColumnType<TaskAssignmentRecord>> = [
      { header: 'Task', type: 'function', function: taskName },
      { header: 'Box', type: 'function', function: boxName },
      { header: 'Policy', type: 'field', field: 'policy' },
      { header: 'Status', type: 'function', function: taskAssignmentStatus },
    ];

    // create task assignment button
    const createTaskAssignmentButton = (
      <Link to='/task-assignments/create' id='create-assignment-link'>
        <button className='btn waves-effect waves-light'>
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
              <div className='basic-table' id='task-assignments-table'>
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
