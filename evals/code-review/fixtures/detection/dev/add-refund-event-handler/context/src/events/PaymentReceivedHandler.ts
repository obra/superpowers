import { EventHandler } from './EventHandler';
import { EventContext } from './EventContext';
import { PaymentReceivedPayload } from './schema/events';
import { metrics } from '../metrics/handlerMetrics';
import { ledgerService } from '../services/ledgerService';

export class PaymentReceivedHandler implements EventHandler<PaymentReceivedPayload> {
    readonly eventType = 'payment.received';

    async handle(ctx: EventContext, payload: PaymentReceivedPayload): Promise<void> {
        const t0 = Date.now();
        try {
            await ledgerService.recordPayment({
                paymentId: payload.paymentId,
                orderId: payload.orderId,
                // amountMinor is already cents — ledger API also takes cents.
                amountCents: payload.amountMinor,
                currency: payload.currency,
            });
            ctx.ack();
            metrics.recordHandled(this.eventType, Date.now() - t0);
        } catch (err) {
            ctx.nack(err as Error);
        }
    }
}
