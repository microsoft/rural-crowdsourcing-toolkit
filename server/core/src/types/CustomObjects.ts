// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// This file defines all custom objects for the database specification that are
// not defined anywhere else.

// Microtask Input
export type MicrotaskInput<InputData = object, InputFiles = { [id: string]: string }> = {
  data: InputData;
  files?: InputFiles;
};

// Microtask Output
export type MicrotaskOutput<OutputData = object, OutputFiles = { [id: string]: string }> = {
  data: OutputData;
  files?: OutputFiles;
};
