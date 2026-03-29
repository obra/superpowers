---
name: system-safety
description: Use before any modification to system-level state (environment variables, system configs, registry, global packages) - enforces snapshot-before-modify and snapshot-based restore protocols to prevent unrecoverable changes
---

# System Safety

## Overview

System-level modifications (environment variables, configs, registry) are **irreversible without a backup**. LLMs reconstructing state from memory will get it wrong.

**Core principle:** NEVER modify system state without a snapshot. NEVER restore from memory — restore from the snapshot.

**Announce at start:** "I'm using the system-safety skill to protect system state before making changes."

## The Iron Law

```
NO SYSTEM-LEVEL MODIFICATIONS WITHOUT SNAPSHOT FIRST
NO RESTORATION WITHOUT DIFFING AGAINST SNAPSHOT
```

If you haven't saved a snapshot file, you cannot modify system state.
If you don't have a snapshot file to diff against, you cannot claim restoration is complete.

## What Counts as System-Level

| Category | Examples | Why Dangerous |
|----------|----------|---------------|
| Environment variables | `setx`, `export` in `.bashrc`, `[Environment]::SetEnvironmentVariable` | Other apps depend on them; partial restore breaks toolchains |
| Shell configs | `.bashrc`, `.zshrc`, `.profile`, `.bash_profile` | Login behavior, PATH, aliases all affected |
| System configs | `/etc/*`, Windows Registry, `hosts` file | OS behavior changes, may require reboot to diagnose |
| Global packages | `npm uninstall -g`, `pip uninstall`, `apt remove` | Dependent tools silently break |
| Services | `systemctl disable`, `service stop`, `sc delete` | Background processes stop, may not restart on reboot |
| Network/firewall | `iptables`, `netsh`, `firewall-cmd` | Can lock out remote access |
| Scheduled tasks | `crontab -r`, `schtasks /delete` | Silent loss of automation |
| Git Destructive | `git clean -fdx`, `git reset --hard` | Destroys uncommitted code or untracked files permanently without git history |

## The Snapshot Protocol

### Before ANY System Modification

**MANDATORY — no exceptions:**

#### Step 1: Snapshot Current State

**Environment variables:**
```bash
# Linux/Mac
env | sort > /tmp/env_snapshot_$(date +%s).txt
echo "Snapshot saved: /tmp/env_snapshot_<timestamp>.txt"

# Windows (PowerShell)
[Environment]::GetEnvironmentVariables('User') | Export-Clixml -Path "$env:TEMP\env_user_snapshot_$(Get-Date -Format 'yyyyMMdd_HHmmss').xml"
[Environment]::GetEnvironmentVariables('Machine') | Export-Clixml -Path "$env:TEMP\env_machine_snapshot_$(Get-Date -Format 'yyyyMMdd_HHmmss').xml"
echo "Snapshots saved to $env:TEMP"

# Windows (cmd) — export registry for bullet-proof restore
reg export "HKCU\Environment" "%TEMP%\env_user_snapshot.reg" /y
reg export "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "%TEMP%\env_machine_snapshot.reg" /y
```

**Configuration files:**
```bash
cp <file> <file>.bak.$(date +%s)
echo "Backup saved: <file>.bak.<timestamp>"
```

**Global packages (record installed state):**
```bash
# Node
npm list -g --depth=0 > /tmp/npm_global_snapshot.txt

# Python
pip list > /tmp/pip_snapshot.txt

# System packages
dpkg --get-selections > /tmp/dpkg_snapshot.txt   # Debian/Ubuntu
brew list > /tmp/brew_snapshot.txt                # macOS
```

#### Step 2: Announce to User

```
⚠️ System modification required: [what will change]

Snapshot saved to: [path]
Rollback command: [exact command]

Shall I proceed? (yes/no)
```

**Wait for user confirmation before proceeding.** Do NOT auto-proceed on system-level changes.

#### Step 3: Make Minimal Change

- Change ONLY what is needed
- ONE variable/setting at a time
- Do NOT batch unrelated changes

#### Step 4: Verify Intended Effect

- Confirm the change took effect
- Confirm no unintended side effects

#### Step 5: Preserve Snapshot

- Do NOT delete the snapshot file
- Tell user where it is
- Keep until user explicitly confirms everything works

## The Restore Protocol

### When Restoring System State

**MANDATORY — no exceptions:**

#### Step 1: Locate Snapshot

```bash
# Find the snapshot file you created earlier
ls -la /tmp/env_snapshot_*.txt   # Linux/Mac
dir %TEMP%\env_*_snapshot*       # Windows
```

**If snapshot not found:** STOP. Tell user you cannot safely restore without the snapshot. Ask them to check the snapshot location or restore manually.

#### Step 2: Diff Against Snapshot

```bash
# Linux/Mac — compare current state to snapshot
env | sort > /tmp/env_current.txt
diff /tmp/env_snapshot_<timestamp>.txt /tmp/env_current.txt
```

```powershell
# Windows — compare current state to snapshot
$snapshot = Import-Clixml -Path "$env:TEMP\env_user_snapshot_<timestamp>.xml"
$current = [Environment]::GetEnvironmentVariables('User')

# Find differences
foreach ($key in ($snapshot.Keys + $current.Keys) | Sort-Object -Unique) {
    $s = $snapshot[$key]; $c = $current[$key]
    if ($s -ne $c) {
        Write-Host "DIFF: $key  snapshot=[$s]  current=[$c]"
    }
}
```

#### Step 3: Restore ONLY the Differences

- Restore ONLY variables/settings that differ from the snapshot
- Do NOT touch variables that match the snapshot
- Do NOT delete variables that exist in both snapshot and current state

**For Windows registry snapshots — safest method:**
```cmd
reg import "%TEMP%\env_user_snapshot.reg"
```
> ⚠️ **CRITICAL LIMITATION**: `reg import` restores deleted values and overwrites changed values, but it **DOES NOT DELETE** keys that were newly added *after* the snapshot. You MUST review the diff and manually delete any newly added environment variables (`reg delete ... /v VAR_NAME /f` or `[Environment]::SetEnvironmentVariable('VAR_NAME', $null, 'User')`) to achieve a perfect restore.

#### Step 4: Verify Restoration

```bash
# Diff again — should show zero differences
env | sort > /tmp/env_after_restore.txt
diff /tmp/env_snapshot_<timestamp>.txt /tmp/env_after_restore.txt
# Expected: no output (identical)
```

#### Step 5: Report to User

```
✅ Restoration complete.

Restored: [list of changed items]
Unchanged: [count] items matched snapshot
Verification: diff shows 0 differences from snapshot

Snapshot file preserved at: [path]
```

## Red Flags — STOP

If you catch yourself:
- "I remember the original value was..." → **STOP. Use the snapshot.**
- "I'll just set it back to what it was" → **STOP. Diff against snapshot first.**
- "I don't need a snapshot for this small change" → **STOP. ALL changes get snapshots.**
- "I'll clean up the env vars I added" → **STOP. Diff to find ALL changes, not just additions.**
- "I'll batch all the environment changes together" → **STOP. One at a time.**
- About to modify system state without announcing to user → **STOP. Announce first.**

## Common Mistakes

**Restoring from memory instead of snapshot**
- **Problem:** LLM "remembers" 10 variables but there were 15. Five get deleted.
- **Fix:** ALWAYS diff against snapshot file. Memory is unreliable.

**Snapshot scope too narrow**
- **Problem:** Snapshot only the variable being changed, miss side effects.
- **Fix:** Snapshot ALL environment variables, not just the target.

**Deleting snapshot too early**
- **Problem:** User finds issue hours later, snapshot already gone.
- **Fix:** NEVER delete snapshot. Let user decide when to clean up.

**Batch modifications**
- **Problem:** Change 5 things at once, one breaks, can't identify which.
- **Fix:** One change at a time, verify each.

**Skipping verification after restore**
- **Problem:** Restore command ran but didn't actually work (permissions, syntax).
- **Fix:** ALWAYS diff after restore to confirm zero differences.

## Quick Reference

| Phase | Action | Evidence Required |
|-------|--------|-------------------|
| Before modify | Save snapshot to file | File path printed |
| Before modify | Announce to user | Change + rollback command shown |
| During modify | One change at a time | Each change verified |
| Before restore | Locate snapshot | File exists and is readable |
| During restore | Diff current vs snapshot | Diff output reviewed |
| During restore | Restore only differences | Changes listed |
| After restore | Diff again | Zero differences confirmed |

## Integration

**Referenced by:**
- **verification-before-completion** — System restore claims require snapshot diff evidence
- **defense-in-depth** — Layer 5: System State Guards
- **writing-plans** — System-level tasks include backup/rollback commands
- **subagent-driven-development** — Subagents must follow this skill for system modifications
