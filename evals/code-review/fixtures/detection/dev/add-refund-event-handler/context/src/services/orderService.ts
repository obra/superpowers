export interface CreateOrderInput {
    orderId: string;
    customerId: string;
    totalCents: number;
    currency: string;
}
export const orderService = {
    async createOrder(_input: CreateOrderInput): Promise<void> { /* stub */ },
};
