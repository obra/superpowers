# Visual Planner mdcl Artifact Linking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the visual-planner agent instructions to use the `mdcl-cli` skill and return the mdcl-hosted artifact URL on its default daemon port, `4321`.

**Architecture:** Keep the existing HTML generation and styling instructions unchanged. Replace the manually managed artifact-server workflow with mdcl skill usage: resolve the configured artifact root, write the HTML artifact there, verify mdcl state, link the exact artifact through mdcl, and return mdcl’s printed URL verbatim.

**Tech Stack:** Markdown agent instructions, `mdcl-cli` skill, mdcl local daemon on default port `4321`.

## Global Constraints

- Use the `mdcl-cli` skill for artifact location, daemon verification, and artifact linking.
- Use mdcl’s default daemon port `4321`; do not scan for ports or expose a competing `PORT` input.
- Keep the visual-planner’s required HTML stack and incremental generation workflow unchanged.
- Write the artifact as `<slug>.html` under the artifact root returned by `mdcl artifact-path get`.
- Return only the exact URL printed by `mdcl artifacts link`; never construct or guess the URL.
- Do not add dependencies, refactor unrelated instructions, or commit changes without explicit user approval.

---

## File Map

- Modify: `agents/visual-planner/agent.md` — update the input contract, artifact output-path guidance, server/linking steps, and final verification/output wording.
- No test files are needed; verification is a targeted textual audit of the edited instructions and the resulting diff.

---

### Task 1: Replace manual artifact hosting with the mdcl-cli workflow

**Files:**
- Modify: `agents/visual-planner/agent.md:24-32` for the input/output contract
- Modify: `agents/visual-planner/agent.md:44-52` for artifact location
- Modify: `agents/visual-planner/agent.md:172-184` for daemon startup and URL output
- Modify: `agents/visual-planner/agent.md:209-215` for final verification/output requirements

**Interfaces:**
- Consumes: The existing `PLAN_PATH`, optional `TITLE`, and optional `DARK_MODE` delegate context values.
- Produces: A visual-planner instruction contract that uses the `mdcl-cli` skill and returns the URL emitted by `mdcl artifacts link`.

- [ ] **Step 1: Update the contract and artifact location wording**

Keep these input fields:

```markdown
- `PLAN_PATH` — absolute path to the plan/spec/document markdown file
- `TITLE` (optional) — page title override
- `DARK_MODE` (optional) — `true` to start in dark theme
```

Remove the `PORT` input entirely. Replace the hard-coded output path:

```markdown
Output path: `~/.claude/artifacts/<slug>.html` (slug from plan title: lowercase, hyphens, no special chars)
```

with:

```markdown
Before artifact work, use the `mdcl-cli` skill. Resolve the configured artifact root with `mdcl artifact-path get`, then write the file as `<slug>.html` in that root (slug from plan title: lowercase, hyphens, no special chars).
```

- [ ] **Step 2: Replace the manual server instructions**

Replace the current steps 4 and 5, including the port scan, `lsof` checks, Python HTTP server, sleep, and manually constructed URL, with:

```markdown
4. **Use the `mdcl-cli` skill to host the artifact:**
   - Verify the generated file exists at the artifact root returned by `mdcl artifact-path get`.
   - Run `mdcl status` and confirm the mdcl daemon is serving the workspace artifact.
   - Run `mdcl artifacts link <slug>.html` using the exact generated filename.
   - Use mdcl's default daemon port `4321`; do not scan for ports, start `python3 -m http.server`, or construct the URL manually.

5. Return the exact URL printed by `mdcl artifacts link <slug>.html`.
```

- [ ] **Step 3: Align the final output contract**

Replace the final output wording:

```markdown
Verify the file exists and the server is listening, then return **only the URL** — nothing else.

```
http://localhost:{PORT}/{slug}.html
```
```

with:

```markdown
Verify the artifact exists, confirm mdcl status, and return **only the URL printed by `mdcl artifacts link`** — nothing else. Do not guess, construct, or rewrite the URL.
```

- [ ] **Step 4: Audit the edited instructions**

Run these checks from the repository root:

```bash
grep -nE 'PORT|python3 -m http.server|Find a free port|lsof -i|localhost:\{PORT\}|~/.claude/artifacts' agents/visual-planner/agent.md
```

Expected: no output, because the old configurable-port, manual-server, guessed-URL, and hard-coded-artifact-root instructions have been removed.

```bash
grep -nE 'mdcl-cli|mdcl artifact-path get|mdcl status|mdcl artifacts link|4321|return \*\*only the URL' agents/visual-planner/agent.md
```

Expected: matches for the required mdcl skill, artifact-path discovery, daemon verification, artifact linking, default port, and URL-only output requirements.

```bash
git diff --check && git diff -- agents/visual-planner/agent.md
```

Expected: no whitespace errors, and the diff contains only the requested visual-planner artifact workflow changes.

- [ ] **Step 5: Run the repository’s relevant instruction validation**

If the repository provides a test or validation command specifically for agent/skill files, run that command. Otherwise, use the targeted grep checks and `git diff --check` from Step 4 as the verification for this Markdown-only change. Do not claim the mdcl daemon was exercised unless `mdcl` is actually run successfully in the local environment.

Do not create a commit unless the user explicitly requests one.
