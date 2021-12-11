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


export type ContactType = "worker"