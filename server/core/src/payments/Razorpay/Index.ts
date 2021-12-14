// Razorpay Contacts
export type ContactsRequest = {
    name: string,
    email?: string,
    contact?: string,
    type?: ContactType,
    reference_id?: string,
    notes?: {[key: string]: any}
}

export type ContactsResponse = {
    id: string,
    entity: string,
    name: string,
    contact: string | null,
    email: string | null,
    type: ContactType | null,
    reference_id: string | null,
    batch_id: string | null,
    active: boolean,
    notes: {[key: string]: any} | null,
    created_at: string
}

// Razorpay Funds
export type FundAccountRequest = {
    contacts_id: string,
    account_type: FundAccountType,
    bank_account: BankAccountDetails
} | {
    contacts_id: string,
    account_type: FundAccountType,
    vpa: VpaAccountDetails
}

interface FundAccountCommonResponseFields {
    id: string,
    entity: string,
    contact_id: string,
    account_type: FundAccountType,
    active: boolean,
    batch_id: string,
    created_at: string
}

export type FundAccountResponse = (FundAccountCommonResponseFields & 
    ({ bank_account: BankAccountDetails} | { vpa: VpaAccountDetails })
)

export type ContactType = "worker"
export type FundAccountType = "bank_account" | "vpa"

export type BankAccountDetails = {
    name: string,
    ifsc: string,
    account_number: string
}

export type VpaAccountDetails = {
    address: string
}