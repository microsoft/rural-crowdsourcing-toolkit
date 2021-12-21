// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Karya database specification

import { DatabaseSpec, TableColumnSpec } from '@karya/schema-spec';
import deepcopy from 'deepcopy';

// Definitive list of all karya database tables
export const karyaTableNames = [
  'server_user',
  'box',
  'worker',
  'karya_file',
  'task',
  'microtask_group',
  'microtask',
  'task_op',
  'task_link',
  'task_assignment',
  'microtask_group_assignment',
  'microtask_assignment',
	'payments_account',
  'payments_transaction',
  'bulk_payments_transaction'
] as const;

export type KaryaTableName = typeof karyaTableNames[number];

// List of custom strings
const karyaStrings = [
  'ServerRole',
  'RegistrationMechanism',
  'Gender',
  'ContainerName',
  'FileCreator',
  'ChecksumAlgorithm',
  'LanguageCode',
  'ScenarioName',
  'AssignmentGranularity',
  'AssignmentOrder',
  'TaskStatus',
  'MicrotaskStatus',
  'TaskOpType',
  'TaskOpStatus',
  'ChainName',
  'ChainStatus',
  'ChainGroupingType',
  'PolicyName',
  'TaskAssignmentStatus',
  'MicrotaskAssignmentStatus',
] as const;

export type KaryaString = typeof karyaStrings[number];

// List of custom objects
const karyaObjects = ['MicrotaskInput', 'MicrotaskOutput'] as const;
export type KaryaObject = typeof karyaObjects[number];

// Karya Database Specification
const karyaDb: DatabaseSpec<KaryaTableName, KaryaString, KaryaObject> = {
  version: '2.0.0',
  tables: {
    server_user: {
      columns: [
        ['access_code', ['string', 32], 'unique', 'not nullable', 'not mutable'],
        ['registered', ['boolean', false], 'not unique', 'not nullable', 'mutable'],
        ['reg_mechanism', ['string', 32, 'RegistrationMechanism'], 'not unique', 'nullable', 'mutable'],
        ['phone_number', ['string', 16], 'not unique', 'nullable', 'mutable'],
        ['otp', ['string', 8], 'not unique', 'nullable', 'mutable'],
        ['otp_generated_at', ['stringarray'], 'not unique', 'nullable', 'mutable'],
        ['auth_id', ['string', 64], 'not unique', 'nullable', 'mutable'],
        ['id_token', ['text'], 'unique', 'nullable', 'mutable'],
        ['role', ['string', 32, 'ServerRole'], 'not unique', 'not nullable', 'not mutable'],
        ['full_name', ['string', 64], 'not unique', 'nullable', 'mutable'],
        ['email', ['string', 64], 'not unique', 'nullable', 'mutable'],
      ],
    },

    box: {
      columns: [
        ['access_code', ['string', 32], 'unique', 'not nullable', 'not mutable'],
        ['registered', ['boolean', false], 'not unique', 'not nullable', 'mutable'],
        ['reg_mechanism', ['string', 32, 'RegistrationMechanism'], 'not unique', 'nullable', 'mutable'],
        ['key', ['string', 64], 'not unique', 'nullable', 'mutable'],
        ['physical', ['boolean', false], 'not unique', 'not nullable', 'not mutable'],
        ['name', ['string', 64], 'not unique', 'nullable', 'mutable'],
        ['location', ['string', 64], 'not unique', 'nullable', 'mutable'],
        ['gps', ['string', 64], 'not unique', 'nullable', 'mutable'],
        ['url', ['string', 256], 'not unique', 'nullable', 'mutable'],
        ['auth_id', ['string', 64], 'not unique', 'nullable', 'mutable'],
        ['id_token', ['text'], 'unique', 'nullable', 'mutable'],
        ['last_received_from_server_at', ['timestamp', 'eon'], 'not unique', 'not nullable', 'mutable'],
        ['last_sent_to_server_at', ['timestamp', 'eon'], 'not unique', 'not nullable', 'mutable'],
      ],
    },

    worker: {
      columns: [
        ['access_code', ['string', 32], 'unique', 'not nullable', 'not mutable'],
        ['registered_at', ['timestamp', 'eon'], 'not unique', 'not nullable', 'mutable'],
        ['reg_mechanism', ['string', 32, 'RegistrationMechanism'], 'not unique', 'nullable', 'mutable'],
        ['phone_number', ['string', 16], 'not unique', 'nullable', 'mutable'],
        ['otp', ['string', 8], 'not unique', 'nullable', 'mutable'],
        ['otp_generated_at', ['stringarray'], 'not unique', 'nullable', 'mutable'],
        ['auth_id', ['string', 64], 'not unique', 'nullable', 'mutable'],
        ['id_token', ['text'], 'unique', 'nullable', 'mutable'],
        ['full_name', ['string', 64], 'not unique', 'nullable', 'mutable'],
        ['year_of_birth', ['string', 4], 'not unique', 'nullable', 'mutable'],
        ['gender', ['string', 16, 'Gender'], 'not unique', 'nullable', 'mutable'],
        ['language', ['string', 8, 'LanguageCode'], 'not unique', 'nullable', 'mutable'],
        ['profile_updated_at', ['timestamp', 'now'], 'not unique', 'not nullable', 'mutable'],
        ['wgroup', ['string', 64], 'not unique', 'nullable', 'mutable'],
        ['tags', ['stringarray'], 'not unique', 'not nullable', 'mutable'],
        ['tags_updated_at', ['timestamp', 'now'], 'not unique', 'not nullable', 'mutable'],
        ['sent_to_server_at', ['timestamp', 'eon'], 'not unique', 'not nullable', 'mutable'],
        ['selected_account', ['>', 'payments_account'], 'unique', 'nullable', 'mutable'],
        ['payments_active', ['boolean', true], 'not unique', 'not nullable', 'mutable'],
        ['payments_meta', ['object'], 'not unique', 'nullable', 'mutable']
      ],
    },

    karya_file: {
      columns: [
        ['container_name', ['string', 64, 'ContainerName'], 'not unique', 'not nullable', 'not mutable'],
        ['name', ['string', 64], 'not unique', 'not nullable', 'not mutable'],
        ['url', ['string', 512], 'unique', 'nullable', 'mutable'],
        ['creator', ['string', 16, 'FileCreator'], 'not unique', 'not nullable', 'not mutable'],
        ['creator_id', ['bigint'], 'not unique', 'not nullable', 'not mutable'],
        ['timestamp', ['timestamp'], 'not unique', 'nullable', 'mutable'],
        ['algorithm', ['string', 8, 'ChecksumAlgorithm'], 'not unique', 'not nullable', 'mutable'],
        ['checksum', ['string', 64], 'not unique', 'not nullable', 'mutable'],
        ['in_box', ['boolean', false], 'not unique', 'not nullable', 'mutable'],
        ['in_server', ['boolean', false], 'not unique', 'not nullable', 'mutable'],
      ],
    },

    task: {
      columns: [
        ['work_provider_id', ['>', 'server_user'], 'not unique', 'not nullable', 'not mutable'],
        ['scenario_name', ['string', 32, 'ScenarioName'], 'not unique', 'not nullable', 'not mutable'],
        ['name', ['string', 64], 'not unique', 'not nullable', 'mutable'],
        ['description', ['text'], 'not unique', 'not nullable', 'mutable'],
        ['display_name', ['string', 64], 'not unique', 'not nullable', 'mutable'],
        ['policy', ['string', 16, 'PolicyName'], 'not unique', 'not nullable', 'not mutable'],
        ['params', ['template', 'ParamsType'], 'not unique', 'not nullable', 'mutable'],
        ['itags', ['stringarray'], 'not unique', 'not nullable', 'mutable'],
        ['otags', ['stringarray'], 'not unique', 'not nullable', 'mutable'],
        ['wgroup', ['string', 64], 'not unique', 'nullable', 'mutable'],
        ['deadline', ['timestamp'], 'not unique', 'nullable', 'mutable'],
        [
          'assignment_granularity',
          ['string', 16, 'AssignmentGranularity'],
          'not unique',
          'not nullable',
          'not mutable',
        ],
        ['group_assignment_order', ['string', 16, 'AssignmentOrder'], 'not unique', 'not nullable', 'mutable'],
        ['microtask_assignment_order', ['string', 16, 'AssignmentOrder'], 'not unique', 'not nullable', 'mutable'],
        ['assignment_batch_size', ['int'], 'not unique', 'nullable', 'mutable'],
        ['status', ['string', 16, 'TaskStatus'], 'not unique', 'not nullable', 'mutable'],
      ],
      templates: [['ParamsType', 'kv']],
    },

    microtask_group: {
      columns: [
        ['task_id', ['>', 'task'], 'not unique', 'not nullable', 'not mutable'],
        ['microtask_assignment_order', ['string', 16, 'AssignmentOrder'], 'not unique', 'not nullable', 'mutable'],
        ['status', ['string', 16, 'MicrotaskStatus'], 'not unique', 'not nullable', 'mutable'],
      ],
    },

    microtask: {
      columns: [
        ['task_id', ['>', 'task'], 'not unique', 'not nullable', 'not mutable'],
        ['group_id', ['>', 'microtask_group'], 'not unique', 'nullable', 'not mutable'],
        [
          'input',
          ['object', 'MicrotaskInput', ['InputData', 'InputFiles']],
          'not unique',
          'not nullable',
          'not mutable',
        ],
        ['input_file_id', ['>', 'karya_file'], 'not unique', 'nullable', 'not mutable'],
        ['deadline', ['timestamp'], 'not unique', 'nullable', 'mutable'],
        ['credits', ['float'], 'not unique', 'not nullable', 'mutable'],
        ['status', ['string', 16, 'MicrotaskStatus'], 'not unique', 'not nullable', 'mutable'],
        ['output', ['object', 'MicrotaskOutput', ['OutputData', 'OutputFiles']], 'not unique', 'nullable', 'mutable'],
      ],
      templates: [
        ['InputData', 'object'],
        ['InputFiles', 'stringdict'],
        ['OutputData', 'object'],
        ['OutputFiles', 'stringdict'],
      ],
    },

    task_op: {
      columns: [
        ['task_id', ['>', 'task'], 'not unique', 'not nullable', 'not mutable'],
        ['op_type', ['string', 32, 'TaskOpType'], 'not unique', 'not nullable', 'not mutable'],
        ['file_id', ['>', 'karya_file'], 'unique', 'nullable', 'not mutable'],
        ['status', ['string', 16, 'TaskOpStatus'], 'not unique', 'not nullable', 'mutable'],
        ['started_at', ['timestamp'], 'not unique', 'nullable', 'mutable'],
        ['completed_at', ['timestamp'], 'not unique', 'nullable', 'mutable'],
        ['messages', ['stringarray'], 'not unique', 'not nullable', 'mutable'],
      ],
    },

    task_link: {
      columns: [
        ['chain', ['string', 32, 'ChainName'], 'not unique', 'not nullable', 'not mutable'],
        ['from_task', ['>', 'task'], 'not unique', 'not nullable', 'not mutable'],
        ['to_task', ['>', 'task'], 'not unique', 'not nullable', 'not mutable'],
        ['blocking', ['boolean', false], 'not unique', 'not nullable', 'mutable'],
        ['force_wgroup', ['boolean', false], 'not unique', 'not nullable', 'mutable'],
        ['delay', ['boolean', false], 'not unique', 'not nullable', 'mutable'],
        ['grouping', ['string', 16, 'ChainGroupingType'], 'not unique', 'not nullable', 'mutable'],
        ['params', ['kv'], 'not unique', 'nullable', 'mutable'],
        ['status', ['string', 16, 'ChainStatus'], 'not unique', 'not nullable', 'mutable'],
      ],
    },

    task_assignment: {
      columns: [
        ['task_id', ['>', 'task'], 'not unique', 'not nullable', 'not mutable'],
        ['box_id', ['>', 'box'], 'not unique', 'not nullable', 'not mutable'],
        ['policy', ['string', 16, 'PolicyName'], 'not unique', 'not nullable', 'not mutable'],
        ['params', ['kv'], 'not unique', 'not nullable', 'not mutable'],
        ['deadline', ['timestamp'], 'not unique', 'nullable', 'mutable'],
        ['status', ['string', 16, 'TaskAssignmentStatus'], 'not unique', 'not nullable', 'mutable'],
        ['received_from_server_at', ['timestamp', 'eon'], 'not unique', 'not nullable', 'mutable'],
      ],
    },

    microtask_group_assignment: {
      columns: [
        ['group_id', ['>', 'microtask_group'], 'not unique', 'not nullable', 'not mutable'],
        ['worker_id', ['>', 'worker'], 'not unique', 'not nullable', 'not mutable'],
        ['status', ['string', 16, 'MicrotaskAssignmentStatus'], 'not unique', 'not nullable', 'mutable'],
      ],
    },

    microtask_assignment: {
      columns: [
        ['microtask_id', ['>', 'microtask'], 'not unique', 'not nullable', 'not mutable'],
        ['task_id', ['>', 'task'], 'not unique', 'not nullable', 'not mutable'],
        ['worker_id', ['>', 'worker'], 'not unique', 'not nullable', 'not mutable'],
        ['wgroup', ['string', 64], 'not unique', 'nullable', 'mutable'],
        ['sent_to_server_at', ['timestamp', 'eon'], 'not unique', 'not nullable', 'mutable'],
        ['deadline', ['timestamp'], 'not unique', 'nullable', 'mutable'],
        ['status', ['string', 16, 'MicrotaskAssignmentStatus'], 'not unique', 'not nullable', 'mutable'],
        ['completed_at', ['timestamp'], 'not unique', 'nullable', 'mutable'],
        ['output', ['object', 'MicrotaskOutput', ['OutputData', 'OutputFiles']], 'not unique', 'nullable', 'mutable'],
        ['output_file_id', ['>', 'karya_file'], 'unique', 'nullable', 'mutable'],
        ['logs', ['stringarray'], 'not unique', 'nullable', 'mutable'],
        ['submitted_to_box_at', ['timestamp'], 'not unique', 'nullable', 'mutable'],
        ['submitted_to_server_at', ['timestamp'], 'not unique', 'nullable', 'mutable'],
        ['verified_at', ['timestamp'], 'not unique', 'nullable', 'mutable'],
        ['report', ['object'], 'not unique', 'nullable', 'mutable'],
        ['max_credits', ['float'], 'not unique', 'not nullable', 'mutable'],
        ['credits', ['float'], 'not unique', 'nullable', 'mutable'],
      ],
      templates: [
        ['OutputData', 'object'],
        ['OutputFiles', 'stringdict'],
      ],
    },

		payments_account: {
			columns: [
        ['hash', ['string', 128], 'unique', 'not nullable', 'not mutable'],
				['worker_id', ['>', 'worker'], 'not unique', 'not nullable', 'not mutable'],
				['fund_id',['string', 64], 'unique', 'nullable', 'mutable'], 
				['account_type', ['string', 16], 'not unique', 'not nullable', 'not mutable'],
				['status', ['string', 64], 'not unique', 'not nullable', 'mutable'],
				['active', ['boolean', false], 'not unique', 'not nullable', 'mutable'],
				['meta', ['object'], 'not unique', 'nullable', 'mutable']
			]
		},

    payments_transaction: {
      columns: [
        ['box_id', ['>', 'box'], 'not unique', 'not nullable', 'not mutable'],
        ['payout_id', ['string', 64], 'unique', 'nullable', 'mutable'],
        ['amount', ['bigint'], 'not unique', 'not nullable', 'not mutable'],
        ['currency', ['string', 64], 'not unique', 'not nullable', 'not mutable'],
        ['account_id', ['>', 'payments_account'], 'not unique', 'not nullable', 'not mutable'],
        ['worker_id', ['>', 'worker'], 'not unique', 'not nullable', 'not mutable'],
        ['source_account', ['string', 64], 'not unique', 'not nullable', 'not mutable'],
        ['UTR', ['string', 64], 'unique', 'nullable', 'mutable'],
        ['mode', ['string', 16], 'not unique', 'not nullable', 'not mutable'],
        ['purpose', ['string', 32], 'not unique', 'not nullable', 'mutable'],
        ['status', ['string', 64], 'not unique', 'not nullable', 'mutable'],
        ['meta', ['object'], 'not unique', 'nullable', 'mutable']
      ]
    },

    bulk_payments_transaction: {
      columns: [
        ['user_id', ['>', 'server_user'], 'not unique', 'not nullable', 'not mutable'],
        ['amount', ['bigint'], 'not unique', 'not nullable', 'not mutable'],
        ['n_workers', ['bigint'], 'not unique', 'not nullable', 'not mutable'],
        ['status', ['string', 64], 'not unique', 'not nullable', 'mutable'],
        ['meta', ['object'], 'not unique', 'nullable', 'mutable']
      ]
    },
  },
};

// Compute ID trigger creation function
const computeIdFunction = `CREATE OR REPLACE FUNCTION compute_id()
  RETURNS TRIGGER AS $$
  BEGIN
  IF NEW.box_id IS NULL THEN
  NEW.id = 0;
  ELSE
  NEW.id = NEW.box_id;
  END IF;
  NEW.id = (NEW.id << 48) + NEW.local_id;
  RETURN NEW;
  END;
  $$ language 'plpgsql'`;
karyaDb.functions = [['compute_id', computeIdFunction]];

// Compute ID triggers
function computeIDTrigger(tableName: KaryaTableName) {
  return `CREATE TRIGGER ${tableName}_compute_id BEFORE INSERT ON ${tableName} FOR EACH ROW EXECUTE PROCEDURE compute_id();`;
}

// Common fields for all tables
const commonFields: TableColumnSpec<KaryaTableName, KaryaString, KaryaObject>[] = [
  ['extras', ['object'], 'not unique', 'nullable', 'mutable'],
  ['created_at', ['timestamp', 'now'], 'not unique', 'not nullable', 'not mutable'],
  ['last_updated_at', ['timestamp', 'now'], 'not unique', 'not nullable', 'mutable'],
];

// Server tables - Tables for which only the server can create records
const serverTables: KaryaTableName[] = [
  'server_user',
  'box',
  'task',
  'microtask_group',
  'microtask',
  'task_op',
  'task_link',
  'task_assignment',
  'payments_transaction'
];

// ID fields for server tables on the server side
const serverSideServerIdFields: TableColumnSpec<KaryaTableName, KaryaString, KaryaObject>[] = [
  ['id', ['bigserial'], 'unique', 'not nullable', 'not mutable'],
];

// ID fields for server tables on the box side
const boxSideServerIdFields: TableColumnSpec<KaryaTableName, KaryaString, KaryaObject>[] = [
  ['id', ['bigint'], 'unique', 'not nullable', 'not mutable'],
];

// Box tables - Tables for which the box can also create records
const boxTables: KaryaTableName[] = ['worker', 'microtask_group_assignment', 'microtask_assignment', 'payments_account'];

// ID fields for box tables on the box side
const boxSideBoxIdFields: TableColumnSpec<KaryaTableName, KaryaString, KaryaObject>[] = [
  ['id', ['bigint'], 'unique', 'not nullable', 'not mutable'],
  ['box_id', ['>', 'box'], 'not unique', 'nullable', 'not mutable'],
  ['local_id', ['bigserial'], 'unique', 'not nullable', 'not mutable'],
];

// ID fields for box tables on the server side
const serverSideBoxIdFields: TableColumnSpec<KaryaTableName, KaryaString, KaryaObject>[] = [
  ['id', ['bigint'], 'unique', 'not nullable', 'not mutable'],
  ['box_id', ['>', 'box'], 'not unique', 'not nullable', 'not mutable'],
  ['local_id', ['bigint'], 'not unique', 'not nullable', 'not mutable'],
];

// Seperate server-side and box side database spec
const karyaServerDb = deepcopy(karyaDb);
const karyaBoxDb = deepcopy(karyaDb);

serverTables.forEach((table) => {
  const columns = karyaServerDb.tables[table].columns;
  karyaServerDb.tables[table].columns = serverSideServerIdFields.concat(columns).concat(commonFields);
  karyaBoxDb.tables[table].columns = boxSideServerIdFields.concat(columns).concat(commonFields);
});

boxTables.forEach((table) => {
  const columns = karyaServerDb.tables[table].columns;
  karyaServerDb.tables[table].columns = serverSideBoxIdFields.concat(columns).concat(commonFields);
  karyaBoxDb.tables[table].columns = boxSideBoxIdFields.concat(columns).concat(commonFields);
  karyaBoxDb.tables[table].triggers = [computeIDTrigger(table)];
});

const karyaFileIdFields: TableColumnSpec<KaryaTableName, KaryaString, KaryaObject>[] = [
  ['id', ['bigint'], 'unique', 'not nullable', 'not mutable'],
  ['box_id', ['>', 'box'], 'not unique', 'nullable', 'not mutable'],
  ['local_id', ['bigserial'], 'not unique', 'not nullable', 'not mutable'],
];

const kf_columns = karyaDb.tables['karya_file'].columns;
karyaServerDb.tables['karya_file'].columns = karyaFileIdFields.concat(kf_columns).concat(commonFields);
karyaServerDb.tables['karya_file'].triggers = [computeIDTrigger('karya_file')];
karyaBoxDb.tables['karya_file'].columns = karyaFileIdFields.concat(kf_columns).concat(commonFields);
karyaBoxDb.tables['karya_file'].triggers = [computeIDTrigger('karya_file')];

export { karyaServerDb, karyaBoxDb };
