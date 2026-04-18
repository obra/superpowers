'use strict';

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateToken } = require('../middleware/auth');
const {
  updateUser,
  getSubscription,
  upsertSubscription,
  cancelSubscriptionRecord,
  getUserByStripeCustomerId,
} = require('../models/db');

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://sharpaction.io';

const PRICE_IDS = {
  pro: {
    monthly: process.env.STRIPE_PRO_PRICE_ID,
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  },
  elite: {
    monthly: process.env.STRIPE_ELITE_PRICE_ID,
    annual: process.env.STRIPE_ELITE_ANNUAL_PRICE_ID,
  },
};

const TIER_FROM_PRICE = new Map([
  [process.env.STRIPE_PRO_PRICE_ID, 'pro'],
  [process.env.STRIPE_PRO_ANNUAL_PRICE_ID, 'pro'],
  [process.env.STRIPE_ELITE_PRICE_ID, 'elite'],
  [process.env.STRIPE_ELITE_ANNUAL_PRICE_ID, 'elite'],
]);

// GET /api/subscriptions/plans
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: [
      {
        tier: 'free',
        name: 'Free',
        price: { monthly: 0, annual: 0 },
        features: [
          'Up to 3 picks per day',
          'Basic win/loss record',
          'Community picks access',
        ],
      },
      {
        tier: 'pro',
        name: 'Pro',
        price: { monthly: 1999, annual: 19999 },
        priceIds: {
          monthly: PRICE_IDS.pro.monthly,
          annual: PRICE_IDS.pro.annual,
        },
        features: [
          'Unlimited picks access',
          'Premium analysis & key factors',
          'Historical performance data',
          'Email pick alerts',
          'Parlay builder',
        ],
      },
      {
        tier: 'elite',
        name: 'Elite',
        price: { monthly: 3999, annual: 39999 },
        priceIds: {
          monthly: PRICE_IDS.elite.monthly,
          annual: PRICE_IDS.elite.annual,
        },
        features: [
          'Everything in Pro',
          'AI-powered analysis (Claude)',
          'Line movement alerts',
          'Priority email & chat support',
          'Early access to new features',
        ],
      },
    ],
  });
});

// GET /api/subscriptions/status
router.get('/status', authenticateToken, (req, res) => {
  const subscription = getSubscription(req.user.id);
  res.json({
    success: true,
    subscription: {
      tier: req.user.subscription_tier,
      expiresAt: req.user.subscription_expires_at,
      stripeCustomerId: req.user.stripe_customer_id,
      ...(subscription && {
        stripeSubscriptionId: subscription.stripe_subscription_id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
      }),
    },
  });
});

// POST /api/subscriptions/create-checkout-session
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  const { tier, billing = 'monthly' } = req.body;

  if (!tier || !['pro', 'elite'].includes(tier)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid tier. Must be "pro" or "elite".',
    });
  }

  if (!['monthly', 'annual'].includes(billing)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid billing cycle. Must be "monthly" or "annual".',
    });
  }

  const priceId = PRICE_IDS[tier][billing];
  if (!priceId) {
    return res.status(500).json({
      success: false,
      error: 'Price ID not configured for this plan. Contact support.',
    });
  }

  try {
    let customerId = req.user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: { userId: String(req.user.id) },
      });
      customerId = customer.id;
      updateUser(req.user.id, { stripe_customer_id: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${FRONTEND_URL}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/pricing?checkout=canceled`,
      subscription_data: {
        metadata: {
          userId: String(req.user.id),
          tier,
          billing,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ success: false, error: 'Failed to create checkout session.' });
  }
});

// POST /api/subscriptions/customer-portal
router.post('/customer-portal', authenticateToken, async (req, res) => {
  const customerId = req.user.stripe_customer_id;

  if (!customerId) {
    return res.status(400).json({
      success: false,
      error: 'No billing account found. Subscribe to a plan first.',
    });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${FRONTEND_URL}/dashboard/billing`,
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error('Stripe portal error:', err);
    res.status(500).json({ success: false, error: 'Failed to open billing portal.' });
  }
});

// POST /api/subscriptions/cancel
router.post('/cancel', authenticateToken, async (req, res) => {
  const subscription = getSubscription(req.user.id);

  if (!subscription || !subscription.stripe_subscription_id) {
    return res.status(400).json({
      success: false,
      error: 'No active subscription found.',
    });
  }

  if (subscription.status === 'canceled') {
    return res.status(400).json({
      success: false,
      error: 'Subscription is already canceled.',
    });
  }

  try {
    // Cancel at period end so the user keeps access until billing cycle ends
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    res.json({
      success: true,
      message: 'Subscription will cancel at the end of the current billing period.',
      currentPeriodEnd: subscription.current_period_end,
    });
  } catch (err) {
    console.error('Stripe cancel error:', err);
    res.status(500).json({ success: false, error: 'Failed to cancel subscription.' });
  }
});

// POST /api/subscriptions/webhook
// Relies on server.js saving the raw buffer as req.rawBody via the express.json() verify option.
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!req.rawBody) {
    return res.status(400).json({ error: 'Raw body unavailable. Webhook signature cannot be verified.' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;
        const stripeSubscriptionId = session.subscription;
        const stripeCustomerId = session.customer;

        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;
        const tier = TIER_FROM_PRICE.get(priceId) || 'pro';

        const user = getUserByStripeCustomerId(stripeCustomerId);
        if (!user) {
          console.error('webhook: no user for customer', stripeCustomerId);
          break;
        }

        const periodStart = new Date(subscription.current_period_start * 1000).toISOString();
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        upsertSubscription({
          userId: user.id,
          stripeSubscriptionId,
          tier,
          status: subscription.status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        });

        updateUser(user.id, {
          subscription_tier: tier,
          subscription_expires_at: periodEnd,
        });

        console.log(`checkout.session.completed: user ${user.id} upgraded to ${tier}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const stripeCustomerId = subscription.customer;

        const user = getUserByStripeCustomerId(stripeCustomerId);
        if (!user) break;

        const priceId = subscription.items.data[0]?.price?.id;
        const tier = TIER_FROM_PRICE.get(priceId) || 'pro';
        const periodStart = new Date(subscription.current_period_start * 1000).toISOString();
        const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

        upsertSubscription({
          userId: user.id,
          stripeSubscriptionId: subscription.id,
          tier,
          status: subscription.status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        });

        updateUser(user.id, {
          subscription_tier: tier,
          subscription_expires_at: periodEnd,
        });

        console.log(`subscription.updated: user ${user.id} — tier=${tier} status=${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const stripeCustomerId = subscription.customer;

        const user = getUserByStripeCustomerId(stripeCustomerId);
        if (!user) break;

        cancelSubscriptionRecord(subscription.id);
        updateUser(user.id, {
          subscription_tier: 'free',
          subscription_expires_at: null,
        });

        console.log(`subscription.deleted: user ${user.id} downgraded to free`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const stripeCustomerId = invoice.customer;
        const user = getUserByStripeCustomerId(stripeCustomerId);
        if (user) {
          console.warn(`invoice.payment_failed: user ${user.id} — ${invoice.hosted_invoice_url}`);
        }
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed.' });
  }
});

module.exports = router;
