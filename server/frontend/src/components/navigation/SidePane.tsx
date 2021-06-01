// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from 'react';
import { NavLink } from 'react-router-dom';

const SidePane = () => {
  return (
    <ul>
      <li>
        <NavLink to='/admin-dashboard'>Admin Dashboard</NavLink>
      </li>
      <li>
        <NavLink to='/wp-dashboard'>WP Dashboard</NavLink>
      </li>
      <li>
        <NavLink to='/profile'>Profile</NavLink>
      </li>
      <li>
        <NavLink to='/work_provider'>Work Providers</NavLink>
      </li>
      <li>
        <NavLink to='/task'>Tasks</NavLink>
      </li>
      <li>
        <NavLink to='/box'>Karya Box</NavLink>
      </li>
      <li>
        <NavLink to='/task-assignments'>Task Assignments</NavLink>
      </li>
    </ul>
  );
};

export default SidePane;
