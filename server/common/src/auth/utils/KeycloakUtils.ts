import { ServerUserRecord } from '@karya/core';
import { envGetString } from '@karya/misc-utils';
import axios from 'axios';

const BASE_URL = envGetString('KEYCLOACK_BASE_URL');
const ACCESS_TOKEN = envGetString('KEYCLOACK_ACCESS_TOKEN');
const REALM = envGetString('KEYCLOACK_REALM');

const authHeaderValue = 'Bearer ' + ACCESS_TOKEN;
const keycloakAxios = axios.create({
  baseURL: BASE_URL,
  headers: { Authorization: authHeaderValue },
});

const RELATIVE_REALM_URL = `auth/admin/realms/${REALM}`;
const RELATIVE_ROLE_URL = `auth/admin/realms/${REALM}/roles`;

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
