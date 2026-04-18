'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { authenticateToken, signToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  getUser,
  getUserById,
  createUser,
  updateUser,
  createPasswordResetToken,
  getPasswordResetToken,
  markPasswordResetTokenUsed,
} = require('../models/db');

const router = express.Router();

const SALT_ROUNDS = 12;
const RESET_TOKEN_EXPIRES_MINUTES = 60;

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ success: false, error: 'Email, password, and name are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
  }

  if (name.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Name must be at least 2 characters.' });
  }

  try {
    const existing = getUser(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = createUser({
      email: email.toLowerCase().trim(),
      password_hash,
      name: name.trim(),
    });

    const token = signToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  try {
    const user = getUser(email.toLowerCase().trim());

    // Constant-time rejection to prevent user enumeration
    const dummyHash = '$2b$12$invalidhashfortimingconstancy00000000000000000000000000';
    const isValid = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, dummyHash);

    if (!user || !isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    updateUser(user.id, { last_login: new Date().toISOString() });

    const token = signToken(user.id);

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  const user = getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }
  res.json({ success: true, user: sanitizeUser(user) });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  // Always return success to prevent user enumeration
  const user = getUser(email.toLowerCase().trim());

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000).toISOString();

    createPasswordResetToken({ userId: user.id, token, expiresAt });

    // In production wire up nodemailer here
    console.info(`[password-reset] token for user ${user.id}: ${token}`);
  }

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ success: false, error: 'Token and new password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
  }

  const record = getPasswordResetToken(token);

  if (!record) {
    return res.status(400).json({ success: false, error: 'Invalid or expired reset token.' });
  }

  if (new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ success: false, error: 'Reset token has expired. Please request a new one.' });
  }

  try {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    updateUser(record.user_id, { password_hash });
    markPasswordResetTokenUsed(token);

    res.json({ success: true, message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, error: 'Failed to reset password. Please try again.' });
  }
});

// PATCH /api/auth/me — update profile fields
router.patch('/me', authenticateToken, async (req, res) => {
  const { name, currentPassword, newPassword, notificationPicks, notificationResults, notificationNews } = req.body;

  const updates = {};

  if (name !== undefined) {
    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Name must be at least 2 characters.' });
    }
    updates.name = name.trim();
  }

  if (newPassword !== undefined) {
    if (!currentPassword) {
      return res.status(400).json({ success: false, error: 'Current password is required to set a new one.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters.' });
    }

    const user = getUserById(req.user.id);
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect.' });
    }

    updates.password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  }

  if (notificationPicks !== undefined) updates.notification_picks = notificationPicks ? 1 : 0;
  if (notificationResults !== undefined) updates.notification_results = notificationResults ? 1 : 0;
  if (notificationNews !== undefined) updates.notification_news = notificationNews ? 1 : 0;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, error: 'No valid fields to update.' });
  }

  try {
    const updated = updateUser(req.user.id, updates);
    res.json({ success: true, user: sanitizeUser(updated) });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
});

module.exports = router;
