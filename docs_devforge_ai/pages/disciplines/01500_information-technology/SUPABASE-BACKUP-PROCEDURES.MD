# 0500_SUPABASE_BACKUP_PROCEDURES.md

# Supabase Database Backup Procedures

## Overview
This document outlines the procedures for backing up Construct AI's remote Supabase project database. The backup includes complete SQL dumps of database schema and data for disaster recovery and migration purposes.

## Project Details
- **Project URL**: https://mseizswoiwyewsidknta.supabase.co
- **Project Reference**: mseizswoiwyewsidknta
- **Database Host**: db.mseizswoiwyewsidknta.supabase.co:5432
- **Credentials Location**: `.env.backup.20250914_122135` (contains service role key)

## Backup Methods

### Primary Method: Supabase Dashboard (Recommended)
1. Navigate to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project `mseizswoiwyewsidknta`
3. Go to **Database → Backups**
4. Click **"Create backup"**
5. Download the SQL dump file
6. Store in `backup/` directory with timestamp

### Secondary Method: Supabase CLI (Requires Docker Desktop)
```bash
# Authenticate and link project
npx supabase login
npx supabase link --project-ref mseizswoiwyewsidknta

# Create backup
npx supabase db dump -f backup/supabase_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Tertiary Method: Direct Database Connection
```bash
# Use service role key from .env.backup.20250914_122135
pg_dump "postgresql://postgres:[SERVICE_ROLE_KEY]@db.mseizswoiwyewsidknta.supabase.co:5432/postgres" > backup.sql
```

## Backup Contents
When successful, backups should include:
- **Database Schema**: All tables, indexes, constraints, functions, and triggers
- **Database Data**: All table records (optional, based on backup type)
- **Project Configuration**: Migration history and metadata

## File Organization
```
backup/
├── supabase_backup_20251016_111325/     # Empty (creation attempt)
├── supabase_backup_20251016_111344/     # Empty (CLI attempt)
├── supabase_backup_2025-10-16T09-14-21/ # Script attempt
├── [FUTURE_BACKUPS]/                    # Successful backups
│   ├── schema.sql                       # Database structure
│   ├── data.sql                         # Table data (if included)
│   ├── backup_metadata.json             # Backup information
│   └── [timestamp].tar.gz               # Compressed archive
└── README.md                            # This documentation
```

## Automation Script
A backup script (`backup_supabase.cjs`) is available for automated backups:
```bash
# Schema only backup
node backup_supabase.cjs schema-only

# Full backup (schema + data)
node backup_supabase.cjs full
```

## Troubleshooting
- **DNS Issues**: Current environment cannot resolve `db.mseizswoiwyewsidknta.supabase.co`
- **Authentication**: Ensure service role key is valid (not expired)
- **Permissions**: Service role key required for full database access

## Recovery Procedures
1. Create new Supabase project if original is lost
2. Use dashboard to restore backup SQL files
3. Verify data integrity post-restore
4. Update application configuration with new project details

## Security Notes
- Never commit actual API keys to version control
- Service role key provides full database access - handle securely
- Backups may contain sensitive data - encrypt if needed for external storage
- Regular backup verification recommended (quarterly)

## Related Documentation
- `docs/0500_SUPABASE_SCHEMA_MANAGEMENT.md` - Schema maintenance procedures
- `.env.backup.20250914_122135` - Backup of environment credentials
- `docs/0000_DOCUMENTATION_GUIDE.md` - Documentation standards
