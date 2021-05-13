// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// This file defines all custom strings for the database specification that are
// not defined anywhere else.

// Server Role
const serverRoles = ['ADMIN', 'WORK_PROVIDER'] as const;
export type ServerRole = typeof serverRoles[number];

// Gender
const genders = ['MALE', 'FEMALE', 'NOT_SPECIFIED'] as const;
export type Gender = typeof genders[number];

// File Creator
const fileCreators = ['SERVER', 'BOX', 'WORKER'] as const;
export type FileCreator = typeof fileCreators[number];

// Task Status
const taskStatuses = ['SUBMITTED', 'APPROVED', 'COMPLETED'] as const;
export type TaskStatus = typeof taskStatuses[number];

// Microtask Status
const microtaskStatuses = ['INCOMPLETE', 'COMPLETED'] as const;
export type MicrotaskStatus = typeof microtaskStatuses[number];

// Task Op Type -- TODO: move to task op handlers
const taskOpTypes = ['PROCESS_INPUT', 'GENERATE_OUTPUT'] as const;
export type TaskOpType = typeof taskOpTypes[number];

// Task Op Status -- TODO: move to task op handlers
const taskOpStatuses = ['CREATED', 'RUNNING', 'COMPLETED', 'FAILED'] as const;
export type TaskOpStatus = typeof taskOpStatuses[number];

// Chain Name -- TODO: move to task chaining module
const chainNames = ['TEST'] as const;
export type ChainName = typeof chainNames[number];

// Chain Status -- TODO: move to task chaining module
const chainStatuses = ['ACTIVE', 'INACTIVE'] as const;
export type ChainStatus = typeof chainStatuses[number];

// Task Assignment Status
const taskAssignmentStatuses = ['ASSIGNED', 'COMPLETED'] as const;
export type TaskAssignmentStatus = typeof taskAssignmentStatuses[number];

// Microtask Assignment Status
const microtaskAssignmentStatuses = ['ASSIGNED', 'COMPLETED', 'SKIPPED', 'EXPIRED', 'VERIFIED'] as const;
export type MicrotaskAssignmentStatus = typeof microtaskAssignmentStatuses[number];
