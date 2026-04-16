-- Chalkpicks.xyz Database Schema
-- SQLite via better-sqlite3

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK(subscription_tier IN ('free', 'pro', 'elite')),
  subscription_expires_at TEXT,
  stripe_customer_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0,
  avatar_url TEXT,
  notification_picks INTEGER NOT NULL DEFAULT 1,
  notification_results INTEGER NOT NULL DEFAULT 1,
  notification_news INTEGER NOT NULL DEFAULT 0,
  is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Picks table
CREATE TABLE IF NOT EXISTS picks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sport TEXT NOT NULL,
  league TEXT NOT NULL,
  game_id TEXT,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  game_time TEXT NOT NULL,
  pick_type TEXT NOT NULL CHECK(pick_type IN ('spread', 'moneyline', 'total')),
  pick_side TEXT NOT NULL,
  pick_value REAL,
  odds INTEGER NOT NULL,
  opening_odds INTEGER,
  confidence INTEGER NOT NULL DEFAULT 50 CHECK(confidence >= 0 AND confidence <= 100),
  analysis TEXT NOT NULL DEFAULT '',
  key_factors TEXT NOT NULL DEFAULT '[]',
  result TEXT NOT NULL DEFAULT 'pending' CHECK(result IN ('pending', 'win', 'loss', 'push')),
  profit_loss REAL,
  is_premium INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_picks_sport ON picks(sport);
CREATE INDEX IF NOT EXISTS idx_picks_game_time ON picks(game_time);
CREATE INDEX IF NOT EXISTS idx_picks_result ON picks(result);
CREATE INDEX IF NOT EXISTS idx_picks_created_at ON picks(created_at);

-- User picks (tracked picks)
CREATE TABLE IF NOT EXISTS user_picks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pick_id INTEGER NOT NULL REFERENCES picks(id) ON DELETE CASCADE,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_parlay INTEGER NOT NULL DEFAULT 0,
  parlay_id INTEGER REFERENCES parlays(id) ON DELETE SET NULL,
  UNIQUE(user_id, pick_id)
);

CREATE INDEX IF NOT EXISTS idx_user_picks_user_id ON user_picks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_picks_pick_id ON user_picks(pick_id);

-- Parlays table
CREATE TABLE IF NOT EXISTS parlays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  picks TEXT NOT NULL DEFAULT '[]',
  combined_odds INTEGER,
  stake REAL,
  potential_payout REAL,
  result TEXT NOT NULL DEFAULT 'pending' CHECK(result IN ('pending', 'win', 'loss', 'push')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_parlays_user_id ON parlays(user_id);

-- Performance stats (aggregate, updated by cron)
CREATE TABLE IF NOT EXISTS performance_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  total_picks INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  pushes INTEGER NOT NULL DEFAULT 0,
  win_rate REAL NOT NULL DEFAULT 0,
  roi REAL NOT NULL DEFAULT 0,
  profit_loss REAL NOT NULL DEFAULT 0,
  sport TEXT NOT NULL DEFAULT 'all'
);

CREATE INDEX IF NOT EXISTS idx_performance_stats_date ON performance_stats(date);
CREATE INDEX IF NOT EXISTS idx_performance_stats_sport ON performance_stats(sport);

-- Subscriptions table (mirrors Stripe state)
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  tier TEXT NOT NULL CHECK(tier IN ('free', 'pro', 'elite')),
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TEXT,
  current_period_end TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- User bets (personal bet tracking)
CREATE TABLE IF NOT EXISTS user_bets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pick_id INTEGER REFERENCES picks(id) ON DELETE SET NULL,
  sport TEXT NOT NULL,
  description TEXT NOT NULL,
  bet_type TEXT NOT NULL CHECK(bet_type IN ('spread', 'moneyline', 'total', 'prop', 'parlay', 'other')),
  odds INTEGER NOT NULL,
  stake REAL NOT NULL,
  potential_payout REAL,
  result TEXT NOT NULL DEFAULT 'pending' CHECK(result IN ('pending', 'win', 'loss', 'push')),
  profit_loss REAL,
  notes TEXT,
  bet_date TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_bets_user_id ON user_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bets_result ON user_bets(result);
