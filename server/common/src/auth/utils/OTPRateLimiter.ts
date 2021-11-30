import Application from "koa";
import { OTPState } from "./OTPUtils";
import * as HttpResponse from '@karya/http-response';

export class OTPRateLimiter<EntityType extends 'server_user' | 'worker'> {
    private _session: Map<String, Array<number>> = new Map();
    maxRequestPerMinute: number;

    limiter: Application.Middleware<OTPState<EntityType>> = async (ctx, next) => {
        try {
            console.log("Inside OTPRateLimiterrr")
            const access_code = ctx.state.entity.access_code
            console.log("Inside OTPRateLimiter: Got access code", access_code)
            const curr_time = new Date().getTime()
            const boundary = this.subtractMinutes(curr_time, 1)
            console.log("OTPRateLimiter: Setup Complete", curr_time, boundary)

            if (this._session.has(access_code)) {
                const record: number[] = this._session.get(access_code)!
                console.log("OTPRateLimiter: Inside IF")
                console.log("OTPRateLimiter: Before while: ", this._session)
                while (record.length  > 0 && record[0] < boundary) {
                    record.shift()
                }
                record.push(curr_time)
                console.log("OTPRateLimiter: After while: ", this._session)
                if(record.length > this.maxRequestPerMinute) {
                    HttpResponse.TooManyRequests(ctx, "OTP request limit exceeded")
                    return;
                }

            } else {
                console.log("OTPRateLimiter: Inside else")
                this._session.set(access_code,[curr_time])
                console.log("OTPRateLimiter: Leaving else")
            }
        } catch (e) {
            HttpResponse.TooManyRequests(ctx, e)
            return;
        }
        
        console.log("OTPRateLimiter: Calling await next")
        await next();

    }

    constructor(maxRequestPerMinute: number) {
        this.maxRequestPerMinute = maxRequestPerMinute
    }

    private subtractMinutes(time: number, minutes: number) {
        return time - minutes*60*1000
    }
}