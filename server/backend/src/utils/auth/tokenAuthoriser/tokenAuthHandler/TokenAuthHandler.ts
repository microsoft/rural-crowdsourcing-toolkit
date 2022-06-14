import { ServerRole, ServerUserRecord } from '@karya/core';
import { BasicModel } from '@karya/common';
import * as KeycloakUtils from '../../KeycloakUtils';

export const setTokens = async (user: ServerUserRecord, tokens: string[]) => {
  for (const token of tokens) {
    const tokenExists = await checkIfTokenAlreadyExists(token);
    if (!tokenExists) {
      await createNewToken(token);
    }
    await createTokenMapping(user, token);
  }
};

export const getTokens = async (user: ServerUserRecord): Promise<string[]> => {
  const keyCloackUserId = (user.extras as any).keyCloackUserId;
  return await KeycloakUtils.getTokens(keyCloackUserId);
};

const checkIfTokenAlreadyExists = async (token: string): Promise<boolean> => {
  return await KeycloakUtils.checkIfTokenAlreadyExists(token);
};

const createNewToken = async (token: string) => {
  await KeycloakUtils.createNewToken(token);
};

const createTokenMapping = async (user: ServerUserRecord, token: string) => {
  // Check if user has a keycloak userId
  let keyCloackUserId: string;
  try {
    keyCloackUserId = (user.extras as any).keyCloackUserId;
  } catch {
    // Create Keycloak user if doesn't exist
    keyCloackUserId = await KeycloakUtils.createUser(user);
    // Save the keyCloackUserId in the DB
    await BasicModel.updateSingle(
      'server_user',
      { id: user.id },
      {
        extras: {
          ...user.extras,
          keyCloackUserId,
        },
      }
    );
  }
  await KeycloakUtils.createTokenMapping(keyCloackUserId, token);
};

export const assignRole = async (user: ServerUserRecord, role: ServerRole) => {
  await setTokens(user, [role]);
};

export const grantTaskPermission = async (user: ServerUserRecord, taskId: string, permissions: ('read' | 'edit')[]) => {
  const tokens: string[] = [];
  permissions.forEach((permission) => {
    tokens.push(`task_${permission}_${taskId}`);
  });
  await setTokens(user, tokens);
};
