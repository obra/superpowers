'use strict';

const express = require('express');
const { updateUser, getUserBets, createBet, updateBet, deleteBet } = require('../models/db');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler, validateRequired } = require('../utils/validate');
const { errors } = require('../utils/errors');

const router = express.Router();
router.use(authenticateToken);

router.get('/me', asyncHandler(async (req, res) => {
  const { password_hash: _, ...safe } = req.user;
  res.json(safe);
}));

router.patch('/me', asyncHandler(async (req, res) => {
  const allowed = ['name', 'avatar_url', 'notification_picks', 'notification_results', 'notification_news'];
  const fields = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const updated = updateUser(req.user.id, fields);
  const { password_hash: _, ...safe } = updated;
  res.json(safe);
}));

router.get('/me/bets', asyncHandler(async (req, res) => {
  res.json(getUserBets(req.user.id));
}));

router.post('/me/bets', asyncHandler(async (req, res) => {
  const missing = validateRequired(req.body, ['sport', 'description', 'bet_type', 'odds', 'stake']);
  if (missing.length) throw errors.validation(`Missing fields: ${missing.join(', ')}`);
  const bet = createBet(req.user.id, req.body);
  res.status(201).json(bet);
}));

router.patch('/me/bets/:id', asyncHandler(async (req, res) => {
  const bet = updateBet(Number(req.params.id), req.user.id, req.body);
  if (!bet) throw errors.notFound('Bet not found');
  res.json(bet);
}));

router.delete('/me/bets/:id', asyncHandler(async (req, res) => {
  const result = deleteBet(Number(req.params.id), req.user.id);
  if (result.changes === 0) throw errors.notFound('Bet not found');
  res.json({ deleted: true });
}));

module.exports = router;
