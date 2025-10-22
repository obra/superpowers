# Repository Consolidation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Systematically evaluate and consolidate features from 5 repositories into superpowers plugin

**Architecture:** Sequential repository processing with structured feature evaluation, user decision gates, and immediate commits

**Tech Stack:** Git, Bash, markdown documentation

---

## Setup Phase

### Task 1: Initialize Rejected Features Log

**Files:**
- Create: `docs/rejected-features.md`

**Step 1: Create rejected features document**

```bash
cat > docs/rejected-features.md <<'EOF'
# Rejected Features Log

This document tracks features evaluated but not integrated during repository consolidation.

Each rejection includes reasoning to prevent future reconsideration without new context.

---

EOF
```

**Step 2: Verify file created**

Run: `cat docs/rejected-features.md`
Expected: File contains header and instructions

**Step 3: Commit**

```bash
git add docs/rejected-features.md
git commit -m "docs: initialize rejected features log for consolidation"
```

---

### Task 2: Create Evaluation Helper Script

**Files:**
- Create: `scripts/inventory-repo.sh`

**Step 1: Write inventory script**

```bash
mkdir -p scripts
cat > scripts/inventory-repo.sh <<'EOF'
#!/bin/bash
# Inventory a repository and list all features

REPO_PATH="$1"
REPO_NAME=$(basename "$REPO_PATH")

echo "# Inventory: $REPO_NAME"
echo ""
echo "**Path:** $REPO_PATH"
echo ""

# Find skills
if [ -d "$REPO_PATH/skills" ]; then
    echo "## Skills"
    find "$REPO_PATH/skills" -name "SKILL.md" -o -name "*.md" | while read file; do
        rel_path=${file#$REPO_PATH/}
        echo "- $rel_path"
    done
    echo ""
fi

# Find commands
if [ -d "$REPO_PATH/commands" ]; then
    echo "## Commands"
    find "$REPO_PATH/commands" -name "*.md" | while read file; do
        rel_path=${file#$REPO_PATH/}
        echo "- $rel_path"
    done
    echo ""
fi

# Find hooks
if [ -d "$REPO_PATH/hooks" ]; then
    echo "## Hooks"
    find "$REPO_PATH/hooks" -name "*.md" -o -name "*.sh" | while read file; do
        rel_path=${file#$REPO_PATH/}
        echo "- $rel_path"
    done
    echo ""
fi

# Find agents
if [ -d "$REPO_PATH/agents" ]; then
    echo "## Agents"
    find "$REPO_PATH/agents" -name "*.md" -o -name "*.txt" | while read file; do
        rel_path=${file#$REPO_PATH/}
        echo "- $rel_path"
    done
    echo ""
fi

# Find scripts
if [ -d "$REPO_PATH/scripts" ]; then
    echo "## Scripts"
    find "$REPO_PATH/scripts" -type f | while read file; do
        rel_path=${file#$REPO_PATH/}
        echo "- $rel_path"
    done
    echo ""
fi

# Find other directories
echo "## Other Directories"
ls -d "$REPO_PATH"/*/ 2>/dev/null | while read dir; do
    dirname=$(basename "$dir")
    if [[ ! "$dirname" =~ ^(skills|commands|hooks|agents|scripts|\.git)$ ]]; then
        echo "- $dirname/"
    fi
done
EOF

chmod +x scripts/inventory-repo.sh
```

**Step 2: Test script on superpowers (current repo)**

Run: `./scripts/inventory-repo.sh /Users/jacob.hurlburt/repos/claude-settings`
Expected: Lists all skills, commands, hooks in current repo

**Step 3: Commit**

```bash
git add scripts/inventory-repo.sh
git commit -m "chore: add repository inventory script"
```

---

## Repository 1: superpowers-skills

### Task 3: Inventory superpowers-skills

**Files:**
- Create: `docs/consolidation/01-superpowers-skills-inventory.md`

**Step 1: Run inventory**

```bash
mkdir -p docs/consolidation
./scripts/inventory-repo.sh /Users/jacob.hurlburt/repos/claude/superpowers-skills > docs/consolidation/01-superpowers-skills-inventory.md
```

**Step 2: Review inventory**

Run: `cat docs/consolidation/01-superpowers-skills-inventory.md`
Expected: Complete list of all features in superpowers-skills

**Step 3: Commit**

```bash
git add docs/consolidation/01-superpowers-skills-inventory.md
git commit -m "docs: inventory superpowers-skills repository"
```

---

### Task 4: Evaluate Feature 1 from superpowers-skills

**Context:** This task repeats for each feature. The actual feature depends on inventory results.

**Step 1: Read feature file**

Run: `cat /Users/jacob.hurlburt/repos/claude/superpowers-skills/[FEATURE_PATH]`
Expected: Feature content displayed

**Step 2: Check if superpowers has equivalent**

Run: `find skills commands hooks -name "*.md" | xargs grep -l "[FEATURE_CONCEPT]"`
Expected: Either matching files or no results

**Step 3: Check dependencies (outbound)**

Run: `grep -r "superpowers:[FEATURE_NAME]\|Skill.*[FEATURE_NAME]" /Users/jacob.hurlburt/repos/claude/superpowers-skills/[FEATURE_PATH]`
Expected: List of skill/command references

**Step 4: Check dependencies (inbound)**

Run: `grep -r "[FEATURE_NAME]" skills/ commands/ hooks/ 2>/dev/null || echo "No inbound references"`
Expected: List of files referencing this feature

**Step 5: Present analysis to user**

Format:
```
**Feature Name**: [name]
**Source**: superpowers-skills/[path]
**Type**: [skill/command/hook/script]

**What It Does**:
[2-3 sentence summary]

**Gap Analysis**:
- Superpowers has equivalent? [Yes/No]
- Comparison: [if yes]
- Gap filled: [if no]

**Quality Assessment**:
- Documentation: [clear/minimal/missing]
- Code: [clean/complex/messy]
- Instructions: [tight/verbose/ambiguous]

**Dependencies**:
- Outbound: [list or "none"]
- Inbound: [list or "none"]
- Impact: [what breaks if modified]

**Integration Path**:
- Convert to: [skill/command/hook]
- Effort: [low/medium/high]
- Required changes: [bullet list]

**Recommendation**: [KEEP/REJECT]
**Justification**: [1-2 sentences]
```

**Step 6: Await user decision**

User will respond: KEEP, REJECT, or REQUEST_MORE_ANALYSIS

**Step 7a: If KEEP - Integrate feature**

```bash
# Copy feature to appropriate location
cp /Users/jacob.hurlburt/repos/claude/superpowers-skills/[FEATURE_PATH] [TARGET_PATH]

# Make any necessary adaptations
# [Specific to feature type]
```

**Step 7b: If REJECT - Document rejection**

```bash
cat >> docs/rejected-features.md <<EOF

## superpowers-skills

### Feature: [name]
- **Source**: superpowers-skills/[path]
- **Type**: [skill/command/etc]
- **Why Rejected**: [reason from analysis]
- **Evaluated**: $(date +%Y-%m-%d)

---
EOF
```

**Step 8: Commit**

If KEEP:
```bash
git add [TARGET_PATH]
git commit -m "feat: add [feature-name] from superpowers-skills

[one-line purpose]

Source: superpowers-skills/[path]"
```

If REJECT:
```bash
git add docs/rejected-features.md
git commit -m "docs: reject [feature-name] from superpowers-skills

[rejection reason]"
```

**Step 9: Mark task complete and proceed to next feature**

Repeat Task 4 for each feature in superpowers-skills inventory.

---

### Task 5: superpowers-skills Repository Complete

**Step 1: Count integration results**

```bash
ADDED=$(git log --oneline --grep="from superpowers-skills" | grep "feat:" | wc -l)
REJECTED=$(git log --oneline --grep="from superpowers-skills" | grep "docs: reject" | wc -l)
echo "superpowers-skills: $ADDED added, $REJECTED rejected"
```

**Step 2: Brief retrospective**

Document any patterns learned or process improvements for next repository.

---

## Repository 2: CCPlugins

### Task 6: Inventory CCPlugins

**Files:**
- Create: `docs/consolidation/02-CCPlugins-inventory.md`

**Step 1: Run inventory**

```bash
./scripts/inventory-repo.sh /Users/jacob.hurlburt/repos/claude/CCPlugins > docs/consolidation/02-CCPlugins-inventory.md
```

**Step 2: Review inventory**

Run: `cat docs/consolidation/02-CCPlugins-inventory.md`
Expected: Complete list of all features in CCPlugins

**Step 3: Commit**

```bash
git add docs/consolidation/02-CCPlugins-inventory.md
git commit -m "docs: inventory CCPlugins repository"
```

---

### Task 7: Evaluate Each Feature from CCPlugins

**Repeat Task 4 process** for each feature in CCPlugins, substituting "CCPlugins" for "superpowers-skills" in all commands and commit messages.

---

### Task 8: CCPlugins Repository Complete

**Repeat Task 5 process** for CCPlugins statistics and retrospective.

---

## Repository 3: claude-codex-settings

### Task 9: Inventory claude-codex-settings

**Files:**
- Create: `docs/consolidation/03-claude-codex-settings-inventory.md`

**Step 1: Run inventory**

```bash
./scripts/inventory-repo.sh /Users/jacob.hurlburt/repos/claude/claude-codex-settings > docs/consolidation/03-claude-codex-settings-inventory.md
```

**Step 2: Review inventory**

Run: `cat docs/consolidation/03-claude-codex-settings-inventory.md`
Expected: Complete list of all features in claude-codex-settings

**Step 3: Commit**

```bash
git add docs/consolidation/03-claude-codex-settings-inventory.md
git commit -m "docs: inventory claude-codex-settings repository"
```

---

### Task 10: Evaluate Each Feature from claude-codex-settings

**Repeat Task 4 process** for each feature in claude-codex-settings.

---

### Task 11: claude-codex-settings Repository Complete

**Repeat Task 5 process** for claude-codex-settings statistics and retrospective.

---

## Repository 4: superclaude

### Task 12: Inventory superclaude

**Files:**
- Create: `docs/consolidation/04-superclaude-inventory.md`

**Step 1: Run inventory**

```bash
./scripts/inventory-repo.sh /Users/jacob.hurlburt/repos/claude/superclaude > docs/consolidation/04-superclaude-inventory.md
```

**Step 2: Review inventory**

Run: `cat docs/consolidation/04-superclaude-inventory.md`
Expected: Complete list of all features in superclaude

**Step 3: Commit**

```bash
git add docs/consolidation/04-superclaude-inventory.md
git commit -m "docs: inventory superclaude repository"
```

---

### Task 13: Evaluate Each Feature from superclaude

**Repeat Task 4 process** for each feature in superclaude.

---

### Task 14: superclaude Repository Complete

**Repeat Task 5 process** for superclaude statistics and retrospective.

---

## Repository 5: SuperClaude_Framework

### Task 15: Inventory SuperClaude_Framework

**Files:**
- Create: `docs/consolidation/05-SuperClaude_Framework-inventory.md`

**Step 1: Run inventory**

```bash
./scripts/inventory-repo.sh /Users/jacob.hurlburt/repos/claude/SuperClaude_Framework > docs/consolidation/05-SuperClaude_Framework-inventory.md
```

**Step 2: Review inventory**

Run: `cat docs/consolidation/05-SuperClaude_Framework-inventory.md`
Expected: Complete list of all features in SuperClaude_Framework

**Step 3: Commit**

```bash
git add docs/consolidation/05-SuperClaude_Framework-inventory.md
git commit -m "docs: inventory SuperClaude_Framework repository"
```

---

### Task 16: Evaluate Each Feature from SuperClaude_Framework

**Repeat Task 4 process** for each feature in SuperClaude_Framework.

---

### Task 17: SuperClaude_Framework Repository Complete

**Repeat Task 5 process** for SuperClaude_Framework statistics and retrospective.

---

## Completion Phase

### Task 18: Create Consolidation Summary

**Files:**
- Create: `docs/consolidation-summary.md`

**Step 1: Generate statistics**

```bash
cat > docs/consolidation-summary.md <<'EOF'
# Repository Consolidation Summary

## Overview

Consolidated 5 repositories into superpowers plugin between [START_DATE] and [END_DATE].

## Results by Repository

### superpowers-skills
EOF

# Add statistics per repo
for repo in superpowers-skills CCPlugins claude-codex-settings superclaude SuperClaude_Framework; do
    ADDED=$(git log --oneline --grep="from $repo" | grep "feat:" | wc -l | tr -d ' ')
    REJECTED=$(git log --oneline --grep="from $repo" | grep "docs: reject" | wc -l | tr -d ' ')
    cat >> docs/consolidation-summary.md <<EOF
- **Added**: $ADDED features
- **Rejected**: $REJECTED features
- **Total Evaluated**: $((ADDED + REJECTED))

EOF
done

# Calculate totals
TOTAL_ADDED=$(git log --oneline --grep="from " | grep "feat:" | wc -l | tr -d ' ')
TOTAL_REJECTED=$(git log --oneline --grep="from " | grep "docs: reject" | wc -l | tr -d ' ')

cat >> docs/consolidation-summary.md <<EOF

## Total Results

- **Features Added**: $TOTAL_ADDED
- **Features Rejected**: $TOTAL_REJECTED
- **Total Evaluated**: $((TOTAL_ADDED + TOTAL_REJECTED))

## Key Improvements

[To be filled in during execution]

## Lessons Learned

[To be filled in during execution]
EOF
```

**Step 2: Review summary**

Run: `cat docs/consolidation-summary.md`
Expected: Complete statistics for all repositories

**Step 3: Commit**

```bash
git add docs/consolidation-summary.md
git commit -m "docs: add consolidation summary

Consolidated 5 repositories:
- superpowers-skills
- CCPlugins
- claude-codex-settings
- superclaude
- SuperClaude_Framework

Total: $TOTAL_ADDED features added, $TOTAL_REJECTED rejected"
```

---

### Task 19: Verify No Broken Dependencies

**Step 1: Check all skill references resolve**

```bash
# Extract all skill references
grep -r "superpowers:" skills/ commands/ hooks/ | \
    sed 's/.*superpowers:\([a-z-]*\).*/\1/' | \
    sort -u > /tmp/referenced_skills.txt

# Check each reference exists
while read skill; do
    if ! find skills/ -name "SKILL.md" | grep -q "$skill"; then
        echo "ERROR: Referenced skill not found: $skill"
    fi
done < /tmp/referenced_skills.txt
```

Expected: No ERROR messages, or list of broken references to fix

**Step 2: Fix any broken references**

If errors found, update referencing files to use correct skill names.

**Step 3: Commit fixes if needed**

```bash
git add [FILES_WITH_FIXES]
git commit -m "fix: update skill references after consolidation"
```

---

### Task 20: Update Main README (if needed)

**Files:**
- Modify: `README.md`

**Step 1: Review added capabilities**

Determine if any new capability categories were added that warrant README updates.

**Step 2: Update README if significant new capabilities**

Add new sections or bullet points for consolidated features that are user-facing.

**Step 3: Commit if modified**

```bash
git add README.md
git commit -m "docs: update README with consolidated capabilities"
```

---

## Execution Notes

**Decision Gates**: Task 4 (and its repetitions across repositories) requires user decisions. Present analysis, await response (KEEP/REJECT/MORE_ANALYSIS), then proceed.

**Parallelization**: Each repository is sequential, but feature evaluation within a repository could theoretically be parallelized. However, user decision gates make sequential processing more practical.

**Rollback**: Each decision creates a commit. If a decision needs reversal, use `git revert [commit-hash]`.

**Progress Tracking**: Use TodoWrite to track:
- Current repository being processed
- Current feature number within repository
- Features evaluated vs remaining

**Estimated Duration**: Depends on feature count, but expect:
- Setup: 15 minutes
- Per feature: 10-15 minutes (analysis + decision + integration/documentation)
- Per repository: Variable based on feature count
- Completion: 30 minutes

**Total estimate**: Several hours to multiple days depending on feature count across all 5 repositories.
