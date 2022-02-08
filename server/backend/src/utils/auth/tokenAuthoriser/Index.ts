import { PolicyParser } from './TokenAuthPolicyParser';
import * as TokenAuthHandler from './tokenAuthHandler/TokenAuthHandler';
import Policy from './TokenAuthPolicy';
import { BasicModel } from '@karya/common';
import { UserRouteMiddleware } from '../../../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';

const policyParser = new PolicyParser(Policy);

export const tokenAuthoriser: UserRouteMiddleware = async (ctx, next) => {
  const resourceTokens = policyParser.getResourceTokens(ctx);
  const serverUser = await BasicModel.getSingle('server_user', { id: ctx.state.entity.id });
  const userTokens = await TokenAuthHandler.getTokens(serverUser);

  const accessAllowed = isAccessAllowed(userTokens, resourceTokens);
  console.log(resourceTokens, userTokens, accessAllowed, ctx);
  if (!accessAllowed) return HttpResponse.Forbidden(ctx, 'User does not have enough permissions, please contact admin');

  await next();
};

const isAccessAllowed = (userTokens: string[], resourceTokens: string[][]): boolean => {
  return resourceTokens.some((tokenArray) => {
    const isSubset = tokenArray.every((token) => userTokens.includes(token));
    return isSubset;
  });
};
