// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to create a new task assignment. On success, redirect to task assignment list page
 */

// React stuff
import React, { ChangeEventHandler, FormEventHandler } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { compose } from 'redux';
import { RootState } from '../../store/Index';

// Store types and actions
import { scenarioMap, ScenarioName, TaskAssignmentRecord } from '@karya/core';
import { policyMap, policyList, PolicyName } from '@karya/core';

// HTML helpers
import { BoxRecord, TaskAssignment, TaskRecord } from '@karya/core';
import { ParameterSection } from '../templates/ParameterRenderer';
import { ErrorMessage, ProgressBar } from '../templates/Status';

// HoC
import { BackendRequestInitAction } from '../../store/apis/APIs';
import { DataProps, withData } from '../hoc/WithData';

// CSS
import '../../css/task_assignment/ngCreateTaskAssignment.css';

// Router props
type RouterProps = RouteComponentProps<{}>;

// Map state to props
const mapStateToProps = (state: RootState) => {
  const { data, ...request } = state.all.task_assignment;
  return {
    request,
  };
};

// Map dispatch to props
const mapDispatchToProps = (dispatch: any) => {
  return {
    createTaskAssignment: (ta: TaskAssignment) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task_assignment',
        label: 'CREATE',
        request: ta,
      };
      dispatch(action);
    },

    editTaskAssignment: (ta: TaskAssignmentRecord) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task_assignment',
        label: 'EDIT_TASK_ASSIGNMENT',
        request: ta,
        task_assignment_id: ta.id,
      };
      dispatch(action);
    },
  };
};

// Create the connector
const reduxConnector = connect(mapStateToProps, mapDispatchToProps);
const dataConnector = withData('box', 'task');
const connector = compose(dataConnector, reduxConnector);
// Component props
// Need filter for box.
type CreateTaskAssignmentProps = RouterProps &
  ConnectedProps<typeof reduxConnector> &
  DataProps<typeof dataConnector> & {
    task_id?: string;
    close_form_func?: () => void;
    assignment_edit?: TaskAssignmentRecord;
  };

// Component state
type CreateTaskAssignmentState = {
  params: { [id: string]: string | number | boolean | string[] };
  task?: TaskRecord;
  box?: BoxRecord;
  policy?: PolicyName;
  task_policy?: boolean;
};

class CreateTaskAssignment extends React.Component<CreateTaskAssignmentProps, CreateTaskAssignmentState> {
  state: CreateTaskAssignmentState = {
    params: {},
  };

  // on mount, get things
  componentDidMount() {
    M.AutoInit();
    M.updateTextFields();

    if (this.props.task_id !== undefined) {
      const task = this.props.task.data.find((t) => t.id === this.props.task_id) as TaskRecord;
      this.setState({ task });
    }
    if (this.props.assignment_edit !== undefined) {
      const ta = this.props.assignment_edit;
      const params = ta.params;
      const box = this.props.box.data.find((b) => b.id === ta.box_id) as BoxRecord;
      const policy = ta.policy;
      this.setState({ params: params, box: box, policy: policy });
    }
  }

  // on update
  componentDidUpdate(prevProps: CreateTaskAssignmentProps) {
    if (prevProps.request.status === 'IN_FLIGHT' && this.props.request.status === 'SUCCESS') {
      if (!this.props.close_form_func) {
        this.props.history.push('/task-assignments');
      } else {
        this.props.close_form_func();
      }
    } else {
      M.updateTextFields();
      M.AutoInit();
    }
  }

  // Change task
  handleTaskChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const task_id = e.currentTarget.value;
    const task = this.props.task.data.find((t) => t.id === task_id) as TaskRecord;
    const currentState = { ...this.state, task, params: {}, task_policy: false };
    delete currentState.policy;
    this.setState(currentState);
  };

  // Change box
  handleBoxChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const box_id = e.currentTarget.value;
    const box = this.props.box.data.find((b) => b.id === box_id) as BoxRecord;
    this.setState({ box });
  };

  // Change policy
  handlePolicyChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const policy = e.currentTarget.value as PolicyName;
    const task_policy = false;
    this.setState({ policy, params: {}, task_policy });
  };

  // handle policy boolean change
  handlePolicyBooleanChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const task_policy = e.currentTarget.checked;
    this.setState({ task_policy });
    const task = this.state.task;

    // If checkbox is in checked state
    if (task_policy === true && task !== undefined) {
      // Getting the same policy as the task
      const policy = task.policy;
      const params = {} as { [id: string]: string | number | boolean | string[] };
      if (policy) {
        // Getting the required policy parameters
        const policyObj = policyMap[policy];
        const policyParams = policyObj.params;
        // Copying the parameters from the task params
        policyParams.map((p) => (params[p.id] = task.params[p.id]));
      }
      this.setState({ policy, params });
    }
  };

  // handle param input change
  handleParamChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const params = { ...this.state.params, [e.currentTarget.id]: e.currentTarget.value };
    this.setState({ params });
  };

  // Handle boolean change
  handleParamBooleanChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const params = { ...this.state.params, [e.currentTarget.id]: e.currentTarget.checked };
    this.setState({ params });
  };

  // Handle list parameter change
  handleParamListChange = (id: string, newData: string[]) => {
    const params = { ...this.state.params, [id]: newData };
    this.setState({ params });
  };

  // handle form submit
  handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    const assignment_edit = this.props.assignment_edit;

    if (!assignment_edit) {
      const ta: TaskAssignment = {
        task_id: this.state.task?.id,
        box_id: this.state.box?.id,
        policy: this.state.policy,
        params: this.state.params,
        status: 'ASSIGNED',
      };
      this.props.createTaskAssignment(ta);
    } else {
      const ta: TaskAssignmentRecord = assignment_edit;
      ta.params = this.state.params;
      this.props.editTaskAssignment(ta);
    }
  };

  render() {
    const errorElements = [this.props.request, this.props.box, this.props.task].map((op, index) =>
      op.status === 'FAILURE' ? <ErrorMessage key={index} message={op.messages} /> : null,
    );

    const task_id_props = this.props.task_id;
    const assignment_edit = this.props.assignment_edit;

    // Task drop down
    const tasks = this.props.task.data.filter((t) => t.status === 'SUBMITTED');
    const { task } = this.state;
    const task_id = task ? task.id : 0;
    const taskDropDown = (
      <div>
        <select id='task_id' value={task_id} onChange={this.handleTaskChange}>
          <option value={0} disabled={true}>
            Select a Task
          </option>
          {tasks.map((t) => (
            <option value={t.id} key={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
    );

    // Box drop down
    const boxes = this.props.box.data.filter((b) => b.reg_mechanism !== null);
    const { box } = this.state;
    const box_id = box ? box.id : 0;
    const boxDropDown = (
      <div>
        <select id='box_id' value={box_id} onChange={this.handleBoxChange}>
          <option value={0} disabled={true}>
            Select a Box
          </option>
          {boxes.map((b) => (
            <option value={b.id} key={b.id}>
              {b.name} ({b.location})
            </option>
          ))}
        </select>
      </div>
    );

    // Policy drop down
    const scenario = scenarioMap[task?.scenario_name as ScenarioName];
    const policies = task === undefined ? [] : policyList[scenario.response_type];
    const policy = this.state.policy || 0;
    const task_policy = this.state.task_policy;
    const policyDropDown = (
      <>
        <div>
          <select
            id='policy_id'
            value={policy}
            onChange={this.handlePolicyChange}
            disabled={assignment_edit ? true : false}
          >
            <option value={0} disabled={true}>
              Select a Policy
            </option>
            {policies.map((p) => (
              <option value={p.name} key={p.name}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>
        <label htmlFor='task_policy'>
          <input
            type='checkbox'
            className='filled-in'
            id='task_policy'
            checked={task_policy}
            onChange={this.handlePolicyBooleanChange}
          />
          <span>Choose same policy as task policy</span>
        </label>
      </>
    );

    // Policy params section
    let policyParamsSection = null;
    if (task !== undefined && box !== undefined && policy !== 0) {
      const policyObj = policyMap[policy];
      policyParamsSection = (
        <ParameterSection
          params={policyObj.params}
          data={this.state.params}
          onChange={this.handleParamChange}
          onBooleanChange={this.handleParamBooleanChange}
          onStringListChange={this.handleParamListChange}
        />
      );
    }

    return (
      <div className='white lpad20 main'>
        {errorElements.map((err) => err)}
        <form onSubmit={this.handleSubmit}>
          <div className='section'>
            {task_id_props ? null : <h1 className='page-title'>Create Assignment</h1>}
            <div id='task-assignment-form'>
              <div className='row'>
                <div className='col s10 m8 l6'>
                  {this.props.task.status === 'IN_FLIGHT' ? (
                    <ProgressBar />
                  ) : this.props.task.status === 'SUCCESS' && !task_id_props ? (
                    taskDropDown
                  ) : null}
                </div>
              </div>
              <div className='row'>
                <div className={task_id_props ? 'col s10' : 'col s10 m8 l6'}>
                  {this.props.box.status === 'IN_FLIGHT' ? (
                    <ProgressBar />
                  ) : this.props.box.status === 'SUCCESS' && !assignment_edit ? (
                    boxDropDown
                  ) : null}
                </div>
              </div>
              <div className='row'>
                <div className={task_id_props ? 'col s10' : 'col s10 m8 l6'}>{policyDropDown}</div>
              </div>

              {/** Policy parameter section */}
              {policyParamsSection}

              {/** Submit cancel buttons */}
              {this.props.request.status === 'IN_FLIGHT' ? (
                <ProgressBar />
              ) : (
                <div className='row'>
                  <div className='input-field'>
                    <button className='btn waves-effect waves-light' id='submit-assignment-btn'>
                      Submit Assignment
                    </button>
                    {task_id_props ? (
                      <button type='button' className='btn cancel-btn' onClick={this.props.close_form_func}>
                        Cancel
                        <i className='material-icons right'>close</i>
                      </button>
                    ) : (
                      <Link to='/task-assignments'>
                        <button className='btn cancel-btn'>Cancel</button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default connector(CreateTaskAssignment);
