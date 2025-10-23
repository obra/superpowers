# Orchestration System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform superpowers plugin into orchestration system where main Claude delegates tasks to specialist sub-agents, each expert in one skill.

**Architecture:** Pre-generate 20 specialist agents from existing skills, load agent registry at session start (~2500 tokens), orchestrator matches user requests to specialists and manages workflows via Task tool.

**Tech Stack:** Bash (generation script), JSON (agent registry), Markdown (agent definitions, orchestrator instructions, templates)

---

## Task 1: Create Specialist Agent Template

**Files:**
- Create: `templates/specialist-agent.template`

**Step 1: Write the specialist agent template file**

Create the reusable template for generating specialist agents:

```markdown
---
name: {{SKILL_NAME}}-specialist
description: {{SKILL_DESCRIPTION}}
model: sonnet
---

# {{SKILL_DISPLAY_NAME}} Specialist

You are a specialist agent whose sole purpose is to execute the **{{SKILL_NAME}}** skill.

## Your Identity

You are an expert in applying the {{SKILL_NAME}} methodology. You follow this skill's process exactly as documented below, without deviation or rationalization.

## The Skill You Execute

{{SKILL_CONTENT}}

## Reporting Requirements

After completing your work, provide a structured report with these sections:

### 1. Summary
- What task you completed
- Which skill steps you followed
- Key actions taken (files modified, commands run, decisions made)
- Final status: ✅ Success | ⚠️ Partial | ❌ Blocked

### 2. Recommendations
- Suggested next skills to invoke (if workflow should continue)
- Alternative approaches if current path is blocked
- Improvements or optimizations identified

### 3. Blockers & Questions
- Any issues preventing completion
- Decisions requiring user input
- Clarifications needed from orchestrator

### 4. Context for Orchestrator
- Any state/context the orchestrator should preserve
- Files to watch for changes
- Artifacts created that other specialists might need

---

## Critical Rules

- **Execute the skill exactly as written** - no shortcuts, no "I remember this"
- **If skill has checklist** - you must complete every item
- **Never skip skill steps** - even if they seem unnecessary
- **Report honestly** - if blocked, say so; don't claim success prematurely
```

**Step 2: Verify template file created**

Run: `cat templates/specialist-agent.template | head -20`
Expected: File shows template with placeholders

**Step 3: Commit**

```bash
git add templates/specialist-agent.template
git commit -m "Add specialist agent template"
```

---

## Task 2: Create Generator Script (Part 1 - Structure)

**Files:**
- Create: `lib/generate-specialists.sh`

**Step 1: Write generator script skeleton**

```bash
#!/bin/bash

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/skills"
AGENTS_DIR="$REPO_ROOT/agents"
TEMPLATE_FILE="$REPO_ROOT/templates/specialist-agent.template"
REGISTRY_FILE="$REPO_ROOT/lib/agent-registry.json"

echo "Generating specialist agents from skills..."

# Ensure agents directory exists
mkdir -p "$AGENTS_DIR"

# Initialize registry
echo "[" > "$REGISTRY_FILE"

# Main generation loop (to be filled in next task)

# Close registry
echo "]" >> "$REGISTRY_FILE"

echo "Generated specialist agents in $AGENTS_DIR"
echo "Generated agent registry at $REGISTRY_FILE"
```

**Step 2: Make script executable**

Run: `chmod +x lib/generate-specialists.sh`
Expected: Script is executable

**Step 3: Test script runs without errors**

Run: `./lib/generate-specialists.sh`
Expected: Creates empty registry file

**Step 4: Commit**

```bash
git add lib/generate-specialists.sh
git commit -m "Add generator script skeleton"
```

---

## Task 3: Complete Generator Script (Part 2 - Logic)

**Files:**
- Modify: `lib/generate-specialists.sh:17-19` (replace "Main generation loop" comment)

**Step 1: Add skill processing logic**

Replace the "Main generation loop" comment with:

```bash
first_entry=true

# Process each skill
for skill_dir in "$SKILLS_DIR"/*; do
    if [ ! -d "$skill_dir" ]; then
        continue
    fi

    skill_file="$skill_dir/SKILL.md"
    if [ ! -f "$skill_file" ]; then
        echo "Warning: No SKILL.md found in $skill_dir"
        continue
    fi

    # Extract skill name from directory
    skill_name=$(basename "$skill_dir")

    # Parse YAML frontmatter
    skill_description=$(awk '/^---$/,/^---$/{if (!/^---$/) print}' "$skill_file" | grep "^description:" | sed 's/^description: *//')

    # Skip if no description
    if [ -z "$skill_description" ]; then
        echo "Warning: No description in $skill_file"
        continue
    fi

    # Read full skill content (everything after second ---)
    skill_content=$(awk 'BEGIN{p=0} /^---$/{p++; next} p>=2' "$skill_file")

    # Create display name (capitalize, replace hyphens with spaces)
    skill_display_name=$(echo "$skill_name" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')

    # Generate agent file
    agent_file="$AGENTS_DIR/${skill_name}-specialist.md"

    echo "Generating $agent_file..."

    # Process template with substitutions
    sed -e "s|{{SKILL_NAME}}|$skill_name|g" \
        -e "s|{{SKILL_DESCRIPTION}}|$skill_description|g" \
        -e "s|{{SKILL_DISPLAY_NAME}}|$skill_display_name|g" \
        "$TEMPLATE_FILE" > "$agent_file.tmp"

    # Insert skill content (escape special chars for sed)
    awk -v content="$skill_content" '{
        if ($0 ~ /{{SKILL_CONTENT}}/) {
            print content
        } else {
            print $0
        }
    }' "$agent_file.tmp" > "$agent_file"

    rm "$agent_file.tmp"

    # Add to registry
    if [ "$first_entry" = false ]; then
        echo "," >> "$REGISTRY_FILE"
    fi
    first_entry=false

    cat >> "$REGISTRY_FILE" <<EOF
  {
    "name": "${skill_name}-specialist",
    "description": "$skill_description",
    "agent_file": "agents/${skill_name}-specialist.md",
    "skill_name": "$skill_name"
  }
EOF
done
```

**Step 2: Run generator script**

Run: `./lib/generate-specialists.sh`
Expected: Creates 20 agent files and populated registry

**Step 3: Verify output**

Run: `ls agents/*-specialist.md | wc -l`
Expected: 20 (or number of skills)

Run: `cat lib/agent-registry.json | jq length`
Expected: 20 (or number of skills)

**Step 4: Commit**

```bash
git add lib/generate-specialists.sh
git commit -m "Complete generator script with skill processing"
```

---

## Task 4: Generate Initial Specialist Agents

**Files:**
- Generate: `agents/*-specialist.md` (20 files)
- Generate: `lib/agent-registry.json`

**Step 1: Run generator to create all specialists**

Run: `./lib/generate-specialists.sh`
Expected: Output shows "Generating agents/brainstorming-specialist.md..." for all 20 skills

**Step 2: Verify one specialist agent content**

Run: `head -30 agents/brainstorming-specialist.md`
Expected: Shows YAML frontmatter, identity section, and start of skill content

**Step 3: Verify agent registry structure**

Run: `cat lib/agent-registry.json | jq '.[0]'`
Expected: Shows first entry with name, description, agent_file, skill_name

**Step 4: Count registry entries**

Run: `cat lib/agent-registry.json | jq 'length'`
Expected: 20

**Step 5: Commit generated files**

```bash
git add agents/*-specialist.md lib/agent-registry.json
git commit -m "Generate 20 specialist agents and registry"
```

---

## Task 5: Create Orchestrator Instructions

**Files:**
- Create: `lib/orchestrator-instructions.md`

**Step 1: Write orchestrator instructions**

```markdown
# Orchestrator Mode Instructions

You are an orchestration agent. Your role is to delegate tasks to specialist agents rather than handling complex work yourself.

## Critical Rule: Mandatory Delegation

**IF A SKILL EXISTS FOR THIS TASK → YOU MUST DELEGATE TO THE SPECIALIST**

This is non-negotiable. Do not rationalize handling it yourself.

## Before Every User Request

1. ☐ Analyze the user's request to understand task type
2. ☐ Check agent registry for matching specialist
3. ☐ If match found → Call specialist via Task tool
4. ☐ If NO match → Handle directly (simple coordination only)

## Skill Matching Process

You have access to an agent registry with 20 specialist agents. Each specialist is expert in one superpowers skill.

**Semantic matching:**
- Read user request
- Compare against all agent descriptions in registry
- Select best match based on task type and skill description

**Common matches:**
- "Fix bug" / "Debug" / "Error" → `systematic-debugging-specialist`
- "Add feature" / "Build" / "Create" → `brainstorming-specialist` (start with design)
- "Write tests" / "TDD" → `test-driven-development-specialist`
- "Review code" → `requesting-code-review-specialist`
- "Create plan" → `writing-plans-specialist`

**No match found:**
- Simple questions → Answer directly
- File reads → Handle directly
- Quick commands → Handle directly
- **IF task requires >2 tool calls → Warn user:** "This seems complex but no specialist available. Proceeding with caution."

## Multi-Skill Workflows

### Sequential Chaining
When one specialist's work naturally leads to another:

```
User: "Create authentication feature"
→ Call brainstorming-specialist (design)
→ Receive design report
→ Call writing-plans-specialist (plan)
→ Receive plan report
→ Present to user for approval
```

### Parallel Execution
When multiple independent tasks can run simultaneously:

```
User: "Fix these 3 bugs in different modules"
→ Call systematic-debugging-specialist (3 parallel Task calls)
→ Wait for all reports
→ Synthesize results for user
```

### Adaptive Workflow
When specialist reports reveal need for different skills:

```
User: "Improve test coverage"
→ Call test-driven-development-specialist
→ Report shows testing anti-patterns present
→ Call testing-anti-patterns-specialist
→ Continue based on findings
```

## Loop Prevention

**Track workflow state:**
- Maintain list: `specialists_called_this_workflow = []`
- Before calling specialist → Check if already called
- If duplicate detected:
  - Can call with different scope if request changed
  - Otherwise escalate to user: "Already used {specialist}, but issue persists. Need guidance."
- Reset list when new user request arrives

**Maximum workflow depth: 10 specialists per request**
- If exceeded → Escalate: "Workflow becoming complex. Let me summarize progress..."

## Specialist Report Handling

Specialists return structured reports with:
1. Summary (what was done, status)
2. Recommendations (next skills to call)
3. Blockers & Questions (issues preventing completion)
4. Context (state for orchestrator)

**You receive these reports privately (user does NOT see them).**

**Your decisions after receiving report:**
- Show relevant parts to user
- Call another specialist (based on recommendations)
- Ask user for guidance (if blockers present)
- Declare task complete

## Error Handling

### Specialist Reports ❌ Blocked
- Read blocker details from report
- Present to user: "The {specialist-name} encountered: {details}. How to proceed?"
- Wait for user guidance

### Task Tool Fails (specialist crashes)
- Catch error
- Inform user: "The {specialist-name} encountered error: {details}"
- Offer fallback: "I can attempt directly, or you can provide alternative approach"
- Do NOT silently retry

### Conflicting Recommendations
- Detect when specialist recommendation conflicts with user constraints
- Present conflict: "Specialist recommends {X}, but you requested {Y}. Which approach?"
- Wait for user decision

## What You Can Handle Directly

**Simple coordination tasks (no specialist needed):**
- Answering questions about project structure
- Reading single files
- Running git status or similar commands
- Explaining concepts

**Everything else → Delegate to specialist**

## Common Rationalizations to AVOID

Never think:
- "This is simple, I'll do it myself" → Check for specialist first
- "I remember how to do this" → Use the specialist, they follow proven process
- "Calling specialist is overkill" → Skills exist for good reason, use them
- "Let me just do this one thing first" → Delegate immediately

## Your Success Criteria

- ✅ Always check registry before handling tasks
- ✅ Delegate to specialists for any non-trivial work
- ✅ Manage workflows (sequential, parallel, adaptive)
- ✅ Handle specialist reports appropriately
- ✅ Prevent loops and excessive workflow depth
- ✅ Provide clear communication to user about what's happening
```

**Step 2: Verify file created**

Run: `wc -w lib/orchestrator-instructions.md`
Expected: ~800-1000 words

**Step 3: Commit**

```bash
git add lib/orchestrator-instructions.md
git commit -m "Add orchestrator instructions"
```

---

## Task 6: Create Project CLAUDE.md Template

**Files:**
- Create: `templates/project-claude-md.template`

**Step 1: Write project CLAUDE.md template**

```markdown
# Project Instructions

This project uses Claude Code with the Superpowers plugin.

## Project Context

[This section will be populated with project-specific information as the work progresses]

## Technology Stack

[Add project tech stack details here]

## Architecture Notes

[Add architecture decisions and patterns here]

## Custom Orchestration Rules

[Add any project-specific rules that override default orchestration behavior]

Example:
- Skip brainstorming for minor bug fixes under 10 lines
- Always use test-driven-development for API endpoints
- Require code review before merging features

## Development Workflow

[Add project-specific workflow notes]

---

<!--
Orchestrator mode is active via superpowers plugin.
You do not need to add orchestration instructions here - they are loaded automatically via SessionStart hook.

The orchestrator will:
1. Check agent registry for matching specialist
2. Delegate complex tasks to specialists
3. Handle simple coordination directly
4. Manage multi-skill workflows
-->
```

**Step 2: Verify template created**

Run: `cat templates/project-claude-md.template`
Expected: Shows complete template

**Step 3: Commit**

```bash
git add templates/project-claude-md.template
git commit -m "Add project CLAUDE.md template"
```

---

## Task 7: Update SessionStart Hook

**Files:**
- Modify: `hooks/session-start.sh`

**Step 1: Read current session-start hook**

Run: `cat hooks/session-start.sh`
Expected: Current implementation that loads using-superpowers skill

**Step 2: Update hook to inject orchestration**

Replace entire file with:

```bash
#!/bin/bash

set -e

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Load orchestrator instructions
ORCHESTRATOR_INSTRUCTIONS=""
if [ -f "$PLUGIN_DIR/lib/orchestrator-instructions.md" ]; then
    ORCHESTRATOR_INSTRUCTIONS=$(cat "$PLUGIN_DIR/lib/orchestrator-instructions.md")
fi

# Load agent registry
AGENT_REGISTRY=""
if [ -f "$PLUGIN_DIR/lib/agent-registry.json" ]; then
    AGENT_REGISTRY=$(cat "$PLUGIN_DIR/lib/agent-registry.json")
fi

# Load project CLAUDE.md if exists, otherwise use template
PROJECT_INSTRUCTIONS=""
if [ -f "CLAUDE.md" ]; then
    PROJECT_INSTRUCTIONS=$(cat "CLAUDE.md")
else
    if [ -f "$PLUGIN_DIR/templates/project-claude-md.template" ]; then
        PROJECT_INSTRUCTIONS=$(cat "$PLUGIN_DIR/templates/project-claude-md.template")
    fi
fi

# Load using-superpowers skill (for backward compatibility and skill enforcement)
USING_SUPERPOWERS=""
if [ -f "$PLUGIN_DIR/skills/using-superpowers/SKILL.md" ]; then
    USING_SUPERPOWERS=$(cat "$PLUGIN_DIR/skills/using-superpowers/SKILL.md")
fi

# Build combined context
COMBINED_CONTEXT=""

# Add using-superpowers (skill enforcement)
if [ -n "$USING_SUPERPOWERS" ]; then
    COMBINED_CONTEXT+="<EXTREMELY_IMPORTANT>
You have superpowers.

**The content below is from skills/using-superpowers/SKILL.md - your introduction to using skills:**

---
$USING_SUPERPOWERS
---

</EXTREMELY_IMPORTANT>

"
fi

# Add orchestration mode
if [ -n "$ORCHESTRATOR_INSTRUCTIONS" ]; then
    COMBINED_CONTEXT+="<ORCHESTRATION_MODE_ACTIVE>

$ORCHESTRATOR_INSTRUCTIONS

</ORCHESTRATION_MODE_ACTIVE>

"
fi

# Add agent registry
if [ -n "$AGENT_REGISTRY" ]; then
    COMBINED_CONTEXT+="<AGENT_REGISTRY>

The following specialist agents are available to you. Each is an expert in one superpowers skill.

When you need to delegate to a specialist, use the Task tool with the specialist's name.

$AGENT_REGISTRY

</AGENT_REGISTRY>

"
fi

# Add project instructions
if [ -n "$PROJECT_INSTRUCTIONS" ]; then
    COMBINED_CONTEXT+="<PROJECT_INSTRUCTIONS>

$PROJECT_INSTRUCTIONS

</PROJECT_INSTRUCTIONS>"
fi

# Return JSON with combined context
jq -n \
  --arg context "$COMBINED_CONTEXT" \
  '{
    hookSpecificOutput: {
      additionalContext: $context
    }
  }'
```

**Step 3: Test hook runs without errors**

Run: `bash hooks/session-start.sh | jq .`
Expected: Valid JSON with additionalContext field

**Step 4: Verify context includes all sections**

Run: `bash hooks/session-start.sh | jq -r '.hookSpecificOutput.additionalContext' | grep -c "ORCHESTRATION_MODE_ACTIVE"`
Expected: 1

Run: `bash hooks/session-start.sh | jq -r '.hookSpecificOutput.additionalContext' | grep -c "AGENT_REGISTRY"`
Expected: 1

**Step 5: Commit**

```bash
git add hooks/session-start.sh
git commit -m "Update session-start hook for orchestration mode"
```

---

## Task 8: Add README Documentation

**Files:**
- Modify: `README.md` (add Orchestration Mode section after Installation)

**Step 1: Read current README**

Run: `grep -n "## Installation" README.md`
Expected: Shows line number of Installation section

**Step 2: Add Orchestration Mode section**

After the Installation section, add:

```markdown
## Orchestration Mode

As of v3.3.0, superpowers includes an orchestration system that automatically delegates tasks to specialist agents.

### How It Works

When superpowers plugin is installed, orchestration mode is **active by default**:

1. **You make a request** → Main Claude (orchestrator) receives it
2. **Orchestrator checks registry** → Matches your request to appropriate specialist agent
3. **Specialist executes skill** → Expert agent applies the relevant skill systematically
4. **Report returns** → Orchestrator receives structured report and decides next steps
5. **Workflow continues** → Orchestrator may call additional specialists or present results

### Benefits

- **Context preservation:** Orchestrator stays focused on workflow management, specialists handle execution details
- **Systematic skill application:** Every specialist follows proven skill methodology exactly
- **Performance:** Only relevant skills load (not all 20 skills per session)
- **Reliability:** Clear delegation rules prevent ad-hoc "I'll do it myself" shortcuts

### The Specialist Agents

Each of the 20 superpowers skills has a corresponding specialist agent:

- `brainstorming-specialist` - Design refinement before coding
- `systematic-debugging-specialist` - 4-phase debugging framework
- `test-driven-development-specialist` - RED-GREEN-REFACTOR cycle
- `writing-plans-specialist` - Detailed implementation plans
- `executing-plans-specialist` - Batch execution with checkpoints
- ... (15 more specialists)

Full list: `lib/agent-registry.json`

### Project-Specific Configuration

Projects can customize orchestration via `CLAUDE.md`:

```markdown
## Custom Orchestration Rules

- Skip brainstorming for minor bug fixes under 10 lines
- Always use test-driven-development for API endpoints
- Require code review before merging features
```

The orchestrator respects project-specific rules while enforcing core delegation principles.

### Regenerating Specialists

When skills are updated, regenerate specialist agents:

```bash
./lib/generate-specialists.sh
```

This rebuilds all 20 `agents/*-specialist.md` files and `lib/agent-registry.json` from current skill content.
```

**Step 3: Verify section added**

Run: `grep -n "## Orchestration Mode" README.md`
Expected: Shows line number

**Step 4: Commit**

```bash
git add README.md
git commit -m "Add orchestration mode documentation to README"
```

---

## Task 9: Create Release Notes

**Files:**
- Modify: `RELEASE-NOTES.md` (add v3.3.0 entry at top)

**Step 1: Read current release notes header**

Run: `head -20 RELEASE-NOTES.md`
Expected: Shows recent version entries

**Step 2: Add v3.3.0 release notes at top**

Add after title/header:

```markdown
## v3.3.0 - Orchestration System

**Release Date:** 2025-10-23

### Major Features

**Orchestration Mode (Default)**

Superpowers now operates as an orchestration system where the main Claude agent delegates tasks to specialist sub-agents, each expert in one skill.

- **20 Specialist Agents:** One per skill, auto-generated from `skills/*/SKILL.md`
- **Agent Registry:** Loaded at session start (~2500 tokens) for skill matching
- **Automatic Delegation:** If skill exists for task → specialist handles it
- **Context Preservation:** Orchestrator stays lightweight, specialists do heavy lifting
- **Multi-Skill Workflows:** Sequential, parallel, and adaptive workflows supported

### New Files

- `lib/generate-specialists.sh` - Builds specialist agents from skills
- `lib/agent-registry.json` - Registry of all 20 specialists (auto-generated)
- `lib/orchestrator-instructions.md` - Core orchestration rules
- `templates/specialist-agent.template` - Template for generating specialists
- `templates/project-claude-md.template` - Default project CLAUDE.md
- `agents/*-specialist.md` - 20 specialist agent definitions (auto-generated)

### Breaking Changes

**None** - Orchestration is backward compatible. Projects without superpowers plugin continue working normally.

### Migration

**No action required** - Orchestration activates automatically when superpowers plugin is installed.

To customize orchestration behavior, add rules to your project's `CLAUDE.md`.

### Performance

- **Session start:** ~2500 tokens (orchestrator + registry)
- **Per task:** Only relevant specialist loads (~200-500 tokens)
- **Savings vs v3.2.x:** ~8000 tokens per session (skills load on-demand, not all upfront)

### Reliability

- Loop prevention (max 10 specialists per workflow)
- Graceful error handling (specialist crashes, blockers, conflicts)
- Fallback to direct handling when no specialist matches

### Developer Notes

To regenerate specialists after skill updates:

```bash
./lib/generate-specialists.sh
git add agents/*-specialist.md lib/agent-registry.json
git commit -m "Regenerate specialists"
```

---
```

**Step 3: Verify release notes added**

Run: `grep -A 5 "## v3.3.0" RELEASE-NOTES.md`
Expected: Shows v3.3.0 section

**Step 4: Commit**

```bash
git add RELEASE-NOTES.md
git commit -m "Add v3.3.0 release notes for orchestration system"
```

---

## Task 10: Update Plugin Version

**Files:**
- Modify: `.claude-plugin/plugin.json`

**Step 1: Read current version**

Run: `cat .claude-plugin/plugin.json | jq -r .version`
Expected: Current version (likely 3.2.1)

**Step 2: Update version to 3.3.0**

Run: `jq '.version = "3.3.0"' .claude-plugin/plugin.json > .claude-plugin/plugin.json.tmp && mv .claude-plugin/plugin.json.tmp .claude-plugin/plugin.json`

**Step 3: Verify version updated**

Run: `cat .claude-plugin/plugin.json | jq -r .version`
Expected: 3.3.0

**Step 4: Commit**

```bash
git add .claude-plugin/plugin.json
git commit -m "Bump version to 3.3.0"
```

---

## Task 11: Final Verification

**Files:**
- None (verification only)

**Step 1: Verify all generated files exist**

Run: `ls agents/*-specialist.md | wc -l`
Expected: 20

Run: `test -f lib/agent-registry.json && echo "exists"`
Expected: exists

Run: `test -f lib/orchestrator-instructions.md && echo "exists"`
Expected: exists

Run: `test -f templates/specialist-agent.template && echo "exists"`
Expected: exists

Run: `test -f templates/project-claude-md.template && echo "exists"`
Expected: exists

**Step 2: Verify session-start hook syntax**

Run: `bash -n hooks/session-start.sh`
Expected: No output (syntax OK)

**Step 3: Verify generator script syntax**

Run: `bash -n lib/generate-specialists.sh`
Expected: No output (syntax OK)

**Step 4: Test full session-start hook execution**

Run: `bash hooks/session-start.sh > /tmp/hook-test.json && jq . /tmp/hook-test.json > /dev/null && echo "Valid JSON"`
Expected: Valid JSON

**Step 5: Count total commits in worktree**

Run: `git log --oneline --all --graph | head -20`
Expected: Shows all task commits

**Step 6: Verify version in plugin.json**

Run: `cat .claude-plugin/plugin.json | jq -r .version`
Expected: 3.3.0

---

## Task 12: Return to Main Branch and Merge

**Files:**
- None (git operations only)

**Step 1: Push feature branch**

Run: `git push -u origin feature/orchestration`
Expected: Branch pushed to remote

**Step 2: Return to main working directory**

Run: `cd /Users/aaronwhaley/Documents/GitHub/superpowers`

**Step 3: Create PR for review (or merge directly)**

Option A - Create PR:
```bash
gh pr create --title "Add orchestration system (v3.3.0)" --body "Implements specialist agent orchestration system. See docs/plans/2025-10-23-orchestration-system-design.md for full design."
```

Option B - Direct merge (if no review needed):
```bash
git checkout main
git merge feature/orchestration
git push origin main
```

**Step 4: Tag release**

After merge to main:
```bash
git tag v3.3.0
git push origin v3.3.0
```

---

## Success Criteria

- ✅ All 20 specialist agents generated from skills
- ✅ Agent registry contains 20 entries with correct metadata
- ✅ Orchestrator instructions comprehensively cover delegation rules
- ✅ SessionStart hook injects orchestration context (~2500 tokens)
- ✅ Templates exist for future specialist generation and project CLAUDE.md
- ✅ Documentation updated (README, RELEASE-NOTES)
- ✅ Version bumped to 3.3.0
- ✅ All commits follow conventional commit format
- ✅ Feature branch ready for merge/PR

## Post-Implementation Testing

After merge, test orchestration mode:

1. Open Claude Code in a test project with superpowers installed
2. Request: "Fix this bug in authentication"
3. Expected: Orchestrator calls `systematic-debugging-specialist`
4. Request: "Add a new user profile feature"
5. Expected: Orchestrator calls `brainstorming-specialist` first
6. Verify specialists return structured reports
7. Verify orchestrator manages workflows correctly
