// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to create a new task assignment. On success, redirect to task assignment list page
 */

// React stuff
import React, { ChangeEventHandler, FormEventHandler } from 'react';
import { RouteComponentProps } from 'react-router-dom';

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { compose } from 'redux';
import { RootState } from '../../store/Index';

// Store types and actions
import { PolicyParameterDefinition } from '../../db/ParameterTypes';

// HTML helpers
import { BoxRecord, PolicyRecord, TaskAssignment, TaskRecord } from '../../db/TableInterfaces.auto';
import { ColTextInput, SubmitOrCancel } from '../templates/FormInputs';
import { ErrorMessage, ProgressBar } from '../templates/Status';

// HoC
import { BackendRequestInitAction } from '../../store/apis/APIs.auto';
import { DataProps, withData } from '../hoc/WithData';

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
const dataConnector = withData('box', 'policy', 'task');
const connector = compose(dataConnector, reduxConnector);
// Component props
// Need filter for box.
type CreateTaskAssignmentProps = RouterProps & ConnectedProps<typeof reduxConnector> & DataProps<typeof dataConnector>;

// Component state
type CreateTaskAssignmentState = {
  params: { [id: string]: string | number };
  task?: TaskRecord;
  box?: BoxRecord;
  policy?: PolicyRecord;
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
    const box_id = Number.parseInt(e.currentTarget.value, 10);
    const box = this.props.box.data.find((b) => b.id === box_id) as BoxRecord;
    this.setState({ box });
  };

  // Change policy
  handlePolicyChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const policy_id = Number.parseInt(e.currentTarget.value, 10);
    const policy = this.props.policy.data.find((p) => p.id === policy_id);
    this.setState({ policy, params: {} });
  };

  // handle param input change
  handleStringParamChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const params = { ...this.state.params, [e.currentTarget.id]: e.currentTarget.value };
    this.setState({ params });
  };

  // handle param input change
  handleIntegerParamChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const params = { ...this.state.params, [e.currentTarget.id]: parseInt(e.currentTarget.value, 10) };
    this.setState({ params });
  };

  // handle param input change
  handleFloatParamChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const params = { ...this.state.params, [e.currentTarget.id]: parseFloat(e.currentTarget.value) };
    this.setState({ params });
  };

  // handle form submit
  handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    const ta: TaskAssignment = {
      task_id: this.state.task?.id,
      box_id: this.state.box?.id,
      policy_id: this.state.policy?.id,
      params: this.state.params,
      status: 'assigned',
    };
    this.props.createTaskAssignment(ta);
  };

  // render a parameter
  renderPolicyParameter(param: PolicyParameterDefinition) {
    switch (param.type) {
      case 'string':
        return (
          <ColTextInput
            id={param.identifier}
            label={param.name}
            width='s4'
            onChange={this.handleStringParamChange}
            required={param.required}
          />
        );
      case 'integer':
        return (
          <ColTextInput
            id={param.identifier}
            label={param.name}
            width='s4'
            onChange={this.handleIntegerParamChange}
            required={param.required}
          />
        );
      case 'float':
        return (
          <ColTextInput
            id={param.identifier}
            label={param.name}
            width='s4'
            onChange={this.handleFloatParamChange}
            required={param.required}
          />
        );
    }
  }

  render() {
    const errorElements = [this.props.request, this.props.box, this.props.policy, this.props.task].map((op, index) =>
      op.status === 'FAILURE' ? <ErrorMessage key={index} message={op.messages} /> : null,
    );

    // Task drop down
    const tasks = this.props.task.data.filter((t) => t.status === 'approved');
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
    const boxes = this.props.box.data.filter((b) => b.key !== null);
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
              {b.name} ({b.location_name})
            </option>
          ))}
        </select>
      </div>
    );

    // Policy drop down
    const policies = task === undefined ? [] : this.props.policy.data.filter((p) => p.scenario_id === task.scenario_id);
    const { policy } = this.state;
    const policy_id = policy ? policy.id : 0;
    const policyDropDown = (
      <div>
        <select id='policy_id' value={policy_id} onChange={this.handlePolicyChange}>
          <option value={0} disabled={true}>
            Select a Policy
          </option>
          {policies.map((p) => (
            <option value={p.id} key={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    );

    // Policy params section
    let policyParamsSection = null;
    if (task !== undefined && box !== undefined && policy !== undefined) {
      const { params: policyParams } = policy.params as { params: PolicyParameterDefinition[] };
      policyParamsSection = (
        <div className='section'>
          {policyParams.map((p, index) => (
            <div className='row' key={index}>
              {this.renderPolicyParameter(p)}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className='white z-depth-1 lpad20'>
        {errorElements.map((err) => err)}
        <form onSubmit={this.handleSubmit}>
          <div className='section'>
            <div className='row'>
              <div className='col s4'>
                {this.props.task.status === 'IN_FLIGHT' ? (
                  <ProgressBar />
                ) : this.props.task.status === 'SUCCESS' ? (
                  taskDropDown
                ) : null}
              </div>
            </div>
            <div className='row'>
              <div className='col s4'>
                {this.props.box.status === 'IN_FLIGHT' ? (
                  <ProgressBar />
                ) : this.props.box.status === 'SUCCESS' ? (
                  boxDropDown
                ) : null}
              </div>
            </div>
            <div className='row'>
              <div className='col s4'>
                {this.props.policy.status === 'IN_FLIGHT' ? (
                  <ProgressBar />
                ) : this.props.policy.status === 'SUCCESS' ? (
                  policyDropDown
                ) : null}
              </div>
            </div>
          </div>

          {/** Policy parameter section */}
          {policyParamsSection}

          {/** Submit cancel button */}
          {this.props.request.status === 'IN_FLIGHT' ? (
            <ProgressBar />
          ) : (
            <SubmitOrCancel submitString='Create Task Assignment' cancelAction='link' cancelLink='/task-assignments' />
          )}
        </form>
      </div>
    );
  }
}

export default connector(CreateTaskAssignment);
