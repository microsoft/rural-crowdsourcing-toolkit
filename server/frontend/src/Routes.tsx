// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from 'react';
import { Route, Switch } from 'react-router-dom';

// Admin router
import { AdminRoute, WorkProviderRoute } from './components/auth/ProtectedRoutes';

/** Auth components */
import LoginRegister from './components/auth/LoginRegister';
import SignOut from './components/auth/SignOut';
import Unauthorized from './components/auth/Unauthorized';

/** Nav component */
import NavBar from './components/navigation/NavBar';

/** Dashboard components */
import AdminDashboard from './components/dashboard/AdminDashboard';
import WorkProviderDashboard from './components/dashboard/WorkProviderDashboard';

/** task components */
import CreateTask from './components/task/CreateTask';
import TaskDetail from './components/task/TaskDetail';
import TaskList from './components/task/TaskList';

/** work_provider components */
import WorkProviderList from './components/work_provider/WorkProviderList';

/** worker components */
import WorkerOverview from './components/worker/WorkerOverview';

/** box components */
import ngBoxList from './components/box/BoxList';

/** task assignment components */
import CreateTaskAssignment from './components/task_assignment/CreateTaskAssignment';
import TaskAssignmentList from './components/task_assignment/TaskAssignmentList';

/** language components */
import LangAsset from './components/lang/LangAsset';

const Routes = (
  <Switch>
    {/** Auth routes */}
    <Route exact path='/signout' component={SignOut} />
    <Route exact path='/unauthorized' component={Unauthorized} />
    <Route exact path='/login' component={LoginRegister} />
    <Route exact path='/' component={LoginRegister} />
    
    <>
    <NavBar />
    <main>
    <div id='main-container' className='container'>
    <Switch>
    {/**  Dashboard routes */}
    <AdminRoute path='/admin-dashboard' component={AdminDashboard} />
    <WorkProviderRoute path='/wp-dashboard' component={WorkProviderDashboard} />

    {/** Task routes */}
    <WorkProviderRoute exact path='/task' component={TaskList} />
    <WorkProviderRoute exact path='/task/create' component={CreateTask} />
    <WorkProviderRoute exact path='/task/edit/:id' component={CreateTask} />
    <WorkProviderRoute exact path='/task/:id' component={TaskDetail} />

    {/** Work Provider routes */}
    <AdminRoute exact path='/work_provider' component={WorkProviderList} />

    {/** Worker routes */}
    <AdminRoute exact path='/worker' component={WorkerOverview} />
    
    {/** Box routes */}
    <AdminRoute exact path='/box' component={ngBoxList} />

    {/** Task assignment routes */}
    <AdminRoute exact path='/task-assignments' component={TaskAssignmentList} />
    <AdminRoute exact path='/task-assignments/create' component={CreateTaskAssignment} />
    
    {/** Language routes */}
    <AdminRoute exact path='/lang-assets' component={LangAsset} />

    </Switch>
    </div>
    </main>
    </>
  </Switch>
);

export default Routes;
