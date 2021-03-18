// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This file defines the types for the HTTP responses. This file will be shared
 * between the different repos.
 *
 * The source of this file will live in the backend repo. All other repos will
 * get a copy from the backend repo. In that sense no other repo should modify
 * this file.
 */

/** Body type for errors */
export type ErrorBody = {
  title: string;
  messages: string[];
};
