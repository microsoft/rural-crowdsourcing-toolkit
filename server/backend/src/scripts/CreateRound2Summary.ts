import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection } from '@karya/common';

async function createRound2Summary() {
  setupDbConnection();

  await knex.raw('DROP MATERIALIZED VIEW IF EXISTS worker_task_summary_round2');
  await knex.raw(`CREATE MATERIALIZED VIEW worker_task_summary_round2 as
    SELECT
      w.*,
      mta.task_id,
      CONCAT('week', mta.week+1),
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
        week,
        COALESCE(SUM((status='ASSIGNED')::int), 0) as assigned,
        COALESCE(SUM((status='COMPLETED')::int), 0) as completed,
        COALESCE(SUM((status='VERIFIED')::int), 0) as verified,
        COALESCE(SUM((status='SKIPPED')::int), 0) as skipped,
        COALESCE(SUM((status='EXPIRED')::int), 0) as expired,
        SUM(COALESCE(base_credits,0.0) + COALESCE(credits, 0.0)) as earned
      FROM
        (
            SELECT 
                mtaw.worker_id,
                mtaw.task_id, 
                mtaw.status, 
                mtaw.created_at, 
                mtaw.completed_at,
                mtaw.base_credits,
                mtaw.credits, 
                (extract(day from (mtaw.created_at - w.registered_at)) / 7)::int as week 
            FROM 
                microtask_assignment 
            AS mtaw 
            LEFT JOIN worker 
            AS w 
            ON mtaw.worker_id=w.id
        ) AS mtaw2
      GROUP BY (worker_id, task_id, week)
      ) as mta
     ON w.id = mta.worker_id
     WHERE
     mta.assigned > 0 OR mta.completed > 0 OR mta.verified > 0 OR mta.skipped > 0 OR mta.expired > 0`);
}

createRound2Summary()
  .catch((e) => console.log(e))
  .finally(() => knex.destroy());
