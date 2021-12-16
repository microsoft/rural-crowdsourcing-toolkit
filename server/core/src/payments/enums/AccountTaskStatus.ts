export enum AccountTaskStatus {
    INITIALISED = "INITIALISED",
    BOX_ACCOUNTS_QUEUE = "BOX_ACCOUNTS_QUEUE",
    SERVER_API = "SERVER_API",
    SERVER_ACCOUNTS_QUEUE = "SERVER_ACCOUNTS_QUEUE",
    TRANSACTION_QUEUE = "TRANSACTION_QUEUE",
    TRANSACTION_CREATED = "TRANSACTION_CREATED",
    VERIFICATION = "VERIFICATION",
    CONFIRMATION_RECEIVED = "CONFIRMATION_RECEIVED",
    CONFIRMATION_FAILED = "CONFIRMATION_FAILED",
    INVALID = "INVALID",
    VERIFIED = "VERIFIED",
    REJECTED = "REJECTED",
    FAILED = "FAILED"
}