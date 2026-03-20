# 🛡️ .ENV FILE PROTECTION & SETUP SYSTEM

## 🚨 PROTECTING YOUR .ENV FILE

Your `.env` file contains sensitive API keys that SHOULD NEVER be committed to git. Here's the comprehensive protection system:

---

## 📁 FILE STRUCTURE

```
├── .env                     # Your local environment (WORKS, contains real keys)
├── .env.example            # Template (COMMITTED to git)
├── .env.local              # Local overrides (optional)
├── .env.production        # Production keys (optional)
├── protect_env.sh          # Protection script
└── .gitignore             # Prevents .env files from being committed
```

---

## 🛠️ SETUP INSTRUCTIONS

### 1. Initial Setup (After Clone)
```bash
# Copy template to create your .env file
cp .env.example .env

# Edit .env with your REAL Supabase keys
# Any key starting with "your-" MUST be replaced!
```

### 2. Protect Your Environment
```bash
# Run after EVERY change to .env
./protect_env.sh
```

This script will:
- ✅ Create timestamped backup
- ✅ Check for placeholder keys
- ✅ Set proper permissions
- ✅ Clean up old backups (>20)

### 3. Git Protection Status
```bash
# Verify git ignores .env but commits template
git status --ignored | grep -E "\.env"
# Should show: ignored: .env
# Should NOT show: .env.example (this is committed)
```

---

## ⚠️ WARNING SIGNS

**Red Flags Your .env Is Broken:**
- ❌ React console shows: `Invalid API key`
- ❌ Server logs show: `JWSError (JSONDecodeError "Not valid base64url")`
- ❌ Supabase queries return: `{"code":"PGRST301","message":"JWSError"}`
- ❌ Prompt Management page won't load sectors

**Fix:** Replace `your-` placeholders with real keys from Supabase Dashboard!

---

## 🔑 REQUIRED KEYS FROM SUPABASE

Visit: https://supabase.com/dashboard → Settings → API Keys

```env
# Required - Get these from your Supabase Dashboard
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Server-side
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...       # Client-side
```

**⚠️ NEVER commit these real keys!**

---

## 🛡️ MULTI-DEVICE PROTECTION

### ✅ PROS:
- **Prevention**: Pre-commit hooks detect placeholder keys
- **Backup**: Automatic timestamped backups
- **Recovery**: Easy restore from .env.backup.DATETIME
- **Team Safe**: Template explains what goes where

### ❌ LIMITATIONS:
- **Per Device**: Each developer needs their own .env
- **Manual Process**: Requires running ./protect_env.sh after changes
- **Not Foolproof**: Someone could still accidentally commit .env

### 🔐 ENTERPRISE OPTIONS:
For companies with multiple developers:
1. **Environment Variables**: Set secrets in CI/CD pipelines
2. **Vault Services**: HashiCorp Vault, AWS Secrets Manager, Azure Key Vault
3. **Environment Servers**: Separate server for keys (Docker secrets)

---

## 🚀 WORKFLOW PROTECTION

### Daily Workflow:
```bash
# Morning: Check protection status
./protect_env.sh

# When updating keys:
# 1. Edit .env
# 2. Run: ./protect_env.sh
# 3. Test: npm run dev (verify no errors)
# 4. Commit: git commit -m "Update API keys"
```

### Emergency Recovery:
```bash
# If you accidentally overwrite .env:
ls -la .env.backup.*
# Copy most recent backup
cp .env.backup.20250914_120000 .env
./protect_env.sh
```

---

## 📋 CHECKLIST

After setup:
- [ ] `.env` contains real Supabase keys (no `your-` prefixes)
- [ ] `git status` doesn't show `.env`
- [ ] `ls .env.backup.*` shows recent backups
- [ ] `./protect_env.sh` runs without warnings
- [ ] Both servers restart without "Invalid API key" errors

---

## 🤝 TEAM COLLABORATION

For multi-developer teams:
```bash
# Share ONLY the template
git add .env.example

# Document setup process
echo "# Setup: cp .env.example .env && ./protect_env.sh"
```

Each team member:
1. Clones repository
2. Sets up their own `.env` (not committed)
3. Runs `protect_env.sh`
4. Gets their own keys from shared, controlled source

---

## 🆘 GETTING HELP

If you get "Invalid API key" errors:

1. **Check .env**: Verify no `your-` placeholders
2. **Restart server**: `./build_and_serve.sh`
3. **Test keys**: Use curl test in this doc
4. **Check Supabase**: Verify project is active
5. **Recover**: Restore from .env.backup.TIMESTAMP

⚡ **Remember**: The `.env` file contains production secrets - protect it like you protect your wallet! 🛡️
