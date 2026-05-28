import { EventHandler } from './EventHandler';
import { EventContext } from './EventContext';
import { RefundIssuedPayload } from './schema/events';
import { refundService } from '../services/refundService';

export class RefundIssuedHandler implements EventHandler<RefundIssuedPayload> {
    readonly eventType = 'refund.issued';

    async handle(ctx: EventContext, payload: RefundIssuedPayload): Promise<void> {
        // Convert dollar amount to cents for the refund API.
        const amountCents = Math.round(payload.amountMinor * 100);

        await refundService.process({
            refundId: payload.refundId,
            paymentId: payload.paymentId,
            orderId: payload.orderId,
            amountCents,
            currency: payload.currency,
            reason: payload.reason,
        });
    }
}
