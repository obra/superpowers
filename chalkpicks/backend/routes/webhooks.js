'use strict';

const express = require('express');
const { updateUser, getDb } = require('../models/db');
const { constructWebhookEvent } = require('../services/stripe');
const { sendSubscriptionConfirm } = require('../services/email');

const router = express.Router();

// express.raw() needed so Stripe can verify the signature against the raw body
router.post('/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = constructWebhookEvent(req.body, sig);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature error: ${err.message}` });
  }

  handleStripeEvent(event).catch((err) => console.error('Stripe webhook handler error:', err));
  res.json({ received: true });
});

async function handleStripeEvent(event) {
  const db = getDb();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = parseInt(session.client_reference_id, 10);
      if (!userId) break;

      const tier = session.metadata?.tier || 'pro';
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      updateUser(userId, {
        subscription_tier: tier,
        subscription_expires_at: expiresAt,
        stripe_customer_id: session.customer,
      });

      db.prepare(
        'INSERT OR REPLACE INTO subscriptions (user_id, stripe_subscription_id, tier, status) VALUES (?, ?, ?, ?)'
      ).run(userId, session.subscription, tier, 'active');

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (user) sendSubscriptionConfirm(user, tier).catch(() => {});
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const dbSub = db.prepare('SELECT * FROM subscriptions WHERE stripe_subscription_id = ?').get(sub.id);
      if (dbSub) {
        db.prepare('UPDATE subscriptions SET status = ?, current_period_end = ? WHERE stripe_subscription_id = ?').run(
          sub.status,
          new Date(sub.current_period_end * 1000).toISOString(),
          sub.id
        );
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const dbSub = db.prepare('SELECT * FROM subscriptions WHERE stripe_subscription_id = ?').get(sub.id);
      if (dbSub) {
        updateUser(dbSub.user_id, { subscription_tier: 'free', subscription_expires_at: null });
        db.prepare("UPDATE subscriptions SET status = 'cancelled' WHERE stripe_subscription_id = ?").run(sub.id);
      }
      break;
    }

    case 'invoice.payment_failed':
      console.log('Payment failed for Stripe customer:', event.data.object.customer);
      break;

    default:
      break;
  }
}

module.exports = router;
