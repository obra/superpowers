#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(process.env.HOME, '.claude', 'meta-learning-state.json');

function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return { count: 0, lastReview: null };
  }
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    // If file is corrupted, return default state
    return { count: 0, lastReview: null };
  }
}

function saveState(state) {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

const command = process.argv[2];

if (command === 'record') {
  const state = loadState();
  state.count++;
  state.lastReview = new Date().toISOString();
  saveState(state);
  console.log(`Recorded. Count: ${state.count}`);
} else if (command === 'count') {
  const state = loadState();
  console.log(state.count);
} else if (command === 'reset') {
  saveState({ count: 0, lastReview: null });
  console.log('Reset complete');
} else if (command === 'last-recorded') {
  const state = loadState();
  if (state.lastReview) {
    console.log(state.lastReview);
  } else {
    console.log('');
  }
} else {
  console.error('Usage: meta-learning-state.js [record|count|reset|last-recorded]');
  process.exit(1);
}
