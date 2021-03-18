// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Interface file for the frontend config

interface IConfig {
  backend: {
    url: string;
  };

  googleOAuthClientID: string;
}

export default IConfig;
