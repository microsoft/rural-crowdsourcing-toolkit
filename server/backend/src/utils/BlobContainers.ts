// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * File to define all the containers in the blob store.
 */

// Container parameters
export type BlobParameters =
  | {
      cname: 'lang-res';
      language_resource_id: number;
      language_id: number;
      ext: string;
    }
  | {
      cname: 'l-lrvs';
      language_id: number;
      ext: 'tar';
    }
  | {
      cname: 'lr-lrvs';
      language_resource_id: number;
      ext: 'tar';
    }
  | {
      cname: 'task-params';
      task_id: number;
      param_id: string;
      ext: string;
    }
  | {
      cname: 'task-input';
      task_id: number;
      ext: string;
    }
  | {
      cname: 'task-output';
      task_id: number;
      timestamp: string;
      ext: 'tgz';
    }
  | {
      cname: 'microtask-input';
      microtask_id: number;
      ext: string;
    }
  | {
      cname: 'microtask-assignment-output';
      microtask_assignment_id: number;
      ext: 'tgz';
    }
  | {
      cname: 'box-logs';
      box_id: number;
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
      worker_id: number;
      timestamp: string;
      ext: 'gz';
    };

// Container Name type and list
export type ContainerName = BlobParameters['cname'];
export const containerNames: readonly ContainerName[] = [
  'lang-res',
  'l-lrvs',
  'lr-lrvs',
  'task-params',
  'task-input',
  'microtask-input',
  'microtask-assignment-output',
  'task-output',
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
    case 'lang-res':
      return `${params.language_resource_id}-${params.language_id}.${params.ext}`;
    case 'l-lrvs':
      return `L-${params.language_id}.${params.ext}`;
    case 'lr-lrvs':
      return `LR-${params.language_resource_id}.${params.ext}`;
    case 'task-params':
      return `${params.task_id}-${params.param_id}.${params.ext}`;
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
