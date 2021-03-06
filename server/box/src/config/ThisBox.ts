// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Set this box */

import { BoxRecord } from '../db/TableInterfaces.auto';
import * as BasicModel from '../models/BasicModel';
import box_id from './box_id';

let this_box: BoxRecord;
let authHeader: {
  'box-id': string;
  'id-token': string;
};

/**
 * Set the record for this box from the DB
 */
export async function SetBox() {
  this_box = await BasicModel.getSingle('box', { id: box_id });
  authHeader = {
    'box-id': this_box.id.toString(),
    'id-token': this_box.key as string,
  };
}

export { this_box, authHeader };
