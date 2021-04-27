// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// This file defines all custom strings for the database specification that are
// not defined anywhere else.

// Server Role
const serverRoles = ['admin', 'work_provider'] as const;
export type ServerRole = typeof serverRoles[number];

// Auth Provider -- TODO: move this to a auth provider module
const authProviders = ['phone_otp', 'google_oauth'] as const;
export type AuthProvider = typeof authProviders[number];

// Gender
const genders = ['male', 'female', 'not_specified'] as const;
export type Gender = typeof genders[number];

// File Creator
const fileCreators = ['server', 'box', 'worker'] as const;
export type FileCreator = typeof fileCreators[number];

// Checksum Algorithm -- TODO: move this to checksum provider
const checksumAlgorithms = ['md5'] as const;
export type ChecksumAlgorithm = typeof checksumAlgorithms[number];

// Task Status
const taskStatuses = ['submitted', 'approved', 'completed'] as const;
export type TaskStatus = typeof taskStatuses[number];

// Microtask Status
const microtaskStatuses = ['incomplete', 'completed'] as const;
export type MicrotaskStatus = typeof microtaskStatuses[number];

// Task Op Type -- TODO: move to task op handlers
const taskOpTypes = ['process_input', 'generate_output'] as const;
export type TaskOpType = typeof taskOpTypes[number];

// Task Op Status -- TODO: move to task op handlers
const taskOpStatuses = ['created', 'running', 'completed', 'failed'] as const;
export type TaskOpStatus = typeof taskOpStatuses[number];

// Chain Name -- TODO: move to task chaining module
const chainNames = ['test'] as const;
export type ChainName = typeof chainNames[number];

// Chain Status -- TODO: move to task chaining module
const chainStatuses = ['active', 'inactive'] as const;
export type ChainStatus = typeof chainStatuses[number];

// Task Assignment Status
const taskAssignmentStatuses = ['assigned', 'completed'] as const;
export type TaskAssignmentStatus = typeof taskAssignmentStatuses[number];

// Microtask Assignment Status
const microtaskAssignmentStatuses = ['assigned', 'completed', 'skipped', 'expired', 'submitted', 'verified'];
export type MicrotaskAssignmentStatus = typeof microtaskAssignmentStatuses[number];
