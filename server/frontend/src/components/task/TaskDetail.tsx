// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to list details of a task and allow actions
 */

// React stuff
import * as React from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { compose } from 'redux';
import { RootState } from '../../store/Index';

import { scenarioMap, ScenarioName } from '@karya/core';

// Utils
import { approveStatuses, editStatuses, taskStatus, validateStatuses } from './TaskUtils';

// HoCs
import { AuthProps, withAuth } from '../hoc/WithAuth';

// HTML helpers
import { BackendRequestInitAction } from '../../store/apis/APIs.auto';
import { ErrorMessage, ProgressBar } from '../templates/Status';

import moment from 'moment';
import { LanguageCode, languageMap } from '@karya/core';

/** Props */

// Router props
type RouteParams = { id: string };
type RouterProps = RouteComponentProps<RouteParams>;

// Own props
type OwnProps = RouterProps;

// Map state to props
const mapStateToProps = (state: RootState, ownProps: OwnProps) => {
  const task_id = ownProps.match.params.id;
  const { data, ...request } = state.all.task;
  return {
    request,
    task: data.find((t) => t.id === task_id),
  };
};

// Map dispatch to props
const mapDispatchToProps = (dispatch: any, ownProps: OwnProps) => {
  const id = ownProps.match.params.id;
  return {
    getTask: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task',
        label: 'GET_BY_ID',
        id,
      };
      dispatch(action);
    },
    validateTask: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task',
        label: 'VALIDATE',
        request: {},
        id,
      };
      dispatch(action);
    },
    approveTask: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task',
        label: 'APPROVE',
        request: {},
        id,
      };
      dispatch(action);
    },
  };
};

// Create the connector
const reduxConnector = connect(mapStateToProps, mapDispatchToProps);
const connector = compose(withAuth, reduxConnector);

// Task detail props
type TaskDetailProps = OwnProps & AuthProps & ConnectedProps<typeof reduxConnector>;

class TaskDetail extends React.Component<TaskDetailProps> {
  /** Validate task */
  validateTask = () => {
    this.props.validateTask();
  };

  /** Approve task */
  approveTask = () => {
    this.props.approveTask();
  };

  componentDidMount() {
    if (this.props.task === undefined) {
      this.props.getTask();
    }
  }

  render() {
    const { task } = this.props;

    // If request in flight, show progress bar
    if (this.props.request.status === 'IN_FLIGHT') {
      return (
        <div className='row white z-depth-1'>
          <ProgressBar />
        </div>
      );
    }

    // If the operation has failed, return failure bar
    if (task === undefined) {
      return (
        <div className='row white z-depth-1'>
          <ErrorMessage message={['Unable to fetch requested task']} />
        </div>
      );
    }

    const errorElement =
      this.props.request.status === 'FAILURE' ? <ErrorMessage message={this.props.request.messages} /> : null;

    const scenario = scenarioMap[task.scenario_name as ScenarioName];
    const language = languageMap[task.language_code as LanguageCode];

    const scenario_name = scenario ? scenario.full_name : '<Loading scenarios>';
    const language_name = language ? `${language.name} (${language.primary_name})` : '<Loading languages>';

    const param_values = task.params as {
      [id: string]: string | string[] | number | undefined | Array<[string, string, string | null]>;
    };

    const disableEdit = !editStatuses.includes(task.status);
    const disableValidate = !validateStatuses.includes(task.status);
    const disableApprove = !(this.props.cwp.role === 'admin' && approveStatuses.includes(task.status));

    const outputFiles = param_values.outputFiles
      ? (param_values.outputFiles as Array<[string, string, string | null]>)
      : null;

    return (
      <div className='white z-depth-1 lpad20'>
        {errorElement !== null ? (
          <div className='section'>
            <div className='row'>{errorElement}</div>
          </div>
        ) : null}

        <div className='section'>
          <div className='row' style={{ marginBottom: '0px' }}>
            <div className='col m6'>
              <h5>
                {`${task.name} (${task.display_name})`}
                <i className='material-icons right' onClick={this.props.getTask}>
                  refresh
                </i>
              </h5>
              <p>{task.description}</p>
            </div>
          </div>
        </div>

        <div className='section'>
          <div className='row' style={{ marginBottom: '0px' }}>
            <div className='col s4'>
              <h6>
                Scenario: <span>{scenario_name}</span>
              </h6>
            </div>
          </div>
          <div className='row' style={{ marginBottom: '0px' }}>
            <div className='col s4'>
              <h6>
                Language: <span>{language_name}</span>
              </h6>
            </div>
          </div>
        </div>

        <div className='section'>
          <div className='row'>
            <div className='col'>
              <h6 className='red-text'>Assignment Parameters</h6>
            </div>
          </div>
          <div className='row' style={{ marginBottom: '0px' }}>
            <div className='col'>Assignment Granularity: </div>
            <div className='col'>{task.assignment_granularity}</div>
          </div>
          {task.assignment_granularity === 'group' ? (
            <div className='row' style={{ marginBottom: '0px' }}>
              <div className='col'>Group Assignment Order: </div>
              <div className='col'>{task.group_assignment_order}</div>
            </div>
          ) : null}
          <div className='row' style={{ marginBottom: '0px' }}>
            <div className='col'>Microtask Assignment Order: </div>
            <div className='col'>{task.microtask_assignment_order}</div>
          </div>
        </div>

        <div className='section'>
          <div className='row' style={{ marginBottom: '0px' }}>
            <div className='col'>
              <span className='red-text'>Task Status: </span>
              <span>{taskStatus(task)}</span>
            </div>
          </div>
        </div>

        {disableEdit && disableValidate && disableApprove ? null : (
          <div className='section'>
            <div className='row'>
              {disableEdit ? null : (
                <div className='col s2 center-align'>
                  <button className='btn-small' disabled={disableEdit}>
                    Edit Task
                  </button>
                </div>
              )}
              {disableValidate ? null : (
                <div className='col s2 center-align'>
                  <button className='btn-small' disabled={disableValidate} onClick={this.validateTask}>
                    Validate Task
                  </button>
                </div>
              )}
              {disableApprove ? null : (
                <div className='col s2 center-align'>
                  <button className='btn-small' disabled={disableApprove} onClick={this.approveTask}>
                    Approve Task
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {task.status === 'approved' || task.status === 'completed' ? (
          <div>
            {!outputFiles ? null : (
              <div className='section'>
                <div className='row'>
                  <div className='col'>
                    <h6 className='red-text'>Output Files</h6>
                  </div>
                </div>
                {outputFiles.map(([timestamp, status, url], index) =>
                  !url ? null : (
                    <div className='row' key={index}>
                      <div className='col'>
                        <a href={url}>{moment(timestamp).format('LLL')}</a>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}

            <div className='section pad10'>
              <Link to={`/task/${task.id}/microtasks`}>Show all microtasks</Link>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}

export default connector(TaskDetail);
