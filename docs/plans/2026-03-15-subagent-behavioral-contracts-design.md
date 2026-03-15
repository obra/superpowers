# Subagent Behavioral Contracts — Full Version Design

**Date:** 2026-03-15
**Status:** Design — awaiting approval
**Depends on:** Minimal version (SubagentStop hook blocking skill leakage) — implemented

---

## Problem Statement

Subagents dispatched by the plugin have unrestricted tool access. An implementer can review. A reviewer can edit. Any subagent can invoke skills or spawn recursive sub-subagents.

**Safety hooks (PreToolUse, PostToolUse) DO fire inside subagents** — verified by `tests/claude-code/test-subagent-hook-scope.sh` on 2026-03-15. This means destructive command blocking and secrets protection are already enforced inside subagents. The remaining gap is **role enforcement**: subagents are not restricted to their role's allowed tool set (e.g., a reviewer can still edit files).

The minimal version (shipped in v5.1.0) detects skill leakage after-the-fact via SubagentStop and forces recovery. This design extends that to a comprehensive **role-based capability system** for subagents.

## Current Hook Architecture

Based on research and verified testing (2026-03-15):

| Event | When it fires | Fires in subagents? | Can block? | Can modify? |
|-------|--------------|---------------------|------------|-------------|
| SubagentStop | After subagent finishes | N/A (subagent-level) | Yes (force continue) | No |
| PreToolUse | Before tool calls | **Yes** (verified) | Yes (deny) | No |
| PostToolUse | After tool calls | **Yes** (verified) | No | No |

**Verified:** PreToolUse and PostToolUse hooks fire inside subagents. This was confirmed by dispatching a subagent to run a command matching the `block-dangerous-commands.js` echo-secret pattern — the hook blocked it. A second test confirmed PostToolUse (`track-edits.js`) fires on subagent Write operations.

**Implications:**
- `block-dangerous-commands.js` already protects subagents from destructive commands
- `protect-secrets.js` already protects subagents from reading/writing sensitive files
- The remaining gap is **role-based tool restrictions** (e.g., preventing reviewers from editing files)

**Remaining limitations:**
- No `SubagentPreToolUse` event exists for subagent-specific interception (but global PreToolUse covers this)
- SubagentStop is reactive (post-completion), not preventive (pre-action) — useful for role violation detection
- The `Skill` tool may not be a matchable tool name in PreToolUse matchers

## Design: Defense in Depth (3 Layers)

We use three complementary layers. Safety (destructive commands, secrets) is already enforced by PreToolUse hooks firing inside subagents. These layers add **role enforcement** on top:

### Layer 1: Prompt Instructions (existing)

**What:** Every subagent prompt template includes explicit restrictions.
**Where:** `implementer-prompt.md`, `spec-reviewer-prompt.md`, `code-quality-reviewer-prompt.md`, `dispatching-parallel-agents/SKILL.md`
**Enforcement:** Soft — relies on model compliance.
**Status:** Implemented in v5.1.0.

### Layer 2: SubagentStop Guard (existing — minimal version)

**What:** Inspects subagent output for evidence of skill invocations. If found, blocks the stop and forces the subagent to redo work properly.
**Where:** `hooks/subagent-guard.js`
**Enforcement:** Reactive — catches violations after they happen but before results are accepted.
**Status:** Implemented in v5.1.0.

### Layer 3: Role-Based Behavioral Contracts (this design)

**What:** Extends the SubagentStop guard with role-specific violation detection, adds transcript-based deep inspection, and introduces a contract definition system.

## Role Definitions

### Implementer

**Purpose:** Write code that satisfies a task's requirements.

**Allowed behaviors:**
- Read files (Read, Grep, Glob)
- Edit and create files (Edit, Write)
- Run commands (Bash) — build, test, lint, git
- Search the web (WebFetch, WebSearch) — for API docs, library usage, etc.

**Prohibited behaviors:**
- Invoke any Skill tool
- Spawn subagents (Agent tool) — no recursive sub-subagents
- Run destructive Bash commands — **already enforced by PreToolUse hooks** (block-dangerous-commands.js fires inside subagents)

**Violation indicators in output:**
- References to superpowers-optimized skills
- Evidence of Agent tool dispatch ("I'm dispatching a subagent", "launching an agent")
- Evidence of Skill tool use ("I'm using the ... skill")

### Reviewer (Spec Compliance)

**Purpose:** Compare implementation against requirements and report findings.

**Allowed behaviors:**
- Read files (Read, Grep, Glob)
- Run read-only commands (Bash) — `git diff`, `git log`, test commands

**Prohibited behaviors:**
- Edit or create files (Edit, Write)
- Invoke any Skill tool
- Spawn subagents (Agent tool)
- Run write commands (Bash) — `git commit`, file modifications

**Violation indicators in output:**
- Evidence of file edits ("I've fixed", "I've updated", "I modified", "I changed the code")
- Evidence of commits ("committed the fix", "created a commit")
- References to superpowers-optimized skills

### Reviewer (Code Quality)

Same as Spec Compliance Reviewer — read-only, report-only.

## Implementation Plan

### Task 1: Contract Definition File

Create `hooks/subagent-contracts.json`:

```json
{
  "contracts": {
    "implementer": {
      "description": "Write code to satisfy task requirements",
      "violationPatterns": [
        { "id": "skill-invocation", "pattern": "superpowers-optimized:|I'm using the .+ skill", "severity": "critical" },
        { "id": "sub-subagent", "pattern": "dispatching a subagent|launching an agent|I'll dispatch", "severity": "critical" }
      ]
    },
    "reviewer": {
      "description": "Read and report findings without modifying code",
      "violationPatterns": [
        { "id": "skill-invocation", "pattern": "superpowers-optimized:|I'm using the .+ skill", "severity": "critical" },
        { "id": "file-modification", "pattern": "I've (fixed|updated|modified|changed|edited)|I (fixed|updated|modified|changed|edited) the", "severity": "high" },
        { "id": "commit-creation", "pattern": "committed|created a commit|git commit", "severity": "high" },
        { "id": "sub-subagent", "pattern": "dispatching a subagent|launching an agent", "severity": "critical" }
      ]
    }
  },
  "severityActions": {
    "critical": "block",
    "high": "block",
    "medium": "warn"
  }
}
```

**Files:** `hooks/subagent-contracts.json` (new)
**Verification:** File exists and is valid JSON

### Task 2: Enhanced SubagentStop Guard

Extend `hooks/subagent-guard.js` to:
1. Load contracts from `subagent-contracts.json`
2. Detect the subagent's role from context (agent_type, last_assistant_message patterns)
3. Apply role-specific violation patterns instead of the current flat list
4. Include severity-based actions (block vs. warn)
5. Provide role-specific recovery instructions when blocking

Role detection heuristic:
- If `agent_type` matches a known agent name (e.g., `code-reviewer`) → reviewer contract
- If `last_assistant_message` contains implementation evidence (commit SHAs, "files changed", "implemented") → implementer contract
- If `last_assistant_message` contains review evidence ("findings", "PASS/FAIL", "verdict") → reviewer contract
- Default → implementer contract (most restrictive for unknown roles)

**Files:** `hooks/subagent-guard.js` (modify)
**Verification:** Run with test payloads for each role

### Task 3: Transcript Deep Inspection (Optional Enhancement)

If `agent_transcript_path` is available in the SubagentStop input, parse the transcript JSONL to detect:
- Actual Skill tool invocations (not just output text patterns)
- Actual Edit/Write tool use by reviewers
- Actual Agent tool use (sub-subagent spawning)
- Actual destructive Bash commands

This is more reliable than text pattern matching on the output, since it checks what actually happened rather than what the subagent said it did.

**Files:** `hooks/subagent-guard.js` (modify)
**Verification:** Create test transcript files and verify detection

### Task 4: Violation Dashboard

Extend `stop-reminders.js` to include subagent violation stats in the session summary:
- Number of subagent violations detected this session
- Which roles violated which contracts
- Recovery actions taken

Example output:
```
Subagent guard: 1 violation blocked (implementer invoked skills → forced redo)
```

**Files:** `hooks/stop-reminders.js` (modify), reads `~/.claude/hooks-logs/subagent-violations.jsonl`
**Verification:** Trigger a violation and verify it appears in stop summary

### Task 5: Documentation

Update skill files to reference the contract system:
- `subagent-driven-development/SKILL.md` — note that behavioral contracts are enforced by the SubagentStop hook
- `dispatching-parallel-agents/SKILL.md` — same note
- README — update hook descriptions

**Files:** Multiple skill files, README.md
**Verification:** Read updated files

## Risks and Mitigations

### False positives

**Risk:** The text pattern matching might flag legitimate subagent output. For example, a reviewer saying "I found that the using-superpowers skill is referenced correctly" would trigger the violation detector.

**Mitigation:** Use patterns that match invocation behavior, not just mentions. E.g., "I'm using the X skill" (invocation) vs. "the X skill is referenced" (mention). Start conservative (only block clear invocations) and tune based on violation logs.

### Role detection errors

**Risk:** The heuristic might assign the wrong contract to a subagent.

**Mitigation:** Default to implementer contract (most restrictive for non-reviewer behaviors). Reviewers being misclassified as implementers is safe (they're still blocked from skills). Implementers being misclassified as reviewers would falsely block legitimate edits — but the heuristic keys on output patterns that reviewers would not produce.

### Performance overhead

**Risk:** Transcript parsing (Task 3) could be slow for long subagent sessions.

**Mitigation:** Only parse the last N lines of the transcript (violations tend to appear near the end). Set a size limit — if transcript exceeds 1MB, fall back to text pattern matching only.

### Subagent infinite loop

**Risk:** Blocking a subagent's stop forces it to continue. If it keeps violating, we get an infinite block-retry loop.

**Mitigation:** Track consecutive blocks per subagent (via the violation log). After 2 consecutive blocks for the same subagent, allow the stop and log a critical warning instead. The main session will see the warning in its context.

## Implementation Order

1. Task 1 (contract definition) — foundation, no risk
2. Task 2 (enhanced guard) — core logic, moderate complexity
3. Task 4 (violation dashboard) — visibility, low risk
4. Task 5 (documentation) — always last
5. Task 3 (transcript inspection) — optional enhancement, highest complexity

Tasks 1-2 should be implemented together. Tasks 3-5 are independent.

## Success Criteria

- Subagent skill leakage is detected and blocked in 100% of cases where the subagent mentions skills in its output
- Reviewer subagents that attempt file edits are detected and blocked
- No false positives on legitimate subagent output during normal plan execution
- Violation logs provide clear evidence for debugging
- Session summary includes violation stats when violations occur
- No infinite loops — consecutive blocks are capped at 2
