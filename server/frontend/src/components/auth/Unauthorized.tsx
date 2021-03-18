// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';

class Unauthorized extends React.Component {
  state = {};
  render() {
    return <p>You are not allowed to access the requested page</p>;
  }
}

export default Unauthorized;
