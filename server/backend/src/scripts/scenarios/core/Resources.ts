// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * List of core resources. Used to initialize the DB when reset.
 *
 * The resources are specified as a list of string resource objects. Each string
 * resource object can optionally be attached with a set of file resource
 * object. For all resources, the core and scenario_id fields are inferred from
 * the parent folder. The required field is set to true unless explicitly
 * specified in the record.
 */

import { ResourceSpec } from '../Index';

/**
 * List of resources
 */

export const resources: ResourceSpec[] = [
  // Main
  {
    str: {
      name: 'project_name',
      description: 'karya',
    },
  },

  // No internet connection or server down
  {
    str: {
      name: 'no_internet_or_server_down',
      description:
        'We are not able to reach our server. Please ensure you have internet turned on.',
    },
  },

  {
    str: {
      name: 'click_to_retry',
      description: 'Click this button to retry',
    },
  },

  {
    str: {
      name: 'unknown_error',
      description:
        'Unknown error occured. Please close the application and open again. If error persists, contact your project coordinator',
    },
  },

  // Salutation
  {
    str: {
      name: 'salutation',
      description: 'Hi',
    },
  },

  /**  Language selection activity */
  // show app in language
  {
    str: {
      name: 'show_app_in_language',
      description: 'Show the app in <language>',
      list_resource: true,
    },
  },

  // prompt for choosing a language
  {
    str: {
      name: 'prompt_for_language_select',
      description: 'To show app in <language>, press here',
      list_resource: true,
    },
    files: [
      {
        name: 'audio_prompt_for_language_select',
        description: 'Audio for language select prompt',
      },
    ],
  },

  /** Fetch data for language activity */
  // Fetching values for a language
  {
    str: {
      name: 'fetching_values_for_language',
      description:
        'Getting all necessary data to display the app in <language>',
    },
  },

  /** Consent form activity */
  {
    str: {
      name: 'consent_form_agree',
      description: 'I agree',
    },
  },

  {
    str: {
      name: 'consent_form_disagree',
      description: 'No. I do not want to participate',
    },
  },

  {
    str: {
      name: 'consent_form_text',
      description: 'HTML text for the consent form',
    },
  },

  {
    str: {
      name: 'consent_form_summary',
      description: 'Summarize the key points in the consent form',
    },

    files: [
      {
        name: 'audio_consent_form_summary',
        description: 'Audio for consent form summary',
      },
    ],
  },

  /** Creation code activity */
  // Creation code
  {
    str: {
      name: 'access_code_prompt',
      description:
        'You should have received a 16-digit access code from the project coordinator. Please enter that access code below.',
    },
    files: [
      {
        name: 'audio_access_code_prompt',
        description: 'Audio for the access code prompt',
      },
    ],
  },

  // Invalid creation code
  {
    str: {
      name: 'invalid_creation_code',
      description: 'You have entered an invalid creation code.',
    },
  },

  // Creation code is already used
  {
    str: {
      name: 'creation_code_already_used',
      description:
        'The creation code you have entered is already used. Please contact your project coordinator.',
    },
  },

  /** User sign-in and registration */
  // Register with the application using phone number
  {
    str: {
      name: 'phone_number_prompt',
      description:
        'To use Karya, you need to register with our application using your phone number. Please enter your phone number below.',
    },
    files: [
      {
        name: 'audio_phone_number_prompt',
        description: 'Audio for the registration prompt',
      },
    ],
  },

  /** Send OTP  */
  {
    str: {
      name: 'sending_otp',
      description: 'Sending OTP to your phone',
    },
  },

  {
    str: {
      name: 'unable_to_send_otp',
      description:
        'We were unable to send OTP to your number. Please try again later',
    },
  },

  // Enter OTP
  {
    str: {
      name: 'otp_prompt',
      description:
        'We have sent you a 6-digit OTP via SMS. Please enter that OTP below',
    },
    files: [
      {
        name: 'audio_otp_prompt',
        description: 'Audio for OTP prompt',
      },
    ],
  },

  // Invalid OTP
  {
    str: {
      name: 'invalid_otp',
      description: 'You have entered an invalid OTP',
    },
  },

  // Resend OTP
  {
    str: {
      name: 'resend_otp',
      description: 'Resend OTP',
    },
  },

  // Choose your profile picture (take a picture)
  {
    str: {
      name: 'profile_picture_prompt',
      description:
        'Please click your profile picture. You can skip this step if you do not want a profile picture',
    },
    files: [
      {
        name: 'audio_profile_picture_prompt',
        description: 'Audio for the profile picture prompt',
      },
    ],
  },

  // Choose your gender
  {
    str: {
      name: 'gender_prompt',
      description:
        'Please choose your gender. If you do not wish to state your gender, you can skip this step',
    },
    files: [
      {
        name: 'audio_gender_prompt',
        description: 'Audio for gender prompt',
      },
    ],
  },

  {
    str: {
      name: 'male',
      description: 'Male',
    },
  },

  {
    str: {
      name: 'female',
      description: 'Female',
    },
  },

  // Enter your age
  {
    str: {
      name: 'age_prompt',
      description: 'Please choose your age group',
    },
    files: [
      {
        name: 'audio_age_prompt',
        description: 'Audio for the age prompt',
      },
    ],
  },

  {
    str: {
      name: 'years',
      description: 'years',
    },
  },

  /** Register worker screen */
  {
    str: {
      name: 'registering_worker',
      description: 'Registering worker with the server',
    },
  },

  {
    str: {
      name: 'phone_number_already_used',
      description:
        'Your phone number is already registered. Please try with another phone number.',
    },
  },

  /** Language skill specification screen */

  // We have three questions about your skills in <language>
  // Please click on the appropriate button
  {
    str: {
      name: 'skill_question_description',
      description:
        'We have three questions about your skills in <language>. For each question, please click <tick> for yes, and <cross> for no.',
      list_resource: true,
    },
    files: [
      {
        name: 'audio_skill_question_description',
        description: 'Audio for skill question description',
      },
    ],
  },

  // Can you read in <language>
  {
    str: {
      name: 'read_skill_question',
      description: 'Can you read in <language>?',
      list_resource: true,
    },
    files: [
      {
        name: 'audio_read_skill_question',
        description: 'Audio for read skill question',
      },
    ],
  },

  // Can you speak in <language>
  {
    str: {
      name: 'speak_skill_question',
      description: 'Can you speak in <language>?',
      list_resource: true,
    },
    files: [
      {
        name: 'audio_speak_skill_question',
        description: 'Audio for speak skill question',
      },
    ],
  },

  // Can you type in <language>
  {
    str: {
      name: 'type_skill_question',
      description: 'Can you type in <language>?',
      list_resource: true,
    },
    files: [
      {
        name: 'audio_type_skill_question',
        description: 'Audio for type skill question',
      },
    ],
  },

  // Registering skill
  {
    str: {
      name: 'registering_skill',
      description: 'Registering new skill for worker',
    },
  },

  {
    str: {
      name: 'failed_to_register_skill',
      description: 'Failed to register new skill for worker',
    },
  },

  // If you know any other language, please select that language
  {
    str: {
      name: 'other_language_selection',
      description:
        'If you know any other language, please select that language below',
    },
    files: [
      {
        name: 'audio_other_language_selection',
        description: 'Audio for other language selection',
      },
    ],
  },

  /** Sync screen */
  // Upload files
  {
    str: {
      name: 'uploading_files',
      description: 'Uploading files to the box',
    },
  },

  // Send updates
  {
    str: {
      name: 'send_updates',
      description: 'Sending updates to the box',
    },
  },

  // Receive updates
  {
    str: {
      name: 'receive_updates',
      description: 'Receiving updates from the box',
    },
  },

  // Download files
  {
    str: {
      name: 'downloading_files',
      description: 'Downloading files from the box',
    },
  },

  /** Dashboad Screen */

  // Sync text parts
  {
    str: {
      name: 'get_new_tasks',
      description: 'Get new tasks',
    },
  },

  {
    str: {
      name: 'submit_completed_tasks',
      description: 'Submit completed tasks',
    },
  },

  {
    str: {
      name: 'update_verified_tasks',
      description: 'Update verified tasks',
    },
  },

  {
    str: {
      name: 'update_earning',
      description: 'Update earnings',
    },
  },

  // Task card parts
  {
    str: {
      name: 'tasks_available',
      description: 'tasks available',
    },
  },

  {
    str: {
      name: 'tasks_completed',
      description: 'tasks completed',
    },
  },

  {
    str: {
      name: 'tasks_submitted',
      description: 'tasks submitted',
    },
  },

  {
    str: {
      name: 'tasks_verified',
      description: 'tasks verified',
    },
  },

  // Update app language
  {
    str: {
      name: 'update_app_language',
      description: 'Change the App Language',
    },
  },

  // Update skills
  {
    str: {
      name: 'update_skills',
      description: 'Update Language Skills',
    },
  },

  // Sync dialog box
  {
    str: {
      name: 'sync_prompt_message',
      description:
        'You have completed tasks that can be submitted to the server. Do you want to submit the tasks now?',
    },
  },

  {
    str: {
      name: 'yes',
      description: 'Yes',
    },
  },

  {
    str: {
      name: 'no',
      description: 'no',
    },
  },
];
