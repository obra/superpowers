// Minimal stub. The real refund API accepts amounts in MINOR UNITS
// (cents) and is non-idempotent: each call processes a new refund
// against the upstream payment processor.
export interface ProcessRefundInput {
    refundId: string;
    paymentId: string;
    orderId: string;
    amountCents: number;
    currency: string;
    reason: string;
}

export const refundService = {
    async process(_input: ProcessRefundInput): Promise<void> {
        // Calls the payment processor's POST /v2/refunds endpoint.
    },
};
