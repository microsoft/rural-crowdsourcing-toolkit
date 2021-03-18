// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import IConfig from './IConfig';
import localConfig from './Local';

// Load production config if appropriate NODE_ENV
const config: IConfig = localConfig;

export default config;
