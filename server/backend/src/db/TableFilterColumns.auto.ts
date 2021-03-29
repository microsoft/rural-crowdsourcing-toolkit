/**
 * This file was auto-generated using specs and scripts in the db-schema
 * repository. DO NOT EDIT DIRECTLY.
 */

import { DbRecordType, DbTableName } from './TableInterfaces.auto';

export const tableFilterColumns: {
  [key in DbTableName]: (keyof DbRecordType<key>)[];
} = {
  language: ['string_support', 'file_support', 'list_support'],
  scenario: ['enabled'],
  language_resource: [
    'core',
    'scenario_id',
    'type',
    'list_resource',
    'required',
  ],
  language_resource_value: [
    'language_id',
    'language_resource_id',
    'valid',
    'need_update',
  ],
  work_provider: ['admin', 'auth_provider'],
  box: ['physical'],
  worker: ['box_id', 'auth_provider', 'app_language'],
  karya_file: [
    'box_id',
    'container_name',
    'creator',
    'worker_id',
    'in_box',
    'in_server',
  ],
  task: ['work_provider_id', 'language_id', 'scenario_id', 'status'],
  microtask_group: ['task_id', 'status'],
  microtask: ['task_id', 'group_id', 'status'],
  policy: ['scenario_id'],
  task_assignment: ['task_id', 'box_id', 'policy_id', 'status'],
  worker_language_skill: ['box_id', 'worker_id', 'language_id'],
  microtask_group_assignment: [
    'box_id',
    'microtask_group_id',
    'worker_id',
    'status',
  ],
  microtask_assignment: ['box_id', 'microtask_id', 'worker_id', 'status'],
  payout_method: ['enabled'],
  payout_info: ['box_id', 'worker_id', 'method_id', 'status', 'enabled'],
  payment_request: ['box_id', 'status'],
};
