// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// HTTP helper utils to send requests to the server

import axios from 'axios';
import { envGetString } from '@karya/misc-utils';

// Get server URL from environment
const serverUrl = envGetString('BACKEND_SERVER_URL');

// Set axios defaults
axios.defaults.baseURL = `${serverUrl}/api_box`;
export { axios };
