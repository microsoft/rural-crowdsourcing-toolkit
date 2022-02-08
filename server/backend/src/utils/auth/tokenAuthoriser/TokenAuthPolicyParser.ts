import { ParameterizedContext } from 'koa';

export class PolicyParser {
  constructor(private policy: any) {}

  getResourceTokens(ctx: ParameterizedContext) {
    const rawTokenArrays: string[][] = this.policy[ctx._matchedRouteName];
    // If no policy defined for the API return empty array
    if (!rawTokenArrays) return [];

    const parsedTokenArrays: string[][] = [];

    rawTokenArrays.forEach((tokenArray) => {
      const regex = /(?<=\[)[^\][]*(?=])/g;
      const parsedTokenArray: string[] = [];

      tokenArray.forEach((token) => {
        const params = new Set(token.match(regex));

        params.forEach((param) => {
          try {
            const paramValue = ctx.params[param];
            // replace placeholder [*]
            token = token.replace(`[${param}]`, paramValue);
          } catch (e) {
            throw `${param} is mentioned in policy but cannot find ${param} in URI path: ${ctx.path}`;
          }
        });

        parsedTokenArray.push(token);
      });

      parsedTokenArrays.push(parsedTokenArray);
    });
    return parsedTokenArrays;
  }
}
