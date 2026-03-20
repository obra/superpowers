# 🚀 Team Schema Regeneration Setup Guide

This guide explains how to set up automatic schema documentation regeneration for all team members.

## 📋 Overview

The schema regeneration script automatically:
- Downloads the latest OpenAPI specification from Supabase
- Generates comprehensive PostgreSQL and SQLite schema files
- Creates markdown documentation (split into manageable parts)
- Updates all schema files with current timestamps
- Runs on system startup

## 🎯 Prerequisites

### Required for All Team Members

1. **Node.js** (v18 or higher)
   ```bash
   node --version
   # If not installed, download from: https://nodejs.org/
   ```

2. **Git**
   ```bash
   git --version
   ```

3. **Supabase Access**
   - Must have access to the Supabase project
   - Can generate Service Role Key or have Admin access

### Environment Variables (Required)

Get these from your Supabase dashboard:
1. Go to `https://supabase.com/dashboard`
2. Select your project
3. Go to **Project Settings** > **API**
4. Copy these values:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**⚠️ Security Note:** These keys are sensitive. Never commit them to git!

## 🛠️ Setup Instructions

### Step 1: Clone or Update Repository

**Note:** The schema regeneration script is located at `docs/schema/code/startup-schema-regeneration.js` (not `scripts/`) because it's schema-specific.

```bash
# If cloning for the first time
git clone https://github.com/Construct-AI-primary/construct_ai.git
cd construct_ai

# If you already have the repo
cd construct_ai
git pull origin main
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

```bash
# Create .env file from template
cp .env.example .env
```

Now edit `.env` and add your Supabase credentials:

```bash
# Open in your preferred editor
# VS Code
code .env

# Or use nano
nano .env
```

Add these lines to `.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here  # Optional, for fallback
```

### Step 4: Test the Setup

Run the script manually to verify everything works:

```bash
node docs/schema/code/startup-schema-regeneration.js
```

**Expected Output:**
```
🚀 SCHEMA REGENERATION - TEAM VERSION
=========================================

🔍 Validating environment variables...
✅ Environment variables validated

📋 Loading environment configuration...
✅ Environment configuration loaded

🌐 Checking API accessibility...
✅ API is accessible

📥 Downloading OpenAPI specification...
✅ OpenAPI spec saved (461 tables)

🔨 Generating schema documentation...
✅ Schema documentation generated

📝 Updating master guide...
✅ Master guide updated

📊 Creating summary report...
✅ Summary report created

========================================
✅ SCHEMA REGENERATION COMPLETE
========================================
📊 Summary: 5/5 files generated
🗂️  Total size: 832.45 KB
⏱️  Execution time: 12.45s
📁 Files location: docs/schema/reports/
========================================
```

If you see errors, check:
- ✅ Node.js version is 18+
- ✅ `.env` file exists with correct values
- ✅ Supabase URL is correct
- ✅ API key is valid
- ✅ Network connection is working

### Step 5: Commit and Push

```bash
# Check what files were modified
git status

# Stage the updated schema files
git add docs/schema/reports/

# Commit with descriptive message
git commit -m "chore: update schema documentation - $(date +%Y-%m-%d)"

# Push to GitHub
git push origin main
```

### Step 6: Notify Team Members

Let other team members know:
1. Pull the latest changes
2. Follow Steps 3-5 to set up their environment
3. Test the script

## 🔧 Platform-Specific Setup

### macOS (Recommended: LaunchAgent)

Create the LaunchAgent plist file:

```bash
# Create directory if it doesn't exist
mkdir -p ~/Library/LaunchAgents

# Create the plist file
cat > ~/Library/LaunchAgents/com.constructai.schema-extraction.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.constructai.schema-extraction</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/your-username/construct_ai/docs/schema/code/startup-schema-regeneration.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>/Users/your-username/construct_ai</string>
    <key>StandardOutPath</key>
    <string>/tmp/constructai-schema.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/constructai-schema-error.log</string>
</dict>
</plist>
EOF
```

**Important:** Replace `/Users/your-username/construct_ai` with your actual project path.

Load the LaunchAgent:

```bash
# Load the agent
launchctl load ~/Library/LaunchAgents/com.constructai.schema-extraction.plist

# Start it immediately (optional)
launchctl start com.constructai.schema-extraction

# Check status
launchctl list | grep constructai

# View logs
tail -f /tmp/constructai-schema.log
```

**To disable:**
```bash
launchctl unload ~/Library/LaunchAgents/com.constructai.schema-extraction.plist
```

### Linux (Systemd Service)

Create the systemd service file:

```bash
# Create directory for user services
mkdir -p ~/.config/systemd/user

# Create service file
cat > ~/.config/systemd/user/constructai-schema.service << 'EOF'
[Unit]
Description=ConstructAI Schema Regeneration
After=network.target

[Service]
Type=oneshot
WorkingDirectory=/home/your-username/construct_ai
ExecStart=/usr/bin/node /home/your-username/construct_ai/docs/schema/code/startup-schema-regeneration.js
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
EOF
```

**Important:** Replace `/home/your-username/construct_ai` with your actual project path.

Enable and start the service:

```bash
# Reload systemd
systemctl --user daemon-reload

# Enable to run at startup
systemctl --user enable constructai-schema.service

# Start it immediately (optional)
systemctl --user start constructai-schema.service

# Check status
systemctl --user status constructai-schema.service

# View logs
journalctl --user -u constructai-schema.service -f
```

**To disable:**
```bash
systemctl --user disable constructai-schema.service
systemctl --user stop constructai-schema.service
```

### Windows (Task Scheduler)

**Option 1: PowerShell Script**

Create a PowerShell script:

```powershell
# Create startup script
@'
# Path to your project
$projectPath = "C:\Users\your-username\construct_ai"

# Navigate to project
Set-Location $projectPath

# Run schema regeneration
node docs/schema/code/startup-schema-regeneration.js

# Log results
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$timestamp] Schema regeneration completed" | Out-File -FilePath "C:\temp\constructai-schema.log" -Append
'@ | Out-File -FilePath "C:\Users\your-username\construct_ai\docs\schema\code\startup-schema-regeneration.ps1" -Encoding UTF8
```

**Option 2: Task Scheduler GUI**

1. Open Task Scheduler (taskschd.msc)
2. Click **Create Basic Task**
3. Name: `ConstructAI Schema Regeneration`
4. Description: `Regenerates schema documentation on startup`
5. Trigger: **When the computer starts**
6. Action: **Start a program**
7. Program/script: `powershell.exe`
8. Add arguments: `-ExecutionPolicy Bypass -File "C:\Users\your-username\construct_ai\docs\schema\code\startup-schema-regeneration.ps1"`
9. Check **Run with highest privileges** (optional)
10. Finish

**Option 3: Registry (Advanced)**

```powershell
# Add to Run registry key
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "ConstructAI Schema" /t REG_SZ /d "powershell.exe -ExecutionPolicy Bypass -File \"C:\Users\your-username\construct_ai\docs\schema\code\startup-schema-regeneration.ps1\"" /f
```

### Cross-Platform: CI/CD Pipeline (Recommended for Teams)

Instead of running on every developer's machine, consider adding to your CI/CD pipeline:

**GitHub Actions Example:**

```yaml
# .github/workflows/update-schema.yml
name: Update Schema Documentation

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch:  # Manual trigger

jobs:
  update-schema:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run schema regeneration
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: |
          node docs/schema/code/startup-schema-regeneration.js
      
      - name: Commit and push changes
        run: |
          git config --global user.name "GitHub Actions"
          git config --global user.email "actions@github.com"
          git add docs/schema/reports/
          git commit -m "chore: auto-update schema documentation - $(date +%Y-%m-%d)" || echo "No changes to commit"
          git push origin main
```

## 🧪 Testing the Setup

### Manual Test

```bash
cd /path/to/construct_ai

# Run the script
node docs/schema/code/startup-schema-regeneration.js

# Check generated files
ls -lh docs/schema/reports/

# View summary report
cat docs/schema/reports/regeneration-report.json | jq .
```

### Verify Files Were Created

The script should generate these files:
- ✅ `docs/schema/reports/schema-part-01.md`
- ✅ `docs/schema/reports/schema-part-02.md`
- ✅ `docs/schema/reports/current-full-schema.sql`
- ✅ `docs/schema/reports/current-full-schema_sqlite.sql`
- ✅ `docs/schema/reports/openapi-spec.json`
- ✅ `docs/schema/reports/regeneration-report.json`

### Check Startup Test

After setting up automatic execution, restart your computer and verify:
1. The script runs automatically
2. Files are updated with new timestamps
3. No errors in logs

## 🔍 Troubleshooting

### Issue: "Missing required environment variables"

**Solution:**
```bash
# Check .env file
cat .env | grep SUPABASE

# If missing, add them:
echo "SUPABASE_URL=https://your-project.supabase.co" >> .env
echo "SUPABASE_SERVICE_ROLE_KEY=your-key-here" >> .env
```

### Issue: "API connection failed"

**Solution:**
1. Verify Supabase URL is correct:
   ```bash
   curl -I https://your-project.supabase.co
   ```
2. Check if Supabase project is running (not paused)
3. Verify API key has correct permissions

### Issue: "Script doesn't run at startup"

**macOS:**
```bash
# Check if LaunchAgent is loaded
launchctl list | grep constructai

# View logs
tail -f /tmp/constructai-schema-error.log

# Reload if needed
launchctl unload ~/Library/LaunchAgents/com.constructai.schema-extraction.plist
launchctl load ~/Library/LaunchAgents/com.constructai.schema-extraction.plist
```

**Linux:**
```bash
# Check service status
systemctl --user status constructai-schema.service

# View logs
journalctl --user -u constructai-schema.service -f

# Restart service
systemctl --user restart constructai-schema.service
```

**Windows:**
```powershell
# Check task scheduler for errors
Get-ScheduledTask -TaskName "ConstructAI Schema Regeneration" | Get-ScheduledTaskInfo

# Run manually to test
powershell.exe -ExecutionPolicy Bypass -File "C:\Users\your-username\construct_ai\docs\schema\code\startup-schema-regeneration.ps1"
```

### Issue: "Permission denied" when running script

**Solution:**
```bash
# Ensure script is executable
chmod +x docs/schema/code/startup-schema-regeneration.js

# Run with correct Node.js version
which node
node --version

# If using nvm, ensure correct version is active
nvm use 18
```

### Issue: "Out of memory" or "Process killed"

**Solution:**
```bash
# Check available memory
free -h

# Reduce Node.js memory limit if needed
NODE_OPTIONS="--max-old-space-size=4096" node docs/schema/code/startup-schema-regeneration.js
```

## 📊 Monitoring & Maintenance

### Check Schema Updates

```bash
# View last regeneration report
cat docs/schema/reports/regeneration-report.json | jq .

# Check file timestamps
ls -lt docs/schema/reports/ | head -10

# View Master Guide
cat docs/schema/reports/0300_DATABASE_SCHEMA_MASTER_GUIDE.md | grep "Last Updated"
```

### Manual Trigger

If you need to regenerate schema manually at any time:

```bash
cd /path/to/construct_ai
node docs/schema/code/startup-schema-regeneration.js
```

### Clean Up Old Backups

```bash
# Find backups older than 7 days
find docs/schema/backup/ -name "*.sql" -mtime +7 -delete

# Or list them
ls -lh docs/schema/backup/
```

## 🤝 Team Collaboration Workflow

### For New Team Members

1. **Pull Latest Changes**
   ```bash
   git pull origin main
   ```

2. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Install & Test**
   ```bash
   npm install
   node docs/schema/code/startup-schema-regeneration.js
   ```

4. **Set Up Automatic Execution**
   - Follow platform-specific instructions above
   - Or use CI/CD pipeline (recommended)

### For Existing Team Members

1. **Pull Latest Schema Updates**
   ```bash
   git pull origin main
   ```

2. **Test the Script** (optional but recommended)
   ```bash
   node docs/schema/code/startup-schema-regeneration.js
   ```

3. **If Changes Were Made**
   ```bash
   git add docs/schema/reports/
   git commit -m "chore: update schema documentation - $(date +%Y-%m-%d)"
   git push origin main
   ```

## 🔒 Security Best Practices

### Never Commit Credentials

The `.env` file is automatically ignored by git (see `.gitignore`).

**✅ DO:**
- Add credentials to `.env` file
- Use environment variables
- Share credentials securely (e.g., team password manager)

**❌ DON'T:**
- Commit `.env` file to git
- Hardcode credentials in scripts
- Share credentials in chat/Slack

### Alternative: Use GitHub Secrets

For CI/CD pipeline, use GitHub Secrets:

1. Go to repository settings
2. Click **Secrets and variables** > **Actions**
3. Add secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 📞 Support

If you encounter issues:

1. **Check Logs**
   - macOS: `/tmp/constructai-schema*.log`
   - Linux: `journalctl --user -u constructai-schema.service`
   - Windows: Event Viewer > Applications and Services Logs

2. **Verify Setup**
   - Run script manually: `node docs/schema/code/startup-schema-regeneration.js`
   - Check environment: `node scripts/check-env.js` (create if needed)

3. **Contact Team**
   - Share error messages from logs
   - Include output from manual script run

## 🎉 Success Checklist

- [ ] Node.js 18+ installed
- [ ] `.env` file created with credentials
- [ ] Script runs successfully manually
- [ ] Files generated in `docs/schema/reports/`
- [ ] Changes committed and pushed
- [ ] Team notified
- [ ] Automatic execution configured (optional)
- [ ] Test restart completed

---

## 📚 Additional Resources

- **Schema Documentation**: `docs/schema/reports/0300_DATABASE_SCHEMA_MASTER_GUIDE.md`
- **API Documentation**: `docs/schema/reports/openapi-spec.json`
- **Supabase Docs**: https://supabase.com/docs
- **Node.js Docs**: https://nodejs.org/en/docs/

## 🔄 Update Schedule

The script is designed to be run:
- **On system startup** (recommended for active development)
- **Manually** when needed (e.g., after database migrations)
- **Via CI/CD** (recommended for production teams)

Choose the method that best fits your team's workflow!

---

**Last Updated**: 2026-01-27
**Version**: 2.0
**Maintainer**: ConstructAI Team