export class RecordNotFoundError extends Error {
    constructor(message = "") {
        super(message);
        this.message = message;
    }
}