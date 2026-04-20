# Lifecycle Extensions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lifecycle extension system so users can hook custom skills into superpowers workflow events via a manifest file, without modifying core skills.

**Architecture:** The session-start bash hook parses `~/.superpowers/extensions.yaml` (personal) and `.superpowers/extensions.yaml` (project), merges them, and injects the resolved registry into session context. Core skills check the registry at defined lifecycle event points and invoke registered extensions via the Skill tool. Extension skills are standard skills with no special metadata.

**Tech Stack:** Bash (session-start hook), Markdown (skill files)

---

### Task 1: Extensions manifest parser in session-start hook

**Files:**
- Modify: `hooks/session-start:1-57`

This task adds a bash function that reads and merges extensions manifest files, then injects the result into the session context alongside the existing `using-superpowers` content.

- [ ] **Step 1: Write the `parse_extensions_yaml` function**

Add this function to `hooks/session-start` after the `escape_for_json` function (after line 31):

```bash
# Parse a simple extensions.yaml file.
# Format:
#   extensions:
#     event-name:
#       - skill-name
# Outputs lines like: event-name:skill-name
parse_extensions_yaml() {
    local file="$1"
    [ -f "$file" ] || return 0
    local current_event=""
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip blank lines, comments, and the top-level "extensions:" key
        case "$line" in
            ''|'#'*|'extensions:'|'extensions: '*)
                continue
                ;;
        esac
        # Detect event key (indented, ends with colon, no dash prefix)
        if printf '%s' "$line" | grep -qE '^[[:space:]]+[a-z].*:$'; then
            current_event=$(printf '%s' "$line" | sed 's/^[[:space:]]*//; s/:$//')
        # Detect skill entry (indented, starts with dash)
        elif printf '%s' "$line" | grep -qE '^[[:space:]]+-[[:space:]]'; then
            if [ -n "$current_event" ]; then
                local skill_name
                skill_name=$(printf '%s' "$line" | sed 's/^[[:space:]]*-[[:space:]]*//')
                printf '%s:%s\n' "$current_event" "$skill_name"
            fi
        fi
    done < "$file"
}
```

- [ ] **Step 2: Write the `build_extensions_registry` function**

Add this function immediately after `parse_extensions_yaml`:

```bash
# Merge personal and project extensions into a registry string.
# Project entries append after personal entries for each event.
# Output format for injection:
#   Extensions Registry:
#   - post-execution: compound-learning, integration-smoke-test
#   - post-review: security-audit
build_extensions_registry() {
    local personal_file="${HOME}/.superpowers/extensions.yaml"
    local project_file=".superpowers/extensions.yaml"
    local tmpfile
    tmpfile=$(mktemp)

    parse_extensions_yaml "$personal_file" >> "$tmpfile"
    parse_extensions_yaml "$project_file" >> "$tmpfile"

    if [ ! -s "$tmpfile" ]; then
        rm -f "$tmpfile"
        return 0
    fi

    # Collect unique events in order of first appearance
    local events
    events=$(awk -F: '{print $1}' "$tmpfile" | awk '!seen[$0]++')

    printf 'Extensions Registry (invoke each skill via Skill tool at the matching lifecycle event):\n'
    while IFS= read -r event; do
        [ -z "$event" ] && continue
        local skills
        skills=$(grep "^${event}:" "$tmpfile" | cut -d: -f2 | paste -sd', ' -)
        printf '- %s: %s\n' "$event" "$skills"
    done <<< "$events"

    rm -f "$tmpfile"
}
```

- [ ] **Step 3: Call the registry builder and inject into session context**

In `hooks/session-start`, after line 33 (`warning_escaped=$(escape_for_json "$warning_message")`), add:

```bash
# Build extensions registry from manifest files
extensions_registry=$(build_extensions_registry)
extensions_escaped=$(escape_for_json "$extensions_registry")
```

Then modify the `session_context` variable (currently line 35) to include the extensions registry. Change:

```bash
session_context="<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**\n\n${using_superpowers_escaped}\n\n${warning_escaped}\n</EXTREMELY_IMPORTANT>"
```

To:

```bash
extensions_section=""
if [ -n "$extensions_registry" ]; then
    extensions_section="\n\n---\n\n${extensions_escaped}"
fi
session_context="<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**\n\n${using_superpowers_escaped}\n\n${warning_escaped}${extensions_section}\n</EXTREMELY_IMPORTANT>"
```

- [ ] **Step 4: Test the hook manually with a test manifest**

Create a temporary test manifest and run the hook:

```bash
mkdir -p ~/.superpowers
cat > ~/.superpowers/extensions.yaml << 'EOF'
extensions:
  post-execution:
    - compound-learning
    - integration-smoke-test
  post-review:
    - security-audit
EOF

# Run the hook and verify extensions appear in output
bash hooks/session-start | python3 -c "import sys,json; d=json.load(sys.stdin); print(d)" 2>&1 | grep -o 'Extensions Registry.*'
```

Expected: Output contains `Extensions Registry` with `post-execution: compound-learning, integration-smoke-test` and `post-review: security-audit`.

- [ ] **Step 5: Test with both personal and project manifests**

```bash
mkdir -p .superpowers
cat > .superpowers/extensions.yaml << 'EOF'
extensions:
  post-execution:
    - project-specific-check
  pre-finish:
    - changelog-generator
EOF

bash hooks/session-start | python3 -c "import sys,json; d=json.load(sys.stdin); print(d)" 2>&1 | grep -o 'Extensions Registry.*'
```

Expected: `post-execution` lists `compound-learning, integration-smoke-test, project-specific-check` (personal first, project appends). `pre-finish` lists `changelog-generator`. `post-review` lists `security-audit`.

- [ ] **Step 6: Test with no manifest files (graceful no-op)**

```bash
# Temporarily move manifests aside
mv ~/.superpowers/extensions.yaml ~/.superpowers/extensions.yaml.bak 2>/dev/null
mv .superpowers/extensions.yaml .superpowers/extensions.yaml.bak 2>/dev/null

bash hooks/session-start | python3 -c "import sys,json; d=json.load(sys.stdin); print(d)" 2>&1

# Restore
mv ~/.superpowers/extensions.yaml.bak ~/.superpowers/extensions.yaml 2>/dev/null
mv .superpowers/extensions.yaml.bak .superpowers/extensions.yaml 2>/dev/null
```

Expected: Output is valid JSON, no errors, no "Extensions Registry" text (since no manifests exist).

- [ ] **Step 7: Commit**

```bash
git add hooks/session-start
git commit -m "feat: parse extensions manifests in session-start hook"
```

---

### Task 2: Update `using-superpowers` skill with extensions awareness

**Files:**
- Modify: `skills/using-superpowers/SKILL.md:107-118`

Add a section teaching the agent what the extensions registry is and how to act on it. This goes between the existing "Skill Priority" section and the "Skill Types" section.

- [ ] **Step 1: Add the Lifecycle Extensions section**

After the "Skill Priority" section (after line 104 `"Fix this bug" → debugging first, then domain-specific skills.`) and before the "Skill Types" section (line 106 `## Skill Types`), add:

```markdown
## Lifecycle Extensions

Users can register custom skills to run at specific lifecycle events via `~/.superpowers/extensions.yaml` (personal) or `.superpowers/extensions.yaml` (project). When an extensions registry is present in your session context, you MUST check it at each lifecycle event and invoke every registered skill in order via the Skill tool.

**Lifecycle events (checked by core skills):**
`post-brainstorm`, `post-plan`, `pre-task`, `post-task`, `post-execution`, `post-review`, `pre-finish`

**Rules:**
- Extensions are regular skills — invoke them via the Skill tool like any other skill
- Run them in the order listed in the registry
- Extensions don't block the workflow — if one fails or isn't found, report and continue
- Only check events that appear in the registry — no registry means no extensions
```

- [ ] **Step 2: Verify the skill reads correctly**

```bash
cat skills/using-superpowers/SKILL.md
```

Expected: The new "Lifecycle Extensions" section appears between "Skill Priority" and "Skill Types", with the event list, rules, and invocation instructions.

- [ ] **Step 3: Commit**

```bash
git add skills/using-superpowers/SKILL.md
git commit -m "feat: teach using-superpowers about lifecycle extensions registry"
```

---

### Task 3: Add `post-brainstorm` extension point to brainstorming skill

**Files:**
- Modify: `skills/brainstorming/SKILL.md:62-66`

The `post-brainstorm` event fires after the user approves the design spec but before invoking writing-plans.

- [ ] **Step 1: Update the process flow graph**

In `skills/brainstorming/SKILL.md`, modify the `digraph brainstorming` graph. Add a new node and edge between "User reviews spec?" and "Invoke writing-plans skill". Change:

```markdown
    "User reviews spec?" -> "Invoke writing-plans skill" [label="approved"];
```

To:

```markdown
    "Run post-brainstorm extensions" [shape=box];
    "User reviews spec?" -> "Run post-brainstorm extensions" [label="approved"];
    "Run post-brainstorm extensions" -> "Invoke writing-plans skill";
```

- [ ] **Step 2: Update the terminal state text**

Change line 66:

```markdown
**The terminal state is invoking writing-plans.** Do NOT invoke frontend-design, mcp-builder, or any other implementation skill. The ONLY skill you invoke after brainstorming is writing-plans.
```

To:

```markdown
**The terminal state is invoking writing-plans.** Do NOT invoke frontend-design, mcp-builder, or any other implementation skill. Before invoking writing-plans, check the extensions registry for `post-brainstorm` extensions and invoke each in order. Then invoke writing-plans.
```

- [ ] **Step 3: Add extension check to the Implementation section**

In the "Implementation" section (around line 135), change:

```markdown
**Implementation:**

- Invoke the writing-plans skill to create a detailed implementation plan
- Do NOT invoke any other skill. writing-plans is the next step.
```

To:

```markdown
**Implementation:**

- **Check extensions registry** for `post-brainstorm` extensions and invoke each in order
- Invoke the writing-plans skill to create a detailed implementation plan
- Do NOT invoke any other implementation skill.
```

- [ ] **Step 4: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat: add post-brainstorm extension point to brainstorming skill"
```

---

### Task 4: Add `post-plan` extension point to writing-plans skill

**Files:**
- Modify: `skills/writing-plans/SKILL.md:136-153`

The `post-plan` event fires after the plan is saved and before the execution handoff.

- [ ] **Step 1: Add extension check to Execution Handoff**

In `skills/writing-plans/SKILL.md`, in the "Execution Handoff" section (line 136), change:

```markdown
## Execution Handoff

After saving the plan, offer execution choice:
```

To:

```markdown
## Execution Handoff

After saving the plan:
1. **Check extensions registry** for `post-plan` extensions and invoke each in order
2. Then offer execution choice:
```

- [ ] **Step 2: Commit**

```bash
git add skills/writing-plans/SKILL.md
git commit -m "feat: add post-plan extension point to writing-plans skill"
```

---

### Task 5: Add `pre-task`, `post-task`, `post-execution` extension points to executing-plans skill

**Files:**
- Modify: `skills/executing-plans/SKILL.md:21-38`

- [ ] **Step 1: Add extension checks to the process steps**

In `skills/executing-plans/SKILL.md`, modify "Step 2: Execute Tasks" (line 26). Change:

```markdown
### Step 2: Execute Tasks

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed
```

To:

```markdown
### Step 2: Execute Tasks

For each task:
1. **Check extensions registry** for `pre-task` extensions and invoke each in order
2. Mark as in_progress
3. Follow each step exactly (plan has bite-sized steps)
4. Run verifications as specified
5. **Check extensions registry** for `post-task` extensions and invoke each in order
6. Mark as completed
```

- [ ] **Step 2: Add extension check to Step 3**

Modify "Step 3: Complete Development" (line 33). Change:

```markdown
### Step 3: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice
```

To:

```markdown
### Step 3: Complete Development

After all tasks complete and verified:
- **Check extensions registry** for `post-execution` extensions and invoke each in order
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice
```

- [ ] **Step 3: Commit**

```bash
git add skills/executing-plans/SKILL.md
git commit -m "feat: add pre-task, post-task, post-execution extension points to executing-plans"
```

---

### Task 6: Add `pre-task`, `post-task`, `post-execution` extension points to subagent-driven-development skill

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md:42-85`

- [ ] **Step 1: Update the process flow graph**

In `skills/subagent-driven-development/SKILL.md`, modify the `digraph process` graph. Add extension check nodes.

After the existing node `"Read plan, extract all tasks with full text, note context, create TodoWrite"` and before `"Dispatch implementer subagent"`, add a pre-task check:

```markdown
    "Check pre-task extensions" [shape=box style=filled fillcolor=lightyellow];
```

Add edge:

```markdown
    "Read plan, extract all tasks with full text, note context, create TodoWrite" -> "Check pre-task extensions";
    "Check pre-task extensions" -> "Dispatch implementer subagent (./implementer-prompt.md)";
```

And remove the existing direct edge:

```markdown
    "Read plan, extract all tasks with full text, note context, create TodoWrite" -> "Dispatch implementer subagent (./implementer-prompt.md)";
```

After `"Mark task complete in TodoWrite"` and before `"More tasks remain?"`, add a post-task check:

```markdown
    "Check post-task extensions" [shape=box style=filled fillcolor=lightyellow];
    "Mark task complete in TodoWrite" -> "Check post-task extensions";
    "Check post-task extensions" -> "More tasks remain?";
```

And remove the existing direct edge:

```markdown
    "Mark task complete in TodoWrite" -> "More tasks remain?";
```

After `"Dispatch final code reviewer subagent for entire implementation"` and before `"Use superpowers:finishing-a-development-branch"`, add a post-execution check:

```markdown
    "Check post-execution extensions" [shape=box style=filled fillcolor=lightyellow];
    "Dispatch final code reviewer subagent for entire implementation" -> "Check post-execution extensions";
    "Check post-execution extensions" -> "Use superpowers:finishing-a-development-branch";
```

And remove the existing direct edge:

```markdown
    "Dispatch final code reviewer subagent for entire implementation" -> "Use superpowers:finishing-a-development-branch";
```

Also update the loop edge for `"More tasks remain?"` — the "yes" path should go to pre-task check, not directly to implementer:

Change:

```markdown
    "More tasks remain?" -> "Dispatch implementer subagent (./implementer-prompt.md)" [label="yes"];
```

To:

```markdown
    "More tasks remain?" -> "Check pre-task extensions" [label="yes"];
```

- [ ] **Step 2: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "feat: add pre-task, post-task, post-execution extension points to subagent-driven-development"
```

---

### Task 7: Add `post-review` extension point to requesting-code-review skill

**Files:**
- Modify: `skills/requesting-code-review/SKILL.md:73-99`

- [ ] **Step 1: Add extension check after acting on feedback**

In `skills/requesting-code-review/SKILL.md`, in the "How to Request" section, after the "3. Act on feedback" subsection (after line 76), add a step 4:

```markdown
**4. Check extensions registry** for `post-review` extensions and invoke each in order.
```

- [ ] **Step 2: Add extension check to Integration section**

In the "Integration with Workflows" section (line 79), update each workflow to mention the extension check. Change:

```markdown
**Subagent-Driven Development:**
- Review after EACH task
- Catch issues before they compound
- Fix before moving to next task

**Executing Plans:**
- Review after each batch (3 tasks)
- Get feedback, apply, continue

**Ad-Hoc Development:**
- Review before merge
- Review when stuck
```

To:

```markdown
**Subagent-Driven Development:**
- Review after EACH task
- Catch issues before they compound
- Fix before moving to next task
- Run `post-review` extensions after each review cycle

**Executing Plans:**
- Review after each batch (3 tasks)
- Get feedback, apply, continue
- Run `post-review` extensions after each review cycle

**Ad-Hoc Development:**
- Review before merge
- Review when stuck
- Run `post-review` extensions after review
```

- [ ] **Step 3: Commit**

```bash
git add skills/requesting-code-review/SKILL.md
git commit -m "feat: add post-review extension point to requesting-code-review"
```

---

### Task 8: Add `pre-finish` extension point to finishing-a-development-branch skill

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md:18-25`

- [ ] **Step 1: Add extension check before presenting options**

In `skills/finishing-a-development-branch/SKILL.md`, in "The Process" section, between Step 1 (Verify Tests) and Step 2 (Determine Base Branch), add a new step. After line 37 (`**If tests pass:** Continue to Step 2.`), add:

```markdown
### Step 1.5: Run Pre-Finish Extensions

**Check extensions registry** for `pre-finish` extensions and invoke each in order. These run after tests pass but before presenting completion options — useful for final compliance checks, changelog generation, or other pre-merge gates.
```

- [ ] **Step 2: Commit**

```bash
git add skills/finishing-a-development-branch/SKILL.md
git commit -m "feat: add pre-finish extension point to finishing-a-development-branch"
```

---

### Task 9: End-to-end validation

This task verifies the complete system works together.

**Files:**
- No new files created — uses test manifests from Task 1

- [ ] **Step 1: Create a minimal test extension skill**

```bash
mkdir -p ~/.claude/skills/test-extension
cat > ~/.claude/skills/test-extension/SKILL.md << 'EOF'
---
name: test-extension
description: Use when testing lifecycle extensions - outputs a confirmation message
---

# Test Extension

When invoked, output: "TEST EXTENSION FIRED SUCCESSFULLY at [current lifecycle event]."

This is a test skill for validating the superpowers lifecycle extensions system. Report the event that triggered you and confirm the extensions registry is working.
EOF
```

- [ ] **Step 2: Create test manifests that wire the test extension to multiple events**

```bash
mkdir -p ~/.superpowers
cat > ~/.superpowers/extensions.yaml << 'EOF'
extensions:
  post-execution:
    - test-extension
  post-review:
    - test-extension
EOF

mkdir -p .superpowers
cat > .superpowers/extensions.yaml << 'EOF'
extensions:
  post-execution:
    - test-extension
  pre-finish:
    - test-extension
EOF
```

- [ ] **Step 3: Verify session-start hook produces correct merged registry**

```bash
bash hooks/session-start 2>/dev/null | python3 -c "
import sys, json
d = json.load(sys.stdin)
# Extract the context string from whichever platform format
for key in ['additional_context', 'additionalContext']:
    if key in d:
        ctx = d[key]
        break
else:
    ctx = d.get('hookSpecificOutput', {}).get('additionalContext', '')
# Check registry content
assert 'Extensions Registry' in ctx, 'No extensions registry found'
assert 'post-execution' in ctx, 'Missing post-execution event'
assert 'pre-finish' in ctx, 'Missing pre-finish event'
assert 'post-review' in ctx, 'Missing post-review event'
print('PASS: Extensions registry correctly merged and injected')
"
```

Expected: `PASS: Extensions registry correctly merged and injected`

- [ ] **Step 4: Verify merged order is correct (personal then project)**

```bash
bash hooks/session-start 2>/dev/null | python3 -c "
import sys, json
d = json.load(sys.stdin)
for key in ['additional_context', 'additionalContext']:
    if key in d:
        ctx = d[key]
        break
else:
    ctx = d.get('hookSpecificOutput', {}).get('additionalContext', '')
# post-execution should list test-extension twice (personal + project)
# The exact format is: post-execution: test-extension, test-extension
assert 'post-execution: test-extension, test-extension' in ctx, f'Merge order wrong'
print('PASS: Personal-then-project merge order correct')
"
```

Expected: `PASS: Personal-then-project merge order correct`

- [ ] **Step 5: Clean up test fixtures**

```bash
rm -rf ~/.claude/skills/test-extension
rm -f ~/.superpowers/extensions.yaml
rm -rf .superpowers
```
