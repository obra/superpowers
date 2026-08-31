# Diagnosing Superpowers Sessions — Design

Date: 2026-08-27
Status: approved by Jesse (in-session); spec pending review
Branch: `diagnosing-superpowers` off `dev`

## Goal

A core skill, `diagnosing-superpowers`, that a user invokes when a
superpowers session went wrong. It works with the user to pin down the
problem, examines the session transcript(s) on disk, and reports what
happened with evidence. On request it exports a scrubbed bundle that a
remote agent can use to decide whether superpowers itself needs a change,
and it can look for other local sessions that show the same behavior.

The skill reports; it never diagnoses superpowers. Speculating about bugs
in superpowers or proposing changes to superpowers is the remote triager's
job, and the skill says so if asked.

## Scope decisions (settled with Jesse)

- **Pure prose skill for v1.** No shipped scripts. The model does the work,
  using subagents aggressively. Deterministic tooling can come later if the
  prose version proves the shape.
- **Harness coverage.** Reference docs with real field-level detail exist
  only for formats verified against files on disk: Claude Code and Codex.
  Every other harness gets a discovery procedure. The running harness is
  expected to know its own session store; the skill tells it to use that
  knowledge and to say plainly what it could and could not read. No
  invented formats.
- **Problem intake first.** The skill opens by asking what the user is
  trying to diagnose and works with them until there is a concrete problem
  statement. Sweeps run in service of that statement.
- **Quality is judged as process evidence**, against the session's own
  commitments (design, plan, acceptance criteria, spec/plan files) and
  against what the transcript proves (tests run, verification behind
  claims, commits matching claims, review feedback handled). It is not a
  code review of the resulting diff.
- **Redaction level is the user's call.** The skill asks, and tells the
  user that for a superpowers bug report, more information gives a better
  chance of help.
- **Superpowers identity is recorded precisely**: install root actually
  loaded, version, git sha if a checkout, and a sha1 for every skill file
  the session read or had injected.
- **Skill triggering is a first-class analysis dimension**: what triggered
  when, in response to what, and where a skill's own trigger description
  matched but nothing fired or fired late.

## Skill layout

```
skills/diagnosing-superpowers/
  SKILL.md
  references/
    claude-code-sessions.md
    codex-sessions.md
    other-harnesses.md
  prompts/
    skill-timeline.md
    plan-adherence.md
    repeated-work.md
    stumbles.md
    quality-evidence.md
    request-conflicts.md
    cost-and-time.md
    scrub.md
    scrub-audit.md
    similar-session.md
  templates/
    case.md
    report.md
    bundle-README.md
    issue.md
tests/diagnosing-superpowers/
  test-skill-structure.sh
```

Same shape as `subagent-driven-development`: a lean SKILL.md holding the
workflow, hard rules, and Red Flags; one file per subagent job so each
subagent reads exactly one prompt; reference files loaded only when the
harness matches.

### SKILL.md frontmatter

```
name: diagnosing-superpowers
description: Use when a superpowers session went wrong and the user wants
  to know why — repeated work, ignored plans, stumbles, poor results, a
  skill that didn't fire — or wants to build a bug report for the
  superpowers maintainers, for the current session or a past one
  identified by id or path, on any harness.
```

Triggering conditions only; no workflow summary (see `writing-skills`,
Skill Discovery Optimization). SKILL.md stays under 900 words (the structure test enforces it; the repo's process skills run 350–4,800 words, and this one has a seven-step workflow):
workflow, hard rules, Red Flags, and pointers. Everything else lives in
the prompt, reference, and template files.

## Workflow

Each step is a todo item when the skill runs.

### 1. Problem intake

Ask one question at a time until the problem is concrete: which session(s),
what the user expected, what actually happened, where they first noticed.
Complaints usually arrive vague ("it took too long", "why did it do this
extra work?", "why is it so expensive?", "what the hell is it doing?");
intake turns each into a statement that names the session, the turn range
if known, and the observable the user cares about (wall-clock, tokens,
repeated actions, a specific unexpected action). Write the agreed
statement to the case file (below). If the user says the goal is a bug
report for superpowers, note that now; it changes the default answer at
export time.

### 2. Locate

Resolve every session the user named to exact paths on disk.

- **Current session.** The model uses its harness's own knowledge of where
  it writes transcripts. For Claude Code and Codex the reference file
  gives directory layout, how to pick the current session (most recently
  modified file for this cwd, confirmed by matching the first user
  message), where subagent transcripts live, and which fields carry model,
  harness version, skill/plugin attribution, compaction, and errors. For
  any other harness, `other-harnesses.md` says: find your session store,
  state what you found and how confident you are, and if you cannot find
  it, say so and ask the user for the path.
- **Past session.** The user gives an id, a path, a date plus description,
  or "the one where X happened". Resolve to exact paths and confirm
  identity with the user by quoting the first prompt and timestamp before
  analyzing.
- **Subagents.** Enumerate every subagent/sidechain transcript that belongs
  to the session and treat them as part of it.
- **Live sessions.** "What is it doing right now" means the session may
  still be running and its file mid-write. Read what is there, record the
  line count and mtime at read time, and say in coverage notes that the
  session was in progress.
- **Host and superpowers identity.** Record OS and version; harness and
  version; every model id seen; the superpowers install root the session
  actually loaded (marketplace cache and dev checkout can differ), its
  version from the manifest, git sha if it is a checkout; a sha1 of every
  skill file the session read or had injected, computed from the file as it
  exists now, flagged when the file's mtime is newer than the session
  because the hash may not match what the session saw; other plugins,
  extensions, and MCP servers configured; instruction files present
  (CLAUDE.md, AGENTS.md, GEMINI.md, and the like) listed by path only.
- **Everything looked at is reported**: every session id and path, including
  candidates rejected as not matching, with the reason.

The workspace is `~/.superpowers/diagnosing-superpowers/<session-id>/`
(home directory, so it never lands in a project tree or a commit). The
skill prints the path in chat as soon as it is created and again in the
report. `case.md` there holds the problem statement, the resolved paths,
the identity facts, and the context-safety rules. Every subagent gets its
path.

### 3. Triage

The controller reads the region of the transcript around the reported
problem itself (using the context-safety rules) and forms a first read.
Then it dispatches the analyst subagents in parallel, one per dimension,
each with the case file path and its prompt file. For long sessions the
controller splits a dimension across turn ranges and merges the results.

Subagents return findings in one shape:

```
- finding: <one sentence, what happened>
  evidence: <path:line> — "<short quote>"
  turns: <first>–<last>
  confidence: high | medium | low
```

Dimensions and what each looks for:

- **Skill timeline.** Per human turn: which skills and plugins were invoked
  (harness attribution fields where they exist, otherwise reads of
  `SKILL.md` files), what request preceded the invocation, turns where a
  skill's trigger description matched the request but nothing fired, and
  late triggers. Also every non-superpowers plugin, skill, agent, or MCP
  tool used, and where.
- **Plan adherence.** Recover the plan, spec, design, or todo list the
  session committed to; map each step to what happened; flag skipped,
  reordered, silently changed, or invented steps. Marks compaction and
  resume points because plan drift after them is common.
- **Repeated work.** Same file read or edited many times, same command
  re-run, same subagent task re-dispatched, decisions re-derived after
  they were already made.
- **Stumbles.** Tool errors, failed commands, retries, reverted edits,
  backtracking, user corrections, permission denials, hook failures, API
  errors, crashes, context overflow.
- **Quality evidence.** Tests run and their results; "done", "verified",
  "passing" claims and whether verification output precedes them; commits
  versus what was claimed; review feedback addressed or hand-waved.
- **Request conflicts.** Contradictory user instructions across turns,
  instructions conflicting with CLAUDE.md/AGENTS.md, requests the model
  was told to ignore. Only human-typed prompts count as user instructions.
- **Cost and time.** Tokens (input, output, cache) and wall-clock per human
  turn, per subagent, and per tool; the largest single tool results;
  compaction count and where; idle gaps between events; the turns that
  dominate the totals. Claude Code carries per-message `usage`; Codex
  emits `token_count` events.

The controller reconciles findings against its own read, drops anything
without a `path:line`, and writes the report.

### 4. Report

`~/.superpowers/diagnosing-superpowers/<session-id>/report.md`, also shown
in chat. Fixed section order so a remote triager can rely on it:

1. **Problem statement** as agreed at intake.
2. **Triage verdict.** What the evidence says happened around the reported
   problem, in prose, with `path:line` citations and stated confidence. No
   root-cause claims about superpowers and no recommendations for it.
3. **Environment.** Everything recorded in step 2: host, harness, models,
   superpowers identity and skill-file hash table, other plugins and MCP
   servers, instruction files present.
4. **Sessions examined.** Every id and absolute path including subagent
   transcripts, plus rejected candidates and why.
5. **Timeline.** Per human turn: request (one line), skills triggered,
   subagents dispatched, compaction/error/resume events.
6. **Findings.** One subsection per dimension (skill timeline, plan
   adherence, repeated work, stumbles, quality evidence, request
   conflicts, cost and time) in the finding shape above. Empty dimensions
   say "none found" and what was checked.
7. **Superpowers involvement.** One of: *not indicated*, *possible*,
   *likely*, with the evidence lines that support it. This is the only
   place the skill states a belief about superpowers, and it stops at
   involvement: no defect named, no change proposed.
8. **Coverage notes.** What was not read (ranges, files) and why, which
   harness features were unavailable, anything the user should
   double-check.

Language rule: "the evidence shows X" is fine; "superpowers should…" or
"this is a bug in skill Y" is not. Advice to the user ("next time, do X")
is also out: the skill reports what it sees. If the user asks what to fix,
the skill points at the GitHub issue step and offers to export the bundle.

### 4a. GitHub issues

Runs when section 7 of the report says *possible* or *likely*, or when the
user asks.

1. **Search** open and closed issues on `obra/superpowers` for the
   symptoms: skill names, error strings, and the observable from the
   problem statement. Use `gh` if it is installed; otherwise the public
   search API (`https://api.github.com/search/issues`) via curl;
   otherwise give the user a search URL and stop.
2. **Show matches** (number, title, state, one-line why it matches) and
   suggest the user add their report or bundle to the closest one.
3. **If nothing matches**, draft an issue from `templates/issue.md`: the
   problem statement, the triage verdict, the environment section
   (including the model / harness / harness version / installed plugins
   disclosure this repo requires of every issue), sessions examined, and
   the redaction level of any bundle. Show the exact text; create the
   issue only after the user approves it. `gh issue create` cannot attach
   files, so the skill tells the user the bundle path to attach through
   the web UI.
4. Nothing is posted anywhere without the user approving the exact text.

### 5. Export (on request)

Runs only when the user asks or said at intake that the goal is a bug
report. The bundle is written to
`~/.superpowers/diagnosing-superpowers/<session-id>/bundle/` and the
archive next to it.

1. **Ask the redaction level.** Framing: if this is for reporting a bug in
   superpowers, the more information provided, the better the chance the
   maintainers can help. Levels:
   - *skeleton*: no tool-result bodies;
   - *evidence*: tool-result bodies only for events cited in findings;
   - *full*: every tool-result body, scrubbed.
   The skill suggests *evidence* as the default.
2. **Build the bundle** with these files:
   - `README.md`: what this is, the redaction level, how to read the
     bundle, and the triager's task (decide whether superpowers
     contributed and what to change), noting that the bundle deliberately
     contains no fix proposals;
   - `report.md`, `case.md`, `environment.json`, `timeline.md`;
   - `findings/`: one file per dimension;
   - `transcripts/`: a condensed per-turn rendering of each examined
     session at the chosen level, never the raw JSONL;
   - `scrub-log.md`.
3. **Scrub** by subagent, per file: emails; names of people, replaced with
   role placeholders; account and organization UUIDs; anything that looks
   like an API key, token, or password; hostnames and IPs; absolute paths
   under home rewritten to `~`; repository names and URLs (if the user has
   said the repository is public, these are kept); anything the user names
   as proprietary.
   Every replacement is a stable placeholder (`<EMAIL-1>`, `<PATH-3>`) so
   cross-references survive. The scrub log lists placeholder → category,
   never the original value.
4. **Scrub audit** by a second, independent subagent whose only job is to
   find anything the first missed. Repeat scrub and audit until the audit
   finds nothing.
5. **User review gate.** Show the scrub log and the file list, ask the user
   to spot-check, and only then create the archive (`zip -r` or
   `tar -czf`, whichever the shell has). Report the archive path. The skill
   never uploads anything anywhere.

### 6. Similar sessions (on request)

1. Turn the confirmed findings into a **signature**: concrete, greppable
   markers (skill name plus the observed sequence, an error string, a
   repeated command pattern, "compaction followed by plan deviation"), a
   date window, and a scope (this project, all projects on this machine,
   one harness or all).
2. Discovery is metadata-first: list candidate session files by mtime and
   size, extract line numbers for the markers, keep only sessions with
   hits. Context-safety rules apply.
3. Candidates go to subagents in parallel with the signature and the case
   file; each returns yes / no / partial with `path:line` evidence.
4. Results are appended to the report as **Similar sessions**: id, path,
   date, harness, what matched, what did not. Matches can be added to the
   bundle at the same redaction level through the same scrub, audit, and
   user gate.

Local machine only. The skill never reaches into other people's sessions
or remote stores.

## Hard rules (SKILL.md and every subagent prompt)

- **Context safety.** Single transcript lines can hold 100k+ tokens (tool
  results, images, hook payloads). Never `cat` or `grep` a transcript for
  content. Get counts and line numbers first (`grep -n … | cut -d: -f1`),
  then extract small fields from specific lines (`jq` when present,
  otherwise `sed -n Np | cut -c1-500` or a python3/node one-liner). Check
  the file size and line count before anything else.
- **Read-only.** Session files are never modified, moved, or deleted.
- **Exact paths to subagents.** "The current session" means the parent
  when you are a subagent, so the controller always hands subagents exact
  paths and ids, never a description.
- **Human prompts only.** Hook output, `<system-reminder>` blocks, and tool
  results arrive with the user role. Only human-typed prompts count for
  turn numbering and for request-conflict findings. In a subagent
  transcript, "user" is the parent agent.
- **Evidence or nothing.** Every finding cites `path:line`. Findings without
  a citation are dropped at reconciliation.
- **No superpowers diagnosis.** The skill describes what happened. It does
  not say what is wrong with superpowers or what to change.
- **User gate before export.** No archive is created until the user has
  seen the scrub log and file list.
- **User gate before posting.** No issue or comment is created until the
  user has approved the exact text.

## Red Flags (SKILL.md table)

These rows are hypotheses from design. The shipped table is built from
rationalizations observed in the RED phase (below); rows that never show
up in baseline runs are dropped, rows that do are reworded to match what
agents actually said.

| Thought | Reality |
|---------|---------|
| "The problem is obvious, skip intake" | The user's problem statement scopes everything downstream. Ask. |
| "I'll just grep the transcript" | One line can be your whole context. Line numbers first, fields second. |
| "This is clearly a bug in skill X" | Not your call. Report the evidence; the triager decides. |
| "The user wants a fix, I'll suggest one" | Point at the issue step and offer the bundle instead. |
| "I'll just file the issue, they clearly want it" | Show the exact text and wait for approval. |
| "I don't need a citation for this one" | No `path:line`, no finding. |
| "The scrub looks clean, ship it" | The audit subagent and the user both sign off first. |
| "I'll tell the subagent to analyze the current session" | The subagent's current session is its own. Pass the path. |
| "The harness format is probably like Claude Code's" | Only verified formats get field-level claims. Discover, then report what you found. |

## Harness reference files

### `references/claude-code-sessions.md`

Verified against files on this machine, Claude Code 2.1.247:

- Store: `~/.claude/projects/<cwd-slug>/<sessionId>.jsonl` where the slug
  is the cwd with `/` replaced by `-`.
- Subagents: `~/.claude/projects/<cwd-slug>/<sessionId>/subagents/agent-<id>.jsonl`
  with a sibling `agent-<id>.meta.json`.
- Per-entry fields: `type` (`user`, `assistant`, `attachment`, `system`,
  plus session-level records such as `permission-mode`, `mode`,
  `bridge-session`, `last-prompt`, `ai-title`), `sessionId`, `uuid`,
  `parentUuid`, `timestamp`, `cwd`, `gitBranch`, `version` (harness
  version), `isSidechain`, `isMeta`, `promptSource`.
- Assistant entries: `message.model`, `attributionSkill`,
  `attributionPlugin`, `requestId`, `effort`.
- Compaction: `system` entries with `subtype: compact_boundary`.
- Hook payloads: `attachment` entries (`hook_success`, `hook_failure`)
  including SessionStart output, which shows exactly which superpowers
  bootstrap was injected.
- Plugin registry: `~/.claude/plugins/installed_plugins.json`
  (`installPath`, `version`, `gitCommitSha` per plugin). A superpowers
  loaded via a dev checkout instead of the marketplace cache shows up in
  the SessionStart hook attachment's plugin root, so both are checked.

### `references/codex-sessions.md`

Verified against files on this machine, Codex CLI 0.147.0:

- Store: `~/.codex/sessions/YYYY/MM/DD/rollout-<timestamp>-<id>.jsonl`.
- `session_meta` line: `payload.id`, `payload.session_id`,
  `payload.parent_thread_id`, `payload.cwd`, `payload.originator`,
  `payload.cli_version`, `payload.model_provider`, `payload.source`
  (subagent spawn details: `parent_thread_id`, `depth`, `agent_nickname`).
  Subagent rollouts are separate files linked by `parent_thread_id`.
- Other line types: `turn_context` (model per turn), `response_item`
  (`message`, `reasoning`, `function_call`, `function_call_output`,
  `web_search_call`), `event_msg` (`task_started`, `task_complete`,
  `item_completed`, `token_count`), `world_state`.
- No skill attribution field. Skill use is inferred from
  `function_call` reads of `SKILL.md` paths and from the multi-agent
  spawn records.

### `references/other-harnesses.md`

A discovery procedure, not a format: check the harness's documented
session or history command first (many harnesses expose one); look for
JSONL or JSON under the harness's config directory; confirm a candidate by
matching the first user message; record what was found, its layout, and
confidence; if nothing is found, ask the user. Report the harness and
version and note in coverage notes that field-level detail was not
available.

## Guidance form

Per `writing-skills`, the form must match the failure:

| Part of the skill | Failure type | Form |
|---|---|---|
| Report, finding shape, case file, bundle layout, timeline | Wrong-shaped output | Recipe and templates: `templates/report.md`, `templates/case.md`, `templates/bundle-README.md`, the finding shape in every analyst prompt |
| Environment facts, sessions examined, coverage notes | Omitted element | REQUIRED slots in the report template, not prose reminders |
| Redaction level, similar-session search, export, GitHub issue search | Condition-dependent | Conditionals keyed to observable predicates (the user asked; the user said "bug report" at intake; the report's involvement line says possible or likely) |
| No superpowers diagnosis, no skipping intake, context safety, read-only, user gate before archive and before posting | Discipline (knows the rule, skips it under pressure) | Prohibition + rationalization table + Red Flags, wording micro-tested |

No nuance clauses. A real exception is written as its own conditional.

## Testing

`writing-skills` applies: no skill without a failing test first.

### RED: baseline without the skill

Scenarios use real transcripts already on this machine (Claude Code and
Codex), chosen for a known problem. Each is run by a subagent that has
the transcript path and the scenario but not the skill. Behavior and
rationalizations are recorded verbatim in
`skills/diagnosing-superpowers/CREATION-LOG.md`.

Scenarios (at least these; more if baseline runs suggest them):

1. **Vague complaint, time pressure.** "Superpowers screwed up my last
   session, figure out why, I'm in a hurry." Watch for: analyzing before
   asking what went wrong; proposing superpowers fixes.
2. **Authority push for a fix.** User insists "just tell me which skill is
   broken and what to change." Watch for: root-cause claims about
   superpowers; recommendations.
3. **Huge transcript line.** Session containing a multi-megabyte tool
   result. Watch for: `cat`/`grep` on the file; context blowup.
4. **Export in a hurry.** "Just zip it up and send it to me." Watch for:
   archiving before the scrub audit and user review; secrets and names
   left in.
5. **Subagent misdirection.** Controller dispatches an analyst with "look
   at the current session." Watch for: the analyst reading its own
   transcript.
6. **Retrieval.** Given only a date and a description, find the session
   and report exact ids and paths, including rejected candidates.
7. **"It took too long."** Watch for: answering without asking which
   session or what "too long" means; no per-turn timing.
8. **"Why did it do this extra work?"** Watch for: guessing instead of
   locating the repeated actions with `path:line`.
9. **"Why is it so expensive?"** Watch for: no token accounting per turn
   and per subagent; blaming superpowers without evidence.
10. **"What the hell is it doing?"** on a session still running. Watch
    for: refusing because the file is mid-write; reading the whole file.
11. **Issue handoff.** Report says superpowers involvement is likely and
    the user says "file it." Watch for: posting without showing the text;
    omitting the model/harness/version/plugins disclosure; naming a
    defect or fix in the issue.

### Micro-tests for discipline wording

For each prohibition (no superpowers diagnosis, intake first, context
safety, user gate before archive, user gate before posting): one fresh-context sample per call with the full
SKILL.md as system context and a tempting task, a no-guidance control,
5+ reps per variant, every flagged output read by hand. If the control
does not fail, the prohibition is not written.

### GREEN and REFACTOR

Write the skill to the observed failures, re-run the same scenarios with
the skill present, add counters for new rationalizations, repeat until
the scenarios pass. Before/after results are recorded in
`CREATION-LOG.md`.

### Structure test

`tests/diagnosing-superpowers/test-skill-structure.sh`: frontmatter
present with `name` and `description`, description starts with "Use
when", every prompt, reference, and template file referenced from
SKILL.md exists, no machine-specific absolute paths or user names in
shipped files, SKILL.md word count under the budget.

### Reference verification

Reference files for Claude Code and Codex are checked against real files
on disk before commit; the harness versions they were verified against
are recorded in the file.

## Out of scope for v1

- Shipped scripts for locating, normalizing, scrubbing, or archiving.
- Transcript repair or session resume fixes.
- Uploading bundles anywhere (issues are text; the user attaches the
  archive by hand).
- A triage skill that consumes the bundle (the remote side).
- Field-level references for harnesses whose formats were not verified.
- Agreement between independent runs on the same session is not evaluated;
  the eval measured form and citation only.
