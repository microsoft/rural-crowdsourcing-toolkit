// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This component implements the verifier for speech-data scenario
 */

import React, { FormEventHandler, ChangeEventHandler } from 'react';
import { GenericVerifierComponentProps } from '../common/Verifier';
import { MicrotaskRecord, MicrotaskAssignmentRecord } from '../../../db/TableInterfaces.auto';

import { ErrorMessage } from '../../templates/Status';

/** Global audio context for playing audio */
let audioContext: AudioContext;

/** Audio quality */
type AudioQuality = 'Bad' | 'Decent' | 'Good';
const audioQualityValues: AudioQuality[] = ['Bad', 'Decent', 'Good'];

/** Quality reason */
const audioQualityReasons: { [id in AudioQuality]: string[] } = {
  Good: [''],
  Decent: ['Low volume', 'Mild human background noise', 'Too fast'],
  Bad: [
    'Empty recording',
    'Incorrect sentence',
    'Completely inaudible',
    'Too much human background noise',
    'Cannot decipher recording',
  ],
};

/** Credits */
function assignedCredits(quality: AudioQuality): number {
  switch (quality) {
    case 'Bad':
      return 0;
    case 'Decent':
      return 0.5;
    case 'Good':
      return 1;
    default:
      ((obj: never) => {
        throw new Error(`Unknown quality '${quality}'`);
      })(quality);
  }
}

/** Speech data verifier state. Tracks status of individual assignment verification */
type SpeechDataVerifierState = {
  currentMicrotask?: MicrotaskRecord;
  currentAssignments: MicrotaskAssignmentRecord[];
  playerAvailable: boolean;
  playButtonsDisabled: boolean;
  submitDisabled: boolean;
  audioRecording: { [id: string]: Buffer };
  audioPlayed: { [id: string]: boolean };
  audioQuality: { [id: string]: AudioQuality };
  audioQualityReason: { [id: string]: string };
};

class SpeechDataVerifier extends React.Component<GenericVerifierComponentProps, SpeechDataVerifierState> {
  /** Initial state */
  state = {
    playerAvailable: true,
    playButtonsDisabled: false,
    submitDisabled: true,
    audioRecording: {},
    audioPlayed: {},
    audioQuality: {},
    audioQualityReason: {},
  } as SpeechDataVerifierState;

  /**
   * On mount, set the audio player context, get new assignments for a completed microtask
   */
  componentDidMount() {
    /** Get audio context */
    try {
      audioContext = new AudioContext();
    } catch (e) {
      this.setState({ playerAvailable: false });
    }

    this.chooseNextMicrotask();
    M.AutoInit();
  }

  /**
   * Choose next microtask
   */
  chooseNextMicrotask = () => {
    const microtasks = this.props.microtasks;

    if (microtasks.length === 0) {
      return;
    }

    const mtIndex = Math.floor(Math.random() * microtasks.length);
    const currentMicrotask = microtasks[mtIndex];
    const currentAssignments = this.props.assignments.filter(
      (assignment) => assignment.microtask_id === currentMicrotask.id,
    );
    this.setState({
      currentMicrotask,
      currentAssignments,
      audioRecording: {},
      audioPlayed: {},
      audioQuality: {},
      audioQualityReason: {},
      submitDisabled: true,
    });
    currentAssignments.forEach((assignment) => this.getAudioRecording(assignment));
  };

  getAudioRecording = (assignment: MicrotaskAssignmentRecord) => {
    this.props
      .getOutputFilesForAssignment(assignment)
      .then((buffers) => {
        if (buffers[0]) {
          const audioRecording = { ...this.state.audioRecording };
          audioRecording[assignment.id] = buffers[0];
          this.setState({ audioRecording });
        }
      })
      .catch((e) => {
        alert('Error getting files');
      });
  };

  /**
   * On update,
   * -> auto init dropdown
   */
  componentDidUpdate(prevProps: GenericVerifierComponentProps) {
    M.AutoInit();
    const currentAssignments = this.state.currentAssignments.filter(
      (assignment) => this.props.assignments.find((unverified) => unverified.id === assignment.id) !== undefined,
    );
    if (Object.keys(this.state.currentAssignments).length > Object.keys(currentAssignments).length) {
      this.setState({ currentAssignments });
      if (Object.keys(currentAssignments).length === 0) {
        this.chooseNextMicrotask();
      }
    }
  }

  /**
   * Play the recording for some file
   */
  playRecordingForAssignment = (assignment: MicrotaskAssignmentRecord) => {
    const sourceBuffer = this.state.audioRecording[assignment.id];
    this.setState({ playButtonsDisabled: true });
    try {
      audioContext.decodeAudioData(
        sourceBuffer.buffer.slice(0),
        (buffer) => {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start(0);
          source.addEventListener('ended', () => {
            const audioPlayed = { ...this.state.audioPlayed };
            audioPlayed[assignment.id] = true;
            this.setState({ audioPlayed, playButtonsDisabled: false });
          });
        },
        (error) => {
          this.setState({ playButtonsDisabled: false });
          alert('Invalid audio recording');
        },
      );
    } catch (e) {
      this.setState({ playButtonsDisabled: false });
      alert('Web audio API not supported');
    }
  };

  /**
   * Set assignment quality
   */
  setAssignmentQuality = (assignment: MicrotaskAssignmentRecord, quality: AudioQuality) => {
    const audioQuality = { ...this.state.audioQuality };
    const audioQualityReason = { ...this.state.audioQualityReason };
    audioQuality[assignment.id] = quality;
    audioQualityReason[assignment.id] = audioQualityReasons[quality][0];
    const submitDisabled = Object.keys(audioQuality).length < Object.keys(this.state.currentAssignments).length;
    this.setState({ audioQuality, audioQualityReason, submitDisabled });
  };

  /**
   * Set audio quality reason
   */
  setQualityReason: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const audioQualityReason = { ...this.state.audioQualityReason };
    const assignmentId = Number.parseInt(e.currentTarget.id, 10);
    const reason = e.currentTarget.value;
    audioQualityReason[assignmentId] = reason;
    this.setState({ audioQualityReason });
  };

  /**
   * Handle form submission
   */
  handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();

    this.setState({ submitDisabled: true });
    const { audioQuality, audioQualityReason } = this.state;

    // Determine credits for each assignment
    const verifiedAssignments: MicrotaskAssignmentRecord[] = this.state.currentAssignments.map((assignment) => {
      return {
        ...assignment,
        credits: assignedCredits(audioQuality[assignment.id]),
        params: { ...assignment.params, feedback: audioQualityReason[assignment.id] },
      };
    });

    this.props.submitVerfications(verifiedAssignments);
  };

  /**
   * Render the verifier
   */
  render() {
    const { assignments } = this.props;
    const { audioRecording, audioPlayed, audioQuality, audioQualityReason, playButtonsDisabled } = this.state;
    const { currentMicrotask, currentAssignments } = this.state;

    if (assignments.length === 0) {
      return <div className='section'>Nothing to verify</div>;
    }

    if (currentMicrotask === undefined) {
      return <div className='section'>Waiting for microtask</div>;
    }

    if (!this.state.playerAvailable) {
      return <ErrorMessage message={['Browser does not support audio playback']} />;
    }

    const sentence = (currentMicrotask.input as { data: string }).data;

    return (
      <div>
        <div className='section'>
          <div className='row'>Check if all the recordings match the below sentence.</div>
        </div>
        <div className='row'>
          <div className='col s12 m10 l10'>
            <form onSubmit={this.handleSubmit}>
              <ul className='collection with-header'>
                <li className='collection-header red-text'>
                  <h4>{sentence}</h4>
                </li>
                {currentAssignments.map((assignment) => {
                  const playDisabled = playButtonsDisabled || audioRecording[assignment.id] === undefined;
                  return (
                    <li className='collection-item' key={assignment.id}>
                      <div className='row' style={{ marginBottom: '0px' }}>
                        <div className='col s1' style={{ lineHeight: '54px' }}>
                          <button
                            className='btn grey'
                            onClick={() => this.playRecordingForAssignment(assignment)}
                            disabled={playDisabled}
                          >
                            <i className='material-icons'>play_arrow</i>
                          </button>
                        </div>

                        {audioQualityValues.map((quality) => {
                          const disabled = !audioPlayed[assignment.id];
                          return (
                            <div className='col s2 center' key={quality} style={{ lineHeight: '54px' }}>
                              <label>
                                <input
                                  name={assignment.id.toString()}
                                  type='radio'
                                  checked={audioQuality[assignment.id] === quality}
                                  disabled={disabled}
                                  onChange={() => this.setAssignmentQuality(assignment, quality)}
                                />
                                <span>{quality}</span>
                              </label>
                            </div>
                          );
                        })}

                        <div className='col s5'>
                          <select
                            id={assignment.id.toString()}
                            value={audioQualityReason[assignment.id]}
                            onChange={this.setQualityReason}
                          >
                            {audioQuality[assignment.id]
                              ? audioQualityReasons[audioQuality[assignment.id]].map((reason, index) => (
                                  <option value={reason} key={index}>
                                    {reason}
                                  </option>
                                ))
                              : null}
                          </select>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className='row'>
                <button className='btn btn-large red tmar20' disabled={this.state.submitDisabled}>
                  Submit <i className='material-icons right'>send</i>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default SpeechDataVerifier;
