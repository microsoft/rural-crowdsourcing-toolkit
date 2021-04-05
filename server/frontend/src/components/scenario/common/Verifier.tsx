// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This components is the gateway for the task verifiers for various scenarios.
 * This component retrieves the task (based on the URL ID), the microtasks
 * associated with the task. It offers an interface for individual verifiers to
 * retrieve assignments belonging to specific microtasks.
 *
 * URL for the component: /task/:id/verify
 */

// React stuff
import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

// Redux stuff
import { connect, ConnectedProps } from 'react-redux';
import { compose } from 'redux';
import { RootState } from '../../../store/Index';

// HoCs
import { BackendRequestInitAction } from '../../../store/apis/APIs.auto';
import { DataProps, withData } from '../../hoc/WithData';

// For downloading karya output files
import axios from 'axios';
import * as zlib from 'zlib';
import * as tar from 'tar-stream';
import { Readable } from 'stream';

// Promise
import { Promise as BBPromise } from 'bluebird';

// Templates
import {
  MicrotaskAssignmentRecord,
  ScenarioRecord,
  KaryaFileRecord,
  TaskRecord,
  MicrotaskRecord,
  MicrotaskAssignment,
} from '@karya/db';
import { ErrorMessage, ProgressBar } from '../../templates/Status';

// List of verifiers
import SpeechDataVerifier from '../speech-data/Verifier';

/** Generic verifier component props: Defines the props interface for all verifiers */
export type GenericVerifierComponentProps = {
  task: TaskRecord;
  microtasks: MicrotaskRecord[];
  assignments: MicrotaskAssignmentRecord[];
  getOutputFilesForAssignment: (assignment: MicrotaskAssignmentRecord) => Promise<Buffer[]>;
  submitVerfications: (assignments: MicrotaskAssignmentRecord[]) => void;
};

/** Prop definitions */
type RouterProps = RouteComponentProps<{ id: string }>;
type OwnProps = RouterProps;

const mapStateToProps = (state: RootState, ownProps: OwnProps) => {
  const task_id = ownProps.match.params.id;
  const { data: taskData, ...taskRequest } = state.all.task;
  return {
    taskRequest,
    microtask: state.all.microtask,
    microtask_assignment: state.all.microtask_assignment,
    output_files: state.all.karya_file.data.filter((kf) => kf.container_name === 'microtask-assignment-output'),
    task: taskData.find((t) => t.id === task_id),
  };
};

const mapDispatchToProps = (dispatch: any, ownProps: OwnProps) => {
  const id = Number.parseInt(ownProps.match.params.id, 10);
  return {
    // Get this task
    getTask: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'task',
        label: 'GET_BY_ID',
        id,
      };
      dispatch(action);
    },

    // Get all microtasks for this task
    getMicrotasks: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'microtask',
        label: 'GET_ALL_WITH_COMPLETED',
        params: { task_id: id },
      };
      dispatch(action);
    },

    // Get all microtask assignments (limit = 1000)
    getCompletedMicrotaskAssignments: () => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'microtask_assignment',
        label: 'GET_ALL',
        params: { status: 'completed', limit: 1000 },
      };
      dispatch(action);
    },

    // Submit verifications
    submitVerificationForAssignment: async (id: number, assignment: MicrotaskAssignment) => {
      const action: BackendRequestInitAction = {
        type: 'BR_INIT',
        store: 'microtask_assignment',
        label: 'UPDATE_BY_ID',
        id,
        request: { ...assignment, status: 'verified' },
      };
      dispatch(action);
    },
  };
};

// Redux connector
const reduxConnector = connect(mapStateToProps, mapDispatchToProps);
const dataConnector = withData('scenario');
const connector = compose(dataConnector, reduxConnector);

// Verifier component props
type VerifierProps = OwnProps & DataProps<typeof dataConnector> & ConnectedProps<typeof reduxConnector>;

/** Assignment output type */
export type AssignmentOutput = {
  logs: object[];
  files: string[];
  data: object;
};

/**
 * Verifier state contains output file streams
 */
type VerifierState = {
  outputBuffers: { [id: string]: Buffer[] };
};

/**
 * Verifier component
 */
class Verifier extends React.Component<VerifierProps, VerifierState> {
  /** No streams to begin with */
  state = {
    outputBuffers: {},
  } as VerifierState;

  /**
   * On mount, get the task and microtasks
   */
  componentDidMount() {
    if (this.props.task === undefined) {
      this.props.getTask();
    }
    this.props.getMicrotasks();
    this.props.getCompletedMicrotaskAssignments();
  }

  /** Submit verifications for assignments */
  submitVerifications = async (assignments: MicrotaskAssignmentRecord[]) => {
    await BBPromise.mapSeries(assignments, async (assignment) => {
      const { id, credits, params } = assignment;
      await this.props.submitVerificationForAssignment(id, { credits, params });
    });
  };

  /**
   * Get output file for assignment
   */
  getOutputFilesForAssignment = async (assignment: MicrotaskAssignmentRecord): Promise<Buffer[]> => {
    return new Promise(async (resolve, reject) => {
      const output = { ...assignment.output } as AssignmentOutput;
      const file = this.props.output_files.find((f) => f.id === assignment.output_file_id) as KaryaFileRecord;

      try {
        const response = await axios.get<Blob>(file.url as string, { responseType: 'blob', withCredentials: false });
        const compressed = await response.data.arrayBuffer();
        const uncompressed = zlib.gunzipSync(Buffer.from(compressed));

        const extract = tar.extract();
        const buffers: Buffer[] = [];

        extract.on('entry', async (header, stream, next) => {
          const filename = header.name;
          const index = output.files.findIndex((fname) => fname === filename);
          if (index >= 0) {
            const buf = await streamToBuffer(stream);
            buffers[index] = buf;
          }
          next();
        });

        extract.on('finish', () => {
          resolve(buffers);
        });

        const tarFile = new Readable({
          read() {
            this.push(uncompressed);
            this.push(null);
          },
        });
        tarFile.pipe(extract);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Render the component
   */
  render() {
    const { task, taskRequest, microtask, microtask_assignment, scenario } = this.props;

    // If task is undefined, then show an error message
    if (taskRequest.status === 'IN_FLIGHT' || scenario.status === 'IN_FLIGHT') {
      return <ProgressBar />;
    }

    if (task === undefined) {
      return <ErrorMessage message={['Unknown task']} />;
    }

    const assignments = microtask_assignment.data.filter((assignment) => assignment.status === 'completed');
    const microtaskIds = assignments
      .map((assignment) => assignment.microtask_id)
      .filter((v, i, self) => self.indexOf(v) === i);
    const microtasks = microtask.data.filter((mt) => microtaskIds.includes(mt.id));

    const thisScenario = scenario.data.find((s) => s.id === task.scenario_id) as ScenarioRecord;
    const VerificationComponent = thisScenario.name === 'speech-data' ? SpeechDataVerifier : null;
    if (VerificationComponent === null) {
      throw new Error('Unknown scenario type');
    }

    return (
      <div className='white z-depth-1 pad20'>
        {microtask.status === 'IN_FLIGHT' || microtask_assignment.status === 'IN_FLIGHT' ? <ProgressBar /> : null}

        <h5>Task Verification for {task.name}</h5>
        {microtasks.length === 0 ? (
          <div className='section'>
            <p>There is nothing to verify</p>
          </div>
        ) : (
          <div className='section'>
            <VerificationComponent
              task={task}
              microtasks={microtasks}
              assignments={assignments}
              getOutputFilesForAssignment={this.getOutputFilesForAssignment}
              submitVerfications={this.submitVerifications}
            />
          </div>
        )}
      </div>
    );
  }
}

/**
 * Copy an input stream into a buffer
 */
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    var bufs: Buffer[] = [];
    stream.on('data', (data) => {
      bufs.push(data);
    });
    stream.on('end', () => resolve(Buffer.concat(bufs)));
    stream.on('error', (e) => {
      reject(e);
    });
  });
}

export default connector(Verifier);
