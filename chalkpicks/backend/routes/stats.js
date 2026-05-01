'use strict';

const express = require('express');
const { getPerformanceStats, getDailyStats } = require('../models/db');
const { asyncHandler } = require('../utils/validate');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json(getPerformanceStats());
}));

router.get('/daily', asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 30, 90);
  res.json(getDailyStats(days));
}));

router.get('/sport/:sport', asyncHandler(async (req, res) => {
  res.json(getPerformanceStats(req.params.sport));
}));

module.exports = router;
