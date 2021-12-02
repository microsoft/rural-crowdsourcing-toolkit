import { Payload } from "./Job";
import { QResult } from "./QResult";

abstract class QueueWrapper {

    constructor(
        public queue: Object, 
        public config: Object
    ) { 
        this.onStart();
    }

    /**
     * The function to run after intialization
     */
    abstract onStart(): void
    abstract enqueue(payload: Payload, ...args: any[]): QResult
    abstract close(): void

}