import { WorkerRecord } from '@karya/core';
import { knex } from '../Client';
import { BasicModel } from '../Index';

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
      COALESCE((mta.earned)::int, 0) as earned
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

/** Code to handle worker disabling */
const disabledTag = '_DISABLED_';

/**
 * Check if a worker is disabled
 * @param worker Worker record
 */
export function isDisabled(worker: Pick<WorkerRecord, 'tags'>): boolean {
  const workerTags = worker.tags.tags;
  return workerTags.indexOf(disabledTag) >= 0;
}

/**
 * Mark a worker as disabled
 * @param worker_id ID of a worker
 */
export async function markDisabled(worker_id: string): Promise<WorkerRecord> {
  const worker = await BasicModel.getSingle('worker', { id: worker_id });
  const tags = worker.tags.tags;
  if (tags.indexOf(disabledTag) < 0) {
    tags.push(disabledTag);
    const currentTime = new Date().toISOString();
    const updatedWorker = await BasicModel.updateSingle(
      'worker',
      { id: worker_id },
      { tags: { tags }, tags_updated_at: currentTime }
    );
    return updatedWorker;
  } else {
    return worker;
  }
}

/**
 *
 * @param worker_id
 * Get Balance (credits - claimed) for a particular worker
 */
export async function getBalance(worker_id: string): Promise<number> {
  const response = await knex.raw(`SELECT  COALESCE(sum(credits), 0) - (SELECT COALESCE(sum(amount), 0)  
  FROM payments_transaction WHERE worker_id = ${worker_id} 
  AND status IN ('created', 'queued', 'processing', 'processed', 'failed_after_transaction') ) as total 
  FROM microtask_assignment WHERE status='VERIFIED' AND worker_id = ${worker_id};`);
  let balance = response.rows[0].total;
  return balance ? balance : 0;
}

/**
 * Get total amount spent by a worker
 */
export async function getTotalSpent(worker_id: string): Promise<number> {
  const response = await knex.raw(`SELECT sum(amount) as total
    FROM payments_transaction WHERE worker_id = ${worker_id} 
    AND status IN ('created', 'queued', 'processing', 'processed', 'failed_after_transaction')`);
  let spent = response.rows[0].total;
  return spent ? spent : 0;
}

/**
 *
 * @returns eligible workers who can get paid with respective amount
 */
export async function getEligibleWorkersForPayments(): Promise<any[]> {
  const response = await knex.raw(`
    SELECT tw.*, t3.amount FROM 
    (SELECT t2.worker_id, t2.sac-COALESCE(t1.sat,0) as amount FROM (SELECT worker_id, sum(amount)
     AS SAT FROM payments_transaction  WHERE status IN 
     ('created', 'queued', 'processing', 'processed') GROUP BY worker_id  ) t1 
     RIGHT JOIN (SELECT worker_id,sum(credits) AS SAC FROM microtask_assignment WHERE status='VERIFIED' GROUP BY worker_id) t2
     ON (t1.worker_id = t2.worker_id)) t3 INNER JOIN (select * from worker where payments_active=true) tw ON (t3.worker_id=tw.id) 
     INNER JOIN (SELECT * FROM payments_account WHERE STATUS='VERIFIED') ta ON (tw.selected_account=ta.id);
   `);

  return response.rows.reduce((filtered: any[], row: any) => {
    if (row.amount > 0) {
      filtered.push(row);
    }
    return filtered;
  }, []);
}
