'use strict';

const jwt = require('jsonwebtoken');
const { getUserById } = require('../models/db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-do-not-use-in-production';

/**
 * Tier hierarchy for subscription checks.
 */
const TIER_LEVELS = {
  free: 0,
  pro: 1,
  elite: 2,
};

/**
 * Extract Bearer token from Authorization header.
 */
function extractToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
  return parts[1];
}

/**
 * authenticateToken — verifies JWT and attaches req.user.
 * Returns 401 if no token or invalid, 403 if expired.
 */
async function authenticateToken(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid Bearer token.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUserById(decoded.userId);

    if (!user || user.is_deleted) {
      return res.status(401).json({
        success: false,
        error: 'User account not found or has been deactivated.',
      });
    }

    // Strip sensitive fields before attaching to request
    const { password_hash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. Please log in again.',
        code: 'TOKEN_INVALID',
      });
    }
    console.error('Auth middleware error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication.',
    });
  }
}

/**
 * requireSubscription — factory that returns middleware enforcing a minimum tier.
 * Usage: router.get('/premium', authenticateToken, requireSubscription('pro'), handler)
 */
function requireSubscription(tier) {
  const requiredLevel = TIER_LEVELS[tier];
  if (requiredLevel === undefined) {
    throw new Error(`requireSubscription called with unknown tier: "${tier}"`);
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    const userTier = req.user.subscription_tier || 'free';
    const userLevel = TIER_LEVELS[userTier] ?? 0;

    // Check subscription expiration for paid tiers
    if (userLevel > 0 && req.user.subscription_expires_at) {
      const expiresAt = new Date(req.user.subscription_expires_at);
      if (expiresAt < new Date()) {
        return res.status(403).json({
          success: false,
          error: 'Your subscription has expired. Please renew to access this content.',
          code: 'SUBSCRIPTION_EXPIRED',
          requiredTier: tier,
        });
      }
    }

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        error: `This feature requires a ${tier} subscription or higher.`,
        code: 'INSUFFICIENT_SUBSCRIPTION',
        requiredTier: tier,
        currentTier: userTier,
        upgradeUrl: '/pricing',
      });
    }

    next();
  };
}

/**
 * optionalAuth — attaches req.user if a valid token is present,
 * but always calls next() regardless. Used for routes where
 * authenticated users get more data but anonymous access is allowed.
 */
async function optionalAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUserById(decoded.userId);

    if (user && !user.is_deleted) {
      const { password_hash, ...safeUser } = user;
      req.user = safeUser;
    } else {
      req.user = null;
    }
  } catch {
    // Invalid or expired token — treat as unauthenticated
    req.user = null;
  }

  next();
}

/**
 * signToken — creates a signed JWT for a user.
 */
function signToken(userId, expiresIn) {
  const expiry = expiresIn || process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: expiry });
}

module.exports = {
  authenticateToken,
  requireSubscription,
  optionalAuth,
  signToken,
};
