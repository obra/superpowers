# Payment Security (Stripe)

## Never Trust Client-Submitted Prices

The #1 payment vulnerability in vibe-coded apps: the price comes from the client. An attacker can set any amount, including $0.

```typescript
// BAD: price comes from the request body
const session = await stripe.checkout.sessions.create({
  line_items: [{
    price_data: {
      currency: 'usd',
      unit_amount: req.body.price, // attacker controls this
      product_data: { name: req.body.name },
    },
    quantity: 1,
  }],
});

// GOOD: look up the price server-side
const product = await db.products.findUnique({ where: { id: req.body.productId } });
if (!product) return new Response('Not found', { status: 404 });

const session = await stripe.checkout.sessions.create({
  line_items: [{ price: product.stripePriceId, quantity: 1 }],
});
```

Use Stripe Price IDs (created via the Stripe dashboard or API) rather than constructing prices from your database. This way, prices are defined in Stripe and can't be manipulated.

## Webhook Signature Verification

Stripe webhooks must have their signatures verified. This requires the **raw request body** — parsing the body as JSON first destroys the signature.

```typescript
// Express: webhook route MUST use express.raw() BEFORE express.json()
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  // ... handle event
});

// Next.js App Router: use request.text(), NOT request.json()
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;
  const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  // ... handle event
}
```

## Subscription Status Validation

Check subscription status **server-side on every protected request** using your database (kept in sync via webhooks). Do not rely on:
- A cached session value from login time
- A client-side flag
- A JWT claim that was set at token creation and never refreshed

Subscriptions can be cancelled, expire, or change tier at any time. Your database (updated via webhooks) is the source of truth.

## Checkout Session Metadata

Validate that checkout session metadata (user ID, plan, etc.) was set **server-side** when creating the session, not passed from the client. If metadata comes from the client, an attacker can claim to be a different user or select a different plan.
