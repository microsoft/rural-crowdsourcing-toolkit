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

// Types and actions
import { ParameterDefinition } from '../../db/ParameterTypes';

// Utils
import { approveStatuses, editStatuses, taskStatus, validateStatuses } from './TaskUtils';

// HoCs
import { AuthProps, withAuth } from '../hoc/WithAuth';
import { DataProps, withData } from '../hoc/WithData';

// HTML helpers
import { BackendRequestInitAction } from '../../store/apis/APIs.auto';
import { ErrorMessage, ProgressBar } from '../templates/Status';

import moment from 'moment';

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
    task: data.find((t) => t.id.toString() === task_id),
  };
};

// Map dispatch to props
const mapDispatchToProps = (dispatch: any, ownProps: OwnProps) => {
  const id = Number.parseInt(ownProps.match.params.id, 10);
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
const dataConnector = withData('language', 'scenario');
const connector = compose(withAuth, dataConnector, reduxConnector);

// Task detail props
type TaskDetailProps = OwnProps & AuthProps & DataProps<typeof dataConnector> & ConnectedProps<typeof reduxConnector>;

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

    const scenario = this.props.scenario.data.find((s) => s.id === task.scenario_id);
    const language = this.props.language.data.find((s) => s.id === task.language_id);

    const scenario_name = scenario ? scenario.full_name : '<Loading scenarios>';
    const language_name = language ? `${language.name} (${language.primary_language_name})` : '<Loading languages>';

    const { params: param_defs } = scenario
      ? (scenario.task_params as { params: ParameterDefinition[] })
      : { params: undefined };
    const param_values = task.params as {
      [id: string]: string | string[] | number | undefined | Array<[string, string, string | null]>;
    };

    const disableEdit = !editStatuses.includes(task.status);
    const disableValidate = !validateStatuses.includes(task.status);
    const disableApprove = !(this.props.cwp.admin && approveStatuses.includes(task.status));

    const task_actions = task.actions as { uploads: string[] };
    const task_errors = task.errors as { messages: string[] };

    const uploads = task_actions.uploads || [];
    const task_messages = task_errors.messages || [];

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
                {`${task.name} (${task.primary_language_name})`}
                <i className='material-icons right' onClick={this.props.getTask}>
                  refresh
                </i>
              </h5>
              <p>{task.description}</p>
              <p>{task.primary_language_description}</p>
            </div>
          </div>
        </div>

        {uploads.length === 0 ? null : (
          <div className='section'>
            <div className='row'>
              <div className='col'>
                <h6 className='red-text'>Actions to be completed</h6>
              </div>
            </div>
            {uploads.map((upload, index) => (
              <div className='row' key={index} style={{ marginBottom: '0px' }}>
                <div className='col'>{upload}</div>
              </div>
            ))}
          </div>
        )}

        {task_messages.length === 0 ? null : (
          <div className='section'>
            <div className='row'>
              <div className='col'>
                <h6 className='red-text'>Task errors</h6>
              </div>
            </div>
            {task_messages.map((err, index) => (
              <div className='row' key={index} style={{ marginBottom: '0px' }}>
                <div className='col'>{err}</div>
              </div>
            ))}
          </div>
        )}

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
              <h6 className='red-text'>Task Parameters</h6>
            </div>
          </div>
          {param_defs === undefined ? (
            <div className='row'>
              <div className='col'>Loading parameters ... </div>
            </div>
          ) : (
            param_defs.map((param) => (
              <div className='row' key={param.identifier} style={{ marginBottom: '0px' }}>
                <div className='col'>{param.name}: </div>
                <div className='col'>{param_values[param.identifier]}</div>
              </div>
            ))
          )}
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
              <span className='red-text'>Estimated Budget: </span>
              <span>{task.budget !== null ? task.budget : 'Not estimated yet'}</span>
            </div>
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
