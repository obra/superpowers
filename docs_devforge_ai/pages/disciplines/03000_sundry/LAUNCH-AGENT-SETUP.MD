# Launch Agent Setup Documentation

## Overview

This document describes the Launch Agent configuration for automatic schema extraction in Construct AI.

## Current Status (2026-02-20)

### Launch Agents Registered

The following Construct AI launch agents are registered:

| Agent | Status | Exit Code |
|-------|--------|-----------|
| `com.constructai.schema-extraction` | Error | 1 |
| `com.constructai.documentation-audit` | Error | 78 |
| `com.constructai.it-security-monitoring` | Error | 78 |
| `com.constructai.ui-compliance` | Error | 78 |
| `com.constructai.workflow-optimization` | Error | 78 |
| `com.constructai.langextract` | Error | 78 |
| `com.constructai.database-security` | Error | 78 |

### Issues Identified

1. **Missing Dependencies** (RESOLVED)
   - The `dotenv` and `@supabase/supabase-js` packages were not installed
   - Fixed by running: `npm install dotenv @supabase/supabase-js --save-dev --legacy-peer-deps`

2. **Invalid Supabase API Key** (CURRENT ISSUE)
   - The Supabase API key in `.env.dev` is invalid or expired
   - Error: `{"message":"Invalid API key","hint":"Double check your Supabase `anon` or `service_role` API key."}`
   - **Action Required**: Update the Supabase API keys in `.env.dev`

3. **Launcher Script Path Issue**
   - The `schema-extraction-launcher.sh` doesn't include `/Users/_General/Feb-20-2` in its search paths
   - The plist points directly to the script, but the launcher is used as a fallback

## Configuration Files

### Plist Location
```
~/Library/LaunchAgents/com.constructai.schema-extraction.plist
```

### Plist Configuration
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.constructai.schema-extraction</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/_General/Feb-20-2/docs/schema/code/extract-schema-openapi.js</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>3600</integer>

    <key>StandardOutPath</key>
    <string>/tmp/schema-extraction.log</string>

    <key>StandardErrorPath</key>
    <string>/tmp/schema-extraction.error.log</string>

    <key>WorkingDirectory</key>
    <string>/Users/_General/Feb-20-2</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
        <key>HOME</key>
        <string>/Users/alistairtennant</string>
    </dict>
</dict>
</plist>
```

## Log Files

- **Standard Output**: `/tmp/schema-extraction.log`
- **Standard Error**: `/tmp/schema-extraction.error.log`

## Manual Execution

To run the schema extraction manually:

```bash
cd /Users/_General/Feb-20-2
node docs/schema/code/extract-schema-openapi.js
```

## Troubleshooting

### Check Launch Agent Status
```bash
launchctl list | grep constructai
```

### View Error Logs
```bash
cat /tmp/schema-extraction.error.log
```

### Restart Launch Agent
```bash
launchctl unload ~/Library/LaunchAgents/com.constructai.schema-extraction.plist
launchctl load ~/Library/LaunchAgents/com.constructai.schema-extraction.plist
```

### Update Supabase Keys

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to Project Settings > API
3. Copy the new `anon` and `service_role` keys
4. Update `.env.dev`:
   ```
   SUPABASE_ANON_KEY=<new_anon_key>
   SUPABASE_SERVICE_ROLE_KEY=<new_service_role_key>
   ```
5. Restart the launch agent

## Output Files

The schema extraction generates the following files in `docs/schema/reports/`:

- `current-full-schema.md` - Complete schema documentation
- `current-full-schema.sql` - SQL schema
- `table-index.md` - Alphabetical table index
- `schema-part-01.md`, `schema-part-02.md`, `schema-part-03.md` - Split schema parts
- `index-policies.md` - RLS policies index
- `index-discipline-pages.md` - Discipline pages index
- `index-accordion.md` - Accordion navigation index

## Next Steps

1. **Update Supabase API Keys** - Get fresh keys from Supabase dashboard
2. **Test Manual Execution** - Verify schema extraction works manually
3. **Restart Launch Agents** - Reload all Construct AI launch agents
4. **Verify Output** - Check that schema files are generated correctly

---

**Last Updated**: 2026-02-20
**Author**: Cline AI Assistant