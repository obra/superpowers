'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { generalLimiter } = require('./middleware/rateLimiter');
const authRouter = require('./routes/auth');
const subscriptionsRouter = require('./routes/subscriptions');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://sharpaction.io';

// --- Global middleware ---
app.use(helmet());
app.use(cors({
  origin: [
    FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:8080',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(generalLimiter);

// --- Body parsing ---
// Save the raw buffer on the request so the Stripe webhook handler can verify the signature.
// The webhook route uses req.rawBody; all other routes use the parsed req.body.
app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// --- Routes ---
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'sharpaction-api',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/auth', authRouter);
app.use('/api/subscriptions', subscriptionsRouter);

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found.` });
});

// --- Global error handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message || 'Internal server error.';
  res.status(status).json({ success: false, error: message });
});

app.listen(PORT, () => {
  console.log(`SharpAction API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;
