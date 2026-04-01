# Fork Modification Checklist

**Source repo:** obra/superpowers v5.0.6
**Target plugin:** pp-superpowers
**Produced:** April 1, 2026
**Based on:** pp-superpowers design roadmap §3, implementation plan V2 §3

## Status Legend

- [ ] Not started
- [~] In progress
- [x] Complete

---

## Structural Divergences from Design Documents

The design roadmap §3 and implementation plan §3 made assumptions about the Superpowers repo structure based on earlier analysis. The repo has evolved significantly (v5.0.6, March 2026). The following divergences must be understood before applying the checklist:

### D1 — No CLAUDE.md in the repo

**Design assumed:** CLAUDE.md serves as the plugin manifest.
**Actual:** There is no CLAUDE.md file. The plugin manifest is `.claude-plugin/plugin.json` (a JSON file with name, description, version, author, homepage, repository, license, keywords). Claude Code discovers skills, agents, commands, and hooks by convention (directory names), NOT by manifest declaration. The Cursor manifest (`.cursor-plugin/plugin.json`) *does* explicitly declare paths (`"skills": "./skills/"`, `"agents": "./agents/"`, etc.), but the Claude Code one does not.

**Impact on pp-superpowers:** The implementation plan §3.3 references "CLAUDE.md (plugin manifest)" with four REPLACE items. These should target `.claude-plugin/plugin.json` instead. The CLAUDE.md section in the template checklist is incorrect — there is no CLAUDE.md to replace.

### D2 — Multi-platform support files exist

**Design assumed:** Claude Code only.
**Actual:** The repo supports Claude Code, Cursor, Gemini CLI, OpenCode, and Codex. This adds files not anticipated:
- `.cursor-plugin/plugin.json` — Cursor manifest
- `hooks/hooks-cursor.json` — Cursor hook format
- `gemini-extension.json` — Gemini CLI extension manifest
- `GEMINI.md` — Gemini CLI context file
- `docs/README.opencode.md` — OpenCode installation guide
- `docs/README.codex.md` — Codex installation guide
- `package.json` — npm package for OpenCode install

**Impact on pp-superpowers:** pp-superpowers targets Claude Code only (per suite roadmap). All multi-platform files should be REMOVED. If Cursor support is desired later, it can be re-added — but it's not in scope and keeping these files creates maintenance burden.

### D3 — Hook is extensionless, uses polyglot wrapper

**Design assumed:** `hooks/session-start.sh`
**Actual:** `hooks/session-start` (no extension) + `hooks/run-hook.cmd` (polyglot wrapper for cross-platform bash discovery). The extensionless name prevents Claude Code's `.sh` auto-detection from breaking execution on Windows. `hooks.json` references `run-hook.cmd session-start` as the command.

**Impact on pp-superpowers:** Keep this pattern. The hook file should be `hooks/session-start` (extensionless). The `run-hook.cmd` wrapper and `hooks.json` dispatcher should be KEPT as infrastructure.

### D4 — Session-start hook injects skill content, does NOT write files

**Design assumed:** The session-start hook writes `.pp-context/project.json` to disk.
**Actual:** The Superpowers session-start hook does NOT write any files. It reads `using-superpowers/SKILL.md`, JSON-escapes it, and outputs a JSON blob with `hookSpecificOutput.additionalContext` that Claude Code injects into the conversation context. The hook is a context injector, not a file writer.

**Impact on pp-superpowers:** This is a fundamental architecture question. The design roadmap §4 says the hook "writes project-level context to `.pp-context/project.json`." But the Superpowers pattern is context injection via JSON output, not file writing. Two options:

1. **Follow the Superpowers pattern** — inject `.pp-context/` data as conversation context via hook JSON output. Simpler. No filesystem side effects. But other plugins can't read the context (it's in-memory only).
2. **Write files AND inject context** — the hook writes `.pp-context/` files (for cross-plugin coordination) AND outputs JSON context (for immediate availability). This is what the design intends, since the suite roadmap §3.1 says other plugins read `.pp-context/`.

**Recommendation:** Option 2. The hook should do both — write `.pp-context/` files for inter-plugin coordination, then inject a summary into conversation context via the Superpowers JSON output pattern. This preserves the proven context injection mechanism while adding the file-writing behavior pp-superpowers needs.

### D5 — Only one agent exists (code-reviewer.md)

**Design assumed:** Multiple agents in `agents/`.
**Actual:** Only `agents/code-reviewer.md` exists. Additionally, some skills have local reviewer prompt templates (e.g., `skills/requesting-code-review/code-reviewer.md`, `skills/subagent-driven-development/implementer-prompt.md`). The agent file format uses YAML frontmatter (name, description, model) followed by markdown instructions.

**Impact on pp-superpowers:** The design roadmap §5 lists 6 domain-specific agents. The agent format is confirmed: YAML frontmatter + markdown body. Local prompt templates within skill directories are also a valid pattern for subagent dispatch.

### D6 — All three commands are deprecated

**Design assumed:** Retained command infrastructure.
**Actual:** All three commands (`brainstorm.md`, `write-plan.md`, `execute-plan.md`) are deprecated stubs that display deprecation notices. They will be removed in the next major release. The Superpowers skill invocation model has moved entirely to the `Skill` tool — commands are considered legacy.

**Impact on pp-superpowers:** Don't carry deprecated commands forward. The implementation plan §3.3 says "REPLACE: Map existing commands to pp-superpowers equivalents or REMOVE." The answer is REMOVE all three. If pp-superpowers needs slash commands (e.g., `/pac-status`), they can be added fresh — but the design should justify why a command is better than a skill for each case.

### D7 — Brainstorm server and visual companion exist

**Design assumed:** Not anticipated.
**Actual:** `skills/brainstorming/scripts/` contains a zero-dependency Node.js WebSocket server for browser-based visual brainstorming. Session management scripts (`start-server.sh`, `stop-server.sh`) and a visual companion guide (`visual-companion.md`) are included.

**Impact on pp-superpowers:** REMOVE entirely. pp-superpowers skills don't need a browser companion. If visual output is needed, it's handled by the skill's conversation flow (e.g., generating Mermaid diagrams or Excalidraw).

### D8 — Skill SKILL.md format confirmed

**Actual format:** YAML frontmatter with `name` and `description` fields (two required fields per agentskills.io spec, additional fields supported), followed by markdown body. The `description` field is critical — it's the trigger condition that Claude Code uses to decide whether to invoke the skill. Best practice from release notes: descriptions should be trigger-only ("Use when X") with no process details.

**Impact on pp-superpowers:** All pp-superpowers SKILL.md files must follow this format. The `description` field should be a concise trigger condition, not a workflow summary.

### D9 — Design roadmap §5 listed code-app under ui-design but not in the target tree

**Design assumed (§5 target tree):** `ui-design/` sub-skills include model-driven-app, canvas-app, pcf-control, custom-page, modal-dialog. code-app is not in the tree.
**Actual (ui-design spec):** code-app is fully specified as a sub-skill in `pp-superpowers-ui-design.md` §9.

**Impact on pp-superpowers:** Add `skills/ui-design/code-app/SKILL.md` to the checklist. This was designed but accidentally omitted from the §5 target tree.

---

## .claude-plugin/ (plugin manifest)

- [ ] REPLACE: `plugin.json` — Update name from `superpowers` to `pp-superpowers`, update description to Power Platform domain, update version to `0.1.0`, update author to SDFX Studios, update homepage/repository to pp-superpowers repo URL, update keywords to Power Platform terms
- [ ] REPLACE: `marketplace.json` — Update all fields to pp-superpowers identity. Defer marketplace registration until plugin is functional.

## .cursor-plugin/ (Cursor support — not in scope)

- [ ] REMOVE: `plugin.json` — pp-superpowers targets Claude Code only. Cursor support is out of scope per suite roadmap.

## hooks/

- [ ] KEEP: `hooks.json` — Hook dispatch infrastructure. Update only the matcher if pp-superpowers needs different trigger events. Current matcher (`startup|clear|compact`) is correct.
- [ ] REPLACE: `session-start` — Replace Superpowers context injection with pp-superpowers hook that: (1) writes `.pp-context/` files (solution, environment, pac-state), (2) reads `using-pp-superpowers/SKILL.md`, (3) outputs JSON context via `hookSpecificOutput.additionalContext`. See divergence D4.
- [ ] KEEP: `run-hook.cmd` — Polyglot wrapper for cross-platform hook execution. No modification needed.
- [ ] REMOVE: `hooks-cursor.json` — Cursor-specific hook format. Not in scope (see D2).

## commands/ (all deprecated — remove)

- [ ] REMOVE: `brainstorm.md` — Deprecated stub. pp-superpowers uses skills, not commands (see D6).
- [ ] REMOVE: `write-plan.md` — Deprecated stub.
- [ ] REMOVE: `execute-plan.md` — Deprecated stub.

**Decision:** The `commands/` directory itself should remain (Claude Code expects it by convention) but will be empty initially. If pp-superpowers needs commands later (e.g., `/pac-status`), they can be added — but each must justify why a command is better than a skill.

## agents/

- [ ] REMOVE: `code-reviewer.md` — Superpowers generic code reviewer. Replaced by domain-specific pp-superpowers agents.
- [ ] ADD: `schema-reviewer.md` — Schema design review agent (schema-design skill)
- [ ] ADD: `plugin-auditor.md` — C# plugin audit agent (business-logic/csharp-plugin)
- [ ] ADD: `ui-reviewer.md` — UI design review agent (ui-design skill)
- [ ] ADD: `security-reviewer.md` — Security review agent (security skill)
- [ ] ADD: `alm-reviewer.md` — ALM workflow review agent (alm-workflow skill)
- [ ] ADD: `integration-reviewer.md` — Integration review agent (integration skill)

**Note:** The design roadmap §3.3 also listed `architecture-advisor`, `domain-modeler`, and `solution-analyzer` as agents. These may be better implemented as local prompt templates within their respective skill directories (following the Superpowers pattern of `implementer-prompt.md` inside skill dirs) rather than global agents. Decision deferred to individual skill build sessions.

## skills/ — REMOVE existing Superpowers skills

- [ ] REMOVE: `brainstorming/` — Entire directory (includes SKILL.md, visual-companion.md, spec-document-reviewer-prompt.md, scripts/)
- [ ] REMOVE: `writing-plans/` — Entire directory (includes SKILL.md, plan-document-reviewer-prompt.md)
- [ ] REMOVE: `executing-plans/` — Entire directory
- [ ] REMOVE: `subagent-driven-development/` — Entire directory (includes SKILL.md, implementer-prompt.md, spec-reviewer-prompt.md, code-quality-reviewer-prompt.md)
- [ ] REMOVE: `test-driven-development/` — Entire directory
- [ ] REMOVE: `systematic-debugging/` — Entire directory
- [ ] REMOVE: `verification-before-completion/` — Entire directory
- [ ] REMOVE: `requesting-code-review/` — Entire directory (includes local code-reviewer.md)
- [ ] REMOVE: `receiving-code-review/` — Entire directory
- [ ] REMOVE: `dispatching-parallel-agents/` — Entire directory
- [ ] REMOVE: `writing-skills/` — Entire directory

## skills/ — KEEP with adaptation

- [ ] REPLACE: `using-superpowers/` → `using-pp-superpowers/` — Rewrite as pp-superpowers orientation skill. Keep the proven enforcement patterns (EXTREMELY-IMPORTANT block, 1% rule, rationalization table, SUBAGENT-STOP gate, instruction priority hierarchy, graphviz flow diagram). Replace all Superpowers skill references with pp-superpowers skill names. Remove Codex/Gemini/OpenCode platform adaptation references.
- [ ] REMOVE: `using-superpowers/references/codex-tools.md` — Not in scope.
- [ ] REMOVE: `using-superpowers/references/gemini-tools.md` — Not in scope.
- [ ] KEEP (evaluate): `using-git-worktrees/` — Useful for parallel development. Keep as-is or adapt minimally. Decision: KEEP unchanged for now; revisit during alm-workflow skill build.
- [ ] KEEP (evaluate): `finishing-a-development-branch/` — Useful for branch completion. Keep as-is or adapt with ALM awareness (solution export verification). Decision: KEEP unchanged for now; revisit during alm-workflow skill build.

## skills/ — ADD pp-superpowers skills

### Phase 1 — Foundation

- [ ] ADD: `solution-discovery/SKILL.md` — First skill to build. Per pp-superpowers-solution-discovery.md spec.
- [ ] ADD: `solution-strategy/SKILL.md` — Refines solution packaging from solution-discovery.

### Phase 2 — Design Layer

- [ ] ADD: `application-design/SKILL.md` — DDD modeling. Per pp-superpowers-application-design.md spec.
- [ ] ADD: `schema-design/SKILL.md` — Physical data model. Per pp-superpowers-schema-design.md spec.

### Phase 3 — Build Layer

- [ ] ADD: `ui-design/SKILL.md` — Router skill, routes by app type.
- [ ] ADD: `ui-design/model-driven-app/SKILL.md` — Per pp-superpowers-ui-design.md §3.
- [ ] ADD: `ui-design/canvas-app/SKILL.md` — Per pp-superpowers-ui-design.md §5.
- [ ] ADD: `ui-design/pcf-control/SKILL.md` — Per pp-superpowers-ui-design.md §6.
- [ ] ADD: `ui-design/custom-page/SKILL.md` — Per pp-superpowers-ui-design.md §7.
- [ ] ADD: `ui-design/modal-dialog/SKILL.md` — Per pp-superpowers-ui-design.md §8.
- [ ] ADD: `ui-design/code-app/SKILL.md` — Per pp-superpowers-ui-design.md §9. (See D9)
- [ ] ADD: `business-logic/SKILL.md` — Router skill, routes by logic type.
- [ ] ADD: `business-logic/csharp-plugin/SKILL.md` — Per pp-superpowers-business-logic.md.
- [ ] ADD: `business-logic/power-automate/SKILL.md` — Per pp-superpowers-business-logic.md.
- [ ] ADD: `business-logic/business-rule/SKILL.md` — Per pp-superpowers-business-logic.md.
- [ ] ADD: `business-logic/client-script/SKILL.md` — Per pp-superpowers-business-logic.md.
- [ ] ADD: `security/SKILL.md` — Design doc not yet started.

### Phase 4 — Lifecycle

- [ ] ADD: `integration/SKILL.md` — Router skill, routes by integration type. Design doc not yet started.
- [ ] ADD: `integration/connectors/SKILL.md`
- [ ] ADD: `integration/dataflows/SKILL.md`
- [ ] ADD: `integration/virtual-tables/SKILL.md`
- [ ] ADD: `integration/fabric/SKILL.md`
- [ ] ADD: `alm-workflow/SKILL.md` — Design doc not yet started.
- [ ] ADD: `environment-setup/SKILL.md` — Design doc not yet started.

## Root files

- [ ] REPLACE: `README.md` — Rewrite for pp-superpowers (installation, skill inventory, usage, Power Platform context).
- [ ] REMOVE: `RELEASE-NOTES.md` — Superpowers-specific release history. pp-superpowers starts fresh with its own changelog.
- [ ] KEEP: `LICENSE` — MIT license. Verify compatibility with pp-superpowers licensing intent.
- [ ] REMOVE: `package.json` — OpenCode npm install support. Not in scope (see D2).
- [ ] REMOVE: `gemini-extension.json` — Gemini CLI support. Not in scope (see D2).
- [ ] REMOVE: `GEMINI.md` — Gemini CLI context file. Not in scope (see D2).
- [ ] KEEP: `.gitignore` — Review and update for pp-superpowers needs (add `.pp-context/`, `.foundation/`).

## docs/

- [ ] REMOVE: `README.opencode.md` — Not in scope.
- [ ] REMOVE: `README.codex.md` — Not in scope.
- [ ] REMOVE: `testing.md` — Superpowers testing guide. Replace with pp-superpowers testing approach when needed.
- [ ] REMOVE: `plans/` — Superpowers brainstorm/plan artifacts.
- [ ] REMOVE: `superpowers/` — Superpowers design specs.
- [ ] ADD: `design-status.md` — Tracks design document approval state.
- [ ] ADD: `fork-modification-checklist.md` — This file.
- [ ] ADD: `skill-framework.md` — Skill authoring guide for pp-superpowers (per design roadmap §5 target tree).

## tests/

- [ ] REMOVE: `explicit-skill-requests/` — Superpowers-specific test suite.
- [ ] REMOVE: `claude-code/` — Superpowers-specific test scripts.
- [ ] REMOVE: `brainstorm-server/` — Brainstorm server tests.
- [ ] ADD: Test infrastructure for pp-superpowers skills (format TBD during Phase 1 build).

## dev-stub.sh (new — development infrastructure)

- [ ] ADD: `dev-stub.sh` — Writes fake `.pp-context/` files for development before pp-devenv is built. See separate file.

---

## Summary Counts

| Category | Count |
|---|---|
| KEEP (unchanged) | 5 files (run-hook.cmd, hooks.json, LICENSE, .gitignore, using-git-worktrees, finishing-a-development-branch) |
| REPLACE | 4 files (plugin.json, marketplace.json, session-start hook, using-superpowers → using-pp-superpowers) |
| REMOVE | ~30+ files across all Superpowers-specific content |
| ADD | ~35+ files (10 skills, 13 sub-skills, 6 agents, docs, dev-stub, tests) |

---

## Open Questions for Build Sessions

1. **architecture-advisor, domain-modeler, solution-analyzer** — Global agents or local prompt templates? Defer to skill build sessions.
2. **Commands directory** — Keep empty or add pp-superpowers commands? Defer to Phase 1 build.
3. **using-git-worktrees and finishing-a-development-branch** — Keep as-is or adapt? Defer to alm-workflow skill build.
4. **Test infrastructure format** — Superpowers uses bash scripts with `claude -p`. Adopt same pattern or different? Defer to Phase 1 validation.
