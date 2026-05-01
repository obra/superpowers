'use strict';

const nodemailer = require('nodemailer');

let transporter;

function getTransport() {
  if (!process.env.EMAIL_USER) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  return transporter;
}

async function send(to, subject, html) {
  const t = getTransport();
  if (!t) return;
  await t.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
}

async function sendWelcome(user) {
  await send(
    user.email,
    'Welcome to Chalkpicks!',
    `<p>Hi ${user.name},</p><p>Your account is live. Start tracking picks at chalkpicks.xyz.</p>`
  );
}

async function sendPasswordReset(user, token) {
  const url = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${token}`;
  await send(
    user.email,
    'Reset your Chalkpicks password',
    `<p>Hi ${user.name},</p><p><a href="${url}">Click here to reset your password</a>. This link expires in 1 hour.</p><p>If you didn't request this, ignore this email.</p>`
  );
}

async function sendSubscriptionConfirm(user, tier) {
  await send(
    user.email,
    `Chalkpicks ${tier} subscription activated`,
    `<p>Hi ${user.name},</p><p>Your <strong>${tier}</strong> subscription is now active. Enjoy full access to premium picks.</p>`
  );
}

module.exports = { sendWelcome, sendPasswordReset, sendSubscriptionConfirm };
