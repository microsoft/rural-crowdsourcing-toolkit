import { Payload } from "./Job";
import { QResult } from "./QResult";

export abstract class QueueWrapper<T> {

    queue!: T;

    constructor(public config: any) { 
        this.intialiseQueue();
        this.onStart();
    }

    /**
     * The function to run after intialization
     */
    abstract intialiseQueue(): void
    abstract onStart(): void
    abstract enqueue(payload: Payload, ...args: any[]): Promise<QResult>
    abstract close(): void
}