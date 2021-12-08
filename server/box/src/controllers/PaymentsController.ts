import { KaryaMiddleware } from "../KoaContextState"
import { PaymentsAccountRecord } from '@karya/core'
import { BasicModel, mainLogger } from '@karya/common'
import * as HttpResponse from '@karya/http-response'
import { calculateHash } from '@karya/misc-utils';
import { RegistrationQPayload } from "../Queue/Registration/RegistrationPayload";
import { RegistrationQWrapper } from "../Queue/Registration/RegistrationQWrapper";
import config from "../Queue/Registration/config";

const ACCOUNT_REGISTRATION_QUEUE_NAME: string = "ACCOUNT_REGISTRATION_QUEUE"

type accountRegReqObject = {
    type: 'bank' | 'upi',
    name: string
    account: {
        id: string,
        ifsc?: string
    }
}

export const addAccount: KaryaMiddleware = async (ctx) => {

    console.log("Inside addAccount")

    // Validate request body
    let accountBody: accountRegReqObject = ctx.request.body
    let isAccountBodyValid = true

    if (!(accountBody.name 
        && typeof accountBody.name == 'string'
        && accountBody.account.id 
        && typeof accountBody.account.id == 'string')) {
        isAccountBodyValid = false
    }

    if (accountBody.type == 'bank') {
        if (!(accountBody.account.ifsc 
            && typeof accountBody.account.ifsc == 'string')) {
                isAccountBodyValid = false
            }
    } else if (accountBody.type != 'upi') {
        isAccountBodyValid = false
    }

    // if validation failed send bad request
    if (isAccountBodyValid == false) {
        HttpResponse.BadRequest(ctx, "Request body is not valid")
        return
    }

    // Check if account verification is in progress for the user
    let inProgressRecord: PaymentsAccountRecord
    let inProgressStatus = ['INITIALISED', 'BOX_ACCOUNTS_QUEUE', 'SERVER_API', 'SERVER_ACCOUNTS_QUEUE', 'TRANSACTION_CREATED']

    for (var st of inProgressStatus) {
        try {
            inProgressRecord = await BasicModel.getSingle('payments_account', { status: st })
            HttpResponse.BadRequest(ctx, `Verification for ${inProgressRecord.id} already in progress with status: ${st}`)
            return
        } catch (e) {
            mainLogger.info(`Cant find account record with status ${st} for user_id: ${ctx.state.entity.id}`)
        }``
    }

    // No account verification in progress. Calculate hash from worker id, account id and ifsc code
    let hash = calculateHash(ctx.state.entity.id, accountBody.account.id, accountBody.account.ifsc || '')

    // Determine if there is already a record with the given hash
    try {
        let record = await BasicModel.getSingle('payments_account', { hash })
        // Send the existing record
        HttpResponse.OK(ctx, record)
        return
    } catch (e) {
        mainLogger.info(`Cant find account record with hash ${hash} for user_id: ${ctx.state.entity.id}`)
    }
    // Create and enque account registration task
    let jobPayload: RegistrationQPayload = {
        workerID: ctx.state.entity.id,
        name: accountBody.name,
        accountType: accountBody.type,
        accountDetails: accountBody.account,
        hash
    }
        
    console.log({ qname: ACCOUNT_REGISTRATION_QUEUE_NAME }, config)
    const accountRegistrationQueue = new RegistrationQWrapper( { qname: ACCOUNT_REGISTRATION_QUEUE_NAME,  opts: config } )
    const result = await accountRegistrationQueue.enqueue(hash , jobPayload)

    HttpResponse.OK(ctx, result)
    return
}
