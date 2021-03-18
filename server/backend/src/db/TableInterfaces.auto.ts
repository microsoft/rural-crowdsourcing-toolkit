// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This file was auto-generated using specs and scripts in the db-schema
 * repository. DO NOT EDIT DIRECTLY.
 */

export type AssignmentGranularityType = 'group' | 'microtask' | 'either';

export type AssignmentOrderType = 'sequential' | 'random' | 'either';

export type LanguageResourceType = 'string_resource' | 'file_resource';

export type TaskStatus =
  | 'created'
  | 'submitted'
  | 'validating'
  | 'validated'
  | 'invalid'
  | 'approving'
  | 'approved'
  | 'assigned'
  | 'completed';

export type MicrotaskGroupStatus = 'incomplete' | 'completed';

export type MicrotaskStatus = 'incomplete' | 'completed';

export type TaskAssignmentStatus = 'assigned' | 'sent' | 'completed';

export type MicrotaskGroupAssignmentStatus =
  | 'assigned'
  | 'incomplete'
  | 'completed'
  | 'submitted';

export type MicrotaskAssignmentStatus =
  | 'assigned'
  | 'incomplete'
  | 'skipped'
  | 'expired'
  | 'completed'
  | 'submitted'
  | 'verified';

export type PayoutInfoStatus = 'submitted' | 'verified';

export type PaymentRequestStatus =
  | 'requested'
  | 'approved'
  | 'denied'
  | 'failed'
  | 'paid';

export type FileCreator = 'karya_server' | 'karya_box' | 'karya_client';

export type ChecksumAlgorithm = 'md5';

export type AuthProviderType = 'google_oauth' | 'phone_otp';

export type LanguageRecord = {
  id: number;
  name: string;
  primary_language_name: string;
  locale: string;
  iso_639_3_code: string;
  script: string | null;
  string_support: boolean;
  file_support: boolean;
  list_support: boolean;
  update_lrv_file: boolean;
  lrv_file_id: number | null;
  params: object;
  created_at: string;
  last_updated_at: string;
};

export type ScenarioRecord = {
  id: number;
  name: string;
  full_name: string;
  description: string;
  task_params: object;
  assignment_granularity: AssignmentGranularityType;
  group_assignment_order: AssignmentOrderType;
  microtask_assignment_order: AssignmentOrderType;
  synchronous_validation: boolean;
  enabled: boolean;
  skills: object;
  params: object;
  created_at: string;
  last_updated_at: string;
};

export type LanguageResourceRecord = {
  id: number;
  core: boolean;
  scenario_id: number | null;
  string_resource_id: number | null;
  type: LanguageResourceType;
  list_resource: boolean;
  name: string;
  description: string;
  required: boolean;
  update_lrv_file: boolean;
  lrv_file_id: number | null;
  params: object;
  created_at: string;
  last_updated_at: string;
};

export type LanguageResourceValueRecord = {
  id: number;
  language_id: number;
  language_resource_id: number;
  value: string;
  valid: boolean;
  need_update: boolean;
  params: object;
  created_at: string;
  last_updated_at: string;
};

export type WorkProviderRecord = {
  id: number;
  admin: boolean;
  creation_code: string;
  full_name: string;
  auth_provider: AuthProviderType | null;
  username: string | null;
  salt: string | null;
  passwd_hash: string | null;
  phone_number: string;
  email: string;
  oauth_id: string | null;
  id_token: string | null;
  params: object;
  created_at: string;
  last_updated_at: string;
};

export type BoxRecord = {
  id: number;
  creation_code: string;
  physical: boolean;
  name: string;
  location_name: string | null;
  gps_location: string | null;
  hw_address: string | null;
  url: string | null;
  salt: string | null;
  key: string | null;
  last_sent_to_server_at: string;
  last_received_from_server_at: string;
  params: object;
  created_at: string;
  last_updated_at: string;
};

export type WorkerRecord = {
  id: number;
  local_id: number;
  box_id: number;
  creation_code: string;
  auth_provider: AuthProviderType | null;
  username: string | null;
  salt: string | null;
  passwd_hash: string | null;
  phone_number: string | null;
  email: string | null;
  oauth_id: string | null;
  id_token: string | null;
  full_name: string | null;
  profile_picture: string | null;
  age: string | null;
  gender: string | null;
  app_language: number | null;
  last_sent_to_box_at: string;
  last_received_from_box_at: string;
  last_sent_to_server_at: string;
  last_received_from_server_at: string;
  params: object;
  created_at: string;
  last_updated_at: string;
};

export type KaryaFileRecord = {
  id: number;
  local_id: number;
  box_id: number | null;
  container_name: string;
  name: string;
  url: string | null;
  creator: FileCreator;
  worker_id: number | null;
  algorithm: ChecksumAlgorithm;
  checksum: string;
  in_box: boolean;
  in_server: boolean;
  params: object;
  created_at: string;
  last_updated_at: string;
};

export type TaskRecord = {
  id: number;
  work_provider_id: number;
  language_id: number;
  scenario_id: number;
  name: string;
  description: string;
  primary_language_name: string;
  primary_language_description: string;
  params: object;
  errors: object;
  actions: object;
  input_file_id: number | null;
  output_file_id: number | null;
  budget: number | null;
  deadline: string | null;
  assignment_granularity: AssignmentGranularityType;
  group_assignment_order: AssignmentOrderType;
  microtask_assignment_order: AssignmentOrderType;
  status: TaskStatus;
  created_at: string;
  last_updated_at: string;
};

export type MicrotaskGroupRecord = {
  id: number;
  task_id: number;
  microtask_assignment_order: AssignmentOrderType;
  status: MicrotaskGroupStatus;
  params: object;
  created_at: string;
  last_updated_at: string;
};

export type MicrotaskRecord = {
  id: number;
  task_id: number;
  group_id: number | null;
  input: object;
  input_file_id: number | null;
  deadline: string | null;
  credits: number;
  status: MicrotaskStatus;
  output: object;
  params: object;
  created_at: string;
  last_updated_at: string;
};

export type PolicyRecord = {
  id: number;
  scenario_id: number;
  name: string;
  description: string;
  params: object;
  created_at: string;
  last_updated_at: string;
};

export type TaskAssignmentRecord = {
  id: number;
  task_id: number;
  box_id: number;
  policy_id: number;
  deadline: string | null;
  status: TaskAssignmentStatus;
  params: object;
  created_at: string;
  last_updated_at: string;
};

export type WorkerLanguageSkillRecord = {
  id: number;
  local_id: number;
  box_id: number;
  worker_id: number;
  language_id: number;
  can_speak: boolean;
  can_type: boolean;
  can_read: boolean;
  can_listen: boolean;
  speak_score: number | null;
  type_score: number | null;
  read_score: number | null;
  listen_score: number | null;
  params: object;
  created_at: string;
  last_updated_at: string;
};

export type MicrotaskGroupAssignmentRecord = {
  id: number;
  local_id: number;
  box_id: number;
  microtask_group_id: number;
  worker_id: number;
  status: MicrotaskGroupAssignmentStatus;
  params: object;
  created_at: string;
  last_updated_at: string;
};

export type MicrotaskAssignmentRecord = {
  id: number;
  local_id: number;
  box_id: number;
  microtask_id: number;
  worker_id: number;
  deadline: string | null;
  status: MicrotaskAssignmentStatus;
  completed_at: string | null;
  output: object;
  output_file_id: number | null;
  credits: number | null;
  params: object;
  created_at: string;
  last_updated_at: string;
};

export type PayoutMethodRecord = {
  id: number;
  name: string;
  description: string;
  required_info: object;
  enabled: boolean;
  created_at: string;
  last_updated_at: string;
};

export type PayoutInfoRecord = {
  id: number;
  local_id: number;
  box_id: number;
  worker_id: number;
  method_id: number;
  info: object;
  status: PayoutInfoStatus;
  enabled: boolean;
  params: object;
  created_at: string;
  last_updated_at: string;
};

export type PaymentRequestRecord = {
  id: number;
  local_id: number;
  box_id: number;
  payout_info_id: number;
  amount: number;
  status: PaymentRequestStatus;
  reference: string | null;
  params: object;
  created_at: string;
  last_updated_at: string;
};

export type Language = Partial<LanguageRecord>;
export type Scenario = Partial<ScenarioRecord>;
export type LanguageResource = Partial<LanguageResourceRecord>;
export type LanguageResourceValue = Partial<LanguageResourceValueRecord>;
export type WorkProvider = Partial<WorkProviderRecord>;
export type Box = Partial<BoxRecord>;
export type Worker = Partial<WorkerRecord>;
export type KaryaFile = Partial<KaryaFileRecord>;
export type Task = Partial<TaskRecord>;
export type MicrotaskGroup = Partial<MicrotaskGroupRecord>;
export type Microtask = Partial<MicrotaskRecord>;
export type Policy = Partial<PolicyRecord>;
export type TaskAssignment = Partial<TaskAssignmentRecord>;
export type WorkerLanguageSkill = Partial<WorkerLanguageSkillRecord>;
export type MicrotaskGroupAssignment = Partial<MicrotaskGroupAssignmentRecord>;
export type MicrotaskAssignment = Partial<MicrotaskAssignmentRecord>;
export type PayoutMethod = Partial<PayoutMethodRecord>;
export type PayoutInfo = Partial<PayoutInfoRecord>;
export type PaymentRequest = Partial<PaymentRequestRecord>;

export type DbTableName =
  | 'language'
  | 'scenario'
  | 'language_resource'
  | 'language_resource_value'
  | 'work_provider'
  | 'box'
  | 'worker'
  | 'karya_file'
  | 'task'
  | 'microtask_group'
  | 'microtask'
  | 'policy'
  | 'task_assignment'
  | 'worker_language_skill'
  | 'microtask_group_assignment'
  | 'microtask_assignment'
  | 'payout_method'
  | 'payout_info'
  | 'payment_request';

export type DbRecordType<
  tableName extends DbTableName
> = tableName extends 'language'
  ? LanguageRecord
  : tableName extends 'scenario'
  ? ScenarioRecord
  : tableName extends 'language_resource'
  ? LanguageResourceRecord
  : tableName extends 'language_resource_value'
  ? LanguageResourceValueRecord
  : tableName extends 'work_provider'
  ? WorkProviderRecord
  : tableName extends 'box'
  ? BoxRecord
  : tableName extends 'worker'
  ? WorkerRecord
  : tableName extends 'karya_file'
  ? KaryaFileRecord
  : tableName extends 'task'
  ? TaskRecord
  : tableName extends 'microtask_group'
  ? MicrotaskGroupRecord
  : tableName extends 'microtask'
  ? MicrotaskRecord
  : tableName extends 'policy'
  ? PolicyRecord
  : tableName extends 'task_assignment'
  ? TaskAssignmentRecord
  : tableName extends 'worker_language_skill'
  ? WorkerLanguageSkillRecord
  : tableName extends 'microtask_group_assignment'
  ? MicrotaskGroupAssignmentRecord
  : tableName extends 'microtask_assignment'
  ? MicrotaskAssignmentRecord
  : tableName extends 'payout_method'
  ? PayoutMethodRecord
  : tableName extends 'payout_info'
  ? PayoutInfoRecord
  : tableName extends 'payment_request'
  ? PaymentRequestRecord
  : never;

export type DbObjectType<
  tableName extends DbTableName
> = tableName extends 'language'
  ? Language
  : tableName extends 'scenario'
  ? Scenario
  : tableName extends 'language_resource'
  ? LanguageResource
  : tableName extends 'language_resource_value'
  ? LanguageResourceValue
  : tableName extends 'work_provider'
  ? WorkProvider
  : tableName extends 'box'
  ? Box
  : tableName extends 'worker'
  ? Worker
  : tableName extends 'karya_file'
  ? KaryaFile
  : tableName extends 'task'
  ? Task
  : tableName extends 'microtask_group'
  ? MicrotaskGroup
  : tableName extends 'microtask'
  ? Microtask
  : tableName extends 'policy'
  ? Policy
  : tableName extends 'task_assignment'
  ? TaskAssignment
  : tableName extends 'worker_language_skill'
  ? WorkerLanguageSkill
  : tableName extends 'microtask_group_assignment'
  ? MicrotaskGroupAssignment
  : tableName extends 'microtask_assignment'
  ? MicrotaskAssignment
  : tableName extends 'payout_method'
  ? PayoutMethod
  : tableName extends 'payout_info'
  ? PayoutInfo
  : tableName extends 'payment_request'
  ? PaymentRequest
  : never;

export type BoxUpdatableTables =
  | 'worker'
  | 'karya_file'
  | 'task_assignment'
  | 'worker_language_skill'
  | 'microtask_group_assignment'
  | 'microtask_assignment'
  | 'payout_info'
  | 'payment_request';
