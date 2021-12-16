import { knex } from '../Client';

/**
 * Get summary info of all workers
 */
export async function workersSummary(): Promise<any[]> {
  const response = await knex.raw(`
    SELECT
      w.*,
      COALESCE((mta.assigned + mta.completed + mta.verified)::int, 0) as assigned,
      COALESCE((mta.completed + mta.verified)::int, 0) as completed,
      COALESCE((mta.verified)::int, 0) as verified,
      (mta.earned) as earned,
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
    `);

  return response.rows.map((row: any) => {
    const { assigned, completed, verified, earned, earliest, latest, ...rest } = row;
    const extras = { assigned, completed, verified, earned, earliest, latest };
    return { ...rest, extras };
  });
}

/**
 * Get summary info of workers for a particular task
 */
export async function workersTaskSummary(task_id: string): Promise<any[]> {
  const response = await knex.raw(`
    SELECT
      w.*,
      COALESCE((mta.assigned + mta.completed + mta.verified)::int, 0) as assigned,
      COALESCE((mta.completed + mta.verified)::int, 0) as completed,
      COALESCE((mta.verified)::int, 0) as verified,
      (mta.earned) as earned
    FROM 
      worker as w
    LEFT JOIN
    (
      SELECT
        worker_id,
        COALESCE(SUM((status='ASSIGNED')::int), 0) as assigned,
        COALESCE(SUM((status='COMPLETED')::int), 0) as completed,
        COALESCE(SUM((status='VERIFIED')::int), 0) as verified,
        COALESCE(SUM(credits), 0) as earned
      FROM
        microtask_assignment
      WHERE
        task_id = ${task_id}
      GROUP BY worker_id
    ) as mta
    ON w.id = mta.worker_id
    WHERE
      mta.assigned > 0
    `);

  return response.rows.map((row: any) => {
    const { assigned, completed, verified, earned, ...rest } = row;
    const extras = { assigned, completed, verified, earned };
    return { ...rest, extras };
  });
}

/**
   * 
   * @param worker_id 
   * Get Balance (credits - claimed) for a particular worker
   */
 export async function getBalance(worker_id: string): Promise<number> {
  const response = await knex.raw(`SELECT  sum(credits) - (SELECT sum(amount) 
  FROM payments_transaction WHERE worker_id = ${worker_id} 
  AND status IN ('created', 'queued', 'processing', 'processed') ) as total 
  FROM microtask_assignment WHERE status='VERIFIED' AND worker_id = ${worker_id};`)
  let balance = response.rows[0].total
  return balance? balance: 0
 }