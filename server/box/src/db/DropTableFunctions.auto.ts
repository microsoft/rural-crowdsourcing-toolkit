/**
 * This file was auto-generated using specs and scripts in the db-schema
 * repository. DO NOT EDIT DIRECTLY.
 */

import logger from '../utils/Logger';

import { knex } from './Client';

export async function dropLanguageTable() {
  return knex.raw('DROP TABLE IF EXISTS language CASCADE');
}

export async function dropScenarioTable() {
  return knex.raw('DROP TABLE IF EXISTS scenario CASCADE');
}

export async function dropLanguageResourceTable() {
  return knex.raw('DROP TABLE IF EXISTS language_resource CASCADE');
}

export async function dropLanguageResourceValueTable() {
  return knex.raw('DROP TABLE IF EXISTS language_resource_value CASCADE');
}

export async function dropBoxTable() {
  return knex.raw('DROP TABLE IF EXISTS box CASCADE');
}

export async function dropWorkerTable() {
  return knex.raw('DROP TABLE IF EXISTS worker CASCADE');
}

export async function dropKaryaFileTable() {
  return knex.raw('DROP TABLE IF EXISTS karya_file CASCADE');
}

export async function dropTaskTable() {
  return knex.raw('DROP TABLE IF EXISTS task CASCADE');
}

export async function dropMicrotaskGroupTable() {
  return knex.raw('DROP TABLE IF EXISTS microtask_group CASCADE');
}

export async function dropMicrotaskTable() {
  return knex.raw('DROP TABLE IF EXISTS microtask CASCADE');
}

export async function dropPolicyTable() {
  return knex.raw('DROP TABLE IF EXISTS policy CASCADE');
}

export async function dropTaskAssignmentTable() {
  return knex.raw('DROP TABLE IF EXISTS task_assignment CASCADE');
}

export async function dropWorkerLanguageSkillTable() {
  return knex.raw('DROP TABLE IF EXISTS worker_language_skill CASCADE');
}

export async function dropMicrotaskGroupAssignmentTable() {
  return knex.raw('DROP TABLE IF EXISTS microtask_group_assignment CASCADE');
}

export async function dropMicrotaskAssignmentTable() {
  return knex.raw('DROP TABLE IF EXISTS microtask_assignment CASCADE');
}

export async function dropPayoutMethodTable() {
  return knex.raw('DROP TABLE IF EXISTS payout_method CASCADE');
}

export async function dropPayoutInfoTable() {
  return knex.raw('DROP TABLE IF EXISTS payout_info CASCADE');
}

export async function dropPaymentRequestTable() {
  return knex.raw('DROP TABLE IF EXISTS payment_request CASCADE');
}

export async function dropAllTables() {
  try {
    await dropLanguageTable();
    await dropScenarioTable();
    await dropLanguageResourceTable();
    await dropLanguageResourceValueTable();
    await dropBoxTable();
    await dropWorkerTable();
    await dropKaryaFileTable();
    await dropTaskTable();
    await dropMicrotaskGroupTable();
    await dropMicrotaskTable();
    await dropPolicyTable();
    await dropTaskAssignmentTable();
    await dropWorkerLanguageSkillTable();
    await dropMicrotaskGroupAssignmentTable();
    await dropMicrotaskAssignmentTable();
    await dropPayoutMethodTable();
    await dropPayoutInfoTable();
    await dropPaymentRequestTable();
  } catch (e) {
    logger.error(e);
  }
}
