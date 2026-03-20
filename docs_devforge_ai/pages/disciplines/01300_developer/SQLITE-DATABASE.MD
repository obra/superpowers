# 0305_SQLITE_DATABASE.md

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-10-03): Initial documentation of SQLite local development database

## Overview

The SQLite local database (`database.db`) serves as a development and testing database that mirrors the production Supabase PostgreSQL database schema. This local database enables offline development, fast testing iterations, and data synchronization between development environments and production.

## Technical Architecture

### Database Location
```
database.db (SQLite file)
├── Location: /Users/_PropAI/construct_ai_working/database.db
├── Type: SQLite 3
├── Size: ~Variable (depends on test data)
├── Schema: Mirrors production Supabase PostgreSQL
```

### Purpose and Usage
- **Development**: Local data storage for development and testing
- **Testing**: Isolated test environment with sample data
- **Synchronization**: Syncs with production Supabase for schema updates
- **Backup**: Local data backup and recovery capabilities

### Database Schema Overview

#### Core Tables
| Table | Row Count | Description |
|-------|-----------|-------------|
| `external_api_configurations` | 3 | External API configurations (Google Vision, OpenAI) |
| `prompts` | Variable | AI prompt templates and system prompts |
| `prompt_analytics` | Variable | AI prompt usage analytics |

#### Key Differences from Supabase Production
- **ID Fields**: Integer auto-increment vs PostgreSQL UUID
- **Organization Support**: No `organization_id` field in most tables
- **RLS Policies**: No Row Level Security (simplified for development)
- **Extensions**: No PostgreSQL-specific extensions

## Table Schemas

### external_api_configurations
```sql
CREATE TABLE external_api_configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_name TEXT NOT NULL,
  api_type TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  organization_id TEXT,  -- Simplified from production
  temperature REAL DEFAULT 0.7,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Current Data (Google Vision/OpenAI):**
```sql
-- Google Vision AI (working configuration)
INSERT INTO external_api_configurations (
  id, api_name, api_type, endpoint_url, api_key, is_active
) VALUES (
  4, 'Google Vision AI', 'Google Vision AI',
  'https://vision.googleapis.com/v1',
  'AIzaSyCnr7GlMABWoWc84Mnmq1V01BXiYTWjFPE\n',
  1
);

-- OpenAI Vision entries (test/dummy)
INSERT INTO external_api_configurations (
  id, api_name, api_type, api_key, is_active
) VALUES (
  1, 'OpenAI GPT-4o Vision (Production)',
  'OpenAI Vision',
  'sk-test-DUMMY-KEY-FOR-TESTING-PURPOSES-ONLY', 1
), (
  2, 'OpenAI GPT-4o (Vision)',
  'OpenAI Vision',
  'sk-test-DUMMY-KEY-FOR-TESTING-PURPOSES-ONLY', 1
);
```

### prompts
```sql
-- Schema mirrors production prompts table
-- Contains AI system prompts, user prompts, and templates
-- Used for drawing analysis, procurement SOW generation, etc.
```

## Current API Configuration Status

### 🟢 Active Google Vision API
**File Location:** `database.db`
**Table:** `external_api_configurations`
**ID:** `4`
**Config:**
- API Name: `Google Vision AI`
- API Type: `Google Vision AI`
- Endpoint: `https://vision.googleapis.com/v1`
- API Key: `AIzaSyCnr7GlMABWoWc84Mnmq1V01BXiYTWjFPE`
- Status: `ACTIVE` (is_active = 1)

### 🚨 Critical Issue: Manual Update Required

**IMPORTANT:** The Google Vision API key was manually updated in the SQLite database using direct SQL commands:
```bash
sqlite3 database.db "UPDATE external_api_configurations SET api_key = 'AIzaSyCnr7GlMABWoWc84Mnmq1V01BXiYTWjFPE' WHERE api_name = 'Google Vision AI';"
```

This change **MAY NOT be reflected in production runtime** unless the server was restarted after the update.

## Data Synchronization Patterns

### Development to Production Flow
```
1. SQLite local changes tested locally
2. Schema changes applied to Supabase via SQL scripts
3. Test data synchronized via import/export tools
4. Production deployment validates synchronization
```

### Production Backups
```
production_data/
├── supabase_backups/    # Full Supabase exports
├── sqlite_mirrors/      # SQLite copies for offline work
└── schema_history/      # DDL migration tracking
```

## Files Accessing SQLite Database

### Direct Database Access Scripts
```bash
# Test and utility scripts
test_vision_api.js          # API configuration testing
scripts/validate-database.js # Schema validation
scripts/export-data.js      # Data export utilities
scripts/import-test-data.js # Test data population
```

### Common Query Patterns
```javascript
// Direct SQLite access for testing
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database.db');

// Query API configurations
db.get(`
  SELECT * FROM external_api_configurations
  WHERE api_type = 'Google Vision AI' AND is_active = 1
`, (err, row) => {
  console.log('Google Vision config:', row);
});
```

### Development Environment Setup
```bash
# Initialize local development database
npm run db:init    # Create SQLite database with schema
npm run db:seed    # Populate with test data
npm run db:test    # Validate database integrity
```

## Database Management Tools

### Interactive Access
```bash
# Open SQLite interactive shell
sqlite3 database.db

# Execute SQL commands
sqlite> .tables                    # List all tables
sqlite> .schema table_name         # Show table schema
sqlite> SELECT * FROM external_api_configurations;
```

### Backup and Recovery
```bash
# Backup database
cp database.db database.backup.$(date +%Y%m%d_%H%M%S)

# Restore from backup
cp database.backup.20231003_143000 database.db

# Export to SQL
sqlite3 database.db .dump > database_export.sql
```

### Query Optimization
```bash
# Analyze query performance
sqlite3 database.db "EXPLAIN QUERY PLAN SELECT * FROM prompts WHERE key = 'drawing_analysis';"

# Vacuum database (cleanup fragmentation)
sqlite3 database.db "VACUUM;"

# Verify database integrity
sqlite3 database.db "PRAGMA integrity_check;"
```

## Production vs Development Differences

### Schema Differences
| Aspect | Production (Supabase) | Development (SQLite) |
|--------|----------------------|---------------------|
| ID Fields | UUID (`uuid_generate_v4()`) | INTEGER AUTOINCREMENT |
| Organizations | Full support with RLS | Simplified/no org field |
| Extensions | PostgreSQL extensions | SQLite built-in functions |
| Constraints | Advanced FK relations | Basic constraints |
| Indexing | Advanced indexes | Basic performance indexes |

### Data Synchronization Issues
- **Environment Variables**: May override database settings
- **Caching**: Server may cache database configurations
- **Connection Pools**: Different connection handling patterns
- **Error Handling**: Different exception patterns between databases

## Troubleshooting Database Issues

### Common Problems

#### 1. Drawing Analysis Fails with OpenAI Error
**Symptom**: "VISION API REQUIRED: OpenAI Vision required" despite Google Vision configured

**Root Causes:**
- Server cached old config (restart required)
- Google Vision key invalid in runtime memory
- Environment variable overrides database setting

**Solutions:**
```bash
# Force server restart
npm run dev:restart

# Verify current config in logs
tail -f logs/server.log | grep "Google Vision"

# Check if env vars override
echo $GOOGLE_VISION_API_KEY  # Should be empty if using database
```

#### 2. Test Scripts Can't Access Database
**Symptom**: `test_vision_api.js` shows "Invalid API key" errors

**Root Causes:**
- No Supabase credentials in script environment
- Script uses Supabase client instead of direct SQLite
- Different database access patterns

**Solutions:**
```javascript
// Option A: Use direct SQLite access in test scripts
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database.db');

// Option B: Ensure Supabase credentials for script environment
export SUPABASE_URL="https://mseizswoiwyewsidknta.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
```

#### 3. Schema Synchronization Issues
**Symptom**: Development and production databases have different schemas

**Solution:**
```bash
# Re-sync schema from production
npm run db:sync --from=production

# Validate schema matches between environments
npm run db:validate-schema
```

## Performance Considerations

### SQLite Limitations in Development
- **Concurrency**: Single-writer multiple-reader (vs PostgreSQL multi-writer)
- **Indexing Strategy**: Different optimization approaches
- **Memory Usage**: Entire database loaded into memory for performance
- **Migration Scripts**: Different DDL syntax vs PostgreSQL

### Optimization Strategies
```sql
-- Create performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_api_configs_active
ON external_api_configurations(is_active, api_type);

CREATE INDEX IF NOT EXISTS idx_prompts_type
ON prompts(role_type, is_active);

-- Vacuum regularly to maintain performance
VACUUM;
```

## Security Considerations

### Local Development Security
- **No RLS**: Row Level Security not enforced (simplified development)
- **Plain Text Storage**: API keys stored in plain text (acceptable for development)
- **Access Control**: Local file system permissions control access
- **Network Exposure**: Database not exposed to network in development

### Production Migration Notes
- **Encryption**: API keys should be encrypted in production
- **Access Control**: RLS policies required for multi-tenant security
- **Audit Logging**: API key access should be logged
- **Environment Separation**: Never deploy local SQLite to production

## Maintenance Operations

### Regular Maintenance Tasks

#### 1. Database Vacuuming
```bash
# Monthly maintenance
sqlite3 database.db "VACUUM;"

# Reclaim disk space from deleted records
sqlite3 database.db "VACUUM INTO 'database_compact.db';"
```

#### 2. Schema Validation
```bash
# Compare local vs production schema
npm run db:compare-schemas --local --production

# Generate schema sync script
npm run db:generate-sync-script
```

#### 3. Test Data Management
```bash
# Refresh test data
npm run db:reset-test-data

# Anonymize production data for testing
npm run db:anonymize-data --source=production
```

## Integration Points

### Environment Variables Override Database
```bash
# These will override database settings
GOOGLE_VISION_API_KEY="from-env"
OPENAI_API_KEY="from-env"
SUPABASE_ANON_KEY="from-env"
```

### File System Integration
```
/Users/_PropAI/construct_ai_working/
├── database.db                    # Main SQLite database
├── database.backup.*             # Automatic backups
├── scripts/                       # Database management scripts
│   ├── db-init.js
│   ├── db-sync.js
│   └── db-backup.js
└── config/                        # Database configuration files
    └── database-config.js
```

## Version History
- v1.0 (2025-10-03): Initial documentation of local SQLite development database

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [ ] Audit completed
