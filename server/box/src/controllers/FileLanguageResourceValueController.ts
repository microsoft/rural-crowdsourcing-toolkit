// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Handler to send LRV files to the client
 */

import * as fs from 'fs';
import config from '../config/Index';
import { getControllerError } from '../errors/ControllerErrors';
import { ContainerName, getBlobName } from '../utils/BlobContainers';
import * as HttpResponse from '../utils/HttpResponse';
import { KaryaHTTPContext } from './KoaContextType';

/**
 * Fetch the LRV tar ball for a specific language or a language resource. The ID
 * of the language or the language resource is specified as a query parameter.
 * @param ctx Karya koa context
 */
export async function getLRVFile(ctx: KaryaHTTPContext) {
  const { language_id, language_resource_id } = ctx.request.query;
  let blobName: string;
  let containerName: ContainerName;

  if (language_id) {
    containerName = 'l-lrvs';
    // @ts-ignore
    blobName = getBlobName({ cname: containerName, language_id, ext: 'tar' });
  } else if (language_resource_id) {
    containerName = 'lr-lrvs';
    blobName = getBlobName({
      cname: containerName,
      // @ts-ignore
      language_resource_id,
      ext: 'tar',
    });
  } else {
    HttpResponse.BadRequest(
      ctx,
      'Need either language_id or language_resource_id parameter',
    );
    return;
  }

  const fileName = `${config.filesFolder}/${containerName}/${blobName}`;
  const fileCheck = fs.existsSync(fileName);
  if (!fileCheck) {
    HttpResponse.NotFound(ctx, 'File not found');
    return;
  }

  try {
    ctx.attachment(blobName);
    HttpResponse.OK(ctx, fs.createReadStream(fileName));
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}
