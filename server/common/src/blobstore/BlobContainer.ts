// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// File to define all the containers in the blob store.

import { LanguageCode } from '../Index';

// Container parameters
export type BlobParameters =
  | {
      cname: 'language-assets';
      language_code: LanguageCode;
      ext: 'tgz';
    }
  | {
      cname: 'task-input';
      task_id: string;
      file_id: string;
      ext: 'tgz';
    }
  | {
      cname: 'task-output';
      task_id: string;
      timestamp: string;
      ext: 'tgz';
    }
  | {
      cname: 'microtask-input';
      microtask_id: string;
      ext: 'tgz';
    }
  | {
      cname: 'microtask-assignment-output';
      microtask_assignment_id: string;
      ext: 'tgz';
    }
  | {
      cname: 'box-logs';
      box_id: string;
      timestamp: string;
      ext: 'gz';
    }
  | {
      cname: 'server-logs';
      timestamp: string;
      ext: 'gz';
    }
  | {
      cname: 'worker-logs';
      worker_id: string;
      timestamp: string;
      ext: 'gz';
    };

// Container Name type and list
export type ContainerName = BlobParameters['cname'];
export const containerNames: readonly ContainerName[] = [
  'language-assets',
  'task-input',
  'task-output',
  'microtask-input',
  'microtask-assignment-output',
  'server-logs',
  'box-logs',
  'worker-logs',
] as const;

/**
 * Return the blobname given the parameters and extension
 * @param params Name parameters for the blob name
 */
export function getBlobName(params: BlobParameters): string {
  switch (params.cname) {
    case 'language-assets':
      return `${params.language_code}.${params.ext}`;
    case 'task-input':
      return `${params.task_id}.${params.ext}`;
    case 'task-output':
      return `${params.task_id}-${params.timestamp}.${params.ext}`;
    case 'microtask-input':
      return `${params.microtask_id}.${params.ext}`;
    case 'microtask-assignment-output':
      return `${params.microtask_assignment_id}.${params.ext}`;
    case 'box-logs':
      return `${params.box_id}-${params.timestamp}.${params.ext}`;
    case 'server-logs':
      return `${params.timestamp}.${params.ext}`;
    case 'worker-logs':
      return `${params.worker_id}-${params.timestamp}.${params.ext}`;
  }
}
