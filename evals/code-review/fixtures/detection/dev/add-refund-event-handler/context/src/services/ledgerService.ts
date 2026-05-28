export interface RecordPaymentInput {
    paymentId: string;
    orderId: string;
    amountCents: number;
    currency: string;
}
export const ledgerService = {
    async recordPayment(_input: RecordPaymentInput): Promise<void> { /* stub */ },
};
