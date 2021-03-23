// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Implements APIs for the 'task' table. These endpoints can be accessed by a
// regular work provider, but need additional filters to ensure that a work
// provider can only access tasks that they have created. Hence, they could not
// be auto generated.

import BBPromise from 'bluebird';
import { Task, TaskRecord, TaskStatus } from '../db/TableInterfaces.auto';
import { getControllerError } from '../errors/ControllerErrors';
import * as BasicModel from '../models/BasicModel';
import {
  ParameterParserResponse,
  parseTaskParameters,
} from '../scenarios/common/ParameterParser';
import { IScenario, scenarioMap } from '../scenarios/Index';
import * as BlobStore from '../utils/AzureBlob';
import * as HttpResponse from '@karya/http-response';
import { KaryaHTTPContext } from './KoaContextType';

import { taskApprovalQueue, taskValidationQueue } from '../services/Index';
import { validateTask as taskValidationHandler } from '../services/ValidateTask';

/**
 * Function to create a work provider filter either based on an explicit query
 * parameter (only admin) or implicitly based on the work provider ID
 * (non-admin)
 * @param ctx koa context
 * @param ctx.request.query.work_provider_id explicit work provider filter
 * @param ctx.state.workProvider.id implicit work provider ID
 */
export function getWorkProviderFilter(ctx: KaryaHTTPContext): Task {
  const workProviderFilter: Task = {};

  // get current user
  const { current_user } = ctx.state;

  // first set the explicit ID if it is provided
  if (ctx.request.query.work_provider_id) {
    // @ts-ignore
    workProviderFilter.work_provider_id = ctx.request.query.work_provider_id;
  }
  // if not admin, override with the implicit ID
  if (!current_user.admin) {
    workProviderFilter.work_provider_id = current_user.id;
  }
  return workProviderFilter;
}

/**
 * Generate output SAS URLs for tasks
 */
export function generateOutputSasURLs(task: TaskRecord): TaskRecord {
  const params = task.params as {
    outputFiles: Array<[string, string, string | null]>;
  };
  if (params.outputFiles) {
    for (const f of params.outputFiles) {
      if (f[2]) {
        f[2] = BlobStore.getBlobSASURL(f[2], 'r', 60);
      }
    }
  }
  return { ...task, params };
}

/**
 * Controller to insert a new task record.
 * @param ctx koa context
 * @param ctx.request.body.data Task object to be inserted
 * @param ctx.request.files Any file parameter uploaded via this interface
 */
export async function insertRecord(ctx: KaryaHTTPContext) {
  try {
    // extract the task object and file attachments
    const task: Task = JSON.parse(ctx.request.body.data);
    const { files } = ctx.request;

    // get current user from state
    const { current_user } = ctx.state;

    // force work provider ID to be the ID of the current work provider
    task.work_provider_id = current_user.id;

    // get the scenario record
    const scenarioId = task.scenario_id;
    const scenarioRecord = await BasicModel.getSingle('scenario', {
      id: scenarioId,
    });

    // get the scenario object from the name
    const scenario = scenarioMap[scenarioRecord.name];

    // parse the task parameters
    const ppResponse = parseTaskParameters(scenario, task.params, files);
    const { params, uploadParams, blobParams, languageParams } = ppResponse;

    task.params = params;
    task.status = 'created';

    // Insert the task into the Db
    const insertedRecord = await BasicModel.insertRecord('task', task);
    const task_id = insertedRecord.id;

    const errors: string[] = [];

    // Check if all the language params are valid
    for (const paramid of languageParams) {
      try {
        const languageID = params[paramid] as number;
        await BasicModel.getSingle('language', { id: languageID });
      } catch (langErr) {
        errors.push(`Invalid language input for ${paramid}`);
      }
    }

    const actions: string[] = [];
    // Create appropriate blob names for the blobs and store
    if (Object.keys(blobParams).length > 0) {
      Object.entries(blobParams).map(([param_id, info]) => {
        try {
          const blobURL = BlobStore.getBlobURL({
            cname: 'task-params',
            task_id,
            param_id,
            ext: info.ext,
          });
          params[param_id] = blobURL;
          actions.push(blobURL);
        } catch (e) {
          errors.push(`Failed to get URL for '${param_id}'`);
        }
      });
    }

    // Upload all files to be uploaded
    await BBPromise.map(Object.entries(uploadParams), async args => {
      try {
        const [param_id, info] = args;
        const blobURL = await BlobStore.uploadBlobFromFile(
          {
            cname: 'task-params',
            task_id,
            param_id,
            ext: info.ext,
          },
          info.file.path,
        );
        params[param_id] = blobURL;
      } catch (e) {
        errors.push(`Failed to upload`);
      }
    });

    let status: TaskStatus = 'created';

    // If there are no errors or no blobParams, then the task can be moved to submitted state
    if (errors.length === 0 && actions.length === 0) {
      status = 'submitted';
    }

    // Update task
    const updatedRecord = await BasicModel.updateSingle(
      'task',
      { id: task_id },
      {
        status,
        params,
        errors: errors.length > 0 ? { messages: errors } : {},
        actions: actions.length > 0 ? { uploads: actions } : {},
      },
    );

    // successful response
    HttpResponse.OK(ctx, updatedRecord);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.BadRequest(ctx, message);
  }
}

/**
 * Controller to update an existing task record by ID. If not admin, need to
 * check for permissions
 * @param ctx koa context
 * @param ctx.params.id ID of the task to be updated
 * @param ctx.request.body Object containing the updates
 */
export async function updateRecordById(ctx: KaryaHTTPContext) {
  /** TODO: This funciton needs to be fixed
   * 1. File upload needs to happen via the other channel
   * 2. The update record may not contain all the parameters
   */
  // get current user
  const { current_user } = ctx.state;

  // extract the ID and updates from params
  const task_id: number = ctx.params.id;
  const task: Task = ctx.request.body;

  try {
    // don't allow edit if the status of the task is beyond 'validated'
    if (
      task.status == 'approved' ||
      task.status == 'assigned' ||
      task.status == 'completed'
    ) {
      HttpResponse.BadRequest(ctx, 'Task cannot be updated after approval');
      return;
    }

    // force work provider ID to be the ID of the current work provider
    task.work_provider_id = current_user.id;

    // get the scenario record
    const scenarioId = task.scenario_id;
    const scenarioRecord = await BasicModel.getSingle('scenario', {
      id: scenarioId,
    });

    // get the scenario object from the name
    const scenario: IScenario = scenarioMap[scenarioRecord.name];

    // parse the task parameters
    let ppResponse: ParameterParserResponse;
    ppResponse = parseTaskParameters(scenario, task.params, ctx.request.files);

    task.params = ppResponse.params;

    // Upload files if it is provided
    // This part needs to be verified
    // TODO: This functionality should be separate?
    if (ctx.request.files) {
      const file = ctx.request.files.fileData;
      const taskParams: any = task.params;
      // TODO: This function needs fixing
      // adding uploaded file's path to the task param
      // taskParams.filePath = result.url;
    }

    task.status = 'submitted';
    const taskRecord = await BasicModel.updateSingle(
      'task',
      { id: task_id },
      task,
    );

    // successful response
    HttpResponse.OK(ctx, taskRecord);

    // run validating task utility in background
    // runService('validate_task', { task, scenario });
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}

/**
 * Controller to get a record by ID. Need to filter by work_provider_id if
 * necessary.
 * @param ctx koa context
 * @param ctx.params.id ID of the task
 */
export async function getRecordById(ctx: KaryaHTTPContext) {
  // extract id from the params
  const id: number = ctx.params.id;

  // get the current user from state
  const { current_user } = ctx.state;

  // create the ID filger
  const filter: Task = { id };

  // add the work_provider field if not admin
  if (!current_user.admin) {
    filter.work_provider_id = current_user.id;
  }

  try {
    // retrieve the record
    const record = await BasicModel.getSingle('task', filter);
    HttpResponse.OK(ctx, generateOutputSasURLs(record));
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.NotFound(ctx, message);
  }
}

/**
 * Controller to get all the tasks. Need to filter by work_provider_id if not
 * admin.
 * @param ctx koa context
 */
export async function getRecords(ctx: KaryaHTTPContext) {
  // generate the work provider filter
  const workProviderFilter: Task = getWorkProviderFilter(ctx);

  try {
    // retrieve the records
    const records = await BasicModel.getRecords('task', workProviderFilter);
    const recordsWithSAS = records.map(t => generateOutputSasURLs(t));
    HttpResponse.OK(ctx, recordsWithSAS);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}

/**
 * Validate a task
 * @param ctx koa context
 */
export async function validateTask(ctx: KaryaHTTPContext) {
  // TODO: Async path to be properly implemented

  // extract ID from params
  const id: number = ctx.params.id;

  try {
    // get the task record
    const taskRecord = await BasicModel.getSingle('task', { id });

    // get the scenario record
    const scenarioRecord = await BasicModel.getSingle('scenario', {
      id: taskRecord.scenario_id,
    });

    // get scenario object
    const scenario = scenarioMap[scenarioRecord.name];

    // If scenario has synchronous validation, direclty call the task validator
    if (scenario.synchronous_validation) {
      const updatedRecord = await taskValidationHandler(taskRecord);

      // If validation failed, then return bad request
      if (updatedRecord === null) {
        HttpResponse.BadRequest(
          ctx,
          'Task validation failed. Please fix the errors in your submission',
        );
        return;
      }

      HttpResponse.OK(ctx, updatedRecord);
    } else {
      await taskValidationQueue.add(taskRecord);

      const updatedRecord = await BasicModel.updateSingle(
        'task',
        { id: taskRecord.id },
        { status: 'validating' },
      );

      HttpResponse.OK(ctx, updatedRecord);
    }
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.BadRequest(ctx, message);
  }
}

/**
 * Controller to approve a task. Calls an async task that run in the background.
 * Sets the task status to 'approving' and returns to the client
 * @param ctx koa context
 */
export async function approveTask(ctx: KaryaHTTPContext) {
  // extract ID from params
  const id: number = ctx.params.id;

  try {
    const taskRecord = await BasicModel.getSingle('task', { id });

    // Insert the task into the approval queue
    // TODO: Should we capture the job ID and store it in the DB?
    await taskApprovalQueue.add(taskRecord);

    // update the task status to 'approving'
    const updatedRecord = await BasicModel.updateSingle(
      'task',
      { id },
      { status: 'approving' },
    );

    HttpResponse.OK(ctx, updatedRecord);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.BadRequest(ctx, message);
  }
}
