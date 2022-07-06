// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display the required workers' data
 */

// React stuff
import * as React from 'react';

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { compose } from 'redux';
import { RootState } from '../../store/Index';

// Store types and actions
import { WorkerRecord } from '@karya/core';

import { BackendRequestInitAction } from '../../store/apis/APIs';

// HTML Helpers
import { ProgressBar } from '../templates/Status';

// HoCs
import { DataProps, withData } from '../hoc/WithData';
import { AuthProps, withAuth } from '../hoc/WithAuth';

// For CSV file download
import { CSVLink } from 'react-csv';

// Data connector
const dataConnector = withData('task');

// Map state to props
const mapStateToProps = (state: RootState) => {
  const workers_data = state.all.worker.data;
  const status = state.all.worker.status;
  return { workers_data, status };
};

// Map dispatch to props
const mapDispatchToProps = (dispatch: any) => {
  return {
    // For getting workers' data
    getWorkerTaskSummary: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'worker',
        label: 'GET_WORKER_TASK',
      };
      dispatch(action);
    },
  };
};

// Create the connector
const reduxConnector = connect(mapStateToProps, mapDispatchToProps);
const connector = compose(withAuth, dataConnector, reduxConnector);

type WorkerReportsProps = DataProps<typeof dataConnector> & ConnectedProps<typeof reduxConnector> & AuthProps;

const weeks = ['week1', 'week2', 'week3', 'week4'] as const;
const regions = ['region1', 'region2', 'region3', 'region4'] as const;

// component state
type WorkerReportsState = {
  week: typeof weeks[number];
  region: typeof regions[number];
};

// Task list component
class WorkerReports extends React.Component<WorkerReportsProps, WorkerReportsState> {
  // Initial state
  state: WorkerReportsState = {
    week: 'week1',
    region: 'region1',
  };

  componentDidMount() {
    this.props.getWorkerTaskSummary();
    M.updateTextFields();
    M.AutoInit();
  }

  componentDidUpdate() {
    M.updateTextFields();
    M.AutoInit();
  }

  // Handle week change
  handleWeekChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const week = e.currentTarget.value as typeof weeks[number];
    this.setState({ week });
  };

  // Handle region change
  handleRegionChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const region = e.currentTarget.value as typeof regions[number];
    this.setState({ region });
  };

  // Render component
  render() {
    if (this.props.status === 'IN_FLIGHT') {
      return <ProgressBar />;
    }

    type Extras = {
      task_id: string;
      assigned: number;
      skipped: number;
      expired: number;
      completed: number;
      verified: number;
      earned: number;
    };
    const workers = this.props.workers_data as (WorkerRecord & Extras)[];

    const { week, region } = this.state;
    const task_ids = this.props.task.data
      .filter((t) => t.itags.itags.includes(week) && t.itags.itags.includes(region))
      .map((t) => t.id);

    const filtered_workers = workers.filter((w) => task_ids.includes(w.task_id));
    const merged_workers: { [id: string]: typeof workers[0] } = {};

    filtered_workers.forEach((w) => {
      if (w.id in merged_workers) {
        const cw = merged_workers[w.id];
        cw.assigned += w.assigned;
        cw.completed += w.completed;
        cw.verified += w.verified;
        cw.skipped += w.skipped;
        cw.expired += w.expired;
        cw.earned += w.earned;
      } else {
        merged_workers[w.id] = w;
      }
    });

    const data = Object.values(merged_workers).map((w) => {
      return {
        id: `I${w.id}`,
        access_code: `A${w.access_code}`,
        assigned: w.assigned,
        skipped: w.skipped,
        expired: w.expired,
        completed: w.completed,
        verified: w.verified,
        earned: w.earned,
      };
    });
    const currentDate = new Date().toISOString().replace(/:/g, '.');
    const exportFileName = `${region}.${week}.${currentDate}.csv`;
    console.log(data);

    const weekDropdown = (
      <select id='week' value={week} onChange={this.handleWeekChange}>
        {weeks.map((w) => (
          <option value={w} key={w}>
            {`${w}`}
          </option>
        ))}
      </select>
    );

    const regionDropdown = (
      <select id='region' value={region} onChange={this.handleRegionChange}>
        {regions.map((r) => (
          <option value={r} key={r}>
            {`${r}`}
          </option>
        ))}
      </select>
    );

    return (
      <>
        <div className='row'>{weekDropdown}</div>
        <div className='row'>{regionDropdown}</div>
        <div className='row'>
          <CSVLink data={data} filename={exportFileName} className='btn' id='download-btn'>
            <i className='material-icons left'>download</i>Download data
          </CSVLink>
        </div>
      </>
    );
  }
}

export default connector(WorkerReports);
