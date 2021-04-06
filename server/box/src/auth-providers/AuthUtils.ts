// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Utilities to tokens */

import { randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { Worker, WorkerRecord, BasicModel } from '@karya/db';
import { IDTokenVerificationResponse } from './common/AuthProviderInterface';

const audience = 'karya-box';

/**
 * Generate token for a worker
 * @param worker Worker record
 */
export function generateToken(id: string, worker: Worker) {
  // Generate a random secret
  const secret = randomBytes(64).toString('base64').slice(0, 32);

  const expiresIn = '60 days';

  // Construct the payload
  const payload = { id };

  // Generate the token
  const id_token = jwt.sign(payload, secret, {
    audience,
    expiresIn,
    algorithm: 'HS256',
  });

  worker.salt = secret;
  worker.id_token = id_token;
  return worker;
}

/**
 * Verify an ID token
 * @param idToken Token to be verified
 */
export async function verifyToken(idToken: string): Promise<IDTokenVerificationResponse> {
  // decode the token
  const payload = jwt.decode(idToken, { json: true });

  if (!payload || !payload.id) {
    return { success: false, message: 'Invalid token' };
  }

  const worker_id = payload.id;

  // Get the worker record
  let worker: WorkerRecord;
  try {
    worker = await BasicModel.getSingle('worker', { id: worker_id });
  } catch (e) {
    return { success: false, message: 'Invalid token' };
  }

  // If the worker secret is not present, return
  if (!worker.salt) {
    return { success: false, message: 'Invalid token', matchInfo: worker };
  }

  // Use the salt to verify the token
  try {
    jwt.verify(idToken, worker.salt, { audience, algorithms: ['HS256'] });
    return { success: true, matchInfo: { id: worker_id } };
  } catch (e) {
    return { success: false, message: 'Expired token', matchInfo: worker };
  }
}
