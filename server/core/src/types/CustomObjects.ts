// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// This file defines all custom objects for the database specification that are
// not defined anywhere else.

// Microtask Input
export type MicrotaskInput<InputData = object, InputFile = string> = {
  data: InputData;
  files?: InputFile[];
};

// Microtask Output
export type MicrotaskOutput<OutputData = object, OutputFile = string> = {
  data: OutputData;
  files?: OutputFile[];
};
