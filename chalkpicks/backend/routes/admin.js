'use strict';

const express = require('express');
const { createPick, updatePick, getDb } = require('../models/db');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler, validateRequired } = require('../utils/validate');
const { errors } = require('../utils/errors');

const router = express.Router();

function requireAdmin(req, res, next) {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim()).filter(Boolean);
  if (!adminEmails.includes(req.user.email)) return next(errors.forbidden('Admin access required'));
  next();
}

router.use(authenticateToken, requireAdmin);

router.post('/picks', asyncHandler(async (req, res) => {
  const required = ['sport', 'league', 'home_team', 'away_team', 'game_time', 'pick_type', 'pick_side', 'odds', 'confidence', 'analysis'];
  const missing = validateRequired(req.body, required);
  if (missing.length) throw errors.validation(`Missing fields: ${missing.join(', ')}`);

  const data = {
    ...req.body,
    key_factors: JSON.stringify(Array.isArray(req.body.key_factors) ? req.body.key_factors : []),
  };
  const pick = createPick(data);
  res.status(201).json(pick);
}));

router.patch('/picks/:id', asyncHandler(async (req, res) => {
  const pick = updatePick(Number(req.params.id), req.body);
  if (!pick) throw errors.notFound('Pick not found');
  res.json(pick);
}));

router.post('/stats/recalculate', asyncHandler(async (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().substring(0, 10);

  const todayPicks = db
    .prepare("SELECT * FROM picks WHERE date(game_time) = ? AND result != 'pending'")
    .all(today);

  const wins = todayPicks.filter((p) => p.result === 'win').length;
  const losses = todayPicks.filter((p) => p.result === 'loss').length;
  const pushes = todayPicks.filter((p) => p.result === 'push').length;
  const total = wins + losses + pushes;
  const win_rate = total > 0 ? (wins / (wins + losses)) * 100 : 0;
  const profit_loss = todayPicks.reduce((sum, p) => sum + (p.profit_loss || 0), 0);
  const roi = total > 0 ? (profit_loss / total) * 100 : 0;

  db.prepare(`
    INSERT INTO performance_stats (date, total_picks, wins, losses, pushes, win_rate, roi, profit_loss, sport)
    VALUES (@date, @total_picks, @wins, @losses, @pushes, @win_rate, @roi, @profit_loss, 'all')
    ON CONFLICT(date) DO UPDATE SET
      total_picks = excluded.total_picks,
      wins = excluded.wins,
      losses = excluded.losses,
      pushes = excluded.pushes,
      win_rate = excluded.win_rate,
      roi = excluded.roi,
      profit_loss = excluded.profit_loss
  `).run({ date: today, total_picks: total, wins, losses, pushes, win_rate, roi, profit_loss });

  res.json({ date: today, total, wins, losses, pushes, win_rate, roi, profit_loss });
}));

module.exports = router;
