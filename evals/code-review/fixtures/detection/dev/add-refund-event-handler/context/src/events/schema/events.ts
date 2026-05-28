/**
 * Event payload schemas.
 *
 * MONETARY UNITS: Every monetary field in this file is named with the
 * suffix `Minor` and represents the amount in MINOR UNITS of the
 * currency (cents for USD, pence for GBP, yen for JPY which has no
 * subunit). Producers MUST emit minor units. Consumers MUST NOT
 * re-scale: pass the value through unchanged to downstream services
 * that themselves take minor units (e.g. the refund and ledger APIs).
 *
 * Background: we standardized on integer minor units in 2023 (ADR-0012)
 * after a payment-rounding incident caused by mixing dollars and cents
 * across service boundaries. Do not reintroduce that ambiguity.
 */

export interface OrderCreatedPayload {
    orderId: string;
    customerId: string;
    amountMinor: number;
    currency: string;
}

export interface PaymentReceivedPayload {
    paymentId: string;
    orderId: string;
    amountMinor: number;
    currency: string;
}

export interface RefundIssuedPayload {
    refundId: string;
    paymentId: string;
    orderId: string;
    /** Refund amount in MINOR UNITS — see file header. */
    amountMinor: number;
    currency: string;
    reason: string;
}
