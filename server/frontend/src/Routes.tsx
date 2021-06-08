// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from 'react';
import { Route, Switch } from 'react-router-dom';

// Admin router
import { AdminRoute, WorkProviderRoute } from './components/auth/ProtectedRoutes';

/** Auth components */
import LoginRegister from './components/auth/LoginRegister';
import SignIn from './components/auth/SignIn';
import SignOut from './components/auth/SignOut';
import SignUp from './components/auth/SignUp';
import Unauthorized from './components/auth/Unauthorized';

/** Dashboard components */
import AdminDashboard from './components/dashboard/AdminDashboard';
import WorkProviderDashboard from './components/dashboard/WorkProviderDashboard';

/** task components */
import CreateTask from './components/task/CreateTask';
import ngCreateTask from './components/task/ngCreateTask';
import TaskDetail from './components/task/TaskDetail';
import TaskList from './components/task/TaskList';

/** work_provider components */
import WorkProviderList from './components/work_provider/WorkProviderList';

/** box components */
import BoxList from './components/box/BoxList';

/** task assignment components */
import CreateTaskAssignment from './components/task_assignment/CreateTaskAssignment';
import TaskAssignmentList from './components/task_assignment/TaskAssignmentList';

const Routes = (
  <Switch>
    {/** Auth routes */}
    <Route exact path='/signup' component={SignUp} />
    <Route exact path='/signin' component={SignIn} />
    <Route exact path='/signout' component={SignOut} />
    <Route exact path='/unauthorized' component={Unauthorized} />
    <Route exact path='/login' component={LoginRegister} />

    {/**  Dashboard routes */}
    <AdminRoute path='/admin-dashboard' component={AdminDashboard} />
    <WorkProviderRoute path='/wp-dashboard' component={WorkProviderDashboard} />

    {/** Task routes */}
    <WorkProviderRoute exact path='/task/create' component={CreateTask} />
    <WorkProviderRoute exact path='/task' component={TaskList} />
    <WorkProviderRoute exact path='/task/:id' component={TaskDetail} />
    <WorkProviderRoute exact path='/tasks/create' component={ngCreateTask} />

    {/** Work Provider routes */}
    <AdminRoute exact path='/work_provider' component={WorkProviderList} />

    {/** Box routes */}
    <AdminRoute exact path='/box' component={BoxList} />

    {/** Task assignment routes */}
    <AdminRoute exact path='/task-assignments' component={TaskAssignmentList} />
    <AdminRoute exact path='/task-assignments/create' component={CreateTaskAssignment} />
  </Switch>
);

export default Routes;
