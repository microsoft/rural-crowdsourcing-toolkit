// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to show the list of all scenarios
 */

import React from 'react';

/** Redux stuff */
import { compose } from 'redux';

// HoCs
import { AuthProps, withAuth } from '../hoc/WithAuth';
import { DataProps, withData } from '../hoc/WithData';

/** HTML helper components */
import { Link } from 'react-router-dom';
import { ErrorMessage, ProgressBar } from '../templates/Status';
import { TableColumnType, TableList } from '../templates/TableList';

/** Import async ops and action creators */
import { ScenarioRecord } from '@karya/db';

/** Define Router match params props */
/** Define own props */

/** Scenario list connector */
const dataConnector = withData('scenario');
const connector = compose(dataConnector, withAuth);

type ScenarioListProps = DataProps<typeof dataConnector> & AuthProps;

/** LanguageList component */
class ScenarioList extends React.Component<ScenarioListProps> {
  render() {
    const scenarios = this.props.scenario.data;

    // push core scenario
    const coreScenario: ScenarioRecord = {
      id: 0,
      name: 'core',
      full_name: 'Core',
      description: 'This is not a real scenario. Just a stub for the core platform.',
      task_params: {},
      assignment_granularity: 'either',
      group_assignment_order: 'either',
      microtask_assignment_order: 'either',
      skills: {},
      params: {},
      synchronous_validation: false,
      enabled: true,
      created_at: new Date(0).toISOString(),
      last_updated_at: new Date(0).toISOString(),
    };

    const displayScenarios = [coreScenario, ...scenarios];

    /** Generate any error message */
    const errorMessageElement =
      this.props.scenario.status === 'FAILURE' ? (
        <div>
          <ErrorMessage message={this.props.scenario.messages} />
          <div>
            <button className='btn grey bmar20' onClick={this.props.getData('scenario')}>
              Retry
            </button>
          </div>
        </div>
      ) : null;

    const scenarioDetailsLink = (scenario: ScenarioRecord) =>
      scenario.id === 0 ? null : (
        <Link to={`/scenario/${scenario.id}`}>
          <i className='material-icons'>list</i>
        </Link>
      );

    const scenarioResourcesLink = (scenario: ScenarioRecord) => (
      <Link to={`/scenario/${scenario.id}/resources`}>
        <i className='material-icons'>language</i>
      </Link>
    );

    const tableColumns: Array<TableColumnType<ScenarioRecord>> = [
      { header: 'Name', type: 'field', field: 'full_name' },
      { header: 'Description', type: 'field', field: 'description' },
      { header: 'Details', type: 'function', function: scenarioDetailsLink },
    ];

    if (this.props.cwp.admin) {
      tableColumns.push({ header: 'Resources', type: 'function', function: scenarioResourcesLink });
    }

    return (
      <div className='lmar20 tmar20'>
        {errorMessageElement}
        {this.props.scenario.status === 'IN_FLIGHT' ? (
          <ProgressBar />
        ) : this.props.scenario.status === 'SUCCESS' ? (
          <TableList<ScenarioRecord>
            columns={tableColumns}
            rows={displayScenarios}
            emptyMessage='No scenarios in the database'
          />
        ) : null}
      </div>
    );
  }
}

export default connector(ScenarioList);
