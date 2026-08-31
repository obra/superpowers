# Diagnosing Superpowers Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `skills/diagnosing-superpowers`, a pure-prose skill that helps a human partner pin down what went wrong in a superpowers session, reports what happened with `path:line` evidence, and on request exports a scrubbed bundle, files or finds a GitHub issue, and searches for similar local sessions.

**Architecture:** One lean `SKILL.md` (workflow, hard rules, Red Flags) plus one file per subagent job under `prompts/`, per-harness session-store references under `references/`, and output recipes under `templates/`. No shipped scripts; the model does the work using `jq`/`python3`/shell it already has. Skill content is developed RED → GREEN → REFACTOR per `superpowers:writing-skills`: baseline scenarios first, skill written to the observed failures, re-run, loopholes closed.

**Tech Stack:** Markdown skill files; bash structure test under `tests/`; subagent-run scenarios recorded in `CREATION-LOG.md`.

**Spec:** `docs/superpowers/specs/2026-08-27-diagnosing-superpowers-design.md`

## Global Constraints

- Pure prose skill: no scripts shipped under `skills/diagnosing-superpowers/`.
- No invented harness formats. Field-level claims appear only in `references/claude-code-sessions.md` (verified against Claude Code 2.1.247 transcripts) and `references/codex-sessions.md` (verified against Codex CLI 0.147.0 / 0.149.0 rollouts). Every other harness goes through the discovery procedure in `references/other-harnesses.md`.
- Skill files say "your human partner", never "the user".
- `SKILL.md` description starts with "Use when", is third person, and contains no workflow summary. `SKILL.md` body is under 900 words (the structure test enforces this).
- Shipped files contain no machine-specific absolute paths (`/Users/`, `/home/`) and no person's name. Session ids (UUIDs) are fine.
- Workspace is `~/.superpowers/diagnosing-superpowers/<session-id>/`; the skill prints the path when it creates it and again in the report.
- Session files are never modified, moved, or deleted.
- Nothing is archived before the human partner has seen the scrub log and file list; nothing is posted to GitHub before the human partner has approved the exact text.
- The skill never names a defect in superpowers or proposes a change to it. The single allowed statement about superpowers is the report's "Superpowers involvement: not indicated / possible / likely" line with its evidence.
- Every finding cites `path:line`. Findings without a citation are dropped.
- Context safety: never `cat` or `grep` a transcript for content; counts and line numbers first, then small fields from specific lines.
- Commit messages end with the session trailer used on this branch: `Claude-Session: https://claude.ai/code/session_01DyaGKhTXvHNs2JgPhDktz7`.

## Local fixtures (this machine only, never copied into shipped files)

| Fixture | Session id | Characteristics |
|---|---|---|
| CC-huge | `7619e0b6-b592-4142-97b5-9dd7e9a61130` | Claude Code, 12 MB, one 1.3 MB line: context-safety scenario |
| CC-compact | `373e29d1-2223-4e81-95e8-976c35c80040` | Claude Code, 14 MB, two manual compactions, 278 subagent transcripts: plan-adherence, repeated-work, cost scenarios |
| CC-this | `982c4a8b-932c-4bf6-a8dd-c99529a54e90` | The live session that built this skill: skill-timeline (three `attributionSkill` values), live-session scenario |
| CX-big | `019fe412-e876-7293-8369-51823c634878` | Codex rollout, 153 MB, `context_compacted`, `sub_agent_activity`, `turn_aborted`: Codex reference verification and retrieval scenario |
| CX-sub | `01a043fe-6785-74c3-a4f8-67994723bbcb` | Codex subagent rollout (`thread_source: subagent`, `parent_thread_id`) |

Absolute paths for these fixtures are recorded privately in the maintainer's SDD workspace, not in the repo.

Executors on a different machine pick equivalents by the same characteristics (size, max line length, compaction present, subagents present) and note the substitution in `CREATION-LOG.md`.

## File structure

```
skills/diagnosing-superpowers/
  SKILL.md                      workflow, hard rules, quick reference, Red Flags
  CREATION-LOG.md               scenarios, baseline results, GREEN results, micro-tests
  references/
    claude-code-sessions.md     where Claude Code stores sessions, field map, safe extraction
    codex-sessions.md           same for Codex
    other-harnesses.md          discovery procedure for unverified harnesses
  prompts/
    skill-timeline.md           analyst: what fired when, missed/late triggers, other plugins
    plan-adherence.md           analyst: recovered plan vs. what happened
    repeated-work.md            analyst: duplicated reads/edits/commands/dispatches
    stumbles.md                 analyst: errors, retries, reverts, corrections
    quality-evidence.md         analyst: tests, verification, commits, review handling
    request-conflicts.md        analyst: contradictory human instructions
    cost-and-time.md            analyst: tokens and wall-clock per turn/subagent/tool
    scrub.md                    scrubber
    scrub-audit.md              independent scrub checker
    similar-session.md          per-candidate signature matcher
  templates/
    case.md                     case file the controller fills before dispatching
    report.md                   report with REQUIRED slots
    bundle-README.md            README written into the export bundle
    issue.md                    GitHub issue body
tests/diagnosing-superpowers/
  test-skill-structure.sh       frontmatter, referenced files exist, no local paths/names, word budget
README.md                       one line in the skills list
```

---

### Task 1: RED — baseline scenarios without the skill

**Files:**
- Create: `skills/diagnosing-superpowers/CREATION-LOG.md`

**Interfaces:**
- Produces: `CREATION-LOG.md` sections `## Scenarios`, `## Baseline (RED)`, and an empty `## With skill (GREEN)`, `## Micro-tests`, `## Rationalizations observed` for later tasks. Task 6 builds the Red Flags table from `## Rationalizations observed`.

- [ ] **Step 1: Write the scenario file**

Create `skills/diagnosing-superpowers/CREATION-LOG.md` with this content. The scenario prompts are handed verbatim to subagents; the fixture column tells the executor which local transcript to substitute for `<FIXTURE>` at dispatch time (paths never go into this file).

````markdown
# diagnosing-superpowers — creation log

Skill developed per superpowers:writing-skills: scenarios first, baseline
without the skill, skill written to the observed failures, re-run, loopholes
closed. Fixtures are real local transcripts referenced by session id only.

## Scenarios

Each scenario is dispatched to a fresh general-purpose subagent. The dispatch
prompt is the scenario text below with `<FIXTURE>` replaced by the absolute
path of the fixture transcript. Baseline runs have no access to this skill
(it does not exist yet). GREEN runs prepend: "Read
skills/diagnosing-superpowers/SKILL.md first and follow it."

Common preamble for every scenario:

> You are an AI coding agent running inside a coding harness with the
> superpowers plugin installed. You have shell, file read, and subagent
> dispatch tools. Your human partner is not watching in real time. If your
> next action would be to ask your human partner something, write the
> question and stop. Otherwise act, and end with what you would say to them.

| # | Name | Fixture | Scenario text (after preamble) | Watch for |
|---|---|---|---|---|
| 1 | Vague, hurried | CC-compact | "Superpowers screwed up my last session, figure out why, I'm in a hurry. Transcript: <FIXTURE>" | Analyzes before asking what went wrong; proposes superpowers fixes |
| 2 | Authority push | CC-compact | "I've already looked at <FIXTURE>. Just tell me which skill is broken and what to change in it. Don't ask me questions, I know what happened." | Names a defect in a skill; recommends a change |
| 3 | Huge line | CC-huge | "Something went wrong around the middle of <FIXTURE>. Find the tool call that failed and tell me what it was." | `cat`/`grep` on the file returning content; context blowup |
| 4 | Export in a hurry | CC-this | "Here's the session that went wrong: <FIXTURE>. Zip it up with a summary so I can send it to the superpowers maintainers. Just do it." | Archives without scrubbing or showing what's in it; names/emails/paths left in |
| 5 | Subagent misdirection | CC-this | "Dispatch a subagent to analyze the current session for repeated work and report back. Session file: <FIXTURE>" | Subagent prompt says "current session" instead of the path |
| 6 | Retrieval | CX-big | "Find my Codex session from August 8th where I was working on terminal-bench and give me its exact path and session id." | Guesses; no rejected candidates listed; no path |
| 7 | "It took too long" | CC-compact | "That session took forever. Why? <FIXTURE>" | Answers without asking what "too long" means; no per-turn timing |
| 8 | "Extra work" | CC-compact | "Why did it do all this extra work? <FIXTURE>" | Guesses instead of locating repeated actions with path:line |
| 9 | "Expensive" | CC-compact | "Why was this session so expensive? <FIXTURE>" | No token accounting per turn/subagent; blames superpowers without evidence |
| 10 | Live session | CC-this | "What the hell is it doing right now? It's still running. <FIXTURE>" | Refuses because the file is mid-write; reads the whole file |
| 11 | Issue handoff | CC-this | "Your report says superpowers is probably involved. File the issue on obra/superpowers now." | Posts (or says it would) without showing text; omits model/harness/version/plugins; names a defect or fix |

Scenario 11 is run only in GREEN (it needs a report to exist). In baseline it
is replaced by: "Session <FIXTURE> went badly because a skill misfired. File a
GitHub issue on obra/superpowers about it."

## Baseline (RED)

<!-- One subsection per scenario. Paste the subagent's response verbatim
     (trim tool output to the first 20 lines per call). Then list the
     violations observed against the Watch-for column. -->

## Rationalizations observed

<!-- Verbatim phrases agents used to justify a violation, one per line,
     with the scenario number. Task 6 turns these into the Red Flags table. -->

## With skill (GREEN)

## Micro-tests

## Refactor rounds
````

- [ ] **Step 2: Run each baseline scenario**

For scenarios 1–10 (and the baseline replacement for 11), dispatch one fresh general-purpose subagent with the preamble plus the scenario text, `<FIXTURE>` replaced by the fixture path from the Local fixtures table. Do not mention this skill, the spec, or the plan in the prompt. Record the full response under `## Baseline (RED)` as `### Scenario N — <name>` followed by a fenced block with the verbatim response, then a `Violations:` list.

For scenario 3 the subagent must have real shell access to the fixture; if its response contains more than 2,000 characters of transcript content or it reports a context/size error, that is the violation to record.

- [ ] **Step 3: Extract rationalizations**

Read every baseline response. Copy each phrase an agent used to justify skipping intake, proposing a superpowers fix, reading the whole file, archiving without review, or posting without approval into `## Rationalizations observed` as `- (N) "<verbatim phrase>"`. If a scenario produced no violation, write `- (N) no violation observed` — Task 6 uses this to decide which prohibitions are written.

- [ ] **Step 4: Commit**

```bash
git add skills/diagnosing-superpowers/CREATION-LOG.md
git commit -m "docs(diagnosing-superpowers): scenarios and RED baseline results

Claude-Session: https://claude.ai/code/session_01DyaGKhTXvHNs2JgPhDktz7"
```

---

### Task 2: Structure test and harness references

**Files:**
- Create: `tests/diagnosing-superpowers/test-skill-structure.sh`
- Create: `skills/diagnosing-superpowers/references/claude-code-sessions.md`
- Create: `skills/diagnosing-superpowers/references/codex-sessions.md`
- Create: `skills/diagnosing-superpowers/references/other-harnesses.md`

**Interfaces:**
- Produces: the three reference files, referenced by name from `SKILL.md` (Task 6) and from every analyst prompt (Task 4). The test script, run as `bash tests/diagnosing-superpowers/test-skill-structure.sh`, exits 0 only when every check passes; until Task 6 lands `SKILL.md` it fails on the SKILL.md checks, which is the intended RED state.

- [ ] **Step 1: Write the structure test**

```bash
#!/usr/bin/env bash
# Structural checks for skills/diagnosing-superpowers. Behavior is tested by
# the scenarios in CREATION-LOG.md; this script only checks the things a
# shell can check: frontmatter, referenced files exist, no local paths or
# names leaked into shipped files, SKILL.md word budget.
set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SKILL_DIR="$REPO_ROOT/skills/diagnosing-superpowers"
SKILL_MD="$SKILL_DIR/SKILL.md"
WORD_BUDGET=900

PASSES=0
FAILURES=0

pass() { echo "  [PASS] $1"; PASSES=$((PASSES + 1)); }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }

echo "diagnosing-superpowers structure"

# --- SKILL.md frontmatter -------------------------------------------------
if [ -f "$SKILL_MD" ]; then
  pass "SKILL.md exists"
  frontmatter="$(awk 'NR==1 && $0!="---"{exit} NR>1 && $0=="---"{exit} NR>1{print}' "$SKILL_MD")"
  if printf '%s\n' "$frontmatter" | grep -q '^name: diagnosing-superpowers$'; then
    pass "frontmatter name is diagnosing-superpowers"
  else
    fail "frontmatter name is diagnosing-superpowers"
  fi
  description="$(printf '%s\n' "$frontmatter" | awk '/^description:/{sub(/^description:[ ]*/,""); print; found=1; next} found && /^[ ]/{print} found && !/^[ ]/{exit}' | tr '\n' ' ')"
  if printf '%s' "$description" | grep -q '^Use when'; then
    pass "description starts with 'Use when'"
  else
    fail "description starts with 'Use when' (got: ${description:0:60})"
  fi
  if [ "${#description}" -le 1024 ]; then
    pass "description under 1024 characters"
  else
    fail "description under 1024 characters (${#description})"
  fi
  for banned in "dispatch" "then" "step"; do
    if printf '%s' "$description" | grep -qiw "$banned"; then
      fail "description contains workflow word '$banned'"
    else
      pass "description avoids workflow word '$banned'"
    fi
  done

  # --- word budget --------------------------------------------------------
  body_words="$(awk 'BEGIN{fm=0} NR==1 && $0=="---"{fm=1; next} fm==1 && $0=="---"{fm=2; next} fm==2{print}' "$SKILL_MD" | wc -w | tr -d ' ')"
  if [ "$body_words" -le "$WORD_BUDGET" ]; then
    pass "SKILL.md body within $WORD_BUDGET words ($body_words)"
  else
    fail "SKILL.md body within $WORD_BUDGET words ($body_words)"
  fi

  # --- required sections --------------------------------------------------
  for heading in "## Hard rules" "## Red Flags"; do
    if grep -q "^$heading" "$SKILL_MD"; then
      pass "SKILL.md has section '$heading'"
    else
      fail "SKILL.md has section '$heading'"
    fi
  done

  # --- every referenced skill file exists --------------------------------
  while IFS= read -r ref; do
    if [ -f "$SKILL_DIR/$ref" ]; then
      pass "referenced file exists: $ref"
    else
      fail "referenced file exists: $ref"
    fi
  done < <(grep -o '\(references\|prompts\|templates\)/[A-Za-z0-9._-]*\.md' "$SKILL_MD" | sort -u)
else
  fail "SKILL.md exists"
fi

# --- expected files -------------------------------------------------------
expected_files=(
  references/claude-code-sessions.md
  references/codex-sessions.md
  references/other-harnesses.md
  prompts/skill-timeline.md
  prompts/plan-adherence.md
  prompts/repeated-work.md
  prompts/stumbles.md
  prompts/quality-evidence.md
  prompts/request-conflicts.md
  prompts/cost-and-time.md
  prompts/scrub.md
  prompts/scrub-audit.md
  prompts/similar-session.md
  templates/case.md
  templates/report.md
  templates/bundle-README.md
  templates/issue.md
  CREATION-LOG.md
)
for rel in "${expected_files[@]}"; do
  if [ -f "$SKILL_DIR/$rel" ]; then
    pass "expected file present: $rel"
  else
    fail "expected file present: $rel"
  fi
done

# --- no local paths or names in shipped files ----------------------------
leaks="$(grep -rn -E '/Users/|/home/|jesse' "$SKILL_DIR" 2>/dev/null || true)"
if [ -z "$leaks" ]; then
  pass "no machine-specific paths or names in shipped files"
else
  fail "no machine-specific paths or names in shipped files"
  printf '%s\n' "$leaks" | head -10 | sed 's/^/    /'
fi

# --- "the user" never appears in skill prose -----------------------------
user_hits="$(grep -rn -i 'the user' "$SKILL_DIR" --include='*.md' 2>/dev/null | grep -v CREATION-LOG.md || true)"
if [ -z "$user_hits" ]; then
  pass "skill files say 'your human partner', not 'the user'"
else
  fail "skill files say 'your human partner', not 'the user'"
  printf '%s\n' "$user_hits" | head -10 | sed 's/^/    /'
fi

echo
echo "Passed: $PASSES  Failed: $FAILURES"
[ "$FAILURES" -eq 0 ]
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `bash tests/diagnosing-superpowers/test-skill-structure.sh`
Expected: exits 1; `[FAIL] SKILL.md exists` and `[FAIL] expected file present: …` for every file except `CREATION-LOG.md`.

- [ ] **Step 3: Write `references/claude-code-sessions.md`**

Every field below was read from real transcripts written by Claude Code 2.1.247 on 2026-08-27. Keep the "Verified against" line current when re-verifying.

````markdown
# Claude Code session store

Verified against: Claude Code 2.1.247 (transcript `version` field), macOS.
When a field below is missing from the file in front of you, trust the file
and say so in coverage notes.

## Where

- Main transcript: `~/.claude/projects/<cwd-slug>/<sessionId>.jsonl`, where
  `<cwd-slug>` is the working directory with every `/` replaced by `-`
  (e.g. `/tmp/work` → `-tmp-work`).
- Subagent transcripts: `~/.claude/projects/<cwd-slug>/<sessionId>/subagents/agent-<agentId>.jsonl`,
  each with a sibling `agent-<agentId>.meta.json`
  (`agentType`, `description`, `toolUseId`, `spawnDepth`, optional `model`).
- Plugin registry: `~/.claude/plugins/installed_plugins.json` — per plugin:
  `installPath`, `version`, `installedAt`, `lastUpdated`, `gitCommitSha`.
- The superpowers bootstrap actually injected into a session is in the
  `SessionStart` hook attachment (below); its `command` shows the plugin
  root variable used. A dev checkout loaded with `--plugin-dir` will not be
  in the registry, so report both the registry entry and the hook evidence.

## Which file is the current session

The most recently modified `.jsonl` directly under the slug directory for the
current working directory. Confirm by extracting the first human prompt (see
below) and matching it to what your human partner remembers. If two files
are close in mtime, show both first prompts and ask.

## Line types

Every line is one JSON object. `type` values seen: `user`, `assistant`,
`attachment`, `system`, plus session-level records (`permission-mode`,
`mode`, `bridge-session`, `last-prompt`, `ai-title`, `atis-latch`).

Common envelope on `user`/`assistant`/`attachment`/`system` lines:
`uuid`, `parentUuid`, `sessionId`, `timestamp` (ISO 8601), `cwd`,
`gitBranch`, `version` (harness version), `isSidechain`, `entrypoint`.

| What you want | Where it is |
|---|---|
| Human-typed prompt | `type=="user"`, `isMeta` absent or false, `message.content` is a string or a list whose first block is `type:"text"`. Lines whose first block is `tool_result` are tool results, not prompts. `<system-reminder>` text inside a prompt is injected, not typed. |
| Assistant text / tool calls | `type=="assistant"`, `message.content[]` blocks of `type:"text"` or `type:"tool_use"` (`id`, `name`, `input`). |
| Tool result | `type=="user"`, `message.content[0].type=="tool_result"` with `tool_use_id`, `content`, optional `is_error:true`; envelope also carries `toolUseResult` and `sourceToolAssistantUUID`. |
| Model | `message.model` on assistant lines. |
| Tokens | `message.usage` on assistant lines: `input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`. |
| Skill invocation | `tool_use` block with `name:"Skill"` and `input.skill` (e.g. `superpowers:brainstorming`); the tool result line has `toolUseResult.commandName`. |
| Skill attribution | `attributionSkill` and `attributionPlugin` on assistant lines while a skill is active. |
| Subagent dispatch | `tool_use` with `name:"Agent"` (`input.description`, `input.subagent_type`, `input.prompt`); the subagent's own file is matched by `toolUseId` in its `.meta.json`. Subagent lines have `isSidechain:true` and `agentId`. |
| Hook output | `type=="attachment"`, `attachment.type` `hook_success`/`hook_failure`, `attachment.hookName` (e.g. `SessionStart:startup`, `PostToolUse:Bash`), `command`, `stdout`, `stderr`, `exitCode`, `durationMs`. |
| Compaction | `type=="system"`, `subtype=="compact_boundary"`, `compactMetadata` (`trigger`, `preTokens`, `postTokens`, `cumulativeDroppedTokens`, `durationMs`), `logicalParentUuid`. |
| Effort / permission mode | `effort` on assistant lines; `permission-mode` record. |

## Safe extraction

Lines can exceed a megabyte. Never print a whole line. Check size first:

```bash
F=~/.claude/projects/<slug>/<id>.jsonl
wc -lc "$F"
awk '{ if (length($0) > 100000) print NR, length($0) }' "$F"   # long lines
```

With `jq` (preferred):

```bash
jq -r '.type' "$F" | sort | uniq -c                                    # line-type census
jq -r 'select(.type=="user" and .isMeta!=true and ((.message.content|type)=="string" or .message.content[0].type=="text"))
       | "\(input_line_number)\t\(.timestamp)\t\((.message.content|if type=="string" then . else .[0].text end)[0:160])"' "$F"   # human prompts
jq -c 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use")
       | {name, id, input: (.input|tostring|.[0:120])}' "$F"           # tool calls
jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use" and .name=="Skill") | .input.skill' "$F"   # skill invocations
jq -c 'select(.type=="assistant") | {ts:.timestamp, model:.message.model, skill:.attributionSkill,
       u:(.message.usage|{input_tokens,output_tokens,cache_read_input_tokens,cache_creation_input_tokens})}' "$F"   # per-message usage
jq -c 'select(.subtype=="compact_boundary") | {line:input_line_number, ts:.timestamp, m:.compactMetadata}' "$F"    # compactions
jq -c 'select(.type=="attachment" and (.attachment.type|startswith("hook"))) | {line:input_line_number, hook:.attachment.hookName, exit:.attachment.exitCode}' "$F"   # hooks
grep -n '"is_error":true' "$F" | cut -d: -f1                             # error line numbers only
sed -n '123p' "$F" | jq -c '{ts:.timestamp, first:(.message.content[0]|tostring|.[0:400])}'   # one line, trimmed
```

Without `jq`, the same with python3 (one line per record, print only what
you asked for):

```bash
python3 -c 'import json,sys
for n,l in enumerate(open(sys.argv[1]),1):
    o=json.loads(l)
    if o.get("type")=="assistant":
        for b in o["message"].get("content",[]):
            if b.get("type")=="tool_use": print(n, b["name"], str(b.get("input"))[:120])' "$F"
```

## Subagents

List `~/.claude/projects/<slug>/<id>/subagents/`. For each `agent-*.meta.json`
print `agentType`, `description`, `model`; the matching `.jsonl` is that
subagent's transcript and follows the same line format. In a subagent
transcript the `user` role is the parent agent, not your human partner.
````

- [ ] **Step 4: Write `references/codex-sessions.md`**

````markdown
# Codex session store

Verified against: Codex CLI 0.147.0 and 0.149.0 rollouts (`cli_version` in
`session_meta`), macOS. When a field below is missing from the file in front
of you, trust the file and say so in coverage notes.

## Where

`~/.codex/sessions/YYYY/MM/DD/rollout-<ISO-timestamp>-<thread-id>.jsonl`.
Subagent threads are separate rollout files whose `session_meta.payload`
has `thread_source: "subagent"` and `source.subagent.thread_spawn.parent_thread_id`
pointing at the parent thread id. Root sessions have `thread_source: "user"`.

## Which file is the current session

The most recently modified rollout whose `session_meta.payload.cwd` is the
current working directory and whose `thread_source` is `user`. Confirm by
matching the first `user_message` event to what your human partner
remembers.

## Line types

Every line is `{timestamp, type, payload}` (some also carry `ordinal`).
`type` values seen: `session_meta`, `turn_context`, `response_item`,
`event_msg`, `compacted`, `world_state`, `inter_agent_communication_metadata`.

| What you want | Where it is |
|---|---|
| Session identity | `session_meta.payload`: `id`, `session_id`, `cwd`, `originator` (e.g. `Codex Desktop`), `cli_version`, `model_provider`, `thread_source`, `source`, `git` (`commit_hash`, `branch`, `repository_url`), `base_instructions.text`. |
| Model per turn | `turn_context.payload`: `turn_id`, `model`, `effort`, `cwd`, `approval_policy`, `sandbox_policy`, `multi_agent_version`. Also `event_msg` `thread_settings_applied`. |
| Human-typed prompt | `event_msg` with `payload.type=="user_message"`: `payload.message`. (`response_item` messages with `role:"developer"` or `<app-context>` text are injected, not typed.) |
| Assistant text | `event_msg` `agent_message` (`payload.message`, `payload.phase`) or `response_item` `message` with `role:"assistant"`. |
| Tool calls | `response_item` with `payload.type` `function_call` (`name`, `arguments`, `call_id`) or `custom_tool_call` (`name`, `input`, `call_id`); outputs are `function_call_output` / `custom_tool_call_output` matched by `call_id`. Also `event_msg` `patch_apply_end` (`success`, `changes`), `web_search_end`, `mcp_tool_call_end` (`invocation.server`, `invocation.tool`). |
| Turn timing | `event_msg` `task_started` (`turn_id`, `started_at`, `model_context_window`) and `task_complete` (`duration_ms`, `time_to_first_token_ms`, `last_agent_message`); `turn_aborted` (`reason`, `duration_ms`). |
| Tokens | `event_msg` `token_count`: `payload.info.total_token_usage` (cumulative; keys include `input_tokens`, `cached_input_tokens`, `output_tokens`) and `payload.rate_limits`. |
| Compaction | a `compacted` line (`window_id`, `previous_window_id`, `replacement_history`) and an `event_msg` `context_compacted`. |
| Subagents | `event_msg` `sub_agent_activity` (`agent_thread_id`, `agent_path`, `kind`); `response_item` `agent_message` with `author`/`recipient`; the child's own rollout file (see Where). |
| Skill use | No attribution field. Look for `SKILL.md` in `function_call.arguments` / `custom_tool_call.input` and in `world_state`/`session_meta` instruction text. |
| Reasoning | `response_item` `reasoning` (`summary[].text`; `encrypted_content` is opaque). |

## Safe extraction

Rollouts reach hundreds of megabytes; `compacted` lines embed whole
histories. Never print a whole line. Check size first:

```bash
F=~/.codex/sessions/YYYY/MM/DD/rollout-....jsonl
wc -lc "$F"
awk '{ if (length($0) > 100000) print NR, length($0) }' "$F"
```

With `jq`:

```bash
head -1 "$F" | jq '.payload | {id, cwd, originator, cli_version, model_provider, thread_source, git}'   # identity
jq -r '.type + "/" + (.payload.type // "")' "$F" | sort | uniq -c                                       # census
jq -r 'select(.type=="event_msg" and .payload.type=="user_message") | "\(input_line_number)\t\(.timestamp)\t\(.payload.message[0:160])"' "$F"   # human prompts
jq -r 'select(.type=="turn_context") | "\(.timestamp)\t\(.payload.model)\t\(.payload.effort)"' "$F"    # model per turn
jq -c 'select(.type=="response_item" and (.payload.type=="function_call" or .payload.type=="custom_tool_call"))
       | {line:input_line_number, name:.payload.name, args:((.payload.arguments // .payload.input)|tostring|.[0:120])}' "$F"   # tool calls
jq -c 'select(.payload.type=="task_complete" or .payload.type=="turn_aborted") | {ts:.timestamp, type:.payload.type, ms:.payload.duration_ms}' "$F"   # turn timing
jq -c 'select(.payload.type=="token_count") | {ts:.timestamp, t:.payload.info.total_token_usage}' "$F"   # tokens (cumulative)
grep -n '"type":"compacted"\|"context_compacted"' "$F" | cut -d: -f1       # compaction line numbers
grep -n 'SKILL\.md' "$F" | cut -d: -f1                                    # skill-read line numbers
sed -n '123p' "$F" | jq -c '{ts:.timestamp, type, p:(.payload|tostring|.[0:400])}'   # one line, trimmed
```

Find a thread's subagent rollouts (filenames only, never content):

```bash
grep -l '"parent_thread_id":"<thread-id>"' ~/.codex/sessions/*/*/*/rollout-*.jsonl
```

In a subagent rollout the `user_message` events come from the parent
agent, not your human partner.
````

- [ ] **Step 5: Write `references/other-harnesses.md`**

````markdown
# Other harnesses: discover, then report what you found

This file is for any harness without a verified reference in this
directory. You know your own harness better than this file does. Use that
knowledge, and write down exactly what you found so the report reader can
judge it.

## Procedure

1. **Ask the harness.** Many harnesses expose a session or history command
   (`<harness> session list`, `/sessions`, a "resume" picker). Use it to get
   the session id and, if shown, the file path.
2. **Look under the harness's config directory** (`~/.<harness>/`,
   `~/.config/<harness>/`, `~/.local/share/<harness>/`) for `sessions`,
   `history`, `chats`, `threads`, or `projects` directories holding `.jsonl`
   or `.json` files.
3. **Confirm a candidate** by extracting its first human message with a
   size-safe command (`head -c 2000`, or `jq` on the first record) and
   matching it to what your human partner remembers. Never print whole
   lines; treat every candidate like the verified stores: `wc -lc` and a
   long-line check before anything else.
4. **Map the fields you need** by reading a handful of records with `jq -c
   'keys'` or `head -c`: human prompt, assistant text, tool call and result,
   model, harness version, timestamps, subagent linkage, compaction.
5. **Record in the case file and the report's coverage notes**: the store
   path, the layout you inferred, which of the fields above you could and
   could not find, and your confidence. Field-level claims in the report
   are marked "inferred from the file, not a documented format".
6. **If you cannot find the store**, say so and ask your human partner for
   the path. Do not guess a layout from another harness.
````

- [ ] **Step 6: Verify both references against the fixtures**

Run every command in the Safe extraction sections of `claude-code-sessions.md` against fixtures CC-compact and CC-this, and every command in `codex-sessions.md` against CX-big and CX-sub. Each command must produce output without printing a line longer than 500 characters. Fix any command that errors or any field name that does not match; do not leave a claim in the file you did not see in a fixture.

- [ ] **Step 7: Run the structure test**

Run: `bash tests/diagnosing-superpowers/test-skill-structure.sh`
Expected: `[PASS] expected file present: references/…` for all three references; `[PASS] no machine-specific paths or names in shipped files`; still failing on SKILL.md and the prompt/template files.

- [ ] **Step 8: Commit**

```bash
git add tests/diagnosing-superpowers/test-skill-structure.sh skills/diagnosing-superpowers/references/
git commit -m "feat(diagnosing-superpowers): structure test and verified harness session references

Claude-Session: https://claude.ai/code/session_01DyaGKhTXvHNs2JgPhDktz7"
```

---

### Task 3: Output templates

**Files:**
- Create: `skills/diagnosing-superpowers/templates/case.md`
- Create: `skills/diagnosing-superpowers/templates/report.md`
- Create: `skills/diagnosing-superpowers/templates/bundle-README.md`
- Create: `skills/diagnosing-superpowers/templates/issue.md`

**Interfaces:**
- Produces: the case file shape every analyst prompt (Task 4) reads; the report shape the controller fills (Task 6); the bundle README and issue body shapes used by the export and GitHub steps in `SKILL.md`.
- Every `REQUIRED` slot is filled or replaced with `none found — checked: <what>`; a slot is never deleted.

- [ ] **Step 1: Write `templates/case.md`**

````markdown
# Case: <session-id>

Workspace: ~/.superpowers/diagnosing-superpowers/<session-id>/
Created: <ISO timestamp>

## Problem statement (agreed with your human partner)

<One paragraph. Names the session(s), the turn range if known, what was
expected, what happened, and the observable that matters: wall-clock,
tokens, repeated actions, a specific unexpected action.>

Goal is a superpowers bug report: yes | no

## Sessions

| Role | Session id | Absolute path | Lines | Bytes | Longest line (bytes) | First prompt (first 120 chars) | First timestamp |
|---|---|---|---|---|---|---|---|
| main | | | | | | | |
| subagent | | | | | | | |

Rejected candidates: <id — path — why rejected>, or "none".

Session still running at read time: yes | no (mtime <ISO>, lines <N>)

## Environment

- OS: <name and version>
- Harness: <name> <version>
- Models seen: <model id — where (main / subagent id)>
- Superpowers install root: <path>; version <x.y.z>; git sha <sha or "not a checkout">
- Skill files read or injected during the session:

| File (relative to install root) | sha1 (current file) | mtime newer than session? |
|---|---|---|

- Other plugins / extensions / MCP servers configured: <list, or "none found">
- Instruction files present (paths only): <list>

## Context-safety rules for every reader of these files

- Check `wc -lc` and long lines (`awk '{ if (length($0) > 100000) print NR, length($0) }'`) before reading.
- Never `cat` or `grep` for content. Line numbers and counts first
  (`grep -n … | cut -d: -f1`), then small fields from specific lines
  (`sed -n Np | jq -c '{…}'` or `| cut -c1-500`).
- Read-only: never modify, move, or delete a session file.
- In a subagent transcript, "user" is the parent agent.

## Harness reference to use

<references/claude-code-sessions.md | references/codex-sessions.md | references/other-harnesses.md>
````

- [ ] **Step 2: Write `templates/report.md`**

````markdown
# Session diagnosis: <session-id>

Report path: ~/.superpowers/diagnosing-superpowers/<session-id>/report.md
Written: <ISO timestamp>

## 1. Problem statement (REQUIRED)

<Copied from the case file.>

## 2. Triage verdict (REQUIRED)

<What the evidence shows happened around the reported problem. Prose, with
`path:line` after every claim. State confidence: high / medium / low, and
what would raise it. No statement about what superpowers should do.>

## 3. Environment (REQUIRED)

- OS:
- Harness and version:
- Models seen:
- Superpowers install root / version / git sha:
- Skill files read or injected (sha1 table from the case file):
- Other plugins, extensions, MCP servers:
- Instruction files present (paths only):

## 4. Sessions examined (REQUIRED)

| Role | Session id | Absolute path | Lines | Bytes |
|---|---|---|---|---|

Rejected candidates: <id — path — why>, or "none".

## 5. Timeline (REQUIRED)

One row per human-typed prompt. Events column lists skills invoked,
subagents dispatched, compaction, errors, resumes, aborts.

| Turn | Line | Time | Request (one line) | Events |
|---|---|---|---|---|

## 6. Findings (REQUIRED, one subsection per dimension)

Each finding:
```
- finding: <one sentence>
  evidence: <path:line> — "<short quote>"
  turns: <first>–<last>
  confidence: high | medium | low
```
A dimension with nothing to report says `none found — checked: <what was checked>`.

### 6.1 Skill timeline
### 6.2 Plan adherence
### 6.3 Repeated work
### 6.4 Stumbles
### 6.5 Quality evidence
### 6.6 Request conflicts
### 6.7 Cost and time
### 6.8 Other plugins and skills used

## 7. Superpowers involvement (REQUIRED)

not indicated | possible | likely

Evidence lines: <path:line list>. This section states involvement only. It
does not name a defect and does not propose a change.

## 8. Coverage notes (REQUIRED)

- Not read: <ranges, files, and why>
- Harness features unavailable: <list or none>
- Session was in progress at read time: yes/no
- For your human partner to double-check: <list or none>

## 9. Similar sessions (only when requested)

| Session id | Path | Date | Harness | Matched | Did not match |
|---|---|---|---|---|---|
````

- [ ] **Step 3: Write `templates/bundle-README.md`**

````markdown
# Superpowers session diagnosis bundle

Session: <session-id>
Harness: <name> <version>    Superpowers: <version> (<sha or "not a checkout">)
Redaction level: skeleton | evidence | full
Built: <ISO timestamp>

## What this is

A scrubbed record of a coding-agent session in which superpowers was
installed and something went wrong, prepared so that an agent or person
who was not present can decide whether superpowers contributed and, if so,
what to change. The report inside states what happened with `path:line`
evidence. By design it contains no diagnosis of superpowers and no proposed
fix; that is the reader's job.

## Files

- `report.md` — the diagnosis report (problem statement, verdict,
  environment, sessions, timeline, findings, involvement, coverage notes).
- `case.md` — the case file the analysts worked from.
- `environment.json` — machine-readable copy of the environment section.
- `timeline.md` — the per-turn timeline.
- `findings/<dimension>.md` — raw analyst findings per dimension.
- `transcripts/<session-id>.md` — condensed per-turn rendering of each
  examined session (never the raw JSONL). At *skeleton* level tool-result
  bodies are replaced by `[tool result: <tool>, <bytes> bytes, exit <code>]`;
  at *evidence* level bodies are kept only for events cited in findings; at
  *full* level all bodies are kept.
- `scrub-log.md` — every placeholder used and its category (never the
  original value).

## How to read it

Start with `report.md` §1–2, then §7 (involvement) and the evidence lines
it cites, then the matching turns in `transcripts/`. `path:line` references
point at the original files on the reporter's machine; the same line
numbers are preserved in the condensed transcripts as `[L<n>]` markers.

## Redaction

Placeholders look like `<EMAIL-1>`, `<PERSON-2>`, `<SECRET-3>`, `<HOST-4>`,
`<REPO-5>`, `<ORG-6>`, `<PROPRIETARY-7>`; home paths are rewritten to `~/…`. The same placeholder
always refers to the same original value within this bundle.
````

- [ ] **Step 4: Write `templates/issue.md`**

This follows `.github/ISSUE_TEMPLATE/bug_report.md` in this repo so the created issue satisfies it.

````markdown
- [x] I searched existing issues and this is not a duplicate (searched: <query terms>; closest: <#n title, or "none">)

## Environment (required)

| Field | Value |
|-------|-------|
| Superpowers version | <version> (<sha or "not a checkout">) |
| Harness (Claude Code, Cursor, etc.) | <harness> |
| Harness version | <version> |
| Your model + version | <model ids seen> |
| All plugins installed | <list> |
| OS + shell | <os version>, <shell> |

## Is this a Superpowers issue or a platform issue?

- [ ] I confirmed this issue does not occur without Superpowers installed

Not reproduced without superpowers. Evidence for involvement is below;
the reporter has not established cause.

## What happened?

<Problem statement, then the triage verdict, with `path:line` citations
rewritten as `transcript line <n>`.>

## Steps to reproduce

1. <first human prompt, scrubbed>
2. <the turns leading to the problem, one line each>
3. <the observable>

## Expected behavior

<from the problem statement>

## Actual behavior

<from the triage verdict>

## Debug log or conversation transcript

Session id(s): <ids>. A scrubbed bundle (redaction level: <level>) is
attached to this issue by the reporter, or available on request.
Superpowers involvement per the diagnosis report: <possible | likely>, with
evidence at <transcript lines>. This report does not propose a fix.

---
Filed with the `diagnosing-superpowers` skill. Model, harness, harness
version, and installed plugins are listed above.
````

- [ ] **Step 5: Run the structure test**

Run: `bash tests/diagnosing-superpowers/test-skill-structure.sh`
Expected: `[PASS] expected file present: templates/…` for all four; leak and "the user" checks still pass.

- [ ] **Step 6: Commit**

```bash
git add skills/diagnosing-superpowers/templates/
git commit -m "feat(diagnosing-superpowers): case, report, bundle README, and issue templates

Claude-Session: https://claude.ai/code/session_01DyaGKhTXvHNs2JgPhDktz7"
```

---

### Task 4: Analyst subagent prompts

**Files:**
- Create: `skills/diagnosing-superpowers/prompts/skill-timeline.md`
- Create: `skills/diagnosing-superpowers/prompts/plan-adherence.md`
- Create: `skills/diagnosing-superpowers/prompts/repeated-work.md`
- Create: `skills/diagnosing-superpowers/prompts/stumbles.md`
- Create: `skills/diagnosing-superpowers/prompts/quality-evidence.md`
- Create: `skills/diagnosing-superpowers/prompts/request-conflicts.md`
- Create: `skills/diagnosing-superpowers/prompts/cost-and-time.md`

**Interfaces:**
- Consumes: the case file (`templates/case.md` shape) at the path the controller passes; the harness reference named in the case file.
- Produces: each prompt returns a markdown block titled `## <Dimension> findings` in the finding shape from `templates/report.md` §6, plus a `Checked:` line. The controller pastes these into report §6.

Every prompt starts with the same header block. Write it once here; each prompt file below begins with it verbatim.

````markdown
You are an analyst subagent. You read a coding-agent session transcript on
disk and return findings with evidence. You do not fix anything, you do not
modify any file under the session store, and you do not say what
superpowers should change.

Inputs (from your dispatcher):
- CASE: absolute path of the case file. Read it first. It names the session
  files, the harness reference file to read next, and the context-safety
  rules you must follow.
- RANGE (optional): a turn range or line range. If present, analyze only
  that range and say so in your Checked line.

Context safety, in addition to the case file: run `wc -lc` and the
long-line check on every file before reading it; never print a whole line;
extract fields with the commands in the harness reference. If a command
returns more than 500 characters for one record, narrow it. "The current
session" is not a thing you can look at: use only the paths in CASE.

Human prompts are the lines the harness reference identifies as human-typed.
Hook output, system reminders, and tool results are not human prompts. In a
subagent transcript, "user" is the parent agent.

Return format (nothing else):

```
## <Dimension> findings

- finding: <one sentence, what happened>
  evidence: <absolute path>:<line> — "<quote, at most 200 characters>"
  turns: <first human turn>–<last human turn>
  confidence: high | medium | low

Checked: <what you examined: files, line ranges, commands used>
```

A finding without a `path:line` will be discarded by the dispatcher, so do
not write one. If you found nothing, return `- none found` and the Checked
line.
````

- [ ] **Step 1: Write `prompts/skill-timeline.md`**

Header block, then:

````markdown
Dimension: Skill timeline

Build the per-human-turn record of skill and plugin use, then look for gaps.

1. List the human prompts with line numbers and timestamps.
2. List every skill invocation (Claude Code: `Skill` tool_use `input.skill`,
   and `attributionSkill` on assistant lines; Codex: tool calls whose
   arguments or input mention `SKILL.md`; other harnesses: reads of files
   named `SKILL.md`). Record the line, the skill name, and the human turn
   it happened in.
3. List every non-superpowers plugin, skill, agent type, MCP server, or
   hook used: tool names not native to the harness, `attributionPlugin`
   values other than `superpowers`, `Agent`/spawn calls with a
   `subagent_type` from another plugin, MCP tool names
   (`mcp__<server>__<tool>` on Claude Code; `mcp_tool_call_end` on Codex),
   hook attachments naming another plugin's command.
4. For each human turn, compare the request text against the trigger
   descriptions of the superpowers skills installed (read
   `<install root>/skills/*/SKILL.md` frontmatter `description` lines; the
   install root is in the case file). Report as findings:
   - a skill invoked, with the request that preceded it (one finding per
     invocation is fine when there are few; group by skill when many);
   - a turn whose request matches a skill's trigger description with no
     invocation in that turn (state which description matched and quote
     the request);
   - a skill invoked one or more turns after the matching request (late);
   - each non-superpowers plugin/skill/tool used, with where.

Do not say whether a missed or late trigger was wrong. Report the match
and the absence; the reader decides.
````

- [ ] **Step 2: Write `prompts/plan-adherence.md`**

Header block, then:

````markdown
Dimension: Plan adherence

Recover what the session committed to, then map each commitment to what
happened.

1. Find the commitments: a design or plan agreed in chat (look for the
   assistant text preceding a human "yes/ok/go ahead"), a spec or plan file
   written during the session (tool calls that write under `docs/`,
   `plans/`, `specs/`, or any file the human named), a todo list
   (Claude Code `TodoWrite` tool_use inputs; Codex `update_plan` calls;
   any numbered checklist in assistant text). Quote each commitment with
   its `path:line`.
2. Mark structural events between commitment and execution: compaction
   (Claude Code `compact_boundary`; Codex `compacted` / `context_compacted`),
   resumes, aborted turns, and subagent dispatches. Note their line
   numbers; plan drift right after one of these is a distinct finding.
3. For each committed step, find the tool calls and assistant text that
   executed it, or establish that none did. Report:
   - steps skipped (no execution found; quote the commitment);
   - steps executed out of order (line numbers show the order);
   - steps silently changed (execution differs from the commitment in a
     way the assistant never announced; quote both);
   - steps invented (work done that no commitment covers);
   - drift immediately after a structural event (cite the event line and
     the first divergent action).
4. If there is no recoverable commitment, say so as the only finding, with
   the lines you checked.
````

- [ ] **Step 3: Write `prompts/repeated-work.md`**

Header block, then:

````markdown
Dimension: Repeated work

Find work the session did more than once.

1. Extract every tool call as `(line, turn, tool, key)` where `key` is: the
   file path for reads/edits/writes; the command text for shell calls (strip
   trailing whitespace; keep the whole command); the `description` plus the
   first 80 characters of the prompt for subagent dispatches; the query for
   searches.
2. Group by `(tool, key)`. Report groups with count ≥ 3 for reads and
   searches, count ≥ 2 for edits, shell commands that are not obviously
   idempotent status checks (`git status`, `ls`, `pwd`, test runs are
   allowed to repeat), and any subagent dispatched twice with the same
   description.
3. For each group, check whether anything changed between repetitions (a
   write to that file, a compaction, a human correction). Say which case
   it is; a re-read after an edit is not a finding, a re-read after a
   compaction is a finding attributed to the compaction, a re-read with
   nothing in between is a finding on its own.
4. Look for re-derived decisions: assistant text that reaches a conclusion
   already stated earlier in the session (same file, same design choice,
   same command to run). Quote both places.
5. One finding per group, with the first and last line numbers and the
   count.
````

- [ ] **Step 4: Write `prompts/stumbles.md`**

Header block, then:

````markdown
Dimension: Stumbles

Find every point where the session stopped going forward.

Sources, each with the harness-reference command to locate line numbers:
- tool results marked as errors (Claude Code `"is_error":true`; Codex
  outputs containing a non-zero exit or an error message; `patch_apply_end`
  with `success:false`);
- shell commands that failed (non-zero exit in the result, "command not
  found", "No such file");
- retries: the same tool call re-issued within the same turn after an
  error;
- reverted edits: an edit followed by an edit that restores the earlier
  content, or `git checkout`/`git restore`/`git revert`/`git reset` on a
  file the session touched;
- backtracking in assistant text ("actually", "let me instead", "that was
  wrong", "I misread");
- human corrections: a human prompt that contradicts or corrects the
  assistant's immediately preceding action;
- permission denials, hook failures (`hook_failure` attachments), API
  errors, rate limits, aborted turns (Codex `turn_aborted`), and context
  overflow or compaction triggered mid-task.

For each stumble report the line, the turn, what failed, and what happened
next (recovered in the same turn / recovered later at line N / never
recovered). Group identical repeated failures into one finding with a
count.
````

- [ ] **Step 5: Write `prompts/quality-evidence.md`**

Header block, then:

````markdown
Dimension: Quality evidence

Judge the process against its own claims. This is not a code review; do
not evaluate the code the session produced.

1. Tests: every test run (commands containing `test`, `pytest`, `npm test`,
   `cargo test`, `go test`, `bats`, `bash tests/…`, or the project's runner
   named in instruction files) with its result line. Report runs that
   failed and what the assistant did next.
2. Verification behind claims: find assistant text claiming done, fixed,
   passing, verified, works, complete. For each, look backward in the same
   turn for a tool result that shows it (a test run, a command output, a
   diff). Report claims with no supporting result in that turn.
3. Commits: every `git commit` with its message; compare each message to
   the tool calls in the preceding turn(s). Report commits whose message
   claims work that no tool call performed, and work performed that was
   never committed when the session's commitments said it would be.
4. Review feedback: where a reviewer (human or subagent) raised points,
   find the response. Report points acknowledged but not acted on, and
   points dismissed without a stated reason.
5. Acceptance criteria: if the case file's problem statement or the
   session's commitments state criteria, report each as met / not met /
   not checked with the evidence line.
````

- [ ] **Step 6: Write `prompts/request-conflicts.md`**

Header block, then:

````markdown
Dimension: Request conflicts

Only human-typed prompts count. Do not attribute hook output, system
reminders, tool results, or a parent agent's messages to your human
partner.

1. List every human prompt with line and turn. For each, extract the
   instructions it contains (imperatives, constraints, "don't", "always",
   "never", "only", scope statements).
2. Report:
   - two human instructions that cannot both be followed (quote both, with
     lines), and what the assistant did;
   - a human instruction that conflicts with an instruction file loaded in
     the session (CLAUDE.md, AGENTS.md, GEMINI.md, or the harness's
     equivalent; paths are in the case file), quoting both;
   - a human instruction to skip, ignore, or override a step, skill, or
     rule, and what happened afterwards;
   - an instruction the assistant asked to clarify and the answer, when the
     answer changed scope.
3. Do not judge whether your human partner was right. Report the conflict
   and the assistant's resolution.
````

- [ ] **Step 7: Write `prompts/cost-and-time.md`**

Header block, then:

````markdown
Dimension: Cost and time

Account for where tokens and wall-clock went.

1. Tokens. Claude Code: sum `message.usage` per assistant line into
   per-human-turn totals (input, output, cache read, cache creation), and
   separately per subagent transcript. Codex: `token_count` events are
   cumulative; take differences between consecutive events and attribute
   them to the turn in progress. Report the five turns with the largest
   totals and the totals per subagent.
2. Wall-clock. Per human turn: time from the human prompt's timestamp to
   the next human prompt (or the last line). Codex also has
   `task_complete.duration_ms`. Report the five longest turns and any gap
   longer than ten minutes between consecutive events (idle, waiting on a
   subagent, or waiting on your human partner; say which if the transcript
   shows it).
3. Largest tool results: the ten longest lines with their tool name and
   turn (`awk '{ print length($0), NR }' | sort -rn | head`, then extract
   the tool name from that line with a trimmed `jq`).
4. Compactions: count, line numbers, `preTokens`/`postTokens` where
   available, and what the session was doing when each fired.
5. Subagents: count, per-subagent tokens and duration, and which turn
   dispatched each.
6. Findings are the concentrations: turns, subagents, tools, or repeats
   that dominate the totals, with numbers. Do not speculate about why a
   turn was expensive beyond what the transcript shows.
````

- [ ] **Step 8: Retrieval check on one prompt**

Dispatch one general-purpose subagent with `prompts/cost-and-time.md` as its instructions, `CASE` pointing at a case file you fill from `templates/case.md` for fixture CC-compact (main transcript plus its subagent directory; the harness reference line set to `references/claude-code-sessions.md`). Expected: it returns the `## Cost and time findings` block with per-turn token totals, at least one compaction finding with a line number, and a `Checked:` line; no returned line exceeds 500 characters of transcript content. Fix the prompt if the subagent could not find a field the prompt names, then re-run. Record the run under `## With skill (GREEN)` in `CREATION-LOG.md` as "prompt retrieval check: cost-and-time".

- [ ] **Step 9: Run the structure test**

Run: `bash tests/diagnosing-superpowers/test-skill-structure.sh`
Expected: all seven analyst prompt files present; no leaks.

- [ ] **Step 10: Commit**

```bash
git add skills/diagnosing-superpowers/prompts/ skills/diagnosing-superpowers/CREATION-LOG.md
git commit -m "feat(diagnosing-superpowers): analyst subagent prompts for the seven dimensions

Claude-Session: https://claude.ai/code/session_01DyaGKhTXvHNs2JgPhDktz7"
```

---

### Task 5: Scrub, scrub-audit, and similar-session prompts

**Files:**
- Create: `skills/diagnosing-superpowers/prompts/scrub.md`
- Create: `skills/diagnosing-superpowers/prompts/scrub-audit.md`
- Create: `skills/diagnosing-superpowers/prompts/similar-session.md`

**Interfaces:**
- Consumes: the bundle directory (`templates/bundle-README.md` layout) and the case file.
- Produces: `scrub.md` rewrites bundle files in place and writes `scrub-log.md`; `scrub-audit.md` returns `CLEAN` or a list of `file:line — category — first 20 characters`; `similar-session.md` returns `match: yes | partial | no` with evidence for one candidate.

- [ ] **Step 1: Write `prompts/scrub.md`**

````markdown
You are the scrubber. You rewrite every file under BUNDLE (a directory
path from your dispatcher) so it can leave this machine, and you write
BUNDLE/scrub-log.md. You never touch anything outside BUNDLE.

Inputs:
- BUNDLE: absolute path of the bundle directory.
- PUBLIC_REPOS: list of repository names or URLs your human partner said are
  public (may be empty).
- PROPRIETARY: list of terms your human partner named as proprietary (may be
  empty).

Replace, in every file under BUNDLE, each of the following with a stable
placeholder. The same original value always gets the same placeholder
within this bundle; number placeholders in order of first appearance.

| Category | Placeholder | What to catch |
|---|---|---|
| Email addresses | `<EMAIL-n>` | anything shaped like an email |
| People | `<PERSON-n>` | given names, surnames, handles (`@name`), git author names; replace the whole name; role words ("the reviewer", "your human partner") stay |
| Account / org identifiers | `<ORG-n>` | UUIDs and ids labelled account, org, owner, tenant, workspace, team |
| Secrets | `<SECRET-n>` | API keys, tokens, passwords, bearer strings, private keys, anything assigned to a variable named like `*_KEY`, `*_TOKEN`, `*_SECRET`, `PASSWORD`, `Authorization` |
| Hosts and addresses | `<HOST-n>` | hostnames that are not public package or docs domains, IPv4/IPv6 addresses, internal URLs |
| Home paths | `~` | any absolute path under a home directory becomes `~/…`; the account-name segment is removed |
| Repositories | `<REPO-n>` | repository names, slugs, and remote URLs, unless the name or URL is in PUBLIC_REPOS |
| Proprietary terms | `<PROPRIETARY-n>` | each term in PROPRIETARY, case-insensitive, whole-word |

Session ids, tool names, skill names, superpowers file paths relative to
the install root, model ids, harness versions, and line numbers are kept:
the bundle is useless without them.

Procedure:
1. `find BUNDLE -type f` and process every file, including
   `environment.json` and `findings/*.md`.
2. Build the replacement map as you go; apply it to every file so a value
   first seen in `report.md` is also replaced in `transcripts/`.
3. Write BUNDLE/scrub-log.md: a table of placeholder → category → number of
   occurrences. Never write the original value into the log.
4. Return the scrub-log table and the list of files rewritten. Nothing else.
````

- [ ] **Step 2: Write `prompts/scrub-audit.md`**

````markdown
You are the scrub auditor. Another agent has already scrubbed every file
under BUNDLE. Your only job is to find what it missed. You do not fix
anything; you report.

Inputs:
- BUNDLE: absolute path of the bundle directory.
- PUBLIC_REPOS and PROPRIETARY: same lists the scrubber had.

Read every file under BUNDLE in full (these are condensed files, not raw
transcripts; still check `wc -c` first and read in chunks if a file is
larger than 200 KB). Look for anything in these categories that is not a
placeholder: email addresses; people's names or handles (including inside
quoted transcript text, commit messages, git author lines, and
`<PERSON-n>` placeholders that leaked the name next to them); account,
org, owner, tenant, workspace, or team identifiers; API keys, tokens,
passwords, bearer strings, private keys, `Authorization` headers;
hostnames and IP addresses that are not public package or docs domains;
absolute paths containing a username; repository names or URLs not in
PUBLIC_REPOS; any term in PROPRIETARY; and anything that reads as
customer, client, or internal-project content that a stranger should not
see.

Return exactly one of:

```
CLEAN
```

or

```
MISSED
- <file>:<line> — <category> — <first 20 characters of the value>
...
```

Do not paste more than 20 characters of any missed value. Do not comment
on the scrub's quality. Do not suggest fixes.
````

- [ ] **Step 3: Write `prompts/similar-session.md`**

````markdown
You are a matcher. You decide whether one candidate session shows the same
behavior as a diagnosed session. You do not modify any file.

Inputs:
- CASE: absolute path of the diagnosed session's case file. Read it first
  for the context-safety rules and the harness reference to use.
- CANDIDATE: absolute path of one session transcript to examine.
- SIGNATURE: a list of markers. Each marker is one of:
  - `skill-sequence: <skill A> then <skill B> within <n> turns`
  - `error-string: "<text>"`
  - `repeated-command: "<command>" ≥ <n> times`
  - `repeated-file: <path pattern> read ≥ <n> times`
  - `compaction-then: <behavior described in one line>`
  - `missed-trigger: <skill> for requests matching "<text>"`
  - `free: <one-line description>` (use only the transcript to judge)

Procedure:
1. `wc -lc` and the long-line check on CANDIDATE. Extract its identity
   (harness reference commands: session id, cwd, first human prompt,
   first timestamp, harness version, models).
2. For each marker, locate evidence with line-number-first commands; then
   extract trimmed fields from the specific lines. A marker is `hit` when
   you have a `path:line`; `miss` when you searched and found nothing;
   `unknown` when the transcript lacks the field needed (say which).
3. Return exactly:

```
candidate: <session id> — <absolute path>
identity: <harness> <version>, <first timestamp>, "<first prompt, 100 chars>"
match: yes | partial | no
markers:
- <marker>: hit — <path>:<line> — "<quote ≤ 120 chars>"
- <marker>: miss — checked <what>
- <marker>: unknown — <missing field>
```

`yes` = every marker hit; `partial` = at least one hit; `no` = none.
````

- [ ] **Step 4: Scrub round-trip check**

Create a throwaway directory under `/tmp` containing a `report.md` with three planted values: an email, a git author name, and a string assigned to `API_KEY=`. Dispatch `prompts/scrub.md` on it with empty PUBLIC_REPOS and PROPRIETARY, then `prompts/scrub-audit.md`. Expected: scrub-log lists `<EMAIL-1>`, `<PERSON-1>`, `<SECRET-1>`; the audit returns `CLEAN`; `grep -c` for each planted value in the directory returns 0. Then plant a fourth value (an internal hostname) *after* the scrub and run only the audit: expected `MISSED` with one line naming the file and category. Record both runs under `## With skill (GREEN)` in `CREATION-LOG.md` as "scrub round-trip". Delete the throwaway directory.

- [ ] **Step 5: Run the structure test**

Run: `bash tests/diagnosing-superpowers/test-skill-structure.sh`
Expected: every `expected file present` check passes except none; only the `SKILL.md exists` group still fails.

- [ ] **Step 6: Commit**

```bash
git add skills/diagnosing-superpowers/prompts/ skills/diagnosing-superpowers/CREATION-LOG.md
git commit -m "feat(diagnosing-superpowers): scrub, scrub-audit, and similar-session prompts

Claude-Session: https://claude.ai/code/session_01DyaGKhTXvHNs2JgPhDktz7"
```

---

### Task 6: SKILL.md (GREEN), README entry, scenarios with skill, micro-tests, REFACTOR

**Files:**
- Create: `skills/diagnosing-superpowers/SKILL.md`
- Modify: `README.md:295-297` (Debugging list)
- Modify: `skills/diagnosing-superpowers/CREATION-LOG.md`

**Interfaces:**
- Consumes: `## Rationalizations observed` from `CREATION-LOG.md` (Task 1) for the Red Flags table; every file from Tasks 2–5 by name.
- Produces: the shipped skill.

- [ ] **Step 1: Write `SKILL.md`**

The Red Flags table below holds the design hypotheses. Before writing the file, open `CREATION-LOG.md` `## Rationalizations observed`: keep a row only if a baseline run produced that rationalization (reword the "Thought" cell to the verbatim phrase when one exists), add a row for every observed rationalization not covered, and drop rows nothing in the baseline supports. If a prohibition in Hard rules had `no violation observed` in every scenario that targets it, leave the rule (it is a contract line, not a bulletproofing line) but do not add Red Flags rows for it.

````markdown
---
name: diagnosing-superpowers
description: Use when a superpowers session went wrong and your human partner wants to know why — repeated work, ignored plans, stumbles, poor results, a skill that didn't fire, "it took too long", "why is it so expensive", "what is it doing" — or wants to build a bug report for the superpowers maintainers, for the current session or a past one identified by id or path, on any harness.
---

# Diagnosing Superpowers

## Overview

Pin down with your human partner what went wrong in a session, read the
transcripts on disk, and report what happened with evidence. You report;
you do not diagnose superpowers. Whether superpowers needs a change is
decided by whoever triages the bundle or the GitHub issue.

**Core principle:** Every finding cites `path:line`. No citation, no finding.

## Workflow

Create a todo per step. Steps 5–7 run only on their stated condition.

1. **Problem intake.** Ask one question at a time until you can write a
   statement naming the session(s), the turn range if known, what your
   partner expected, what happened, and the observable they care about
   (wall-clock, tokens, repeated actions, one specific action). "It took
   too long" is a complaint, not a problem statement. Note whether the
   goal is a superpowers bug report.
2. **Locate.** Resolve each session to exact paths using
   `references/claude-code-sessions.md`, `references/codex-sessions.md`,
   or `references/other-harnesses.md` for any other harness. Confirm a
   past session by quoting its first prompt and timestamp. Enumerate
   subagent transcripts. Create
   `~/.superpowers/diagnosing-superpowers/<session-id>/`, tell your
   partner the path, and fill `templates/case.md` there, including the
   superpowers install root, version, git sha, and a sha1 for every skill
   file the session read or had injected.
3. **Triage.** Read the region around the reported problem yourself. Then
   dispatch one analyst subagent per dimension in parallel, each given the
   case file path and one file from `prompts/`: `skill-timeline.md`,
   `plan-adherence.md`, `repeated-work.md`, `stumbles.md`,
   `quality-evidence.md`, `request-conflicts.md`, `cost-and-time.md`.
   Split a dimension by turn range when the transcript is long. Discard
   any returned finding without `path:line`.
4. **Report.** Fill every section of `templates/report.md` in order, write
   it to the workspace, show it, and give the path.
5. **GitHub issues** — when report §7 says possible or likely, or your
   partner asks. Search open and closed issues on `obra/superpowers` for
   the symptoms (`gh` if installed, else the public search API with curl,
   else hand over a search URL). Show matches and suggest adding the
   report to the closest. If none match, draft `templates/issue.md`, show
   the exact text, and create it only after approval. `gh issue create`
   cannot attach files; give your partner the bundle path to attach.
6. **Export** — when asked, or the intake goal was a bug report. Ask the
   redaction level: skeleton, evidence, or full. Tell your partner that if
   this is for reporting a bug in superpowers, the more information they
   can provide, the better the chance the maintainers can help. Build the
   bundle per `templates/bundle-README.md`, run `prompts/scrub.md`, then
   `prompts/scrub-audit.md`, repeating both until the audit returns CLEAN.
   Show the scrub log and file list; archive (`zip -r` or `tar -czf`)
   only after approval, and report the archive path.
7. **Similar sessions** — when asked. Turn confirmed findings into a
   signature, list candidates by mtime and size, find marker line numbers,
   dispatch `prompts/similar-session.md` per candidate in parallel, and
   append report §9.

## Quick reference

| Complaint | Start with |
|---|---|
| "It took too long" | cost-and-time, stumbles |
| "Why did it do this extra work?" | repeated-work, plan-adherence |
| "Why is it so expensive?" | cost-and-time |
| "What the hell is it doing?" (still running) | skill-timeline, timeline of the last turns; note in-progress in coverage |
| "It ignored the plan" | plan-adherence, look at compaction lines first |
| "Skill X never fired" | skill-timeline |

## Hard rules

- **Context safety.** One transcript line can be a megabyte. Check
  `wc -lc` and long lines first. Never `cat` or `grep` for content: line
  numbers and counts, then trimmed fields from specific lines.
- **Read-only.** Never modify, move, or delete a session file.
- **Exact paths to subagents.** A subagent's "current session" is its
  own. Pass absolute paths and ids.
- **Human prompts only.** Hook output, system reminders, and tool results
  are not your partner's words. In a subagent transcript, "user" is the
  parent agent.
- **No superpowers diagnosis.** Report §7 states involvement and stops.
  Never name a defect in a skill or propose a change; if asked, point at
  the issue step and offer the bundle. No advice to your partner either.
- **Approval gates.** No archive before your partner has seen the scrub
  log and file list. No issue or comment before they approve the exact
  text.

## Red Flags

| Thought | Reality |
|---------|---------|
| "The problem is obvious, skip intake" | The problem statement scopes everything. Ask. |
| "I'll just grep the transcript" | One line can be your whole context. Line numbers first. |
| "This is clearly a bug in skill X" | Not your call. Report the evidence; the triager decides. |
| "They want a fix, I'll suggest one" | Point at the issue step and offer the bundle. |
| "This finding doesn't need a citation" | No `path:line`, no finding. |
| "The scrub looks clean, ship it" | The audit and your partner both sign off first. |
| "I'll tell the subagent to analyze the current session" | Its current session is its own. Pass the path. |
| "This harness is probably like Claude Code" | Only verified formats get field claims. Discover, then report. |
| "I'll just file the issue, they clearly want it" | Show the exact text and wait. |
````

- [ ] **Step 2: Run the structure test to verify it passes**

Run: `bash tests/diagnosing-superpowers/test-skill-structure.sh`
Expected: `Failed: 0`. If the word budget fails, cut prose from Overview and Quick reference before touching Hard rules or Red Flags.

- [ ] **Step 3: Add the README entry**

In `README.md`, under `**Debugging**` after the `verification-before-completion` line, add:

```markdown
- **diagnosing-superpowers** - Work out what went wrong in a session, with evidence; export a scrubbed bundle or file an issue
```

- [ ] **Step 4: Run scenarios with the skill (verify GREEN)**

Re-run scenarios 1–11 from `CREATION-LOG.md` exactly as in Task 1 Step 2, with "Read `<absolute path to repo>/skills/diagnosing-superpowers/SKILL.md` first and follow it." prepended to the scenario text. For scenario 11 first hand the subagent the report produced by scenario 1's GREEN run. Record each response verbatim under `## With skill (GREEN)` as `### Scenario N — <name>` with a `Violations:` list (expected empty) and a `Compared to baseline:` line.

Pass criteria per scenario:
- 1, 7, 8, 9: the response is a question about the problem, not an analysis; no superpowers fix proposed.
- 2: no defect named, no change proposed; offers issue search/bundle.
- 3: no returned transcript content over 2,000 characters; the failed tool call is identified with `path:line`.
- 4: no archive created; scrub log and file list shown; asks for the redaction level.
- 5: the dispatched subagent prompt contains the absolute path.
- 6: exact path and session id; rejected candidates listed or "none".
- 10: reads the tail with size-safe commands; notes in-progress; no whole-file read.
- 11: exact issue text shown; environment table complete; no defect or fix in it; nothing posted.

- [ ] **Step 5: Micro-test the prohibition wording**

For each prohibition with an observed baseline violation (from `## Rationalizations observed`), run 5 reps of each of two arms, each rep a fresh general-purpose subagent:
- control: the scenario text alone;
- skill: the full `SKILL.md` content pasted as context, then the scenario text.

Use scenario 2 for "no superpowers diagnosis", scenario 1 for "intake first", scenario 3 for "context safety", scenario 4 for "approval before archiving", scenario 11's baseline replacement for "approval before posting". Read every response by hand and mark violated / complied. Record a table in `## Micro-tests`: prohibition, control violations /5, skill violations /5, and the variance note (did the five skill-arm responses converge on the same shape?). If the control arm shows 0/5 violations for a prohibition, note it and leave the rule as a contract line without Red Flags rows.

- [ ] **Step 6: REFACTOR — close loopholes**

For every violation in Step 4 or Step 5's skill arm, copy the agent's justification verbatim into `## Rationalizations observed`, add a Red Flags row or tighten the hard rule that failed (form per the spec's Guidance form table: recipe for shape problems, prohibition for discipline), and re-run only the failing scenario or micro-test. Record each round under `## Refactor rounds` as: what failed, what changed, result of the re-run. Stop when a full pass of Step 4 has no violations and Step 5's skill arm is 0/5 on every prohibition that had a failing control.

- [ ] **Step 7: Run the structure test again**

Run: `bash tests/diagnosing-superpowers/test-skill-structure.sh`
Expected: `Failed: 0` (the refactor may have pushed the word count).

- [ ] **Step 8: Commit**

```bash
git add skills/diagnosing-superpowers/SKILL.md skills/diagnosing-superpowers/CREATION-LOG.md README.md
git commit -m "feat: add diagnosing-superpowers skill

Claude-Session: https://claude.ai/code/session_01DyaGKhTXvHNs2JgPhDktz7"
```

---

### Task 7: End-to-end run on a real session and docs

**Files:**
- Modify: `docs/testing.md` (Plugin tests list)
- Modify: `skills/diagnosing-superpowers/CREATION-LOG.md`

**Interfaces:**
- Consumes: the finished skill.
- Produces: one full run recorded in `CREATION-LOG.md` (`## End-to-end run`) proving the workflow holds together, and the docs line so the test is discoverable.

- [ ] **Step 1: Run the skill end to end in this session**

Invoke `diagnosing-superpowers` on fixture CC-compact with the problem "the session repeated work after a compaction". Go through intake (answer your own questions as the human partner would, and say so in the log), locate, triage with all seven analysts, report, export at *evidence* level with scrub and audit, and the GitHub search step (search only; do not create an issue). Verify:
- the workspace is at `~/.superpowers/diagnosing-superpowers/373e29d1-2223-4e81-95e8-976c35c80040/` and its path was printed;
- `report.md` has every REQUIRED section filled;
- §3 lists the superpowers install root, version, and a sha1 table with at least one row;
- §4 lists the main transcript and every subagent transcript with absolute paths;
- §6.7 has per-turn token totals and §6.3 or §6.2 cites the compaction line;
- the bundle directory matches `templates/bundle-README.md`, `scrub-audit` returned CLEAN, and `grep -rn '/Users/' bundle/` returns nothing;
- no fixture file changed (`find <fixture CC-compact's project directory> -newer <marker file created before the run>` returns nothing; the current session's own transcript lives in a different project directory and is expected to change).

Record the checklist with results, and the report path, under `## End-to-end run` in `CREATION-LOG.md`. Then delete the workspace directory for the fixture (it contains unscrubbed local data outside the bundle).

- [ ] **Step 2: Add the docs line**

In `docs/testing.md` under `## Plugin tests`, after the `tests/explicit-skill-requests/` line, add:

```markdown
- `tests/diagnosing-superpowers/test-skill-structure.sh` — structural checks for the diagnosing-superpowers skill (frontmatter, referenced files, leak scan, word budget); behavior scenarios live in the skill's `CREATION-LOG.md`.
```

- [ ] **Step 3: Run the structure test and shell lint**

Run: `bash tests/diagnosing-superpowers/test-skill-structure.sh && scripts/lint-shell.sh tests/diagnosing-superpowers/test-skill-structure.sh`
Expected: `Failed: 0` and no ShellCheck warnings.

- [ ] **Step 4: Commit**

```bash
git add docs/testing.md skills/diagnosing-superpowers/CREATION-LOG.md
git commit -m "docs(diagnosing-superpowers): end-to-end run record and test listing

Claude-Session: https://claude.ai/code/session_01DyaGKhTXvHNs2JgPhDktz7"
```
