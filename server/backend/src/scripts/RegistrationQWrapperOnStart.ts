// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Push all the server api status account records back into the queue

// WARNING: PLEASE ENSURE THE SERVER IS RUNNING BEFORE EXCECUTING THIS SCRIPT

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, setupBlobStore, BasicModel } from '@karya/common';
import { AccountTaskStatus, TaskRecordType } from '@karya/core';
import { RegistrationQWrapper } from '../Queue/Registration/RegistrationQWrapper';
import { RegistrationQConfig } from '../Queue/Registration/RegistrationQConfig';

/** Main Script */
(async () => {
  setupDbConnection();
  
  const serverAPIAccounts = await BasicModel.getRecords('payments_account', { status: AccountTaskStatus.SERVER_API })
  const registrationQ = new RegistrationQWrapper(RegistrationQConfig);
  
  for (const accountRecord of serverAPIAccounts) {
    await registrationQ.enqueue(
        accountRecord.id, {
        accountRecord: { ...accountRecord },
        boxId: accountRecord.box_id
        }
    )
  }

})().finally(() => knex.destroy());
