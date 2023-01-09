import { PolicyParser } from './TokenAuthPolicyParser';
import * as TokenAuthHandler from './tokenAuthHandler/TokenAuthHandler';
import Policy from './TokenAuthPolicy';
import { BasicModel } from '@karya/common';
import { UserRouteMiddleware } from '../../../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';

const policyParser = new PolicyParser(Policy);

export const tokenAuthoriser: UserRouteMiddleware = async (ctx, next) => {
  const resourceTokens = policyParser.getResourceTokens(ctx); //reource == api
  const serverUser = await BasicModel.getSingle('server_user', { id: ctx.state.entity.id });
  const userTokens = serverUser.role_mappings ? serverUser.role_mappings.role_mappings : [];

  const accessAllowed = isAccessAllowed(userTokens, resourceTokens);
  if (!accessAllowed) return HttpResponse.Forbidden(ctx, 'User does not have enough permissions, please contact admin');

  await next();
};

const isAccessAllowed = (userTokens: string[], resourceTokens: string[][]): boolean => {
  // No tokens required if length is zero
  if (resourceTokens.length === 0) return true;

  return resourceTokens.some((tokenArray) => {
    const isSubset = tokenArray.every((token) => userTokens.includes(token));
    return isSubset;
  });
};
