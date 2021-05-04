// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Helper to generate and verify karya ID tokens

import jwt, { SignOptions, VerifyOptions, JwtHeader } from 'jsonwebtoken';
import { AuthEntity, AuthMechanism, AuthRecord } from '../Common';
import { envGetString } from '@karya/misc-utils';
import { DbRecordType } from '../../Index';
import Application from 'koa';
import { SetOption as CookieOptions } from 'cookies';
import * as HttpResponse from '@karya/http-response';
import { BasicModel } from '../../db/Index';

/**
 * process.env[$CURRENT_JWT_KID] is the current ID of the key to be used to
 * generate ID tokens.
 * process.env[$JWT_KEY_PREFIX + $currentKeyId] is the secret key to be used to
 * generate the ID tokens.
 */
const CURRENT_JWT_KID = 'KARYA_JWT_KID';
const JWT_KEY_PREFIX = 'KARYA_JWT_KEY_';

// Karya JWT options
const karyaJWTOptions: SignOptions & VerifyOptions = {
  algorithm: 'HS256',
  audience: 'karya-server',
  issuer: 'karya-server',
};

// Karya JWT payload type
type KaryaJWTPayload = {
  sub?: string;
  entity?: AuthEntity;
};

/**
 * Generate an ID token for an entity registered with the server.
 * @param entity Name of the entity for which token should be generated
 * @param id ID for which token should be generated
 */
function generateKaryaIdToken(entityType: AuthEntity, id: string, expiresIn: string = '30 days') {
  // Get the key ID and key from environment
  const keyId = envGetString(CURRENT_JWT_KID);
  const key = envGetString(JWT_KEY_PREFIX + keyId);

  // Generate the payload
  const payload: KaryaJWTPayload = {
    sub: id,
    entity: entityType,
  };

  const idToken = jwt.sign(payload, key, { ...karyaJWTOptions, expiresIn, keyid: keyId });
  return idToken;
}

/**
 * Verify if a Karya ID token is valid
 * @param entityType Name of the entity for which the token is to be generated
 * @param id_token ID token to be verified
 */
export async function verifyKaryaIdToken(entityType: AuthEntity, id_token: string): Promise<AuthRecord> {
  // Token cannot be decoded or does not contain the header
  const decoded = jwt.decode(id_token, { json: true, complete: true });
  if (!decoded || !decoded.header) {
    throw new Error('Invalid id-token');
  }

  const header: JwtHeader = decoded.header;
  const kid = header.kid;
  // No key ID
  if (!kid) {
    throw new Error('No key ID');
  }

  const jwtKey = process.env[JWT_KEY_PREFIX + kid];
  // No key present for key ID
  if (!jwtKey) {
    throw new Error(`Invalid key ID '${kid}'`);
  }

  try {
    const payload: KaryaJWTPayload = jwt.verify(id_token, jwtKey, karyaJWTOptions) as object;
    // Invalid payload
    if (payload.entity != entityType || !payload.sub) {
      throw new Error('Invalid payload in token');
    }

    // @ts-ignore
    const record = await BasicModel.getSingle(entityType, { id: payload.sub });
    return record;
  } catch (e) {
    throw new Error(`Invalid ID Token`);
  }
}

// Expected state for authentication routes
export type KaryaIDTokenState<EntityType extends 'server_user' | 'worker' | 'box'> = {
  auth_mechanism: AuthMechanism | null;
  entity: DbRecordType<EntityType>;
};

// Karya ID token options
type KaryaIDTokenOptions = {
  inCookie?: boolean;
  tokenExpiresIn?: string;
  cookieOptions?: CookieOptions;
  cookieExpiresIn?: number;
};

// Default options
const defaultIDTokenOptions: KaryaIDTokenOptions = {
  inCookie: false,
  tokenExpiresIn: '30 days',
  cookieOptions: {
    maxAge: 60 * 60,
    httpOnly: true,
    sameSite: true,
  },
};

/**
 * Generates a set of middlewares and route handlers to generate and verify ID
 * tokens
 * @param entityType Name of the entity type
 */
export function KaryaIDTokenHandlerTemplate<EntityType extends 'server_user' | 'worker' | 'box'>(
  entityType: EntityType,
  optionsArg?: KaryaIDTokenOptions
) {
  // ID token options
  const options = optionsArg ? { ...defaultIDTokenOptions, ...optionsArg } : defaultIDTokenOptions;

  type TokenMiddleware = Application.Middleware<KaryaIDTokenState<EntityType>>;

  /**
   * Generate ID token for the entity
   * @param ctx Karya request context
   * @param next Optional middleware in the chain
   */
  const generateToken: TokenMiddleware = async (ctx, next) => {
    try {
      const id_token = generateKaryaIdToken(entityType, ctx.state.entity.id, options.tokenExpiresIn);

      // Check if id_token should be sent via cookie or record
      if (options.inCookie) {
        ctx.cookies.set('karya-id-token', id_token, options.cookieOptions);
      } else {
        ctx.state.entity.id_token = id_token;
      }

      // Tentative response set by generate token
      HttpResponse.OK(ctx, {});
      await next();
    } catch (e) {
      HttpResponse.Unavailable(ctx, 'Unable to generate ID token');
    }
  };

  /**
   * Authenticate an incoming request. This middleware authenticates a request
   * in following manner:
   * 1) Check if karya-id-token is present
   * 2) If yes,
   *  2.1) Verify the ID token
   *  2.2) If valid, mark request as authenticated with id-token mechanism
   *  2.3) If invalid, then mark request an unauthorized
   * 3) If no,
   *  3.1) Check for access code
   *  3.2) If valid access code is present, then authenticate with access-code
   *  3.3) else unauthorized
   * @param ctx Karya request context
   * @param next Optional middleware in the chain
   */
  const authenticateRequest: TokenMiddleware = async (ctx, next) => {
    // Extract id token from the header or cookie
    const id_token = options.inCookie ? ctx.cookies.get('karya-id-token') : ctx.request.header['karya-id-token'];

    // ID token is presented with the request
    if (id_token) {
      if (id_token instanceof Array) {
        HttpResponse.Unauthorized(ctx, 'Invalid id token');
        return;
      }

      // verify the id token
      try {
        // @ts-ignore: Perhaps can be fixed by moving verifyKaryaIdToken into
        // the dependency injected code
        ctx.state.entity = await verifyKaryaIdToken(entityType, id_token);
        ctx.state.auth_mechanism = 'karya-id-token';

        // Setting tentative success response
        HttpResponse.OK(ctx, {});
        await next();
        return;
      } catch (e) {
        HttpResponse.Unauthorized(ctx, 'Invalid id token');
        return;
      }
    } else {
      // Try access code route
      const access_code = ctx.request.header['access-code'];
      if (!access_code || access_code instanceof Array) {
        HttpResponse.Unauthorized(ctx, 'Missing or invalid auth information');
        return;
      }

      try {
        // @ts-ignore Not sure why this is an error
        ctx.state.entity = await BasicModel.getSingle(entityType, { access_code });
        ctx.state.auth_mechanism = 'access-code';
        // Setting tentative success response
        HttpResponse.OK(ctx, {});
        await next();
      } catch (e) {
        HttpResponse.Unauthorized(ctx, 'Invalid access code');
        return;
      }
    }
  };

  return { generateToken, authenticateRequest };
}
