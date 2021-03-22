// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// File containing controllers for the 'language_resource_value' table that
// could not be autimatically implemented.

import { knex } from '../db/Client';
import { tableFilterColumns } from '../db/TableFilterColumns.auto';
import * as BasicModel from '../models/BasicModel';
import * as HttpResponse from '../utils/HttpResponse';
import { KaryaHTTPContext } from './KoaContextType';

import {
  LanguageResource,
  LanguageResourceRecord,
  LanguageResourceValue,
  LanguageResourceValueRecord,
} from '../db/TableInterfaces.auto';
import { getControllerError } from '../errors/ControllerErrors';

import { languageLRVTarQueue, lrLRVTarQueue } from '../services/Index';

import * as BlobStore from '../utils/AzureBlob';

/**
 * Function to get all language resource value records. This function has two
 * possible filters. language_id and a list of language_resources specified by a
 * generic language_resource filter.
 * @param ctx koa request context
 */
export async function getRecords(ctx: KaryaHTTPContext) {
  try {
    const { query } = ctx.request;

    // check if there is a language_id filter
    const languageFilter: LanguageResourceValue = {};
    if (query.language_id) {
      languageFilter.language_id = query.language_id as string;
    }

    // Check if there is a language resource filter
    const lrFilter: LanguageResource = {};
    tableFilterColumns['language_resource'].forEach(col => {
      if (query[col]) {
        // @ts-ignore
        lrFilter[col] = query[col];
      }
    });

    let records: LanguageResourceValueRecord[] = [];

    // If there is a lr filter, complex path
    if (lrFilter !== {}) {
      records = await knex<LanguageResourceValueRecord>(
        'language_resource_value',
      )
        .select()
        .where(languageFilter)
        .whereIn(
          'language_resource_id',
          knex<LanguageResourceRecord>('language_resource')
            .select('id')
            .where(lrFilter),
        );
    } else {
      // no scenario_id filter. simply return records with any language filter
      records = await BasicModel.getRecords(
        'language_resource_value',
        languageFilter,
      );
    }

    // return the list of retrieved records
    HttpResponse.OK(ctx, records);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}

/**
 * Handle value creation for a new file resource
 * @param ctx Koa request context
 */
export async function createFileResourceValue(ctx: KaryaHTTPContext) {
  // Extract language resource object from the body
  const lrv: LanguageResourceValue = JSON.parse(ctx.request.body.data);

  // If no file attached return with error
  const file = ctx.request.files?.file;
  if (file === undefined) {
    HttpResponse.BadRequest(ctx, 'Need to upload a file with this resource');
    return;
  }

  // check if the language resource object is well specified
  if (!lrv.language_resource_id || !lrv.language_id) {
    HttpResponse.BadRequest(ctx, 'No IDs provided');
    return;
  }

  // check if the file has an extension
  const ext = (file as unknown as File).name.split('.').pop();
  if (ext === undefined) {
    HttpResponse.BadRequest(
      ctx,
      'Uploaded file needs to have an appropriate extension.',
    );
    return;
  }

  try {
    // upload file to azure blob
    const { language_resource_id, language_id } = lrv;
    const blobURL = await BlobStore.uploadBlobFromFile(
      {
        cname: 'lang-res',
        language_resource_id,
        language_id,
        ext,
      },
      // @ts-ignore
      file.path,
    );

    // insert the record into the db
    lrv.value = blobURL;
    const insertedRecord = await BasicModel.insertRecord(
      'language_resource_value',
      lrv,
    );

    // set lrv file flag
    await setLRVFileUpdateFlag(insertedRecord);

    HttpResponse.OK(ctx, insertedRecord);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}

/**
 * Update a file resource with a new one. Deletes the old file if the new one
 * has a different extension.
 * @param ctx Koa context
 */
export async function updateFileResourceValue(ctx: KaryaHTTPContext) {
  // Extract updates and id from request
  const updates: LanguageResourceValue = JSON.parse(ctx.request.body.data);
  const id = ctx.params.id;

  // If no file attached return with error
  const file = ctx.request.files?.file;
  if (file === undefined) {
    HttpResponse.BadRequest(ctx, 'Need to upload a file with this resource');
    return;
  }

  // check if the file has an extension
  const ext = (file as unknown as File).name.split('.').pop();
  if (ext === undefined) {
    HttpResponse.BadRequest(
      ctx,
      'Uploaded file needs to have an appropriate extension.',
    );
    return;
  }

  const match: LanguageResourceValue = { id };

  try {
    // get the current record
    const lrvRecord = await BasicModel.getSingle(
      'language_resource_value',
      match,
    );

    // replace the current blob with new file
    const { language_id, language_resource_id } = lrvRecord;
    const blobURL = await BlobStore.replaceBlobWithFile(
      {
        cname: 'lang-res',
        language_resource_id,
        language_id,
        ext,
      },
      lrvRecord.value,
      //@ts-ignore
      file.path,
    );

    // add blob URL to updates
    updates.value = blobURL;

    // update the record in the db
    const updatedRecord = await BasicModel.updateSingle(
      'language_resource_value',
      match,
      updates,
    );

    // set update lrv file flag
    await setLRVFileUpdateFlag(updatedRecord);

    HttpResponse.OK(ctx, updatedRecord);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.BadRequest(ctx, message);
  }
}

/**
 * Function to set the update_lrv_file flag for a language and a language
 * resource when a specific value is created or updated
 * @param lrv LRV record corresponding to a file resource
 */
async function setLRVFileUpdateFlag(lrv: LanguageResourceValueRecord) {
  // Check the flag for the language. If the flag is true, it means a Bull job
  // is already scheduled, and there is nothing to do here.
  const language = await BasicModel.getSingle('language', {
    id: lrv.language_id,
  });
  if (!language.update_lrv_file) {
    // update the language record
    const updatedLanguageRecord = await BasicModel.updateSingle(
      'language',
      { id: lrv.language_id },
      { update_lrv_file: true },
    );

    languageLRVTarQueue.add(updatedLanguageRecord, { delay: 60000 });
  }

  // Check the flag for the LR. If the flag is true, it means a Bull job is
  // already scheduled. Nothing to be done here.
  const lr = await BasicModel.getSingle('language_resource', {
    id: lrv.language_resource_id,
  });
  if (!lr.update_lrv_file) {
    // update the language resource
    const updatedLRR = await BasicModel.updateSingle(
      'language_resource',
      { id: lrv.language_resource_id },
      { update_lrv_file: true },
    );

    lrLRVTarQueue.add(updatedLRR, { delay: 60000 });
  }
}
