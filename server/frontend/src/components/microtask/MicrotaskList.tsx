// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Component to display the list of microtasks for a task
 */

// React stuff
import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from '../../store/Index';

// HTML helpers
import { BackendRequestInitAction } from '../../store/apis/APIs.auto';
import { ErrorMessage, ProgressBar } from '../templates/Status';

// Router props
type RouterProps = RouteComponentProps<{ task_id: string }>;
type OwnProps = RouterProps;

// Map state to props
const mapStateToProps = (state: RootState, ownProps: OwnProps) => {
  const task_id = Number.parseInt(ownProps.match.params.task_id, 10);
  const { data, ...request } = state.all.microtask;
  return {
    // @ts-ignore
    microtasks: data.filter((m) => Number.parseInt(m.task_id, 10) === task_id),
    request,
  };
};

// Map dispatch to props
const mapDispatchToProps = (dispatch: any, ownProps: OwnProps) => {
  const task_id = Number.parseInt(ownProps.match.params.task_id, 10);
  return {
    getMicrotasks: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'microtask',
        label: 'GET_ALL',
        params: { task_id },
      };
      return dispatch(action);
    },
  };
};

// Redux connecotr
const reduxConnector = connect(mapStateToProps, mapDispatchToProps);

// Microtask list props
type MicrotaskListProps = OwnProps & ConnectedProps<typeof reduxConnector>;

// Microtask list
class MicrotaskList extends React.Component<MicrotaskListProps> {
  // on mount, fetch microtasks
  componentDidMount() {
    this.props.getMicrotasks();
  }

  render() {
    const { microtasks, request } = this.props;

    // If request in flight, just show a progress bar
    if (request.status === 'IN_FLIGHT') {
      return <ProgressBar />;
    }

    // If request has failed, display error message
    if (request.status === 'FAILURE') {
      return <ErrorMessage message={request.messages} />;
    }

    // If microtasks is undefined, then return error
    if (microtasks === undefined) {
      return <ErrorMessage message={['Could not fetch microtasks']} />;
    }

    return (
      <div className='lmar20 tmar20 white z-depth-1 pad20'>
        {microtasks.length === 0 ? (
          <p>There are no microtasks for this task</p>
        ) : (
          microtasks.map((m) => (
            <div className='row' key={m.id}>
              {JSON.stringify(m.input)}
            </div>
          ))
        )}
      </div>
    );
  }
}

export default reduxConnector(MicrotaskList);
