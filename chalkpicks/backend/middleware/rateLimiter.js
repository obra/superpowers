'use strict';

const rateLimit = require('express-rate-limit');

/**
 * General limiter — applied to all routes by default.
 * 100 requests per 15 minutes per IP.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again in 15 minutes.',
    retryAfter: '15 minutes',
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

/**
 * Auth limiter — stricter, applied to login and register routes.
 * 10 requests per 15 minutes per IP to prevent brute-force attacks.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error:
      'Too many authentication attempts from this IP. Please wait 15 minutes before trying again.',
    retryAfter: '15 minutes',
  },
  handler: (req, res, next, options) => {
    console.warn(`Auth rate limit exceeded for IP: ${req.ip} on path: ${req.path}`);
    res.status(429).json(options.message);
  },
  // Key by IP + normalized email when available to avoid locking out an IP
  // based on other users' bad requests
  keyGenerator: (req) => {
    const email = req.body && req.body.email ? req.body.email.toLowerCase().trim() : '';
    return `${req.ip}:${email}`;
  },
});

/**
 * API limiter — for external data endpoints (odds, sports data).
 * 200 requests per hour per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'API rate limit exceeded. You can make up to 200 requests per hour.',
    retryAfter: '1 hour',
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter,
};
