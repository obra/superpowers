'use strict';

const express = require('express');
const { getUserParlays, createParlay, deleteParlay } = require('../models/db');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../utils/validate');
const { errors } = require('../utils/errors');

const router = express.Router();
router.use(authenticateToken);

router.get('/', asyncHandler(async (req, res) => {
  const parlays = getUserParlays(req.user.id);
  res.json(parlays.map((p) => ({ ...p, picks: JSON.parse(p.picks || '[]') })));
}));

router.post('/', asyncHandler(async (req, res) => {
  const { picks, combined_odds, stake, potential_payout } = req.body;
  if (!Array.isArray(picks) || picks.length < 2) {
    throw errors.validation('Parlay requires at least 2 picks');
  }
  const parlay = createParlay(req.user.id, { picks, combined_odds, stake, potential_payout });
  res.status(201).json({ ...parlay, picks: JSON.parse(parlay.picks || '[]') });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const result = deleteParlay(Number(req.params.id), req.user.id);
  if (result.changes === 0) throw errors.notFound('Parlay not found');
  res.json({ deleted: true });
}));

module.exports = router;
