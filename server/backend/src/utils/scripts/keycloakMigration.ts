import dotenv from 'dotenv';
dotenv.config();
import { BasicModel, setupDbConnection } from '@karya/common';
import * as TokenAuthHandler from '../auth/tokenAuthoriser/tokenAuthHandler/TokenAuthHandler';

// Setup the database connection
setupDbConnection();

const createAndMapRolesForExistingUsers = async () => {
  const server_users = await BasicModel.getRecords('server_user', { role: 'ADMIN' });
  server_users.forEach(async (user) => {
    await TokenAuthHandler.assignRole(user, 'ADMIN');
  });
};

createAndMapRolesForExistingUsers();
