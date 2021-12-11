import { BasicModel, setupDbConnection } from "@karya/common";
import { AccountTaskStatus, ContactsRequest, ContactsResponse, PaymentsAccountRecord, RecordNotFoundError, WorkerRecord } from "@karya/core";
import { Job } from "bullmq";
import { razorPayAxios } from "../../HttpUtils";
import { RegistrationQJobData } from "../Types";

const SERVER_ADD_ACCOUNT_RELATIVE_URL = 'api_box/payments/accounts'
const RAZORPAY_CONTACTS_RELATIVE_URL = 'contacts'

// Setting up Db Connection
setupDbConnection();

export default async (job: Job<RegistrationQJobData>) => {
    // Get the box record
    // TODO: Maybe cache the id_token rather than calling the database every time
    let accountRecord: PaymentsAccountRecord
    try {
        getContactsID(job.data.account_record_id)
    } catch (e) {

        // TODO: Handle error for the case where accountRecord cannot be fetched from database
        // Possible Handling: Move the job to failed stage and keep retrying
        // sending the account record for registration

        // TODO: Log the error here
        console.log(e)
        let updatedRecordMeta = accountRecord!.meta
        // Update the record to status failed with faluire reason
        // TODO: Set the type of meta to be any
        // @ts-ignore adding property to meta field
        updatedRecordMeta["failure_reason"] = `Failure inside Registration Account Queue Processor at box | ${e.message}`;
        BasicModel.updateSingle('payments_account', { id: job.data.account_record_id}, { status: AccountTaskStatus.FAILED, meta: updatedRecordMeta })
    }
}

const getContactsID = async (workerId: string) => {
    let workerRecord: WorkerRecord
    try {
        workerRecord = await BasicModel.getSingle('worker', { id: workerId })
    } catch (e) {
        throw new RecordNotFoundError("Cannot find worker record with given id in accounts record")
    }
    // Check if contactsId already exists in the worker record
    let contactsId = (workerRecord!.payments_meta! as any).contacts_id
    if (contactsId) {
        return contactsId
    }
    // Contacts ID doesnot exist, make a request to Razorpay
    // 1. Create the request body
    const contactsRequestBody: ContactsRequest = {
        name: workerId,
        contact: workerRecord.phone_number!,
        type: "worker"
    }
    //2. Make the post request
    // TODO: Maybe rertry the request few times before marking the record as failed
    const response = await razorPayAxios.post<ContactsResponse>(RAZORPAY_CONTACTS_RELATIVE_URL, contactsRequestBody)
    console.log(response.data)
}