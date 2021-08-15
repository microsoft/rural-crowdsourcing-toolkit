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
import ngCreateTask from './components/task/ngCreateTask';
import ngTaskDetail from './components/task/ngTaskDetail';
import ngTaskList from './components/task/ngTaskList';

/** work_provider components */
import ngWorkProviderList from './components/work_provider/ngWorkProviderList';

/** worker components */
import WorkerOverview from './components/worker/WorkerOverview';

/** box components */
import ngBoxList from './components/box/ngBoxList';

/** task assignment components */
import ngCreateTaskAssignment from './components/task_assignment/ngCreateTaskAssignment';
import ngTaskAssignmentList from './components/task_assignment/ngTaskAssignmentList';

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
    <WorkProviderRoute exact path='/task' component={ngTaskList} />
    <WorkProviderRoute exact path='/task/create' component={ngCreateTask} />
    <WorkProviderRoute exact path='/task/:id' component={ngTaskDetail} />

    {/** Work Provider routes */}
    <AdminRoute exact path='/work_provider' component={ngWorkProviderList} />

    {/** Worker routes */}
    <AdminRoute exact path='/worker' component={WorkerOverview} />
    
    {/** Box routes */}
    <AdminRoute exact path='/box' component={ngBoxList} />

    {/** Task assignment routes */}
    <AdminRoute exact path='/task-assignments' component={ngTaskAssignmentList} />
    <AdminRoute exact path='/task-assignments/create' component={ngCreateTaskAssignment} />
    
    {/** Language routes */}
    <AdminRoute exact path='/lang-assets' component={LangAsset} />

    </Switch>
    </div>
    </main>
    </>
  </Switch>
);

export default Routes;
