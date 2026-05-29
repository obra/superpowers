# Rename Commands to Superpowers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename all `sp-` prefixed commands to use the full name `superpowers-` in Junie integration.

**Architecture:** Rename command files in `hooks/junie/commands/`, update documentation, skill references, installation/uninstallation scripts, and tests to reflect the new naming convention. Update `uninstall-junie.sh` to handle both old and new names for clean uninstalls.

**Tech Stack:** Bash, Markdown

---

### Task 1: Rename Command Files

**Files:**
- Modify: `hooks/junie/commands/sp-brainstorm.md` -> `hooks/junie/commands/superpowers-brainstorm.md`
- Modify: `hooks/junie/commands/sp-debug.md` -> `hooks/junie/commands/superpowers-debug.md`
- Modify: `hooks/junie/commands/sp-plan.md` -> `hooks/junie/commands/superpowers-plan.md`
- Modify: `hooks/junie/commands/sp-review.md` -> `hooks/junie/commands/superpowers-review.md`
- Modify: `hooks/junie/commands/sp-tdd.md` -> `hooks/junie/commands/superpowers-tdd.md`
- Modify: `hooks/junie/commands/sp.md` -> `hooks/junie/commands/superpowers.md`

- [ ] **Step 1: Rename command files**

Run:
```bash
mv hooks/junie/commands/sp-brainstorm.md hooks/junie/commands/superpowers-brainstorm.md
mv hooks/junie/commands/sp-debug.md hooks/junie/commands/superpowers-debug.md
mv hooks/junie/commands/sp-plan.md hooks/junie/commands/superpowers-plan.md
mv hooks/junie/commands/sp-review.md hooks/junie/commands/superpowers-review.md
mv hooks/junie/commands/sp-tdd.md hooks/junie/commands/superpowers-tdd.md
mv hooks/junie/commands/sp.md hooks/junie/commands/superpowers.md
```

- [ ] **Step 2: Commit**

```bash
git add hooks/junie/commands/*.md
git commit -m "refactor: rename Junie commands to use full superpowers name"
```

### Task 2: Update Documentation and Skill References

**Files:**
- Modify: `docs/README.junie.md`
- Modify: `skills/using-superpowers/references/junie-tools.md`

- [ ] **Step 1: Update docs/README.junie.md**

Update the commands table:
```markdown
| Command | Skill triggered |
|---------|-----------------|
| `/superpowers-brainstorm` | `superpowers:brainstorming` |
| `/superpowers-plan` | `superpowers:writing-plans` |
| `/superpowers-tdd` | `superpowers:test-driven-development` |
| `/superpowers-debug` | `superpowers:systematic-debugging` |
| `/superpowers-review` | `superpowers:requesting-code-review` |
| `/superpowers skill=<name>` | Invoke any skill by name (e.g. `/superpowers skill=writing-skills`) |
```

- [ ] **Step 2: Update skills/using-superpowers/references/junie-tools.md**

Update the slash commands list:
```markdown
Superpowers provides several slash commands as shortcuts for common workflows:

- `/superpowers-brainstorm` -> Brainstorming
- `/superpowers-plan` -> Plan writing
- `/superpowers-tdd` -> Test-Driven Development
- `/superpowers-debug` -> Systematic Debugging
- `/superpowers-review` -> Requesting Code Review
- `/superpowers skill=<name>` -> Invoke any skill by name
```

- [ ] **Step 3: Commit**

```bash
git add docs/README.junie.md skills/using-superpowers/references/junie-tools.md
git commit -m "docs: update Junie command names in documentation and skill references"
```

### Task 3: Update Scripts and Tests

**Files:**
- Modify: `scripts/uninstall-junie.sh`
- Modify: `tests/junie/test-bootstrap.sh`

- [ ] **Step 1: Update scripts/uninstall-junie.sh to handle both old and new names**

Change the loop to include `superpowers-*.md` and `superpowers.md`:
```bash
    for cmd in "$JUNIE_COMMANDS_DIR"/sp-*.md "$JUNIE_COMMANDS_DIR"/sp.md "$JUNIE_COMMANDS_DIR"/superpowers-*.md "$JUNIE_COMMANDS_DIR"/superpowers.md; do
```

- [ ] **Step 2: Update tests/junie/test-bootstrap.sh**

Update the check for command symlinks:
```bash
if [ -d "$JUNIE_HOME/commands" ] && find "$JUNIE_HOME/commands" -maxdepth 1 -mindepth 1 -name "superpowers-*.md" | grep -q .; then
```

- [ ] **Step 3: Commit**

```bash
git add scripts/uninstall-junie.sh tests/junie/test-bootstrap.sh
git commit -m "build: update uninstall script and tests for new command names"
```

### Task 4: Final Verification

- [ ] **Step 1: Run installation test**

Run: `bash tests/junie/test-install.sh`
Expected: PASS (All commands symlinked)

- [ ] **Step 2: Run bootstrap/uninstall test**

Run: `bash tests/junie/test-bootstrap.sh`
Expected: PASS (Command symlinks removed)
