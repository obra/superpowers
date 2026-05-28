/**
 * Base contract for asynchronous event handlers.
 *
 * Every concrete handler MUST signal the outcome of `handle()` exactly
 * once, before the returned Promise resolves, by calling ONE of:
 *
 *   - ctx.ack()             — message handled successfully; broker removes it.
 *   - ctx.nack(err)         — transient failure; broker redelivers immediately.
 *   - ctx.deadLetter(err)   — permanent failure; broker routes to DLQ.
 *
 * IF NONE OF THESE IS CALLED, the broker treats the message as failed
 * and redelivers it up to 24 times with exponential backoff. For
 * non-idempotent handlers (anything touching money — payments, refunds,
 * ledger writes), missing ack() results in DUPLICATE EXECUTION on every
 * redelivery. Several historical incidents (INC-2117, INC-2304) were
 * caused by handlers that forgot to ack on the happy path.
 *
 * Handlers MUST also record a handled-metric via
 * `metrics.recordHandled(handlerName, latencyMs)` so SREs can track
 * throughput and SLOs per handler. See `OrderCreatedHandler` and
 * `PaymentReceivedHandler` for canonical implementations.
 */
export interface EventHandler<TPayload> {
    readonly eventType: string;
    handle(ctx: EventContext, payload: TPayload): Promise<void>;
}

import { EventContext } from './EventContext';
