// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component the show the details of a scenario.
 */

import React from 'react';

/** React router stuff */
import { RouteComponentProps } from 'react-router-dom';

/** Redux stuff */
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from '../../store/Index';

/** HTML helper elements */
import { ErrorMessage } from '../templates/Status';
import { TableColumnType, TableList } from '../templates/TableList';

/** Scenario task paramters types and definition */
import { ParameterDefinition } from '../../db/ParameterTypes';
import { BackendRequestInitAction } from '../../store/apis/APIs.auto';

/** Define Router match params props */
type RouteParams = { id: string };
type RouterProps = RouteComponentProps<RouteParams>;

/** Define own props */
type OwnProps = RouterProps;

/** map relevant state to props */
const mapStateToProps = (state: RootState, ownProps: OwnProps) => {
  const scenario_id = Number.parseInt(ownProps.match.params.id, 10);
  return {
    /** Scenario object corresponding to this scenario */
    scenario: state.all.scenario.data.find((s) => s.id === scenario_id),
  };
};

// Map dispatch to props
const mapDispatchToProps = (dispatch: any, ownProps: OwnProps) => {
  return {
    getScenario: (id: number) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'scenario',
        label: 'GET_BY_ID',
        id,
      };
      dispatch(action);
    },
  };
};

/** Create the connector HoC */
const connector = connect(mapStateToProps, mapDispatchToProps);

/** Combine component props */
type ScenarioDetailProps = ConnectedProps<typeof connector> & OwnProps;

/** LanguageList component */
class ScenarioDetail extends React.Component<ScenarioDetailProps> {
  // On mount, dispatch actions
  componentDidMount() {
    if (this.props.scenario === undefined) {
      const id = Number.parseInt(this.props.match.params.id, 10);
      this.props.getScenario(id);
    }
  }

  render() {
    const { scenario } = this.props;

    /** scenario can be undefined? */
    /** Fetch scenario from backend? */
    if (scenario === undefined) {
      return <ErrorMessage message={['Undefined Scenario ID']} />;
    }

    /** basic scenario details */
    const basicScenarioDetails = (
      <div className='pad10 tmar20 grey lighten-5'>
        <h6 className='red-text'>Basic Details</h6>
        <table className='compact'>
          <tbody>
            <tr>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td className='label w100'>identifying name</td>
              <td>{scenario.name}</td>
            </tr>
            <tr>
              <td className='label w100'>full name</td>
              <td>{scenario.full_name}</td>
            </tr>
            <tr>
              <td className='label w100'>description</td>
              <td>{scenario.description}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );

    /** skills required for the scenario */
    /** TODO: Need to clearly specify skills object type */
    const skills = scenario.skills as { l1: object; l2?: object };
    const skillDetails = (
      <div className='pad10 tmar20 grey lighten-5'>
        <h6 className='red-text'>Skills required to complete tasks</h6>
        <div className='section'>primary language skill: {JSON.stringify(skills.l1)}</div>
      </div>
    );

    /** the list of task parameters */
    const { params: taskParams } = scenario.task_params as { params: ParameterDefinition[] };
    const paramsTableColumns: Array<TableColumnType<ParameterDefinition>> = [
      { header: 'Name', type: 'field', field: 'name' },
      { header: 'Type', type: 'field', field: 'type' },
      { header: 'Description', type: 'field', field: 'description' },
      { header: 'Default', type: 'field', field: 'default' },
      { header: 'Required', type: 'function', function: (r) => (r.required ? 'Yes' : 'No') },
    ];

    const taskParamsDetails = (
      <TableList<ParameterDefinition>
        columns={paramsTableColumns}
        rows={taskParams}
        emptyMessage='There are no task parameters for this scenario'
      />
    );

    /** Allocation parameters */
    const allocationParameters = (
      <div className='pad10 tmar20 grey lighten-5'>
        {' '}
        <h6 className='red-text'>Allocation and Assignment Parameters</h6>
        <table className='compact'>
          <tbody>
            <tr>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td className='label w150'>allocation granularity</td>
              <td>
                {scenario.assignment_granularity === 'group'
                  ? 'Microtask Group'
                  : scenario.assignment_granularity === 'microtask'
                  ? 'Microtask'
                  : 'Per-task Choice'}
              </td>
            </tr>
            <tr>
              <td className='label w150'>group assignment order</td>
              <td>
                {scenario.group_assignment_order === 'sequential'
                  ? 'Sequential'
                  : scenario.group_assignment_order === 'random'
                  ? 'Random'
                  : 'Per-task Choice'}
              </td>
            </tr>
            <tr>
              <td className='label w150'>microtask assignment order</td>
              <td>
                {scenario.microtask_assignment_order === 'sequential'
                  ? 'Sequential'
                  : scenario.microtask_assignment_order === 'random'
                  ? 'Random'
                  : 'Per-task Choice'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );

    return (
      <div className='tmar20'>
        <h4 className='bmar20'>{scenario.full_name} Scenario</h4>
        {scenario.enabled ? null : <h6 className='grey-text'>This scenario is currently not enabled</h6>}
        {basicScenarioDetails}
        {skillDetails}
        {taskParamsDetails}
        {allocationParameters}
      </div>
    );
  }
}

export default connector(ScenarioDetail);
