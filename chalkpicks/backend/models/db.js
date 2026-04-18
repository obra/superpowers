'use strict';

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || './chalkpicks.db';
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Resolve DB path relative to project root (where server.js lives)
const resolvedDbPath = path.resolve(process.cwd(), DB_PATH);

let db;

function getDb() {
  if (!db) {
    db = new Database(resolvedDbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initializeDatabase() {
  const database = getDb();

  // Run schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  // Split on semicolons and run each statement that isn't empty
  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  const runAll = database.transaction(() => {
    for (const stmt of statements) {
      try {
        database.prepare(stmt).run();
      } catch (err) {
        // Ignore "already exists" style errors for PRAGMA and CREATE INDEX IF NOT EXISTS
        if (!err.message.includes('already exists')) {
          console.error(`Schema error on statement:\n${stmt}\n`, err.message);
        }
      }
    }
  });

  runAll();
  console.log('Database schema initialized.');

  seedDatabase(database);
  return database;
}

function seedDatabase(database) {
  // Only seed if tables are empty
  const pickCount = database.prepare('SELECT COUNT(*) as cnt FROM picks').get();
  if (pickCount.cnt > 0) return;

  console.log('Seeding initial data...');

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const fmtDate = (d) => d.toISOString().replace('T', ' ').substring(0, 19);

  // Insert seed picks
  const insertPick = database.prepare(`
    INSERT INTO picks
      (sport, league, game_id, home_team, away_team, game_time,
       pick_type, pick_side, pick_value, odds, opening_odds,
       confidence, analysis, key_factors, result, profit_loss, is_premium)
    VALUES
      (@sport, @league, @game_id, @home_team, @away_team, @game_time,
       @pick_type, @pick_side, @pick_value, @odds, @opening_odds,
       @confidence, @analysis, @key_factors, @result, @profit_loss, @is_premium)
  `);

  const seedPicks = [
    {
      sport: 'basketball',
      league: 'NBA',
      game_id: 'nba-seed-001',
      home_team: 'Boston Celtics',
      away_team: 'Miami Heat',
      game_time: fmtDate(tomorrow),
      pick_type: 'spread',
      pick_side: 'Boston Celtics -5.5',
      pick_value: -5.5,
      odds: -110,
      opening_odds: -108,
      confidence: 74,
      analysis:
        'The Celtics have been dominant at home this season, covering the spread in 8 of their last 11 home games. Miami is dealing with backcourt fatigue from a back-to-back, and Boston\'s defense ranks 2nd in the league against opposing guards. The line movement toward Boston suggests sharp money is on the hosts.',
      key_factors: JSON.stringify([
        'Celtics 8-3 ATS in last 11 home games',
        'Miami on second leg of back-to-back',
        'Boston top-5 defensive rating at home',
        'Line moved from -5 to -5.5 (sharp action)',
      ]),
      result: 'pending',
      profit_loss: null,
      is_premium: 0,
    },
    {
      sport: 'football',
      league: 'NFL',
      game_id: 'nfl-seed-001',
      home_team: 'Kansas City Chiefs',
      away_team: 'Las Vegas Raiders',
      game_time: fmtDate(tomorrow),
      pick_type: 'moneyline',
      pick_side: 'Kansas City Chiefs',
      pick_value: null,
      odds: -185,
      opening_odds: -175,
      confidence: 81,
      analysis:
        'Kansas City at home is a near-lock scenario this season. The Raiders are 2-7 SU in their last 9 road games and have significant offensive line issues heading into this matchup. Mahomes has a 94.1 passer rating in night games this year. The Chiefs\' pass rush should exploit the Raiders\' depleted offensive line.',
      key_factors: JSON.stringify([
        'Chiefs 7-1 SU at home this season',
        'Raiders 2-7 SU in last 9 road games',
        'Mahomes 94.1 passer rating in prime time',
        'Raiders missing two starting offensive linemen',
      ]),
      result: 'pending',
      profit_loss: null,
      is_premium: 0,
    },
    {
      sport: 'baseball',
      league: 'MLB',
      game_id: 'mlb-seed-001',
      home_team: 'Los Angeles Dodgers',
      away_team: 'San Francisco Giants',
      game_time: fmtDate(tomorrow),
      pick_type: 'total',
      pick_side: 'Under 8.5',
      pick_value: 8.5,
      odds: -115,
      opening_odds: -110,
      confidence: 68,
      analysis:
        'Two elite starters are on the mound tonight, both with sub-3.00 ERAs over the last 30 days. The marine layer at Dodger Stadium has suppressed run scoring in evening games this week. Both bullpens are relatively fresh after low-leverage games over the weekend.',
      key_factors: JSON.stringify([
        'Both starters ERA under 3.00 last 30 days',
        'Marine layer effect at Dodger Stadium',
        'Combined team batting average .238 last week',
        'Under hit in 6 of last 8 Dodgers home starts',
      ]),
      result: 'pending',
      profit_loss: null,
      is_premium: 1,
    },
    {
      sport: 'hockey',
      league: 'NHL',
      game_id: 'nhl-seed-001',
      home_team: 'Colorado Avalanche',
      away_team: 'Minnesota Wild',
      game_time: fmtDate(tomorrow),
      pick_type: 'spread',
      pick_side: 'Colorado Avalanche -1.5',
      pick_value: -1.5,
      odds: 115,
      opening_odds: 120,
      confidence: 63,
      analysis:
        'Colorado has won 5 straight at home and is clicking on all cylinders offensively. Mackinnon has 9 points in his last 6 games. Minnesota\'s goaltending has been inconsistent on the road, posting a .898 save percentage away from home this month. The Avs should win by multiple goals.',
      key_factors: JSON.stringify([
        'Avalanche 5-game home winning streak',
        "MacKinnon 9 points in last 6 games",
        "Wild goaltender .898 SV% on road this month",
        'Colorado leads NHL in 5-on-5 goals for',
      ]),
      result: 'pending',
      profit_loss: null,
      is_premium: 1,
    },
    {
      sport: 'basketball',
      league: 'NBA',
      game_id: 'nba-seed-002',
      home_team: 'Golden State Warriors',
      away_team: 'Phoenix Suns',
      game_time: fmtDate(yesterday),
      pick_type: 'spread',
      pick_side: 'Golden State Warriors -3',
      pick_value: -3,
      odds: -110,
      opening_odds: -112,
      confidence: 71,
      analysis:
        'Golden State covered in 7 of their last 9 home games. Curry was rested for the previous game and historically plays 30+ minutes after a rest day. Phoenix has a weak perimeter defense allowing 39.2% from three this season.',
      key_factors: JSON.stringify([
        'Warriors 7-2 ATS in last 9 home games',
        'Curry historically dominant after rest',
        'Suns allow 39.2% from three (bottom 5)',
        'Golden State +12.4 net rating at home',
      ]),
      result: 'win',
      profit_loss: 0.909,
      is_premium: 0,
    },
    {
      sport: 'football',
      league: 'NFL',
      game_id: 'nfl-seed-002',
      home_team: 'Philadelphia Eagles',
      away_team: 'Dallas Cowboys',
      game_time: fmtDate(yesterday),
      pick_type: 'total',
      pick_side: 'Over 44.5',
      pick_value: 44.5,
      odds: -110,
      opening_odds: -105,
      confidence: 66,
      analysis:
        'Both offenses have been prolific in recent weeks. Philly averages 31.2 points at home while Dallas has scored 28+ in 4 consecutive games. Warm weather with no wind expected favors the over. The Cowboys\' defense has struggled against mobile quarterbacks.',
      key_factors: JSON.stringify([
        'Eagles average 31.2 PPG at home',
        'Cowboys scored 28+ in 4 straight games',
        'Favorable weather: 68 degrees, no wind',
        'Divisional rivalry historically high-scoring',
      ]),
      result: 'loss',
      profit_loss: -1.0,
      is_premium: 0,
    },
    {
      sport: 'baseball',
      league: 'MLB',
      game_id: 'mlb-seed-002',
      home_team: 'New York Yankees',
      away_team: 'Boston Red Sox',
      game_time: fmtDate(yesterday),
      pick_type: 'moneyline',
      pick_side: 'New York Yankees',
      pick_value: null,
      odds: -145,
      opening_odds: -140,
      confidence: 72,
      analysis:
        'The Yankees are rolling with their ace on the mound who has a 1.87 ERA over his last 8 starts. Boston\'s lineup has struggled against left-handed pitching this month. Yankee Stadium\'s dimensions favor the Yankees\' pull-heavy lineup.',
      key_factors: JSON.stringify([
        "Yankees ace 1.87 ERA over last 8 starts",
        'Boston hitting .221 vs LHP this month',
        'Yankees won 7 of last 10 home series vs Boston',
        'Bullpen fresh after off day',
      ]),
      result: 'win',
      profit_loss: 0.69,
      is_premium: 0,
    },
    {
      sport: 'basketball',
      league: 'NCAAB',
      game_id: 'ncaab-seed-001',
      home_team: 'Duke Blue Devils',
      away_team: 'North Carolina Tar Heels',
      game_time: fmtDate(tomorrow),
      pick_type: 'spread',
      pick_side: 'North Carolina +7.5',
      pick_side: 'North Carolina +7.5',
      pick_value: 7.5,
      odds: -110,
      opening_odds: -108,
      confidence: 61,
      analysis:
        'Rivalry games historically see underdogs cover at a higher rate. UNC has beaten the spread in 5 of their last 7 road games in rivalry matchups. Duke has been inconsistent against elite competition despite the home advantage. This line feels inflated by public perception.',
      key_factors: JSON.stringify([
        'Underdogs cover 58% in rivalry games',
        'UNC 5-2 ATS in last 7 rivalry road games',
        'Duke inconsistent vs top-25 opponents (4-5 ATS)',
        'Public betting 74% on Duke inflating line',
      ]),
      result: 'pending',
      profit_loss: null,
      is_premium: 1,
    },
    {
      sport: 'football',
      league: 'NCAAF',
      game_id: 'ncaaf-seed-001',
      home_team: 'Alabama Crimson Tide',
      away_team: 'LSU Tigers',
      game_time: fmtDate(yesterday),
      pick_type: 'spread',
      pick_side: 'Alabama Crimson Tide -6.5',
      pick_value: -6.5,
      odds: -110,
      opening_odds: -107,
      confidence: 77,
      analysis:
        'Alabama\'s defense has been suffocating this season, allowing fewer than 14 PPG. LSU\'s offensive line has been decimated by injuries and will struggle to create any run game. Bryant-Denny Stadium is one of the hardest places to play in college football.',
      key_factors: JSON.stringify([
        'Alabama defense allows 13.8 PPG (2nd in CFB)',
        'LSU missing 3 starting offensive linemen',
        'Saban 18-4 ATS as home favorite vs ranked teams',
        'Night game at Bryant-Denny historically dominant',
      ]),
      result: 'win',
      profit_loss: 0.909,
      is_premium: 0,
    },
    {
      sport: 'hockey',
      league: 'NHL',
      game_id: 'nhl-seed-002',
      home_team: 'Tampa Bay Lightning',
      away_team: 'Florida Panthers',
      game_time: fmtDate(yesterday),
      pick_type: 'moneyline',
      pick_side: 'Tampa Bay Lightning',
      pick_value: null,
      odds: -120,
      opening_odds: -115,
      confidence: 65,
      analysis:
        'The Battle of Florida is always competitive but Tampa has the goaltending edge. Vasilevskiy has a .931 save percentage this month and historically dominates the Panthers. This is an undervalued favorite given the matchup history.',
      key_factors: JSON.stringify([
        'Vasilevskiy .931 SV% this month',
        'Tampa 8-3 SU vs Florida in last 11 matchups',
        'Panthers PP% drops 8% on road games',
        'Lightning power play clicking at 28%',
      ]),
      result: 'push',
      profit_loss: 0,
      is_premium: 0,
    },
  ];

  const seedPicksTransaction = database.transaction(() => {
    for (const pick of seedPicks) {
      insertPick.run(pick);
    }
  });

  seedPicksTransaction();

  // Seed performance stats (last 3 days)
  const insertStat = database.prepare(`
    INSERT OR IGNORE INTO performance_stats
      (date, total_picks, wins, losses, pushes, win_rate, roi, profit_loss, sport)
    VALUES
      (@date, @total_picks, @wins, @losses, @pushes, @win_rate, @roi, @profit_loss, @sport)
  `);

  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const statsSeed = [
    {
      date: twoDaysAgo.toISOString().substring(0, 10),
      total_picks: 8,
      wins: 5,
      losses: 3,
      pushes: 0,
      win_rate: 62.5,
      roi: 8.3,
      profit_loss: 3.32,
      sport: 'all',
    },
    {
      date: yesterday.toISOString().substring(0, 10),
      total_picks: 6,
      wins: 4,
      losses: 1,
      pushes: 1,
      win_rate: 80.0,
      roi: 18.2,
      profit_loss: 4.37,
      sport: 'all',
    },
    {
      date: now.toISOString().substring(0, 10),
      total_picks: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      win_rate: 0,
      roi: 0,
      profit_loss: 0,
      sport: 'all',
    },
  ];

  const seedStatsTransaction = database.transaction(() => {
    for (const stat of statsSeed) {
      insertStat.run(stat);
    }
  });

  seedStatsTransaction();

  console.log(`Seeded ${seedPicks.length} picks and ${statsSeed.length} performance stat records.`);
}

// --- Helper functions ---

function getUser(email) {
  const database = getDb();
  return database.prepare('SELECT * FROM users WHERE email = ? AND is_deleted = 0').get(email);
}

function getUserById(id) {
  const database = getDb();
  return database.prepare('SELECT * FROM users WHERE id = ? AND is_deleted = 0').get(id);
}

function createUser({ email, password_hash, name, subscription_tier = 'free' }) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO users (email, password_hash, name, subscription_tier)
    VALUES (@email, @password_hash, @name, @subscription_tier)
  `);
  const result = stmt.run({ email, password_hash, name, subscription_tier });
  return getUserById(result.lastInsertRowid);
}

function updateUser(id, fields) {
  const database = getDb();
  const allowedFields = [
    'name',
    'password_hash',
    'subscription_tier',
    'subscription_expires_at',
    'stripe_customer_id',
    'last_login',
    'email_verified',
    'avatar_url',
    'notification_picks',
    'notification_results',
    'notification_news',
    'is_deleted',
  ];

  const updates = Object.entries(fields)
    .filter(([key]) => allowedFields.includes(key))
    .map(([key]) => `${key} = @${key}`)
    .join(', ');

  if (!updates) return getUserById(id);

  const stmt = database.prepare(
    `UPDATE users SET ${updates}, updated_at = datetime('now') WHERE id = @id`
  );
  stmt.run({ ...fields, id });
  return getUserById(id);
}

// --- Subscription helpers ---

function getSubscription(userId) {
  const database = getDb();
  return database
    .prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(userId);
}

function upsertSubscription({ userId, stripeSubscriptionId, tier, status, currentPeriodStart, currentPeriodEnd }) {
  const database = getDb();
  const existing = database
    .prepare('SELECT id FROM subscriptions WHERE stripe_subscription_id = ?')
    .get(stripeSubscriptionId);

  if (existing) {
    database.prepare(`
      UPDATE subscriptions
      SET tier = @tier, status = @status,
          current_period_start = @currentPeriodStart,
          current_period_end = @currentPeriodEnd
      WHERE stripe_subscription_id = @stripeSubscriptionId
    `).run({ tier, status, currentPeriodStart, currentPeriodEnd, stripeSubscriptionId });
  } else {
    database.prepare(`
      INSERT INTO subscriptions
        (user_id, stripe_subscription_id, tier, status, current_period_start, current_period_end)
      VALUES
        (@userId, @stripeSubscriptionId, @tier, @status, @currentPeriodStart, @currentPeriodEnd)
    `).run({ userId, stripeSubscriptionId, tier, status, currentPeriodStart, currentPeriodEnd });
  }

  return getSubscription(userId);
}

function cancelSubscriptionRecord(stripeSubscriptionId) {
  const database = getDb();
  database.prepare(`
    UPDATE subscriptions SET status = 'canceled' WHERE stripe_subscription_id = ?
  `).run(stripeSubscriptionId);
}

function getUserByStripeCustomerId(stripeCustomerId) {
  const database = getDb();
  return database
    .prepare('SELECT * FROM users WHERE stripe_customer_id = ? AND is_deleted = 0')
    .get(stripeCustomerId);
}

// --- Password reset helpers ---

function createPasswordResetToken({ userId, token, expiresAt }) {
  const database = getDb();
  // Invalidate previous tokens
  database.prepare('UPDATE password_reset_tokens SET used = 1 WHERE user_id = ?').run(userId);
  database.prepare(`
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES (@userId, @token, @expiresAt)
  `).run({ userId, token, expiresAt });
}

function getPasswordResetToken(token) {
  const database = getDb();
  return database
    .prepare('SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0')
    .get(token);
}

function markPasswordResetTokenUsed(token) {
  const database = getDb();
  database.prepare('UPDATE password_reset_tokens SET used = 1 WHERE token = ?').run(token);
}

// Initialize and export
const database = initializeDatabase();

module.exports = {
  db: database,
  getDb,
  getUser,
  getUserById,
  createUser,
  updateUser,
  getSubscription,
  upsertSubscription,
  cancelSubscriptionRecord,
  getUserByStripeCustomerId,
  createPasswordResetToken,
  getPasswordResetToken,
  markPasswordResetTokenUsed,
};

// Allow direct execution for setup
if (require.main === module) {
  console.log('Database setup complete at:', resolvedDbPath);
  process.exit(0);
}
