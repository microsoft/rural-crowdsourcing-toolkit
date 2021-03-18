// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fs from 'fs';
import config from '../config/Index';
import { KaryaFile } from '../db/TableInterfaces.auto';
import { getControllerError } from '../errors/ControllerErrors';
import * as BasicModel from '../models/BasicModel';
import { insertWorkerFile } from '../models/KaryaFileModel';
import * as HttpResponse from '../utils/HttpResponse';
import { KaryaHTTPContext } from './KoaContextType';

/**
 * Get the input karya file for a microtask via the microtask assignment ID. The
 * controller first checks if the microtask assignment is indeed assigned to
 * the requesting worker.
 * @param ctx Karya koa context
 */
export async function getInputFileForAssignment(ctx: KaryaHTTPContext) {
  // Get ID from the context
  const microTaskAssignmentId: number = ctx.params.id;

  try {
    // Retrieve the microtask assignment
    const mtaRecord = await BasicModel.getSingle('microtask_assignment', {
      id: microTaskAssignmentId,
    });

    // Check if the microtask assignment was made for this worker
    if (ctx.state.current_user.id != mtaRecord.worker_id) {
      HttpResponse.Unauthorized(
        ctx,
        'Illegal access. Microtask assignment was not for this worker',
      );
      return;
    }

    // Get the microtask for the assignment
    const microtask = await BasicModel.getSingle('microtask', {
      id: mtaRecord.microtask_id,
    });

    // If the microtask has no input file, then return
    if (!microtask.input_file_id) {
      HttpResponse.BadRequest(
        ctx,
        'Microtask does not have a input file associated with it',
      );
      return;
    }

    const fileId = microtask.input_file_id;
    const fileRecord = await BasicModel.getSingle('karya_file', { id: fileId });
    const filepath = `${config.filesFolder}/${fileRecord.container_name}/${fileRecord.name}`;

    ctx.attachment(fileRecord.name);
    HttpResponse.OK(ctx, fs.createReadStream(filepath));
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.NotFound(ctx, message);
  }
}

/**
 * Upload the output file for an assignment. The controller first checks if the
 * microtask assignment is indeed assigned to the requesting worker.
 * @param ctx Karya koa context
 */
export async function uploadOutputFileForAssignment(ctx: KaryaHTTPContext) {
  // Get the ID and file details from the context
  const mtaID: number = ctx.params.id;

  let karyaFile: KaryaFile;
  try {
    karyaFile = JSON.parse(ctx.request.body.data);
  } catch (e) {
    HttpResponse.BadRequest(ctx, 'Invalid JSON object');
    return;
  }

  const { files } = ctx.request;
  if (!files || !files.file) {
    HttpResponse.BadRequest(ctx, 'Need to attach a file to this request');
    return;
  }

  const file = files.file;

  try {
    // Get microtask assignment record
    const mtaRecord = await BasicModel.getSingle('microtask_assignment', {
      id: mtaID,
    });

    // Check if the assignment was made for this worker
    if (ctx.state.current_user.id !== mtaRecord.worker_id) {
      HttpResponse.Unauthorized(
        ctx,
        'Illegal access. Microtask assignment was not for this worker',
      );
      return;
    }

    // Check if this is an update
    // TODO: This is a temporary fix
    if (mtaRecord.output_file_id !== null) {
      const oldRecord = await BasicModel.getSingle('karya_file', {
        id: mtaRecord.output_file_id,
      });
      HttpResponse.OK(ctx, oldRecord);
      // HttpResponse.BadRequest(ctx, 'Updating output files is not allowed');
      return;
    }

    // Insert the record
    const fileRecord = await insertWorkerFile(
      ctx.state.current_user.id,
      karyaFile,
      {
        cname: 'microtask-assignment-output',
        microtask_assignment_id: mtaRecord.id,
        ext: 'tgz',
      },
      // @ts-ignore
      file.path,
    );

    HttpResponse.OK(ctx, fileRecord);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.NotFound(ctx, message);
  }
}
