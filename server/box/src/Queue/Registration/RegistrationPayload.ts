import { Payload } from "@karya/common";

export interface RegistrationQPayload extends Payload {
    name: string,
    workerID: string,
    accountType: string,
    accountDetails: {
        id: string,
        ifsc?: string
    },
    hash: string,
}