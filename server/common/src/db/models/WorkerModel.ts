import { knex } from '../Client';

/**
 * Get summary info for all workers
 */
export async function workersSummary(): Promise<any[]> {
  const response = await knex.raw(`
    SELECT
      id,
      tags,
      box_id,
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
      GROUP BY worker_id
    ) as mta
  ON w.id = mta.worker_id
    `);

  return response.rows.map((row: any) => {
    const { assigned, completed, verified, earned, ...rest } = row;
    const extras = { assigned, completed, verified, earned };
    return { ...rest, extras };
  });
}
