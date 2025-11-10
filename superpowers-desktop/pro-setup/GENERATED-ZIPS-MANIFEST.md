# Generated Skills ZIP Manifest

**Generated on:** November 10, 2025
**Total skills:** 20
**Total size:** 69KB
**Location:** `skill-zips/`

---

## Core Skills (4)

Essential skills for daily development work.

| Skill | Size | Description |
|-------|------|-------------|
| **test-driven-development.zip** | 4.3K | RED-GREEN-REFACTOR workflow - write test first |
| **systematic-debugging.zip** | 4.6K | 4-phase root cause investigation process |
| **brainstorming.zip** | 1.5K | Socratic design refinement before coding |
| **using-superpowers.zip** | 2.3K | Understanding and using the skills system |

**Recommended upload order:** Start with these 4 skills.

---

## Testing Skills (2)

Quality assurance and testing practices.

| Skill | Size | Description |
|-------|------|-------------|
| **testing-skills-with-subagents.zip** | 5.2K | Validating skill effectiveness with agents |
| **testing-anti-patterns.zip** | 3.5K | Common testing mistakes to avoid |
| **condition-based-waiting.zip** | 2.0K | Async operation patterns and timing |

---

## Debugging Skills (3)

Advanced debugging and verification workflows.

| Skill | Size | Contents | Description |
|-------|------|----------|-------------|
| **defense-in-depth.zip** | 2.9K | SKILL.md + scripts/find-polluter.sh | Multiple validation layers |
| **root-cause-tracing.zip** | 3.6K | SKILL.md + scripts/find-polluter.sh | Deep issue investigation |
| **verification-before-completion.zip** | 3.3K | SKILL.md + scripts/find-polluter.sh | Pre-completion quality checks |

**Note:** These skills include the `find-polluter.sh` script for test pollution detection.

---

## Collaboration Skills (8)

Team workflows and code review processes.

| Skill | Size | Description |
|-------|------|-------------|
| **writing-plans.zip** | 1.9K | Structured planning for complex tasks |
| **executing-plans.zip** | 1.4K | Systematic plan implementation |
| **requesting-code-review.zip** | 1.7K | Pre-review preparation checklist |
| **receiving-code-review.zip** | 2.9K | Responding to review feedback |
| **finishing-a-development-branch.zip** | 2.1K | Branch completion workflow |
| **using-git-worktrees.zip** | 2.5K | Parallel development with worktrees |
| **dispatching-parallel-agents.zip** | 2.7K | Task distribution strategies |
| **subagent-driven-development.zip** | 2.4K | Delegated implementation patterns |

---

## Meta Skills (3)

Skills for managing and creating skills.

| Skill | Size | Description |
|-------|------|-------------|
| **writing-skills.zip** | 8.3K | Creating new effective skills |
| **sharing-skills.zip** | 2.2K | Contributing skills via pull requests |
| **testing-skills-with-subagents.zip** | 5.2K | Validating skill effectiveness |

---

## Upload Instructions

### Quick Start (Core 4)

Upload these first for immediate productivity:

```
1. test-driven-development.zip
2. systematic-debugging.zip
3. brainstorming.zip
4. using-superpowers.zip
```

### Full Setup (All 20)

Upload all skills for complete Superpowers experience.

### Upload Process

1. **Open Claude Desktop**
2. **Go to Settings → Capabilities**
3. **Click "Upload skill"** for each ZIP
4. **Verify** skill appears in "My Skills" list
5. **Test** in a new conversation

---

## Verification

### Check ZIP Structure

```bash
unzip -l skill-zips/test-driven-development.zip
# Should show: SKILL.md at root
```

### Verify All Files Present

```bash
ls -1 skill-zips/ | wc -l
# Should output: 20
```

### Check Total Size

```bash
du -sh skill-zips/
# Should output: 69K
```

---

## Regenerating ZIPs

If you modify skill source files, regenerate ZIPs:

```bash
cd superpowers-desktop/pro-setup
rm -rf skill-zips/
./create-skill-zips.sh
```

---

## Recommended Packages

### Package 1: Essentials (Start Here)
- test-driven-development.zip
- systematic-debugging.zip
- brainstorming.zip
- using-superpowers.zip

**Size:** 12.7K | **Skills:** 4

### Package 2: Development Pro
- All Core (4)
- All Testing (3)
- verification-before-completion.zip

**Size:** 23.4K | **Skills:** 8

### Package 3: Team Collaboration
- All Core (4)
- requesting-code-review.zip
- receiving-code-review.zip
- finishing-a-development-branch.zip
- writing-plans.zip

**Size:** 19.9K | **Skills:** 8

### Package 4: Full Superpowers
- All 20 skills

**Size:** 69K | **Skills:** 20

---

## Troubleshooting

### "Invalid ZIP structure"

**Cause:** ZIP doesn't have SKILL.md at root

**Fix:** Re-run `./create-skill-zips.sh`

### "File not found"

**Cause:** Not in correct directory

**Fix:**
```bash
cd superpowers-desktop/pro-setup
./create-skill-zips.sh
```

### "Permission denied"

**Fix:**
```bash
chmod +x create-skill-zips.sh
./create-skill-zips.sh
```

---

## File Checksums (for verification)

To verify integrity after download:

```bash
cd skill-zips
shasum -a 256 *.zip > checksums.txt
cat checksums.txt
```

---

## Next Steps

1. ✅ ZIPs generated successfully
2. 📤 Upload to Claude Desktop (Settings → Capabilities)
3. ✅ Test core skills in conversation
4. 📖 Read full guide: [SKILLS-ZIP-UPLOAD-GUIDE.md](SKILLS-ZIP-UPLOAD-GUIDE.md)

---

**Generated with:** `create-skill-zips.sh`
**Documentation:** See `SKILLS-ZIP-UPLOAD-GUIDE.md` for complete tutorial
**Source:** superpowers-desktop/pro-setup/skills/
