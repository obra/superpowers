'use strict';

let stripe;

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripe) stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  return stripe;
}

function getPriceId(tier, interval = 'monthly') {
  const map = {
    pro: {
      monthly: process.env.STRIPE_PRO_PRICE_ID,
      annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    },
    elite: {
      monthly: process.env.STRIPE_ELITE_PRICE_ID,
      annual: process.env.STRIPE_ELITE_ANNUAL_PRICE_ID,
    },
  };
  return map[tier]?.[interval] || null;
}

async function createCheckoutSession(user, priceId, successUrl, cancelUrl) {
  const s = getStripe();
  if (!s) throw new Error('Stripe not configured');
  return s.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: user.email,
    client_reference_id: String(user.id),
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}

async function cancelSubscription(subscriptionId) {
  const s = getStripe();
  if (!s) throw new Error('Stripe not configured');
  return s.subscriptions.cancel(subscriptionId);
}

function constructWebhookEvent(payload, sig) {
  const s = getStripe();
  if (!s) throw new Error('Stripe not configured');
  return s.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
}

module.exports = { getStripe, getPriceId, createCheckoutSession, cancelSubscription, constructWebhookEvent };
