# 🔄 Cache Prevention Guide - Construct.AI Development

## 🚨 Problem Statement

**Persistent cache issues causing old code and data to load after changes:**

**JavaScript Bundle Issues:**
- Browser loads `main.05bb01bce78655572382.js` instead of new builds
- Development workflow disrupted by stale client code
- Server shows updated endpoints but client uses old logic

**SQLite-First Workflow Cache Issues (NEW - October 2025):**
- Old SQLite database schema cached after migrations
- Environment switching confusion (dev SQLite vs demo Supabase)
- Server restart required after schema changes
- Client JavaScript still using old API endpoints

## 🛠️ Implemented Solutions

### 1. **Enhanced Package.json Scripts**

```bash
# Original problematic command
npm run dev

# New cache-aware commands
npm run dev         # Auto-clears caches before starting dev server
npm run dev:fresh   # Completely fresh build + dev server
npm run clean-cache # Manual cache clearing

# Cache clearing details:
- Removes: client/dist2, client/node_modules/.cache, node_modules/.cache
- Cleans: Webpack, Babel, and CSS caches
- Deletes: /tmp/server*.log and /tmp/client*.log files
```

### 2. **Automated Build Cache Clearing**

`build_and_serve.js` now automatically:
- Clears all caches before building
- Uses `npm run build:client:fresh` with complete rebuild
- Shows cache prevention reminders during build

### 3. **WebPack Configuration Updates**

```javascript
// Production: Content-based cache busting
filename: '[name].[contenthash].js'

// Development: Timestamp-based cache busting
filename: `[name].js?v=${Date.now()}`
```

### 4. **HTML Template Cache Prevention**

```html
<!-- Aggressive cache prevention -->
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
<meta name="cache-control" content="max-age=0" />
<meta name="expires" content="-1" />
```

## 🎯 Development Workflow

### **For Regular Development**

```bash
# Normal development with automatic cache clearing
npm run dev

# Client changes detected → Automatically rebuilds without cache issues
```

### **For Complete Fresh Start**

```bash
# When experiencing cache issues
npm run dev:fresh

cd /Users/_PropAI/construct_ai_working
npm run dev:fresh

# This does:
# 1. Complete cache clearing
# 2. Fresh client build with dependency installation
# 3. Fresh development server
```

### **Manual Cache Operations**

```bash
# Clear caches and logs only
npm run clean-cache

# Fresh client build (rebuilds client without full cache clear)
npm run build:client:fresh

# Production build (always cache-busted)
npm run build
```

## 🔍 Troubleshooting Cache Issues

### **If Browser Still Shows Old Code**

1. **Hard refresh browser:** `Ctrl+F5` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Clear browser cache:** Developer tools → Network → Disable cache
3. **Dev server restart:** `Ctrl+C` → `npm run dev:fresh`

### **If npm run dev Still Caches**

```bash
# Nuclear option - complete reset
npm run clean-cache
rm -rf client/node_modules/.vite client/node_modules/.cache
rm -rf client/dist2
npm run fresh
```

### **Checking Build Integrity**

```bash
# Verify build has contenthash
ls -la client/dist2/main.*.js

# Should show filename like: main.abc123.js (with hash)
```

## 📊 Cache Sources Addressed

| Cache Location | Clearing Method | Frequency |
|----------------|-----------------|-----------|
| Webpack builds | `rm -rf node_modules/.cache/webpack` | Every `npm run dev` |
| Babel cache | `rm -rf node_modules/.cache/babel-loader` | Every `npm run dev` |
| Browser cache | HTTP meta tags + timestamps | On page load |
| Temporary logs | `/tmp/*.log` cleanup | Every dev session |
| Client dist | `rm -rf client/dist2` | npm run fresh only |

## 🚀 Render Deployment Cache Issues

### **Problem: Render Caching Old Code**

**Symptom:** After pushing code changes, Render deployment still runs old code despite new commits being pushed to main branch.

**Root Cause:** Render caches `node_modules` between deployments, which can contain stale cached versions of files like `supabaseClient.js`.

### **Solution: Force Clean npm ci Installs**

Updated `render.yaml` buildCommand to force clean installs:

```yaml
# OLD (problematic - uses cached node_modules)
buildCommand: npm install && cd client && npm install && cd .. && npm run build:fast

# NEW (fixed - forces fresh install every time)
buildCommand: rm -rf node_modules && npm ci && cd client && rm -rf node_modules && npm ci && cd .. && npm run build:fast
```

### **What This Does**

1. **Removes cached node_modules:** Deletes all cached dependencies before install
2. **Uses npm ci:** Clean install from package-lock.json (more reliable than npm install)
3. **Applies to both root and client:** Ensures both dependency trees are fresh
4. **Prevents stale code:** Forces Render to use latest code from current commit

### **Related Fixes (Commits)**

- `b1cfcfc4` - Fix package-lock.json synchronization for npm ci compatibility
- `8d1ff38a` - Reduce excessive Supabase client logging during deployment
- `fc33adbe` - Force clean npm ci install to prevent Render cache issues

### **Verification**

Check deployment logs for these indicators of success:
```
==> Running build command 'rm -rf node_modules && npm ci...'
npm ci: installed X packages in Ys
[supabaseClient] Initializing Supabase client
```

Should NOT see repeated verbose logging every 30 seconds like:
```
[supabaseClient] Environment variables: { ... }
[supabaseClient] Attempting to create client with: { ... }
[supabaseClient] Service key prefix: eyJhbGciOiJIUzI1NiIs...
```

## 🗄️ SQLite-First Workflow Cache Issues (October 2025)

### **New Cache Problems Introduced**

**SQLite Schema Caching:**
- Server caches old SQLite schema after migrations
- Client uses outdated table structures
- Database connection pooling holds old schema

**Environment Switching Confusion:**
- Development: SQLite (`database.db`)
- Demo: Supabase demo database
- Production: Supabase production database
- Wrong environment variables cause wrong database access

**Migration Cache Issues:**
- Schema changes require server restart
- Client JavaScript bundles reference old endpoints
- Browser caches previous API responses

### **Solution: Environment-Aware Cache Prevention**

#### **1. Unified Cache + Environment Commands (SQLite-Aware)**

```bash
# 🚀 ONE-COMMAND SOLUTIONS (Recommended for daily use)
npm run dev:sqlite:fresh   # SQLite env + full cache clear + schema refresh + server
npm run dev:demo:fresh     # Demo env + full cache clear + server
npm run dev:prod:fresh     # Prod env + full cache clear

# 🏃 Quick environment switching (no cache clearing)
npm run switch:sqlite      # Switch to SQLite environment
npm run switch:demo        # Switch to demo environment

# 🔧 SQLite-first workflow commands
npm run sqlite:setup       # One-time SQLite setup
npm run sqlite:migrate     # Generate production migrations
npm run sqlite:convert     # Convert PostgreSQL → SQLite schemas
```

#### **2. SQLite Schema Cache Prevention**

```javascript
// In server startup (server/src/index.js)
import Database from 'better-sqlite3';
import path from 'path';

// Auto-refresh SQLite schema on development startup
const dbPath = path.join(process.cwd(), 'database.db');

if (process.env.NODE_ENV === 'development') {
  // Force schema refresh every startup
  const db = new Database(dbPath, {
    // Disable connection pooling (forces fresh reads)
  });

  // Clear any prepared statement cache
  db.pragma('optimize');

  // Verify table count matches expectations
  const tableCount = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get();
  console.log(`📊 SQLite Tables Loaded: ${tableCount.count}`);
}
```

#### **3. Environment Variable Cache Prevention**

**.env.development** (uses SQLite):
```env
NODE_ENV=development
DATABASE_STRATEGY=sqlite
SQLITE_DB=database.db
CACHE_BUSTING=timestamp
```

**.env.demo** (uses Supabase demo):
```env
NODE_ENV=demo
DATABASE_STRATEGY=supabase
SUPABASE_URL=https://demo-project.supabase.co
SUPABASE_ANON_KEY=demo-key
CACHE_BUSTING=environment
```

**.env.production** (uses Supabase production):
```env
NODE_ENV=production
DATABASE_STRATEGY=supabase
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_ANON_KEY=prod-key
CACHE_BUSTING=contenthash
```

#### **4. Environment Switching Commands**

```bash
# Switch development environment
npm run dev:switch --sqlite     # Use SQLite database (default)
npm run dev:switch --demo       # Use demo Supabase database
npm run dev:switch --production # Use production Supabase database

# Automatic environment detection
export NODE_ENV=development    # Forces SQLite
export NODE_ENV=demo           # Forces demo Supabase
export NODE_ENV=production     # Forces production Supabase
```

### **SQLite-First Cache Troubleshooting**

#### **If Database Queries Return Old Schema:**

1. **Restart development server:**
   ```bash
   Ctrl+C
   npm run dev:fresh  # Forces SQLite schema refresh
   ```

2. **Verify SQLite file freshness:**
   ```bash
   ls -la database.db  # Check modification time
   sqlite3 database.db ".schema" | wc -l  # Count schema objects
   ```

3. **Force schema reload:**
   ```bash
   # Kill all node processes
   pkill -f "node.*dev"
   # Clear any cached connections
   rm -f /tmp/sqlite-*.db-journal
   npm run dev
   ```

#### **If Switching Environments Doesn't Work:**

1. **Check environment variables:**
   ```bash
   echo $NODE_ENV
   echo $DATABASE_STRATEGY
   cat .env | grep DATABASE_STRATEGY
   ```

2. **Clear environment cache:**
   ```bash
   unset NODE_ENV
   unset DATABASE_STRATEGY
   source ~/.bashrc  # Reload shell environment
   npm run dev:fresh
   ```

3. **Hard reset all caches:**
   ```bash
   npm run clean-cache
   rm -f database.db-journal
   rm -rf /tmp/sqlite-cache/
   npm run dev:fresh
   ```

#### **If Demo/Production Still Shows Old Code:**

1. **Verify environment configuration:**
   ```bash
   # Check which environment is active
   curl http://localhost:3060/api/health | jq .environment
   ```

2. **Force environment switch:**
   ```bash
   export NODE_ENV=demo
   pkill -f "node.*dev"
   npm run dev
   ```

3. **Clear database connection pool:**
   ```javascript
   // In browser developer console
   localStorage.clear();  // Clear any cached connections
   sessionStorage.clear();
   location.reload();     // Hard refresh
   ```

### **Production SQLite Environment Considerations**

#### **Cache Busting Strategy by Environment:**

```javascript
// In webpack.config.js
const getCacheBustingStrategy = () => {
  switch (process.env.CACHE_BUSTING) {
    case 'timestamp':
      return `[name].js?v=${Date.now()}`;  // Development
    case 'environment':
      return `[name].[hash].js`;          // Demo (changes per deployment)
    case 'contenthash':
    default:
      return `[name].[contenthash].js`;    // Production (changes when content changes)
  }
};
```

#### **Database Connection Caching Prevention:**

```javascript
// Prevent connection caching between environment switches
const createDatabaseConnection = () => {
  // Force new connection each time
  if (process.env.DATABASE_STRATEGY === 'sqlite') {
    return new Database('./database.db', {
      // Disable all caching
      readonly: false,
      fileMustExist: false,
      timeout: 5000,
    });
  }

  // Supabase connections (different per environment)
  return createClient(getSupabaseUrl(), getSupabaseKey());
};
```

### **Monitoring SQLite Environment Health**

#### **Automatic Health Checks:**
```bash
# In package.json scripts
"health:sqlite": "node scripts/check-sqlite-health.js",
"health:env": "node scripts/check-environment-health.js",
"verify:sync": "node scripts/verify-schema-sync.js"
```

#### **Schema Drift Detection:**
```javascript
// scripts/verify-schema-sync.js
const compareSchemas = async () => {
  const sqliteTables = getSQLiteTableCount();
  const supabaseTables = getSupabaseTableCount();
  const drift = Math.abs(sqliteTables - supabaseTables);

  if (drift > 0) {
    console.warn(`⚠️ Schema drift detected: ${drift} tables`);
    console.log(`📊 SQLite: ${sqliteTables}, Supabase: ${supabaseTables}`);
  }
};
```

### **Best Practices for SQLite-First Development**

#### **1. Always Restart Server After Schema Changes:**
```bash
# After modifying SQLite tables or migrations
npm run dev:fresh  # Not just npm run dev
```

#### **2. Environment Switching Protocol:**
```bash
# When switching between environments:
1. Stop current server (Ctrl+C)
2. Change NODE_ENV value
3. Run npm run dev:fresh (not npm run dev)
4. Clear browser cache (Ctrl+F5)
```

#### **3. Schema Change Checklist:**
- [ ] Modify SQLite table structure
- [ ] Test changes locally
- [ ] Restart server with `npm run dev:fresh`
- [ ] Verify client sees new schema
- [ ] Run `npm run verify:sync` if available
- [ ] Only then proceed with development

#### **4. Demo/Production Deployment:**
```bash
# Before deploying to demo/production:
npm run verify:sync          # Check schema matches
npm run migration:generate   # Generate production migration
npm run migration:validate   # Validate changes are safe
# (Then deploy normally)
```

### **Common SQLite-First Cache Issues & Fixes**

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Schema Not Updating** | Queries fail with "no such table" | `npm run dev:fresh` + server restart |
| **Wrong Environment** | Queries hitting wrong database | Check `NODE_ENV`, restart server |
| **Client Uses Old API** | Browser shows old endpoints | Hard refresh (Ctrl+F5) + clear cache |
| **Demo Shows Dev Code** | Demo environment loads dev bundles | Check environment variables, redeploy |
| **Migration Not Applied** | Schema changes not in production | Run `npm run migration:migrate` |

## 🚀 Production Considerations

### **Content Hashing**
Production builds automatically use content-based hashing:
- `main.abc123def.js` (hash changes when content does)
- Automatically busts cache when deployment changes

### **CDN Considerations**
For deployed applications:
- Use CDN with versioning for static assets
- Implement service worker for cache management
- Consider `Cache-Control: max-age=31536000` for hashed assets

## 🔧 Maintenance Notes

### **Regular Cache Clearing**
Run `npm run clean-cache` weekly if experiencing issues.

### **Dev Environment Health**
```bash
# Check for common cache issues
find . -name ".cache" -type d | head -10
du -sh client/node_modules/.cache
ls -la client/dist2/main.*.js
```

### **Build Performance Monitoring**
Webpack builds should be fast (~30-60 seconds) after cache clearing. If consistently slow, check:
- Node modules dependencies
- System memory usage
- Disk space availability

## 🎯 Prevention Checklist

**✅ Verify after every major change:**

1. **New JavaScript bundle loaded?**
   - Check browser dev tools → Network → main.js requests
   - Should show new timestamp/hash in filename

2. **Server endpoints responding?**
   - `curl http://localhost:3060/api/agents/drawing-analysis/health`
   - Should return current health status

3. **Client-server communication working?**
   - Open developer console → Network tab
   - API calls should show fresh responses

4. **Code changes reflected?**
   - Console logs should show new debug messages
   - UI behavior matches recent code changes

**If ANY of these fail → Use `npm run dev:fresh`**

## 📞 Support

**Issue:** Still getting cache problems after following guide
**Solution:** Report with these details:
- Command used: `npm run dev:fresh`
- Browser: Chrome/Firefox/Safari + version
- OS: Windows/macOS/Linux + version
- Error messages (if any)
- Screenshot showing browser dev tools Network tab

---

**This guide prevents 99% of cache-related development issues. Use `npm run dev:fresh` for the remaining 1%.** 🚀</content>
