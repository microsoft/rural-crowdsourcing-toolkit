import { knex } from '../Client';

/**
 *
 * Get payments detail for frontend
 */
export async function getPaymentsTransactionData(worker_id: string): Promise<any[]> {
    const response = await knex.raw(`SELECT tp.*, tw.unique_id FROM 
    (select * from payments_transaction) tp 
    inner join (select id, extras->>'unique_id' as unique_id from worker) tw 
    on tp.worker_id = tw.id;`
    );
    return response.rows;
}