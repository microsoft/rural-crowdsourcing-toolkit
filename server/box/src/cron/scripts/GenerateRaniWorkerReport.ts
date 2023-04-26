// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Process an input file for a task via CLI

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, WorkerModel, setupBlobStore, BasicModel } from '@karya/common';
import { createObjectCsvWriter } from 'csv-writer';
import { PaymentsAccountRecord, WorkerRecord } from '@karya/core';

const csv_path = process.argv[2];

/** Main Script */
export async function generateRaniReport() {
  var raniWorkersResponse = (await knex.raw(`SELECT * FROM WORKER WHERE profile IS NOT NULL`)).rows

  var totalTimeSpentResponse = (await knex.raw(`
  SELECT t1.worker_id as worker_id,
  EXTRACT(EPOCH FROM sum(t2.ts - t1.ts)) as total_time_spent
  FROM
  (select id, worker_id, (elem->>'ts')::timestamp as ts
  from microtask_assignment
  cross join jsonb_array_elements((logs->>'logs')::jsonb) elem
  where elem->>'message' = 'marking microtask complete') t2
  INNER JOIN
  (select id, worker_id, (elem->>'ts')::timestamp as ts
  from microtask_assignment
  cross join jsonb_array_elements((logs->>'logs')::jsonb) elem
  where elem->>'message' = 'microtask setup complete') t1
  ON t2.id = t1.id
  GROUP BY t1.worker_id;
  `)).rows

  var totalDaysResponse = (await knex.raw(`
  select worker_id, count(DISTINCT extract(day from ((elem->>'ts')::timestamp))) as days
  from microtask_assignment
  cross join jsonb_array_elements((logs->>'logs')::jsonb) elem
  where elem->>'message' = 'marking microtask complete' group by worker_id;
  `)).rows

  var lastDayTimeSpentResponse = (await knex.raw(`
  SELECT t1.worker_id as worker_id,
  EXTRACT(EPOCH FROM sum(t2.ts - t1.ts)) as last_day_time_spent
  FROM
  (select id, worker_id, (elem->>'ts')::timestamp as ts
  from microtask_assignment
  cross join jsonb_array_elements((logs->>'logs')::jsonb) elem
  where elem->>'message' = 'marking microtask complete' and completed_at > current_date - 1) t2
  INNER JOIN
  (select id, worker_id, (elem->>'ts')::timestamp as ts
  from microtask_assignment
  cross join jsonb_array_elements((logs->>'logs')::jsonb) elem
  where elem->>'message' = 'microtask setup complete') t1
  ON t2.id = t1.id
  GROUP BY t1.worker_id;
  `)).rows

  var tasksDonePreviousDayResponse = (await knex.raw(`
  SELECT worker_id, count(*) as tasks_done_previous_day  from microtask_assignment 
  where status IN ('COMPLETED', 'VERIFIED') and completed_at > current_date - 1 
  group by worker_id;
  `)).rows

  var totalTimeSpentResponseMap: {[key: string]: string} = {}
  totalTimeSpentResponse.forEach((element: { worker_id: string | number; total_time_spent: string; }) => {
    totalTimeSpentResponseMap[element.worker_id] = element.total_time_spent
  });

  var totalDaysResponseMap: {[key: string]: string}  = {}
  totalDaysResponse.forEach((element: { worker_id: string | number; days: any; }) => {
    totalDaysResponseMap[element.worker_id] = element.days
  });

  var lastDayTimeSpentResponseMap: {[key: string]: string}  = {}
  lastDayTimeSpentResponse.forEach((element: { worker_id: string | number; last_day_time_spent: any; }) => {
    lastDayTimeSpentResponseMap[element.worker_id] = element.last_day_time_spent
  });

  var tasksDonePreviousDayResponseMap: {[key: string]: string}  = {}
  tasksDonePreviousDayResponse.forEach((element: { worker_id: string | number; tasks_done_previous_day: any; }) => {
    tasksDonePreviousDayResponseMap[element.worker_id] = element.tasks_done_previous_day
  });

  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth();

  const csvWriter = createObjectCsvWriter({
    path: `/home/karya/data/worker_report_${day}_${month}.csv`,
    header: [
        {id: 'date_joined', title: 'date_joined'},
        {id: 'unique_id', title: 'unique_id'},
        {id: 'name', title: 'name'},
        {id: 'phone_no', title: 'phone_no'},
        {id: 'center', title: 'center '},
        {id: 'payment_level', title: 'payment_level'},
        {id: 'accuracy_overall', title: 'accuracy_overall'},
        {id: 'payment_earned_total', title: 'payment_earned_total'},
        {id: 'payment_account_type', title: 'payment_account_type'},
        {id: 'payment_account_status', title: 'payment_account_status'},
        {id: 'payment_disbursed', title: 'payment_disbursed'},
        {id: 'no_tasks_completed', title: 'no_tasks_completed'},
        {id: 'no_days_active', title: 'no_days_active'},
        {id: 'time_active_platform', title: 'time_active_platform'},
        {id: 'last_day_task_completed', title: 'last_day_task_completed'},
        {id: 'last_day_time_spent', title: 'last_day_time_spent'},
        {id: 'endline_t', title: 'last_day_time_spent'},


    ]
  });

  const records: any[] = [];
  for (var i=0; i<raniWorkersResponse.length; i++) {
    const worker = raniWorkersResponse[i] as WorkerRecord
    const isWorkFromCenter = worker.tags.tags.includes('_wfc_')
    const paymentLevel = worker.tags.tags.includes('pay-low') ? 'low' : worker.tags.tags.includes('pay-high') ? 'high' : 'med' 

    const paymentEarnedTotal = await WorkerModel.getTotalEarned(worker.id)
    const paidTotal = await WorkerModel.getTotalSpent(worker.id)

    const response = (await knex.raw(`
      SELECT count(*) as total_completed FROM microtask_assignment WHERE worker_id = ${worker.id} AND STATUS IN ('COMPLETED', 'VERIFIED')
    `)).rows
    const totalAssignmentsCompleted = response ? response[0].total_completed : 0
    const accountRecordId = worker.selected_account ? worker.selected_account : null
    var accountRecord: PaymentsAccountRecord | null = null
    if (accountRecordId != null) {
      try {
        accountRecord = await BasicModel.getSingle('payments_account', { id: accountRecordId })
      } catch (e) {
        console.log(e)
      }
    }
    const payment_account_type = accountRecord ? accountRecord.account_type : null
    const payment_account_status = accountRecord ? accountRecord.status : null

    const obj = {
      date_joined: worker.registered_at,
      unique_id: worker.extras ? (worker.extras as any).unique_id: "",
      name: worker.profile ? (worker.profile as any).name : '',
      phone_no: worker.phone_number,
      center:  isWorkFromCenter ? 1 : 0,
      payment_level:  paymentLevel,
      accuracy_overall:  '',
      payment_earned_total: paymentEarnedTotal,
      payment_account_status:  payment_account_status ? payment_account_status : "NA",
      payment_account_type: payment_account_type ? payment_account_type : "NA",
      payment_disbursed:  paidTotal,
      no_tasks_completed:  totalAssignmentsCompleted,
      no_days_active:  totalDaysResponseMap[worker.id],
      time_active_platform:  totalTimeSpentResponseMap[worker.id],
      last_day_task_completed: tasksDonePreviousDayResponseMap[worker.id],
      last_day_time_spent: lastDayTimeSpentResponseMap[worker.id]

    }

    records.push(obj)
  }

  await csvWriter.writeRecords(records) 
  

};