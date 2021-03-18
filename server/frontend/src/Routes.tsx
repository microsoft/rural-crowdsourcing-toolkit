// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from 'react';
import { Route, Switch } from 'react-router-dom';

// Admin router
import { AdminRoute, WorkProviderRoute } from './components/auth/ProtectedRoutes';

/** Auth components */
import SignIn from './components/auth/SignIn';
import SignOut from './components/auth/SignOut';
import SignUp from './components/auth/SignUp';
import Unauthorized from './components/auth/Unauthorized';

/** Dashboard components */
import AdminDashboard from './components/dashboard/AdminDashboard';
import WorkProviderDashboard from './components/dashboard/WorkProviderDashboard';

/** language components */
import CreateUpdateLanguage from './components/language/CreateUpdateLanguage';
import LanguageList from './components/language/LanguageList';

/** scenario components */
import Verifier from './components/scenario/common/Verifier'
import ScenarioDetail from './components/scenario/ScenarioDetail';
import ScenarioList from './components/scenario/ScenarioList';

/** language_resource components */
import LanguageResourceList from './components/language_resource/LanguageResourceList';

/** language_resource_value components */
import LanguageResourceValueList from './components/language_resource_value/LanguageResourceValueList';

/** task components */
import CreateTask from './components/task/CreateTask';
import TaskDetail from './components/task/TaskDetail';
import TaskList from './components/task/TaskList';

/** microtask components */
import MicrotaskList from './components/microtask/MicrotaskList'

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

    {/**  Dashboard routes */}
    <AdminRoute path='/admin-dashboard' component={AdminDashboard} />
    <WorkProviderRoute path='/wp-dashboard' component={WorkProviderDashboard} />

    {/**  Language routes */}
    <WorkProviderRoute exact path='/language' component={LanguageList} />
    <AdminRoute exact path='/language/create' component={CreateUpdateLanguage} />
    <AdminRoute exact path='/language/update/:id' component={CreateUpdateLanguage} />

    {/** Scenario routes */}
    <WorkProviderRoute exact path='/scenario' component={ScenarioList} />
    <WorkProviderRoute exact path='/scenario/:id' component={ScenarioDetail} />

    {/** Language resource routes */}
    <AdminRoute exact path='/scenario/:id/resources' component={LanguageResourceList} />

    {/** Language resource value routes */}
    <AdminRoute exact path='/language-support/' component={LanguageResourceValueList} />

    {/** Task routes */}
    <WorkProviderRoute exact path='/task/create' component={CreateTask} />
    <WorkProviderRoute exact path='/task' component={TaskList} />
    <WorkProviderRoute exact path='/task/:id' component={TaskDetail} />

    {/** Work Provider routes */}
    <AdminRoute exact path='/work_provider' component={WorkProviderList} />

    {/** Box routes */}
    <AdminRoute exact path='/box' component={BoxList} />

    {/** Task assignment routes */}
    <AdminRoute exact path='/task-assignments' component={TaskAssignmentList} />
    <AdminRoute exact path='/task-assignments/create' component={CreateTaskAssignment} />

    {/** Microtask lists */}
    <WorkProviderRoute exact path='/task/:task_id/microtasks' component={MicrotaskList} />

    {/** Verifier */}
    <AdminRoute exact path='/task/:id/verify' component={Verifier} />

  </Switch>
);

export default Routes;
