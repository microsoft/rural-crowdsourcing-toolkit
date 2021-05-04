// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// List of container names

export const containerNames = [
  'language-assets',
  'task-input',
  'task-output',
  'microtask-input',
  'microtask-assignment-output',
  'server-logs',
  'box-logs',
  'worker-logs',
] as const;
export type ContainerName = typeof containerNames[number];
