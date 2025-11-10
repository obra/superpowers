# Claude Desktop Pro: Skills ZIP Upload Guide

**Complete tutorial for uploading Superpowers skills in ZIP format**

---

## Table of Contents

1. [Overview](#overview)
2. [Skills vs Project Knowledge](#skills-vs-project-knowledge)
3. [ZIP File Structure Requirements](#zip-file-structure-requirements)
4. [Creating ZIP Files for Upload](#creating-zip-files-for-upload)
5. [Uploading Skills to Claude Desktop](#uploading-skills-to-claude-desktop)
6. [Verification and Testing](#verification-and-testing)
7. [Managing Multiple Skills](#managing-multiple-skills)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Claude Desktop Pro (and higher tiers) supports uploading **Skills** as ZIP files. This feature, announced in October 2025, allows you to extend Claude's capabilities with specialized knowledge and workflows.

**Key Benefits:**
- ✅ Cleaner organization than individual file uploads
- ✅ Easier to share and distribute skill packages
- ✅ Skills are validated and activated by Claude
- ✅ Private to your individual account
- ✅ Can include resources and scripts

**Requirements:**
- Claude Desktop Pro, Max, Team, or Enterprise subscription
- Code execution enabled (for skills with scripts)
- Skills in proper ZIP format

---

## Skills vs Project Knowledge

Understanding the difference is crucial:

### Project Knowledge (Traditional Approach)
- **What:** Upload individual files (markdown, code, docs) to a project
- **How:** Project → Add content → Upload files
- **Context:** Files available as reference material
- **Use case:** Background information, documentation, code samples
- **Limitation:** Manual invocation required

### Skills (ZIP Upload - Recommended)
- **What:** Packaged capabilities uploaded as ZIP files
- **How:** Settings → Capabilities → Upload skill
- **Context:** Active extensions to Claude's functionality
- **Use case:** Workflows, specialized knowledge, repeatable processes
- **Advantage:** Claude can invoke skills more naturally

**For Superpowers, the Skills approach is recommended** because workflows like TDD, systematic debugging, and brainstorming are active processes, not just reference material.

---

## ZIP File Structure Requirements

Each skill must be packaged as a ZIP file with this structure:

```
skill-name.zip
├── SKILL.md              # Main skill definition (REQUIRED)
├── resources/            # Optional: Additional markdown files
│   ├── examples.md
│   └── references.md
└── scripts/              # Optional: Helper scripts
    └── helper.sh
```

### SKILL.md Format

The main `SKILL.md` file must include frontmatter:

```markdown
---
name: skill-name
description: Use when [triggering conditions] - [what it does]
---

# Skill Name

## Overview
[Skill content here]
```

### Example: Test-Driven Development Skill

```
test-driven-development.zip
└── SKILL.md              # TDD workflow and checklist
```

### Example: Systematic Debugging Skill with Resources

```
systematic-debugging.zip
├── SKILL.md              # Main debugging workflow
├── resources/
│   └── examples.md       # Example debugging scenarios
└── scripts/
    └── find-polluter.sh  # Test pollution detection script
```

---

## Creating ZIP Files for Upload

### Method 1: Individual Skills (Recommended for Starting)

Create a ZIP file for each core skill:

```bash
cd /path/to/superpowers-desktop/pro-setup/skills

# Create test-driven-development skill
mkdir -p temp/test-driven-development
cp core/test-driven-development.md temp/test-driven-development/SKILL.md
cd temp/test-driven-development
zip -r ../../test-driven-development.zip .
cd ../..
rm -rf temp

# Create systematic-debugging skill
mkdir -p temp/systematic-debugging
cp core/systematic-debugging.md temp/systematic-debugging/SKILL.md
cd temp/systematic-debugging
zip -r ../../systematic-debugging.zip .
cd ../..
rm -rf temp

# Create brainstorming skill
mkdir -p temp/brainstorming
cp core/brainstorming.md temp/brainstorming/SKILL.md
cd temp/brainstorming
zip -r ../../brainstorming.zip .
cd ../..
rm -rf temp

# Create using-superpowers skill
mkdir -p temp/using-superpowers
cp core/using-superpowers.md temp/using-superpowers/SKILL.md
cd temp/using-superpowers
zip -r ../../using-superpowers.zip .
cd ../..
rm -rf temp
```

### Method 2: Automated Script

Use this script to create all skill ZIPs:

```bash
#!/bin/bash
# create-skill-zips.sh

SKILLS_DIR="pro-setup/skills"
OUTPUT_DIR="pro-setup/skill-zips"
TEMP_DIR="temp"

mkdir -p "$OUTPUT_DIR"

# Function to create a skill ZIP
create_skill_zip() {
    local skill_file=$1
    local skill_name=$(basename "$skill_file" .md)

    echo "Creating $skill_name.zip..."

    # Create temp directory structure
    mkdir -p "$TEMP_DIR/$skill_name"

    # Copy main skill file as SKILL.md
    cp "$skill_file" "$TEMP_DIR/$skill_name/SKILL.md"

    # Check for associated resources (scripts, examples)
    local skill_dir=$(dirname "$skill_file")
    if [ -f "$skill_dir/find-polluter.sh" ]; then
        mkdir -p "$TEMP_DIR/$skill_name/scripts"
        cp "$skill_dir/find-polluter.sh" "$TEMP_DIR/$skill_name/scripts/"
    fi

    # Create ZIP
    (cd "$TEMP_DIR/$skill_name" && zip -r "../../$OUTPUT_DIR/$skill_name.zip" .)

    echo "✓ Created $OUTPUT_DIR/$skill_name.zip"
}

# Create ZIPs for all skills
echo "Creating skill ZIPs from $SKILLS_DIR..."

# Core skills
for skill in "$SKILLS_DIR/core"/*.md; do
    create_skill_zip "$skill"
done

# Testing skills
for skill in "$SKILLS_DIR/testing"/*.md; do
    create_skill_zip "$skill"
done

# Debugging skills
for skill in "$SKILLS_DIR/debugging"/*.md; do
    [ -f "$skill" ] && create_skill_zip "$skill"
done

# Collaboration skills
for skill in "$SKILLS_DIR/collaboration"/*.md; do
    create_skill_zip "$skill"
done

# Meta skills
for skill in "$SKILLS_DIR/meta"/*.md; do
    create_skill_zip "$skill"
done

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "✓ All skills packaged in $OUTPUT_DIR/"
ls -lh "$OUTPUT_DIR"
```

Save this as `create-skill-zips.sh`, make it executable, and run:

```bash
chmod +x create-skill-zips.sh
./create-skill-zips.sh
```

### Method 3: Quick Command Line

For a single skill:

```bash
# Navigate to skills directory
cd superpowers-desktop/pro-setup/skills

# Create a skill ZIP (test-driven-development example)
mkdir -p temp && \
  cp core/test-driven-development.md temp/SKILL.md && \
  cd temp && \
  zip ../test-driven-development.zip SKILL.md && \
  cd .. && \
  rm -rf temp

# Result: test-driven-development.zip ready for upload
```

---

## Uploading Skills to Claude Desktop

### Step-by-Step Process

#### 1. Open Claude Desktop Settings

1. Launch Claude Desktop
2. Click on your profile (bottom left)
3. Select **"Settings"**
4. Navigate to **"Capabilities"** section

#### 2. Upload Your First Skill

1. In the Capabilities section, look for **"Upload skill"** button
2. Click **"Upload skill"**
3. Browse to your ZIP file (e.g., `test-driven-development.zip`)
4. Select and upload
5. Wait for validation (Claude validates the ZIP structure)
6. Confirmation: "Skill activated successfully"

#### 3. Verify Skill Installation

After upload, you should see:
- ✅ Skill name listed under "My Skills"
- ✅ Description visible
- ✅ Status: "Active"

#### 4. Upload Additional Skills

Repeat the process for other skills:

**Recommended upload order:**
1. ✅ `test-driven-development.zip` (Core - mandatory for all coding)
2. ✅ `systematic-debugging.zip` (Core - mandatory for bugs)
3. ✅ `brainstorming.zip` (Core - for feature design)
4. ✅ `using-superpowers.zip` (Meta - understanding the system)
5. Then add specialized skills as needed

---

## Verification and Testing

### Testing Skill Activation

After uploading skills, test them in a new conversation:

#### Test 1: TDD Skill Activation

```
You: "I need to implement user email validation"

Expected: Claude should reference test-driven-development skill
and follow RED-GREEN-REFACTOR workflow

Claude: "I'm using test-driven-development to implement this.
         Let me write a failing test first..."
```

#### Test 2: Debugging Skill Activation

```
You: "Tests are failing with TypeError in login.js"

Expected: Claude should use systematic-debugging skill
and follow the 4-phase process

Claude: "I'm using systematic-debugging to investigate this.

         Phase 1: Root Cause Investigation
         Let me examine the error message carefully..."
```

#### Test 3: Brainstorming Skill Activation

```
You: "I want to add a shopping cart feature"

Expected: Claude should use brainstorming skill
and ask Socratic questions

Claude: "I'm using brainstorming to design this feature.

         Let me ask some questions to understand:
         1. What should happen when users add items?
         2. Should the cart persist between sessions?
         ..."
```

### Verifying Skill Content

To check if Claude has access to skill details:

```
You: "What's the RED-GREEN-REFACTOR cycle in test-driven-development?"

Expected: Claude should reference the uploaded skill
and explain the process accurately
```

---

## Managing Multiple Skills

### Recommended Skill Packages

#### Package 1: Core Essentials (Start Here)
- `test-driven-development.zip`
- `systematic-debugging.zip`
- `brainstorming.zip`
- `using-superpowers.zip`

**Total:** 4 skills - covers 80% of daily work

#### Package 2: Testing & Quality
- Core Essentials +
- `testing-skills-with-subagents.zip`
- `testing-anti-patterns.zip`
- `verification-before-completion.zip`

**Total:** 7 skills - for quality-focused work

#### Package 3: Team Collaboration
- Core Essentials +
- `requesting-code-review.zip`
- `receiving-code-review.zip`
- `finishing-a-development-branch.zip`
- `writing-plans.zip`

**Total:** 8 skills - for team environments

#### Package 4: Full Superpowers
- All 20+ skills uploaded

**Consideration:** More skills = more context. Start small, add as needed.

### Updating Skills

When skills are updated:

1. **Download new version** from superpowers repository
2. **Create new ZIP** with updated content
3. **Re-upload** to Claude Desktop (replaces old version)
4. **Test** to confirm changes

### Removing Skills

To remove a skill:

1. Go to Settings → Capabilities
2. Find the skill in "My Skills"
3. Click the "..." menu
4. Select "Remove skill"

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Invalid ZIP structure"

**Cause:** ZIP file doesn't contain SKILL.md in the root

**Solution:**
```bash
# Wrong: skill.zip contains folder/SKILL.md
# Right: skill.zip contains SKILL.md directly

# Fix it:
cd skill-name/
zip -r ../skill-name.zip SKILL.md resources/ scripts/
```

#### Issue: "Skill validation failed"

**Cause:** Missing or malformed frontmatter in SKILL.md

**Solution:** Ensure SKILL.md starts with:
```markdown
---
name: skill-name
description: Clear description here
---
```

#### Issue: "Skill not activating in conversations"

**Cause:** Skill uploaded but Claude isn't invoking it automatically

**Solution:**
- Explicitly invoke: "Use test-driven-development skill for this"
- Add custom instructions reminding Claude to check skills
- Provide clear context that matches skill's triggering conditions

#### Issue: "Code execution required"

**Cause:** Skill contains scripts but code execution is disabled

**Solution:**
1. Go to Settings → Capabilities
2. Enable "Code execution"
3. Re-upload skill if needed

#### Issue: "Too many skills, context issues"

**Cause:** Uploaded too many skills, competing for context window

**Solution:**
- Remove rarely-used skills
- Keep only 4-8 most-used skills active
- Use Projects for additional context
- Upload specialized skills only when needed

#### Issue: "Skill works in one project, not another"

**Cause:** Skills are account-level, but Projects affect context

**Solution:**
- Skills are global to your account
- If not working, explicitly invoke the skill
- Check Project custom instructions don't conflict

---

## Best Practices

### 1. Start Small, Grow Gradually

**Week 1:** Upload and master the 4 core skills
**Week 2-3:** Add testing and debugging skills
**Week 4+:** Add collaboration and specialized skills

### 2. Explicit Invocation

While skills can activate automatically, explicit invocation is more reliable:

```
❌ Vague: "Fix this bug"
✓ Clear: "Use systematic-debugging skill to fix this bug"

❌ Vague: "Add this feature"
✓ Clear: "Use brainstorming skill to design, then test-driven-development to implement"
```

### 3. Combine Skills for Workflows

Many tasks need multiple skills:

**Implementing a Feature:**
1. `brainstorming` → Design the feature
2. `test-driven-development` → Implement with tests
3. `verification-before-completion` → Verify quality
4. `requesting-code-review` → Prepare for review

**Fixing a Bug:**
1. `systematic-debugging` → Find root cause
2. `test-driven-development` → Write failing test, fix, verify
3. `verification-before-completion` → Ensure no regressions

### 4. Keep Skills Updated

- Watch superpowers repository for updates
- Re-create ZIPs when skills improve
- Re-upload to Claude Desktop

### 5. Track Your Checklists

Skills contain checklists. Since TodoWrite isn't available in Desktop, track manually:

```markdown
**TDD Checklist for login validation:**
- [x] Write failing test for valid email
- [x] Run test - FAILS as expected
- [x] Implement validation (minimal)
- [x] Run test - PASSES
- [ ] Write failing test for invalid email
- [ ] ...
```

Update as you progress.

---

## Comparison: ZIP Upload vs Project Knowledge Upload

| Aspect | ZIP Upload (Skills) | Project Knowledge Upload |
|--------|---------------------|--------------------------|
| **How** | Settings → Capabilities → Upload skill | Project → Add content → Upload files |
| **Format** | ZIP with SKILL.md | Individual .md files |
| **Scope** | Account-wide | Project-specific |
| **Activation** | More automatic | Requires explicit reference |
| **Organization** | Validated skill packages | Loose files |
| **Best for** | Workflows, processes, methods | Documentation, code, references |
| **Scripts** | Supported in ZIP | Can upload but limited |
| **Updates** | Re-upload ZIP | Re-upload files |

**Recommendation:** Use Skills ZIP upload for Superpowers workflows.

---

## Quick Reference: Commands

### Create Single Skill ZIP
```bash
cd superpowers-desktop/pro-setup/skills
mkdir -p temp && \
  cp core/test-driven-development.md temp/SKILL.md && \
  cd temp && zip ../tdd.zip SKILL.md && cd .. && rm -rf temp
```

### Create All Skill ZIPs
```bash
./create-skill-zips.sh
# (Use the script provided in Method 2 above)
```

### Verify ZIP Structure
```bash
unzip -l skill-name.zip
# Should show: SKILL.md at root
```

### Extract and Inspect
```bash
unzip skill-name.zip -d inspect/
cat inspect/SKILL.md | head -n 20
```

---

## Next Steps

### Immediate Actions

1. ✅ **Create ZIPs** for core 4 skills using instructions above
2. ✅ **Upload** to Claude Desktop Settings → Capabilities
3. ✅ **Test** each skill in a new conversation
4. ✅ **Verify** activation and behavior

### Going Further

1. **Add specialized skills** as you need them
2. **Customize** skills for your workflow (fork, modify, re-zip)
3. **Share** useful custom skills with team
4. **Contribute** improvements back to superpowers repository

---

## Additional Resources

- **Main Repository:** [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Claude Code Plugin:** Full experience with auto-activation
- **Superpowers Desktop:** Alternative project knowledge approach
- **Issue Tracker:** Report bugs and request features

---

## Summary

**Skills ZIP upload is the recommended approach for Claude Desktop Pro users** because:

✅ Cleaner than uploading 20+ individual files
✅ Skills are properly validated by Claude
✅ Better activation and invocation
✅ Easier to share and distribute
✅ Matches the intended Skills architecture

**Follow this guide to:**
1. Create properly formatted ZIP files for each skill
2. Upload to Settings → Capabilities
3. Test and verify activation
4. Use skills explicitly in your workflows

**Start with the 4 core skills** and expand from there. Happy coding with Superpowers!

---

**Last Updated:** November 2025
**Superpowers Version:** 3.4.1
**Claude Desktop:** Pro, Max, Team, Enterprise
