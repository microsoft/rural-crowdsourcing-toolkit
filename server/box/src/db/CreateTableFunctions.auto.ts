/**
 * This file was auto-generated using specs and scripts in the db-schema
 * repository. DO NOT EDIT DIRECTLY.
 */

import { knex } from './Client';

import logger from '../utils/Logger';

/**
 * Create a trigger to check the last_updated_at column is increasing. Cannot
 * apply update from the past
 * @param tableName Name of the table
 */
function onUpdateCheckTrigger(tableName: string) {
  return `CREATE TRIGGER ${tableName}_check_updated_at BEFORE UPDATE ON ${tableName} FOR EACH ROW EXECUTE PROCEDURE check_last_updated_column();`;
}

/**
 * Create the update function for the updating last_updated_at column of tables
 */
async function createCheckLastUpdatedFunction() {
  return knex.raw(`CREATE OR REPLACE FUNCTION check_last_updated_column()
  RETURNS TRIGGER AS $$
  BEGIN
  IF NEW.last_updated_at < OLD.last_updated_at THEN
  RAISE EXCEPTION 'Update from the past';
  END IF;
  RETURN NEW;
  END;
  $$ language 'plpgsql';`);
}

/**
 * Create the compute function for ID from local id and box id
 */
async function createComputeIDFunction() {
  return knex.raw(`CREATE OR REPLACE FUNCTION compute_id()
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
  $$ language 'plpgsql';`);
}

/**
 * Create a trigger to update the last_updated_at column for a table
 * @param tableName Name of the table
 */
function computeIDTrigger(tableName: string) {
  return `CREATE TRIGGER ${tableName}_compute_id BEFORE INSERT ON ${tableName} FOR EACH ROW EXECUTE PROCEDURE compute_id();`;
}

export async function createLanguageTable() {
  await knex.schema.createTable('language', async (table) => {
    table.bigInteger('id').primary();
    table.specificType('name', 'VARCHAR(48)').unique().notNullable();
    table
      .specificType('primary_language_name', 'VARCHAR(48)')
      .unique()
      .notNullable();
    table.specificType('locale', 'VARCHAR(48)').unique().notNullable();
    table.specificType('iso_639_3_code', 'VARCHAR(6)').unique().notNullable();
    table.specificType('script', 'VARCHAR(16)');
    table.boolean('string_support').notNullable().defaultTo(false);
    table.boolean('file_support').notNullable().defaultTo(false);
    table.boolean('list_support').notNullable().defaultTo(false);
    table.boolean('update_lrv_file').notNullable().defaultTo(false);
    table.bigInteger('lrv_file_id');
    table.json('params').notNullable().defaultTo('{}');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
  await knex.raw(onUpdateCheckTrigger('language'));
}

export async function createScenarioTable() {
  await knex.schema.createTable('scenario', async (table) => {
    table.bigInteger('id').primary();
    table.specificType('name', 'VARCHAR(48)').unique().notNullable();
    table.specificType('full_name', 'VARCHAR(48)').unique().notNullable();
    table.text('description').notNullable();
    table.json('task_params').notNullable();
    table
      .enu('assignment_granularity', ['group', 'microtask', 'either'])
      .notNullable();
    table
      .enu('group_assignment_order', ['sequential', 'random', 'either'])
      .notNullable();
    table
      .enu('microtask_assignment_order', ['sequential', 'random', 'either'])
      .notNullable();
    table.boolean('synchronous_validation').notNullable().defaultTo(false);
    table.boolean('enabled').notNullable().defaultTo(false);
    table.json('skills').notNullable();
    table.json('params').notNullable().defaultTo('{}');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
  await knex.raw(onUpdateCheckTrigger('scenario'));
}

export async function createLanguageResourceTable() {
  await knex.schema.createTable('language_resource', async (table) => {
    table.bigInteger('id').primary();
    table.boolean('core').notNullable().defaultTo(false);
    table.bigInteger('scenario_id');
    table.foreign('scenario_id').references('scenario.id');
    table.bigInteger('string_resource_id');
    table.foreign('string_resource_id').references('language_resource.id');
    table.enu('type', ['string_resource', 'file_resource']).notNullable();
    table.boolean('list_resource').notNullable().defaultTo(false);
    table.specificType('name', 'VARCHAR(48)').notNullable();
    table.text('description').notNullable();
    table.boolean('required').notNullable().defaultTo(true);
    table.boolean('update_lrv_file').notNullable().defaultTo(false);
    table.bigInteger('lrv_file_id');
    table.json('params').notNullable().defaultTo('{}');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.unique(['scenario_id', 'name']);
  });
  await knex.raw(onUpdateCheckTrigger('language_resource'));
}

export async function createLanguageResourceValueTable() {
  await knex.schema.createTable('language_resource_value', async (table) => {
    table.bigInteger('id').primary();
    table.bigInteger('language_id').notNullable();
    table.foreign('language_id').references('language.id');
    table.bigInteger('language_resource_id').notNullable();
    table.foreign('language_resource_id').references('language_resource.id');
    table.text('value').notNullable();
    table.boolean('valid').notNullable().defaultTo(true);
    table.boolean('need_update').notNullable().defaultTo(false);
    table.json('params').notNullable().defaultTo('{}');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.unique(['language_id', 'language_resource_id']);
  });
  await knex.raw(onUpdateCheckTrigger('language_resource_value'));
}

export async function createBoxTable() {
  await knex.schema.createTable('box', async (table) => {
    table.bigInteger('id').primary();
    table.specificType('creation_code', 'VARCHAR(64)').unique().notNullable();
    table.boolean('physical').notNullable().defaultTo(false);
    table.specificType('name', 'VARCHAR(48)').unique().notNullable();
    table.specificType('location_name', 'VARCHAR(48)');
    table.specificType('gps_location', 'VARCHAR(48)');
    table.specificType('hw_address', 'VARCHAR(32)').unique();
    table.specificType('url', 'VARCHAR(256)');
    table.specificType('salt', 'VARCHAR(64)');
    table.text('key');
    table
      .timestamp('last_sent_to_server_at', { useTz: true })
      .notNullable()
      .defaultTo(new Date(0).toISOString());
    table
      .timestamp('last_received_from_server_at', { useTz: true })
      .notNullable()
      .defaultTo(new Date(0).toISOString());
    table.json('params').notNullable().defaultTo('{}');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
  await knex.raw(onUpdateCheckTrigger('box'));
}

export async function createWorkerTable() {
  await knex.schema.createTable('worker', async (table) => {
    table.bigInteger('id').primary();
    table.specificType('local_id', 'BIGSERIAL');
    table.bigInteger('box_id').notNullable();
    table.foreign('box_id').references('box.id');
    table.specificType('creation_code', 'VARCHAR(64)').unique().notNullable();
    table.enu('auth_provider', ['google_oauth', 'phone_otp']);
    table.specificType('username', 'VARCHAR(48)');
    table.specificType('salt', 'VARCHAR(256)');
    table.specificType('passwd_hash', 'VARCHAR(256)');
    table.specificType('phone_number', 'VARCHAR(16)').unique();
    table.specificType('email', 'VARCHAR(64)').unique();
    table.specificType('oauth_id', 'VARCHAR(256)');
    table.text('id_token');
    table.specificType('full_name', 'VARCHAR(64)');
    table.specificType('profile_picture', 'BYTEA');
    table.specificType('age', 'VARCHAR(8)');
    table.specificType('gender', 'VARCHAR(16)');
    table.bigInteger('app_language');
    table.foreign('app_language').references('language.id');
    table
      .timestamp('last_sent_to_box_at', { useTz: true })
      .notNullable()
      .defaultTo(new Date(0).toISOString());
    table
      .timestamp('last_received_from_box_at', { useTz: true })
      .notNullable()
      .defaultTo(new Date(0).toISOString());
    table
      .timestamp('last_sent_to_server_at', { useTz: true })
      .notNullable()
      .defaultTo(new Date(0).toISOString());
    table
      .timestamp('last_received_from_server_at', { useTz: true })
      .notNullable()
      .defaultTo(new Date(0).toISOString());
    table.json('params').notNullable().defaultTo('{}');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.unique(['box_id', 'username']);
  });
  await knex.raw(onUpdateCheckTrigger('worker'));
  await knex.raw(computeIDTrigger('worker'));
}

export async function createKaryaFileTable() {
  await knex.schema.createTable('karya_file', async (table) => {
    table.bigInteger('id').primary();
    table.specificType('local_id', 'BIGSERIAL');
    table.integer('box_id');
    table.specificType('container_name', 'VARCHAR(64)').notNullable();
    table.specificType('name', 'VARCHAR(256)').notNullable();
    table.specificType('url', 'VARCHAR(256)');
    table
      .enu('creator', ['karya_server', 'karya_box', 'karya_client'])
      .notNullable();
    table.bigInteger('worker_id');
    table.enu('algorithm', ['md5']).notNullable();
    table.specificType('checksum', 'VARCHAR(256)').notNullable();
    table.boolean('in_box').notNullable().defaultTo(false);
    table.boolean('in_server').notNullable().defaultTo(false);
    table.json('params').notNullable().defaultTo('{}');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
  await knex.raw(onUpdateCheckTrigger('karya_file'));
  await knex.raw(computeIDTrigger('karya_file'));
}

export async function createTaskTable() {
  await knex.schema.createTable('task', async (table) => {
    table.bigInteger('id').primary();
    table.bigInteger('work_provider_id');
    table.bigInteger('language_id').notNullable();
    table.foreign('language_id').references('language.id');
    table.bigInteger('scenario_id').notNullable();
    table.foreign('scenario_id').references('scenario.id');
    table.specificType('name', 'VARCHAR(48)').notNullable();
    table.text('description').notNullable();
    table.specificType('primary_language_name', 'VARCHAR(48)').notNullable();
    table.text('primary_language_description').notNullable();
    table.json('params').notNullable();
    table.json('errors').notNullable().defaultTo('{}');
    table.json('actions').notNullable().defaultTo('{}');
    table.bigInteger('input_file_id');
    table.foreign('input_file_id').references('karya_file.id');
    table.bigInteger('output_file_id');
    table.foreign('output_file_id').references('karya_file.id');
    table.float('budget');
    table.timestamp('deadline', { useTz: true });
    table
      .enu('assignment_granularity', ['group', 'microtask', 'either'])
      .notNullable();
    table
      .enu('group_assignment_order', ['sequential', 'random', 'either'])
      .notNullable();
    table
      .enu('microtask_assignment_order', ['sequential', 'random', 'either'])
      .notNullable();
    table
      .enu('status', [
        'created',
        'submitted',
        'validating',
        'validated',
        'invalid',
        'approving',
        'approved',
        'assigned',
        'completed',
      ])
      .notNullable();
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
  await knex.raw(onUpdateCheckTrigger('task'));
}

export async function createMicrotaskGroupTable() {
  await knex.schema.createTable('microtask_group', async (table) => {
    table.bigInteger('id').primary();
    table.bigInteger('task_id').notNullable();
    table.foreign('task_id').references('task.id');
    table
      .enu('microtask_assignment_order', ['sequential', 'random', 'either'])
      .notNullable();
    table.enu('status', ['incomplete', 'completed']).notNullable();
    table.json('params').notNullable().defaultTo('{}');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
  await knex.raw(onUpdateCheckTrigger('microtask_group'));
}

export async function createMicrotaskTable() {
  await knex.schema.createTable('microtask', async (table) => {
    table.bigInteger('id').primary();
    table.bigInteger('task_id').notNullable();
    table.foreign('task_id').references('task.id');
    table.bigInteger('group_id');
    table.foreign('group_id').references('microtask_group.id');
    table.json('input').notNullable();
    table.bigInteger('input_file_id');
    table.foreign('input_file_id').references('karya_file.id');
    table.timestamp('deadline', { useTz: true });
    table.float('credits').notNullable();
    table.enu('status', ['incomplete', 'completed']).notNullable();
    table.json('output').notNullable().defaultTo('{}');
    table.json('params').notNullable().defaultTo('{}');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
  await knex.raw(onUpdateCheckTrigger('microtask'));
}

export async function createPolicyTable() {
  await knex.schema.createTable('policy', async (table) => {
    table.bigInteger('id').primary();
    table.bigInteger('scenario_id').notNullable();
    table.foreign('scenario_id').references('scenario.id');
    table.specificType('name', 'VARCHAR(48)').notNullable();
    table.text('description').notNullable();
    table.json('params').notNullable().defaultTo('{}');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.unique(['scenario_id', 'name']);
  });
  await knex.raw(onUpdateCheckTrigger('policy'));
}

export async function createTaskAssignmentTable() {
  await knex.schema.createTable('task_assignment', async (table) => {
    table.bigInteger('id').primary();
    table.bigInteger('task_id').notNullable();
    table.foreign('task_id').references('task.id');
    table.bigInteger('box_id').notNullable();
    table.foreign('box_id').references('box.id');
    table.bigInteger('policy_id').notNullable();
    table.foreign('policy_id').references('policy.id');
    table.timestamp('deadline', { useTz: true });
    table.enu('status', ['assigned', 'sent', 'completed']).notNullable();
    table.json('params').notNullable().defaultTo('{}');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.unique(['task_id', 'box_id']);
  });
  await knex.raw(onUpdateCheckTrigger('task_assignment'));
}

export async function createWorkerLanguageSkillTable() {
  await knex.schema.createTable('worker_language_skill', async (table) => {
    table.bigInteger('id').primary();
    table.specificType('local_id', 'BIGSERIAL');
    table.bigInteger('box_id').notNullable();
    table.foreign('box_id').references('box.id');
    table.bigInteger('worker_id').notNullable();
    table.foreign('worker_id').references('worker.id');
    table.bigInteger('language_id').notNullable();
    table.foreign('language_id').references('language.id');
    table.boolean('can_speak').notNullable().defaultTo(false);
    table.boolean('can_type').notNullable().defaultTo(false);
    table.boolean('can_read').notNullable().defaultTo(false);
    table.boolean('can_listen').notNullable().defaultTo(false);
    table.float('speak_score');
    table.float('type_score');
    table.float('read_score');
    table.float('listen_score');
    table.json('params').notNullable().defaultTo('{}');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.unique(['worker_id', 'language_id']);
  });
  await knex.raw(onUpdateCheckTrigger('worker_language_skill'));
  await knex.raw(computeIDTrigger('worker_language_skill'));
}

export async function createMicrotaskGroupAssignmentTable() {
  await knex.schema.createTable('microtask_group_assignment', async (table) => {
    table.bigInteger('id').primary();
    table.specificType('local_id', 'BIGSERIAL');
    table.bigInteger('box_id').notNullable();
    table.foreign('box_id').references('box.id');
    table.bigInteger('microtask_group_id').notNullable();
    table.foreign('microtask_group_id').references('microtask_group.id');
    table.bigInteger('worker_id').notNullable();
    table.foreign('worker_id').references('worker.id');
    table
      .enu('status', ['assigned', 'incomplete', 'completed', 'submitted'])
      .notNullable();
    table.json('params').notNullable().defaultTo('{}');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.unique(['microtask_group_id', 'worker_id']);
  });
  await knex.raw(onUpdateCheckTrigger('microtask_group_assignment'));
  await knex.raw(computeIDTrigger('microtask_group_assignment'));
}

export async function createMicrotaskAssignmentTable() {
  await knex.schema.createTable('microtask_assignment', async (table) => {
    table.bigInteger('id').primary();
    table.specificType('local_id', 'BIGSERIAL');
    table.bigInteger('box_id').notNullable();
    table.foreign('box_id').references('box.id');
    table.bigInteger('microtask_id').notNullable();
    table.foreign('microtask_id').references('microtask.id');
    table.bigInteger('worker_id').notNullable();
    table.foreign('worker_id').references('worker.id');
    table.timestamp('deadline', { useTz: true });
    table
      .enu('status', [
        'assigned',
        'incomplete',
        'skipped',
        'expired',
        'completed',
        'submitted',
        'verified',
      ])
      .notNullable();
    table.timestamp('completed_at', { useTz: true });
    table.json('output').notNullable().defaultTo('{}');
    table.bigInteger('output_file_id');
    table.foreign('output_file_id').references('karya_file.id');
    table.float('credits');
    table.json('params').notNullable().defaultTo('{}');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.unique(['microtask_id', 'worker_id']);
  });
  await knex.raw(onUpdateCheckTrigger('microtask_assignment'));
  await knex.raw(computeIDTrigger('microtask_assignment'));
}

export async function createPayoutMethodTable() {
  await knex.schema.createTable('payout_method', async (table) => {
    table.bigInteger('id').primary();
    table.specificType('name', 'VARCHAR(48)').unique().notNullable();
    table.text('description').notNullable();
    table.json('required_info').notNullable();
    table.boolean('enabled').notNullable().defaultTo(false);
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
  await knex.raw(onUpdateCheckTrigger('payout_method'));
}

export async function createPayoutInfoTable() {
  await knex.schema.createTable('payout_info', async (table) => {
    table.bigInteger('id').primary();
    table.specificType('local_id', 'BIGSERIAL');
    table.bigInteger('box_id').notNullable();
    table.foreign('box_id').references('box.id');
    table.bigInteger('worker_id').notNullable();
    table.foreign('worker_id').references('worker.id');
    table.bigInteger('method_id').notNullable();
    table.foreign('method_id').references('payout_method.id');
    table.json('info').notNullable();
    table.enu('status', ['submitted', 'verified']).notNullable();
    table.boolean('enabled').notNullable().defaultTo(false);
    table.json('params').notNullable().defaultTo('{}');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
  await knex.raw(onUpdateCheckTrigger('payout_info'));
  await knex.raw(computeIDTrigger('payout_info'));
}

export async function createPaymentRequestTable() {
  await knex.schema.createTable('payment_request', async (table) => {
    table.bigInteger('id').primary();
    table.specificType('local_id', 'BIGSERIAL');
    table.bigInteger('box_id').notNullable();
    table.foreign('box_id').references('box.id');
    table.bigInteger('payout_info_id').notNullable();
    table.foreign('payout_info_id').references('payout_info.id');
    table.integer('amount').notNullable();
    table
      .enu('status', ['requested', 'approved', 'denied', 'failed', 'paid'])
      .notNullable();
    table.specificType('reference', 'VARCHAR(64)');
    table.json('params').notNullable().defaultTo('{}');
    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('last_updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
  await knex.raw(onUpdateCheckTrigger('payment_request'));
  await knex.raw(computeIDTrigger('payment_request'));
}

export async function createAllTables() {
  try {
    await createCheckLastUpdatedFunction();
    await createComputeIDFunction();
    await createLanguageTable();
    await createScenarioTable();
    await createLanguageResourceTable();
    await createLanguageResourceValueTable();
    await createBoxTable();
    await createWorkerTable();
    await createKaryaFileTable();
    await createTaskTable();
    await createMicrotaskGroupTable();
    await createMicrotaskTable();
    await createPolicyTable();
    await createTaskAssignmentTable();
    await createWorkerLanguageSkillTable();
    await createMicrotaskGroupAssignmentTable();
    await createMicrotaskAssignmentTable();
    await createPayoutMethodTable();
    await createPayoutInfoTable();
    await createPaymentRequestTable();
  } catch (e) {
    logger.error(e);
  }
}
