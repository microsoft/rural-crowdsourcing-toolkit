// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Controllers to handle requests from the box
 */

import { randomBytes } from 'crypto';
import * as jwtSimple from 'jwt-simple';
import RawBody from 'raw-body';
import config from '../config/Index';
import { Box, BoxRecord, KaryaFileRecord } from '../db/TableInterfaces.auto';
import { getControllerError } from '../errors/ControllerErrors';
import * as BasicModel from '../models/BasicModel';
import * as BoxRequestModel from '../models/BoxRequestModel';
import { getChecksum } from '../models/KaryaFileModel';
import * as BS from '../utils/AzureBlob';
import { compress, decompress } from '../utils/CompressTools';
import * as HttpResponse from '@karya/http-response';
import { KaryaHTTPContext } from './KoaContextType';
import logger from '../utils/Logger';

/**
 * Check in request from the box. Update box params with the timestamp.
 * @param ctx Koa context
 */
export async function checkin(ctx: KaryaHTTPContext) {
  const box = ctx.state.current_box;
  const params = { ...box.params, last_check_in_at: new Date().toISOString() };
  await BasicModel.updateSingle('box', { id: box.id }, { params });
  HttpResponse.OK(ctx, {});
}

/**
 * Send phone auth server information to box
 * @param ctx Karya koa context
 */
export async function sendPhoneAuthInfo(ctx: KaryaHTTPContext) {
  // Send phone OTP information
  HttpResponse.OK(ctx, config.phoneOtp);
}

/**
 * Get karya file with new SAS token
 * @param ctx Karya koa context
 */
export async function getKaryaFileWithSASToken(ctx: KaryaHTTPContext) {
  // Get ID from the request
  const id: number = ctx.params.id;

  try {
    // Get Karya file
    const karyaFile = await BasicModel.getSingle('karya_file', { id });

    // If URL is null, return (this should not be happening)
    if (karyaFile.url === null) {
      HttpResponse.BadRequest(ctx, 'Unable to fetch URL for file');
      return;
    }

    // Update URL with SAS token
    karyaFile.url = BS.getBlobSASURL(karyaFile.url, 'r');
    HttpResponse.OK(ctx, karyaFile);
  } catch (err) {
    const messages = getControllerError(err);
    HttpResponse.BadRequest(ctx, messages);
  }
}

/**
 * Upload a file from the box to the server
 * @param ctx Karya koa context
 */
export async function uploadFile(ctx: KaryaHTTPContext) {
  // extract details from the box
  const { body, files } = ctx.request;

  // Check if request is valid
  if (!body.data || !files || !files.file) {
    HttpResponse.BadRequest(
      ctx,
      'Invalid request. Need file record and file attachment',
    );
    return;
  }

  let fileRecord: KaryaFileRecord;

  try {
    fileRecord = JSON.parse(ctx.request.body.data);
  } catch (err) {
    HttpResponse.BadRequest(ctx, 'Bad JSON file object');
    return;
  }

  // Check if the file is from the box
  const box = ctx.state.current_box;
  if (fileRecord.box_id !== box.id) {
    HttpResponse.BadRequest(ctx, 'Cannot update some other box');
    return;
  }

  // Extract the file
  const file = files.file;

  // Compute checksum and if checksum doesn't match, return
  // @ts-ignore
  const checksum = await getChecksum(file.path, fileRecord.algorithm);
  if (checksum !== fileRecord.checksum) {
    HttpResponse.BadRequest(ctx, 'Checksum did not match');
    return;
  }

  // If there is an existing record with the same checksum, then we can ignore uploading
  try {
    const serverRecord = await BasicModel.getSingle('karya_file', {
      id: fileRecord.id,
    });
    if (serverRecord.checksum == checksum) {
      HttpResponse.OK(ctx, serverRecord);
      return;
    }
  } catch (e) {
    // no existing record
  }

  try {
    // Upload the file to the server
    const blobURL = await BS.uploadBlobFromFileWithName(
      fileRecord.container_name,
      fileRecord.name,
      // @ts-ignore
      file.path,
    );

    // First upsert the record
    await BasicModel.upsertRecord('karya_file', fileRecord);

    // update local karya_file record
    const serverRecord = await BasicModel.updateSingle(
      'karya_file',
      { id: fileRecord.id },
      {
        url: blobURL,
        in_server: true,
      },
    );

    HttpResponse.OK(ctx, serverRecord);
  } catch (err) {
    const messages = getControllerError(err);
    HttpResponse.BadRequest(ctx, messages);
  }
}

/**
 * Receive updates from the box and apply them to the server DB
 * @param ctx Koa context
 */
export async function receiveUpdatesFromBox(ctx: KaryaHTTPContext) {
  // Extract box info and compressed updates from ctx
  const box = ctx.state.current_box;

  // Decompress the updates
  let updatesString: string;
  try {
    const compressedUpdates: Buffer = await RawBody(ctx.request.req);
    updatesString = await decompress(compressedUpdates);
  } catch (e) {
    HttpResponse.BadRequest(ctx, 'Could not decompress updates');
    return;
  }

  // JSON parse the update string
  let updates: any;
  try {
    updates = JSON.parse(updatesString);
  } catch (e) {
    HttpResponse.BadRequest(ctx, 'Updates should be a valid JSON object');
    return;
  }

  // Apply the updates
  try {
    await BoxRequestModel.applyUpdatesFromBox(box, updates);
    HttpResponse.OK(ctx, {});
  } catch (e) {
    logger.error(e);
    HttpResponse.BadRequest(ctx, 'Error while applying updates');
    return;
  }
}

/**
 * Collect updates for a box and send them
 * @param ctx Koa context
 */
export async function sendUpdatesForBox(ctx: KaryaHTTPContext) {
  // Get box record and from timestamp from ctx
  const box = ctx.state.current_box;
  const from = ctx.query.from as string;

  if (!from) {
    HttpResponse.BadRequest(ctx, 'Need a from timestamp');
    return;
  }

  // Get all updates for the box
  try {
    const updates = await BoxRequestModel.getUpdatesForBox(box, from);
    const updateString = JSON.stringify(updates);
    const compressedUpdates = await compress(updateString);
    HttpResponse.OK(ctx, compressedUpdates);
  } catch (e) {
    HttpResponse.BadRequest(ctx, 'Error while collecting updates');
  }
}

/**
 * Creates a sample box
 * @param ctx koa context object
 * @param ctx.params.id id of the box;
 * @param ctx.request.body.boxObject updated box object;
 * @returns returns the assignment object in response body
 */
export async function updateWithCreationCode(ctx: KaryaHTTPContext) {
  const box: Box = ctx.request.body;
  let boxRecord: BoxRecord;

  // Check if the creation code is valid
  try {
    const { creation_code } = box;
    boxRecord = await BasicModel.getSingle('box', { creation_code });
  } catch (e) {
    HttpResponse.BadRequest(ctx, 'Invalid creation code');
    return;
  }

  // Check if the creation code is already used
  if (boxRecord.key !== null) {
    HttpResponse.BadRequest(ctx, 'Creation code already in use');
    return;
  }

  // Create the key for the box
  const { salt, key } = createNewKeyForBox(boxRecord);
  box.salt = salt;
  box.key = key;

  // Remove unnecessary fields from box
  delete box.physical;

  try {
    const updatedRecord = await BasicModel.updateSingle(
      'box',
      { id: boxRecord.id },
      box,
    );

    // Don't send salt to the box
    updatedRecord.salt = null;
    HttpResponse.OK(ctx, updatedRecord);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.BadRequest(ctx, message);
  }
}

/**
 * Creates a new key for the given box and returns the salt and key
 * @param boxRecord Box record
 */
function createNewKeyForBox(boxRecord: BoxRecord) {
  const payload = {
    id: boxRecord.id,
    exp: Date.now() + 1000 * 60 * 60 * 48,
  };
  const salt = randomBytes(64)
    .toString('base64')
    .slice(0, 32);
  const key = jwtSimple.encode(payload, salt, 'HS256');
  return { salt, key };
}
