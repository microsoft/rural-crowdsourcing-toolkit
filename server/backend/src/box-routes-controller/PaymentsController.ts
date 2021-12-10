import * as HttpResponse from '@karya/http-response';
import { PaymentsAccountRecord } from "@karya/core";
import { BoxRouteMiddleware } from "../routes/BoxRoutes";

export const addAccount: BoxRouteMiddleware = async (ctx) => {
    const accountRecord: PaymentsAccountRecord = ctx.request.body
    console.log("###############################")
    console.log(accountRecord)
    HttpResponse.OK(ctx, accountRecord)
    return
}