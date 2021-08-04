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
import { scenarioMap, ScenarioName } from '@karya/core';
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
  };
};

// Create the connector
const reduxConnector = connect(mapStateToProps, mapDispatchToProps);
const dataConnector = withData('box', 'task');
const connector = compose(dataConnector, reduxConnector);
// Component props
// Need filter for box.
type CreateTaskAssignmentProps = RouterProps & ConnectedProps<typeof reduxConnector> & DataProps<typeof dataConnector>;

// Component state
type CreateTaskAssignmentState = {
  params: { [id: string]: string | boolean };
  task?: TaskRecord;
  box?: BoxRecord;
  policy?: PolicyName;
};

class CreateTaskAssignment extends React.Component<CreateTaskAssignmentProps, CreateTaskAssignmentState> {
  state: CreateTaskAssignmentState = {
    params: {},
  };

  // on mount, get things
  componentDidMount() {
    M.AutoInit();
    M.updateTextFields();
  }

  // on update
  componentDidUpdate(prevProps: CreateTaskAssignmentProps) {
    if (prevProps.request.status === 'IN_FLIGHT' && this.props.request.status === 'SUCCESS') {
      this.props.history.push('/task-assignments');
    } else {
      M.updateTextFields();
      M.AutoInit();
    }
  }

  // Change task
  handleTaskChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const task_id = e.currentTarget.value;
    const task = this.props.task.data.find((t) => t.id === task_id) as TaskRecord;
    const currentState = { ...this.state, task, params: {} };
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
    console.log(policy);
    this.setState({ policy, params: {} });
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

  // handle form submit
  handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    const ta: TaskAssignment = {
      task_id: this.state.task?.id,
      box_id: this.state.box?.id,
      policy: this.state.policy,
      params: this.state.params,
      status: 'ASSIGNED',
    };
    this.props.createTaskAssignment(ta);
  };

  render() {
    const errorElements = [this.props.request, this.props.box, this.props.task].map((op, index) =>
      op.status === 'FAILURE' ? <ErrorMessage key={index} message={op.messages} /> : null,
    );

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
    const policyDropDown = (
      <div>
        <select id='policy_id' value={policy} onChange={this.handlePolicyChange}>
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
        />
      );
    }

    return (
      <div className='white z-depth-1 lpad20' id='main'>
        {errorElements.map((err) => err)}
        <form onSubmit={this.handleSubmit}>
          <div className='section'>
            <h1 id='page-title'>Create Assignment</h1>
            <div id='task-assignment-form'>
              <div className='row'>
                <div className='col s10 m8 l6'>
                  {this.props.task.status === 'IN_FLIGHT' ? (
                    <ProgressBar />
                  ) : this.props.task.status === 'SUCCESS' ? (
                    taskDropDown
                  ) : null}
                </div>
              </div>
              <div className='row'>
                <div className='col s10 m8 l6'>
                  {this.props.box.status === 'IN_FLIGHT' ? (
                    <ProgressBar />
                  ) : this.props.box.status === 'SUCCESS' ? (
                    boxDropDown
                  ) : null}
                </div>
              </div>
              <div className='row'>
                <div className='col s10 m8 l6'>{policyDropDown}</div>
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
                  <Link to='/task-assignments'>
                    <button className='btn' id='cancel-btn'>
                      Cancel
                    </button>
                  </Link>
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
