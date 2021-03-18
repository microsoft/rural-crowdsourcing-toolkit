// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import IConfig from './ConfigInterface';

import devConfig from './Development';

// Load production config if appropriate NODE_ENV
const config: IConfig = devConfig;

export default config;
