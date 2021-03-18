// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * List of resources for speech-data scenario
 */

import { ResourceSpec } from '../Index';

/**
 * List of speech-data resources
 */
export const resources: ResourceSpec[] = [
  // Recording activity
  {
    str: {
      name: 'record_sentence',
      description: 'You have to record yourself speaking out this sentence',
    },
    files: [
      {
        name: 'audio_record_sentence',
        description: 'Audio for record sentence',
      },
    ],
  },

  {
    str: {
      name: 'record_action',
      description:
        'To start recording, press this button. It will turn red indicating that the recording has started.',
    },
    files: [
      {
        name: 'audio_record_action',
        description: 'Audio for record action',
      },
    ],
  },

  {
    str: {
      name: 'stop_action',
      description:
        'Once you are done recording, press this button again to stop the recording',
    },
    files: [
      {
        name: 'audio_stop_action',
        description: 'Audio for stop action',
      },
    ],
  },

  {
    str: {
      name: 'listen_action',
      description:
        'The app will play back the recorded audio. Listen to it carefully to ensure it is correct and that there is no other background voice.',
    },
    files: [
      {
        name: 'audio_listen_action',
        description: 'Audio for listen action',
      },
    ],
  },

  {
    str: {
      name: 'rerecord_action',
      description:
        'If your recording is not correct, you can record again using the record button.',
    },
    files: [
      {
        name: 'audio_rerecord_action',
        description: 'Audio for rerecord action',
      },
    ],
  },

  {
    str: {
      name: 'next_action',
      description:
        'If you are happy with the recording, you can press this button to go to the next sentence.',
    },
    files: [
      {
        name: 'audio_next_action',
        description: 'Audio for next action',
      },
    ],
  },

  {
    str: {
      name: 'previous_action',
      description: 'You can press this button to go to the previous sentence.',
    },
    files: [
      {
        name: 'audio_previous_action',
        description: 'Audio for previous action',
      },
    ],
  },
];
