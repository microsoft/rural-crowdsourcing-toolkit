import { ServerUserRecord } from '@karya/core';
import { envGetString } from '@karya/misc-utils';
import querystring from 'querystring';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const BASE_URL = envGetString('KEYCLOACK_BASE_URL');
const REALM = envGetString('KEYCLOACK_REALM');
let accessToken: string | undefined;

const keycloakAxios = axios.create({
  baseURL: BASE_URL,
});

const RELATIVE_TOKEN_URL = 'auth/realms/master/protocol/openid-connect/token';
const RELATIVE_REALM_URL = `auth/admin/realms/${REALM}`;
const RELATIVE_ROLE_URL = `auth/admin/realms/${REALM}/roles`;

const getKeycloakAccessTokenResponse = async () => {
  return await axios.post(
    `${BASE_URL}/${RELATIVE_TOKEN_URL}`,
    querystring.stringify({
      username: envGetString('KEYCLOAK_USERNAME'),
      password: envGetString('KEYCLOAK_PASSWORD'),
      client_id: 'admin-cli',
      grant_type: 'password',
      scope: 'openid',
    })
  );
};

// Interceptor to refresh token when required
keycloakAxios.interceptors.request.use(async (config) => {
  const setAccessToken = async () => {
    const response = await getKeycloakAccessTokenResponse();
    accessToken = response.data.access_token;
  };

  if (!accessToken) {
    await setAccessToken();
  }

  // Check if jwt token is expired
  const decoded = jwt.decode(accessToken!);
  // @ts-ignore
  if (decoded!.exp < Date.now()) {
    // Token expired, regenerate
    await setAccessToken();
  }

  config.headers.Authorization = 'Bearer ' + accessToken;

  return config;
});

export const createNewToken = async (token: string) => {
  const response = await keycloakAxios.post(RELATIVE_ROLE_URL, {
    name: token,
  });
};

export const getTokens = async (userId: string): Promise<string[]> => {
  const response = await keycloakAxios.get(`${RELATIVE_REALM_URL}/users/${userId}/role-mappings/realm/composite`);

  const tokens: string[] = [];

  response.data.forEach((roleObject: any) => {
    tokens.push(roleObject.name);
  });

  return tokens;
};

export const checkIfTokenAlreadyExists = async (token: string): Promise<boolean> => {
  try {
    await keycloakAxios.get(`${RELATIVE_ROLE_URL}/${token}`);
    return true;
  } catch (err) {
    return false;
  }
};

export const createTokenMapping = async (userId: string, token: string) => {
  const tokenId = await getTokenId(token);
  const response = await keycloakAxios.post(`${RELATIVE_REALM_URL}/users/${userId}/role-mappings/realm`, [
    { name: token, id: tokenId },
  ]);
};

export const getTokenId = async (token: string): Promise<string> => {
  const response = await keycloakAxios.get(`${RELATIVE_ROLE_URL}/${token}`);
  return response.data.id as string;
};

export const createUser = async (user: ServerUserRecord) => {
  await keycloakAxios.post(`${RELATIVE_REALM_URL}/users`, {
    firstName: user.id,
    username: user.id,
  });

  const userQueryResponse = await keycloakAxios.get(`${RELATIVE_REALM_URL}/users`, { params: { username: user.id } });
  return userQueryResponse.data[0].id;
};
