// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display a graph with the required workers' data
 */

// React stuff
import * as React from 'react';

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { compose } from 'redux';
import { RootState } from '../../store/Index';

// Store types and actions

import { BackendRequestInitAction } from '../../store/apis/APIs';

import { ErrorMessageWithRetry, ProgressBar } from '../templates/Status';

// Recharts library
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// For CSV file download
import { CSVLink } from 'react-csv';

import '../../css/worker/WorkerOverview.css';

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
    getWorkersSummary: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'worker',
        label: 'GET_ALL',
      };
      dispatch(action);
    },
  };
};

// Create the connector
const reduxConnector = connect(mapStateToProps, mapDispatchToProps);
const connector = compose(reduxConnector);

type WorkerOverviewProps = ConnectedProps<typeof reduxConnector>;

// component state
type WorkerOverviewState = {
  tags_filter: Array<string>;
  box_id_filter?: string;
};

// Task list component
class WorkerOverview extends React.Component<WorkerOverviewProps, WorkerOverviewState> {
  // Initial state
  state: WorkerOverviewState = {
    tags_filter: [],
  };

  componentDidMount() {
    this.props.getWorkersSummary();
    M.AutoInit();
  }

  componentDidUpdate() {
    M.AutoInit();
  }

  // Handle tags change
  handleTagsChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const tags_filter = Array.from(e.currentTarget.selectedOptions, (o) => o.value);
    this.setState({ tags_filter });
  };

  // Handle box id change
  handleBoxIdChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const box_id_filter = e.currentTarget.value;
    this.setState({ box_id_filter });
  };

  // Render component
  render() {
    var workers = this.props.workers_data;
    const tags_filter = this.state.tags_filter;
    const box_id_filter = this.state.box_id_filter;

    // Filtering workers by tags
    workers = workers.filter((w) => tags_filter.every((val) => w.tags.tags.includes(val)));

    // Getting all the tasks' tags as a single flat array with no duplicates
    const tags_array = workers.map((w) => w.tags.tags);
    const arr: string[] = [];
    const tags_duplicates = arr.concat(...tags_array);
    const tags = Array.from(new Set([...tags_duplicates]));

    // Getting all the box ids as an array with no duplicates
    const boxIds_duplicates = workers.map((w) => w.box_id);
    const boxIds = Array.from(new Set([...boxIds_duplicates]));

    // Filtering workers by box id
    if (box_id_filter !== undefined && box_id_filter !== 'all') {
      workers = workers.filter((w) => w.box_id === box_id_filter);
    }

    // Data to be fed into graph
    const data = workers.map((w) => ({
      id: w.id,
      access_code: w.access_code,
      phone_number: w.phone_number,
      ...w.extras,
    }));

    // Create error message element if necessary
    const getErrorElement =
      this.props.status === 'FAILURE' ? (
        <ErrorMessageWithRetry message={['Unable to fetch the data']} onRetry={this.props.getWorkersSummary} />
      ) : null;

    return (
      <div className='row' id='main-row'>
        <div className='col s12'>
          {this.props.status === 'IN_FLIGHT' ? (
            <ProgressBar />
          ) : this.props.status === 'FAILURE' ? (
            { getErrorElement }
          ) : (
            <>
              <h1 id='workers-title'>Workers</h1>
              <div className='row' id='filter_row'>
                <div className='col s10 m8 l5'>
                  <select multiple={true} id='tags_filter' value={tags_filter} onChange={this.handleTagsChange}>
                    <option value='' disabled={true} selected={true}>
                      Filter workers by tags
                    </option>
                    {tags.map((t) => (
                      <option value={t} key={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='col s10 m8 l4'>
                  <select id='box_id_filter' value={box_id_filter} onChange={this.handleBoxIdChange}>
                    <option value='' disabled={true} selected={true}>
                      Filter workers by box ID
                    </option>
                    <option value='all'>All boxes</option>
                    {boxIds.map((i) => (
                      <option value={i} key={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <ResponsiveContainer width='90%' height={400}>
                <LineChart data={data} margin={{ top: 30, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='id' tick={false} label='Worker ID' />
                  <YAxis />
                  <Tooltip />
                  <Legend verticalAlign='top' />
                  <Line type='monotone' dataKey='assigned' stroke='#8884d8' dot={false} />
                  <Line type='monotone' dataKey='completed' stroke='#82ca9d' dot={false} />
                  <Line type='monotone' dataKey='verified' stroke='#4dd0e1' dot={false} />
                  <Line type='monotone' dataKey='earned' stroke='#ea80fc' dot={false} />
                </LineChart>
              </ResponsiveContainer>

              <CSVLink data={data} filename={'worker-data.csv'} className='btn' id='download-data-btn'>
                <i className='material-icons left'>download</i>Download data
              </CSVLink>
            </>
          )}
        </div>
      </div>
    );
  }
}

export default connector(WorkerOverview);
