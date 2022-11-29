import { knex } from '../Client';

/**
 *
 * Get payments detail for frontend
 */
export async function getPaymentsTransactionData(): Promise<any[]> {
    const response = await knex.raw(`SELECT tp.*, tw.phone_number, tw.name, tw.unique_id FROM 
    (select * from payments_transaction) tp 
    inner join (select id, phone_number, profile->>'name' as name, extras->>'unique_id' as unique_id from worker) tw 
    on tp.worker_id = tw.id;`
    );
    return response.rows;
}