// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import BodyParser from 'koa-body';
import * as BoxRequestController from '../controllers/BoxRequestController';

// Import router from the automatically created routes
// This router includes basic APIs that perform CRU operations on the tables
import router from './Routes.auto';

// Routes to handle requests from a box
router.put('/box/update/cc', BodyParser(), BoxRequestController.updateWithCreationCode);
router.put('/rbox/checkin', BodyParser(), BoxRequestController.checkin);
router.post('/rbox/updates', BoxRequestController.receiveUpdatesFromBox);
router.get('/rbox/updates', BoxRequestController.sendUpdatesForBox);
router.put('/rbox/upload-file', BodyParser({ multipart: true }), BoxRequestController.uploadFile);
router.get('/rbox/karya-file/:id', BoxRequestController.getKaryaFileWithSASToken);
router.get('/rbox/phone-auth-info', BoxRequestController.sendPhoneAuthInfo);

export default router;
