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
  await createLeaderboardMV();
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
 * Function to create the worker leaderboard materialized view
 * Worker with highest XP appears first in the table
 */
export async function createLeaderboardMV() {
  await createMatView(
    'leaderboard',
    `SELECT 
    worker.*,
    profile->'name' as name,
    COALESCE(points.XP:: float, 0) as XP
    FROM
      worker
    LEFT JOIN
      (
        SELECT
          worker_id,
          COUNT(*) * 2 + SUM(COALESCE((report->>'accuracy')::int, 0)) as XP
        FROM
          microtask_assignment
        WHERE 
          status='COMPLETED' 
          OR 
          status='VERIFIED'
        GROUP BY worker_id
      ) as points
    ON worker.id = points.worker_id
    WHERE worker.profile IS NOT NULL
      `,
    'wgroup'
  );
}

export async function refreshLeaderboardMV() {
  await knex.raw(`REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard`);
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
