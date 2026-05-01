'use strict';

const express = require('express');
const { getPicks, getPickById, trackPick, untrackPick, getUserPicks } = require('../models/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../utils/validate');
const { errors } = require('../utils/errors');

const router = express.Router();

router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { sport, league, result, limit, offset } = req.query;
  const picks = getPicks({ sport, league, result, limit, offset });
  res.json(picks.map((p) => gatePick(p, req.user)));
}));

router.get('/my', authenticateToken, asyncHandler(async (req, res) => {
  const picks = getUserPicks(req.user.id);
  res.json(picks.map(parsePick));
}));

router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const pick = getPickById(Number(req.params.id));
  if (!pick) throw errors.notFound('Pick not found');
  res.json(gatePick(pick, req.user));
}));

router.post('/:id/track', authenticateToken, asyncHandler(async (req, res) => {
  const pick = getPickById(Number(req.params.id));
  if (!pick) throw errors.notFound('Pick not found');
  trackPick(req.user.id, pick.id);
  res.json({ tracked: true });
}));

router.delete('/:id/track', authenticateToken, asyncHandler(async (req, res) => {
  untrackPick(req.user.id, Number(req.params.id));
  res.json({ tracked: false });
}));

function parsePick(p) {
  try {
    return { ...p, key_factors: typeof p.key_factors === 'string' ? JSON.parse(p.key_factors) : p.key_factors };
  } catch {
    return p;
  }
}

function gatePick(pick, user) {
  const parsed = parsePick(pick);
  const isFreeUser = !user || user.subscription_tier === 'free';
  if (pick.is_premium && isFreeUser) {
    return { ...parsed, analysis: null, key_factors: null, _gated: true };
  }
  return parsed;
}

module.exports = router;
