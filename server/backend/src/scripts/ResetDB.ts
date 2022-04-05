// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Script to reset the database and initialize some basic tables
 */

import dotenv from 'dotenv';
dotenv.config();

import { Promise as BBPromise } from 'bluebird';
import { knex, setupDbConnection, ServerDbFunctions, mainLogger as logger } from '@karya/common';
import { bootstrapAuth } from './AuthBootstrap';

/**
 * Function to recreate all tables in the database
 */
async function recreateAllTables() {
  // Drop all tables and then create them
  logger.info(`Recreating all tables`);
  await ServerDbFunctions.dropAllTables();
  await ServerDbFunctions.createAllTables();
  logger.info(`Tables recreated`);
}

/**
 * Function to create all materialized views
 */
async function createAllMatViews() {
  logger.info(`Creating all materialized views`);
  await createWorkerSummaryMV();
  await createTaskSummaryMV();
  await createWorkerTaskSummaryMV();
  logger.info(`Materialized views created`);
}

async function createMatView(name: string, definition: string, index: string) {
  await knex.raw(`DROP MATERIALIZED VIEW IF EXISTS ${name} CASCADE;
    CREATE MATERIALIZED VIEW ${name} AS ${definition};
    CREATE UNIQUE INDEX ON ${name} (${index});
    `);
}

async function createWorkerSummaryMV() {
  await createMatView(
    'worker_summary',
    `SELECT
      w.*,
      COALESCE((mta.assigned + mta.completed + mta.verified)::int, 0) as assigned,
      COALESCE((mta.completed + mta.verified)::int, 0) as completed,
      COALESCE((mta.verified)::int, 0) as verified,
      COALESCE((mta.earned)::int, 0) as earned,
      (mta.earliest) as earliest,
      (mta.latest) as latest
    FROM 
      worker as w
    LEFT JOIN
    (
      SELECT
        worker_id,
        COALESCE(SUM((status='ASSIGNED')::int), 0) as assigned,
        COALESCE(SUM((status='COMPLETED')::int), 0) as completed,
        COALESCE(SUM((status='VERIFIED')::int), 0) as verified,
        COALESCE(SUM(credits), 0) as earned,
        MIN(created_at) as earliest,
        MAX(completed_at) as latest
      FROM
        microtask_assignment
      GROUP BY worker_id
    ) as mta
  ON w.id = mta.worker_id
    `,
    'id'
  );
}

async function createWorkerTaskSummaryMV() {
  await createMatView(
    'worker_task_summary',
    `SELECT
      w.*,
      mta.task_id,
      COALESCE((mta.assigned + mta.completed + mta.verified)::int, 0) as assigned,
      COALESCE((mta.completed + mta.verified)::int, 0) as completed,
      COALESCE((mta.verified)::int, 0) as verified,
      COALESCE((mta.earned)::int, 0) as earned
     FROM 
      worker as w
     LEFT JOIN
     (
      SELECT
        worker_id,
        task_id,
        COALESCE(SUM((status='ASSIGNED')::int), 0) as assigned,
        COALESCE(SUM((status='COMPLETED')::int), 0) as completed,
        COALESCE(SUM((status='VERIFIED')::int), 0) as verified,
        COALESCE(SUM(credits), 0) as earned
      FROM
        microtask_assignment
      GROUP BY (worker_id, task_id)
      ) as mta
     ON w.id = mta.worker_id
     WHERE
     mta.assigned > 0 OR mta.completed > 0 OR mta.verified > 0
        `,
    'id, task_id'
  );
}

async function createTaskSummaryMV() {
  await createMatView(
    'task_summary',
    `SELECT
      t.id,
      t.scenario_name,
      COALESCE((mta.assigned)::int, 0) as assigned,
      COALESCE((mta.completed)::int, 0) as completed,
      COALESCE((mta.verified)::int, 0) as verified,
      COALESCE((mta.cost)::int, 0) as cost
    FROM
      task as t
    LEFT JOIN 
      (
        SELECT
          task_id,
          COALESCE(SUM((status='ASSIGNED' OR status='COMPLETED' OR status='VERIFIED')::int), 0) as assigned,
          COALESCE(SUM((status='COMPLETED' OR status='VERIFIED')::int), 0) as completed,
          COALESCE(SUM((status='VERIFIED')::int), 0) as verified,
          COALESCE(SUM(credits), 0) as cost
        FROM
          microtask_assignment
        GROUP BY task_id
      ) as mta
    ON t.id = mta.task_id
    `,
    'id'
  );
}

/** Script sequence */
let scriptSequence = ['recreate-tables', 'auth-bootstrap'];

/** Main Script to reset the DB */
(async () => {
  logger.info(`Starting reset script DB`);

  const option = process.argv[2] || 'all';
  if (option !== 'all') {
    if (!scriptSequence.includes(option)) {
      logger.info(
        `Unknown option '${option}' to ResetDB script. Option should be one of '${scriptSequence.join(' ')}'`
      );
      process.exit(1);
    }
    scriptSequence = [option];
  }

  setupDbConnection();

  await BBPromise.mapSeries(scriptSequence, async (action) => {
    switch (action) {
      case 'recreate-tables':
        await recreateAllTables();
        break;
      case 'auth-bootstrap':
        const cc = await bootstrapAuth();
        console.log(cc);
        break;
    }
  });

  await createAllMatViews();
})().finally(() => knex.destroy());
