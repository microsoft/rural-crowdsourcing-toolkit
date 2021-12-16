export class InsufficientBalanceError extends Error {
    constructor(message = "Insufficient Balance") {
        super(message);
        this.message = message;
    }
}

export class RazorPayRequestError extends Error {
    constructor(message = "Something went wrong while sending a request to Razorpay Server") {
        super(message);
        this.message = message;
    }
}