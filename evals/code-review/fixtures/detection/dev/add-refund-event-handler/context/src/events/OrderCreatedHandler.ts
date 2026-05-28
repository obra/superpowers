import { EventHandler } from './EventHandler';
import { EventContext } from './EventContext';
import { OrderCreatedPayload } from './schema/events';
import { metrics } from '../metrics/handlerMetrics';
import { orderService } from '../services/orderService';

export class OrderCreatedHandler implements EventHandler<OrderCreatedPayload> {
    readonly eventType = 'order.created';

    async handle(ctx: EventContext, payload: OrderCreatedPayload): Promise<void> {
        const t0 = Date.now();
        try {
            await orderService.createOrder({
                orderId: payload.orderId,
                customerId: payload.customerId,
                // amountMinor is already in minor units (cents) — pass through.
                totalCents: payload.amountMinor,
                currency: payload.currency,
            });
            ctx.ack();
            metrics.recordHandled(this.eventType, Date.now() - t0);
        } catch (err) {
            ctx.nack(err as Error);
        }
    }
}
