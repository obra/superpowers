import { EventHandler } from './EventHandler';
import { OrderCreatedHandler } from './OrderCreatedHandler';
import { PaymentReceivedHandler } from './PaymentReceivedHandler';
import { RefundIssuedHandler } from './RefundIssuedHandler';

export const HANDLERS: Map<string, EventHandler<unknown>> = new Map();

function register<T>(h: EventHandler<T>): void {
    HANDLERS.set(h.eventType, h as EventHandler<unknown>);
}

register(new OrderCreatedHandler());
register(new PaymentReceivedHandler());
register(new RefundIssuedHandler());
