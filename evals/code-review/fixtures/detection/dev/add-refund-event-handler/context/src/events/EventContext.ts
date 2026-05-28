/**
 * Per-message context passed to EventHandler.handle().
 *
 * See EventHandler.ts for the ack/nack/deadLetter contract — exactly
 * one of these MUST be invoked before handle() resolves.
 */
export interface EventContext {
    /** Acknowledge successful processing. MUST be called exactly once on the happy path. */
    ack(): void;

    /** Signal a transient failure; broker will redeliver. */
    nack(err: Error): void;

    /** Signal a permanent failure; broker routes the message to the DLQ. */
    deadLetter(err: Error): void;

    /** 1-based delivery attempt count. >1 means this is a redelivery. */
    readonly deliveryAttempt: number;

    /** Broker-assigned message identifier; stable across redeliveries. */
    readonly messageId: string;
}
