// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Handle tasks related to materialized views
 */

import { knex, mainLogger as logger } from '@karya/common';

/**
 * Function to create all materialized views
 */
export async function createAllMatViews() {
  logger.info(`Creating all materialized views`);
  await createWorkerSummaryMV();
  await createTaskSummaryMV();
  await createWorkerTaskSummaryMV();
  await createMicrotaskSummaryMV();
  logger.info(`Materialized views created`);
}

/**
 * Function to create a materialized view
 */
export async function createMatView(name: string, definition: string, index: string) {
  await knex.raw(`DROP MATERIALIZED VIEW IF EXISTS ${name} CASCADE;
    CREATE MATERIALIZED VIEW ${name} AS ${definition};
    CREATE UNIQUE INDEX ON ${name} (${index});
    `);
}

/**
 * Function to create the worker summary materialized view
 */
export async function createWorkerSummaryMV() {
  await createMatView(
    'worker_summary',
    `SELECT
      w.*,
      COALESCE((mta.assigned + mta.completed + mta.verified + mta.skipped + mta.expired)::int, 0) as assigned,
      COALESCE((mta.skipped)::int, 0) as skipped,
      COALESCE((mta.expired)::int, 0) as expired,
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
        COALESCE(SUM((status='SKIPPED')::int), 0) as skipped,
        COALESCE(SUM((status='EXPIRED')::int), 0) as expired,
        SUM(COALESCE(base_credits,0.0) + COALESCE(credits, 0.0)) as earned,
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

/**
 * Function to create the task-level worker summary materialized view
 */
export async function createWorkerTaskSummaryMV() {
  await createMatView(
    'worker_task_summary',
    `SELECT
      w.*,
      mta.task_id,
      COALESCE((mta.assigned + mta.completed + mta.verified + mta.skipped + mta.expired)::int, 0) as assigned,
      COALESCE((mta.skipped)::int, 0) as skipped,
      COALESCE((mta.expired)::int, 0) as expired,
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
        COALESCE(SUM((status='SKIPPED')::int), 0) as skipped,
        COALESCE(SUM((status='EXPIRED')::int), 0) as expired,
        SUM(COALESCE(base_credits,0.0) + COALESCE(credits, 0.0)) as earned
      FROM
        microtask_assignment
      GROUP BY (worker_id, task_id)
      ) as mta
     ON w.id = mta.worker_id
     WHERE
     mta.assigned > 0 OR mta.completed > 0 OR mta.verified > 0 OR mta.skipped > 0 OR mta.expired > 0
        `,
    'id, task_id'
  );
}

/**
 * Function to create the task summary materialized view
 */
export async function createTaskSummaryMV() {
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
          SUM(COALESCE(base_credits,0.0) + COALESCE(credits, 0.0)) as cost
        FROM
          microtask_assignment
        GROUP BY task_id
      ) as mta
    ON t.id = mta.task_id
    `,
    'id'
  );
}

export async function refreshWorkerSummaryMV() {
  await knex.raw(`REFRESH MATERIALIZED VIEW CONCURRENTLY worker_summary`);
}

export async function refreshWorkerTaskSummaryMV() {
  await knex.raw(`REFRESH MATERIALIZED VIEW CONCURRENTLY worker_task_summary`);
}

export async function refreshTaskSummaryMV() {
  await knex.raw(`REFRESH MATERIALIZED VIEW CONCURRENTLY task_summary`);
}

/**
 * Function to create the microtask summary materialized view
 */
export async function createMicrotaskSummaryMV() {
  await createMatView(
    'microtask_summary',
    `SELECT
      mt.*,
      COALESCE((mta.assigned + mta.completed + mta.verified)::int, 0) as assigned,
      COALESCE((mta.completed + mta.verified)::int, 0) as completed,
      COALESCE((mta.verified)::int, 0) as verified,
      (mta.cost) as cost
    FROM
      microtask as mt
    LEFT JOIN
      (
        SELECT
          microtask_id,
          task_id,
          COALESCE(SUM((status='ASSIGNED')::int), 0) as assigned,
          COALESCE(SUM((status='COMPLETED')::int), 0) as completed,
          COALESCE(SUM((status='VERIFIED')::int), 0) as verified,
          SUM(COALESCE(base_credits,0.0) + COALESCE(credits, 0.0)) as cost
        FROM
          microtask_assignment
        GROUP BY (microtask_id, task_id)
      ) as mta
    ON mt.id = mta.microtask_id
    `,
    'id, task_id'
  );
}

/**
 * Function to refresh all materialized views
 * in the db
 */
export async function refreshAllMatViews() {
  await knex.raw(`
  DO $$
  DECLARE
  r RECORD;
  BEGIN
    FOR r IN SELECT matviewname FROM pg_matviews WHERE matviewowner = 'karya'
    LOOP
      EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY '|| r.matviewname;
    END LOOP;
  END;
  $$ LANGUAGE plpgsql;
 `);
}
