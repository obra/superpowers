# Visual Design Lock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the visual design selected in the brainstorming companion through spec, plan, and subagent implementation via committed lock artifacts.

**Architecture:** A deterministic Node export script wraps a winner-only mockup fragment with the frame template's CSS into a self-contained HTML artifact committed under `docs/superpowers/specs/assets/`. Skill-content additions thread the artifact through the chain: design-system discovery before mocking (`visual-companion.md`), a Design Lock section in specs (`brainstorming/SKILL.md`), and a conditional threading rule putting the artifact path and a comparison step into every UI plan task (`writing-plans/SKILL.md`).

**Tech Stack:** Node.js (stdlib only), Bash, Markdown skill content. Test-only dependency landscape unchanged (`tests/brainstorm-server/` plain-node tests).

**Spec:** `docs/superpowers/specs/2026-07-10-visual-design-lock-design.md`

## Global Constraints

- **Zero dependencies.** No headless browser, no html2canvas, no vendored libraries. Screenshots are opportunistic, never required.
- **No changes to session-state persistence** — `.superpowers/brainstorm/` behavior untouched.
- **No `server.cjs` changes** — no new endpoints; the export script is standalone.
- The exported artifact must be **self-contained**: no external images, links kept inert, no helper script, no WebSocket code, no connection chrome.
- Skill-content edits are **small, conditional additions**; carefully-tuned surrounding content is left untouched verbatim.
- New shell scripts must pass `scripts/lint-shell.sh` (ShellCheck auto-discovers tracked `*.sh` files).
- Files added under `skills/brainstorming/scripts/` need no packaging-manifest updates (Codex packaging copies directories).

---

### Task 1: Export script (`export-mockup.cjs` + `export-mockup.sh`)

**Files:**
- Create: `skills/brainstorming/scripts/export-mockup.cjs`
- Create: `skills/brainstorming/scripts/export-mockup.sh`
- Test: `tests/brainstorm-server/export-mockup.test.js`
- Modify: `tests/brainstorm-server/package.json`

**Interfaces:**
- Consumes: `skills/brainstorming/scripts/frame-template.html` (read at runtime from the script's own directory; contains `<!-- BRANDING -->` and `<!-- CONTENT -->` placeholder comments and the literal status markup `<div class="status">Connecting…</div>` — note the `…` is U+2026 HORIZONTAL ELLIPSIS, not three dots).
- Produces: CLI `skills/brainstorming/scripts/export-mockup.sh <fragment-file> <output-file> [--title "Screen name"]` — writes a self-contained HTML file, creates parent directories, prints `{"type":"mockup-exported","output":"<abs path>"}` on stdout, exits non-zero with a `stderr` message on bad usage or missing input. Module exports (for tests): `exportMockup(fragmentHtml, {title})`, `isFullDocument(html)`, `escapeHtmlText(value)`. Task 2's documentation references this CLI verbatim.

- [ ] **Step 1: Write the failing test**

Create `tests/brainstorm-server/export-mockup.test.js`:

```javascript
/**
 * Tests for export-mockup.cjs — the design-lock export script.
 *
 * The export wraps a winner-only mockup fragment with the frame template's
 * CSS into a self-contained static artifact: no helper script, no WebSocket
 * code, no connection chrome, no external references added by the frame.
 */

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const SCRIPTS_DIR = path.join(__dirname, '../../skills/brainstorming/scripts');
const SH_PATH = path.join(SCRIPTS_DIR, 'export-mockup.sh');
const { exportMockup, isFullDocument, escapeHtmlText } = require(
  path.join(SCRIPTS_DIR, 'export-mockup.cjs')
);
const TEST_DIR = '/tmp/brainstorm-export-test';

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
}

function main() {
  cleanup();
  fs.mkdirSync(TEST_DIR, { recursive: true });

  const fragment = '<h2>Dashboard</h2><div class="mockup"><div class="mockup-body">cards-here</div></div>';

  // --- exportMockup(): wrapping behavior ---

  const out = exportMockup(fragment, { title: 'Dashboard' });
  assert.ok(out.includes('cards-here'), 'output contains the fragment');
  assert.ok(out.trimStart().startsWith('<!DOCTYPE html>'), 'output is a full document');
  assert.ok(out.includes('--bg-primary'), 'output inlines the frame theme CSS');
  assert.ok(!out.includes('<!-- CONTENT -->'), 'content placeholder replaced');
  assert.ok(!out.includes('<!-- BRANDING -->'), 'branding placeholder replaced');
  console.log('ok - wraps fragment with frame CSS');

  assert.ok(!out.includes('<script'), 'no scripts in artifact');
  assert.ok(!out.includes('WebSocket'), 'no WebSocket code in artifact');
  assert.ok(!out.includes('Connecting'), 'no connection status in artifact');
  console.log('ok - omits helper and connection chrome');

  assert.ok(!out.includes('brand-logo'), 'no remote brand image');
  assert.ok(!out.includes('primeradiant.com'), 'no external brand URL');
  assert.ok(!out.includes('href="https://github.com'), 'no upstream repo link');
  assert.ok(out.includes('Dashboard — locked design'), 'artifact labeled with title');
  console.log('ok - self-contained: no external references added by frame');

  const escaped = exportMockup(fragment, { title: 'A<B>&"C' });
  assert.ok(escaped.includes('A&lt;B&gt;&amp;&quot;C'), 'title is HTML-escaped');
  console.log('ok - escapes title');

  const fullDoc = '<!DOCTYPE html><html><body>standalone</body></html>';
  assert.strictEqual(exportMockup(fullDoc, { title: 'x' }), fullDoc,
    'full documents pass through unchanged');
  assert.ok(isFullDocument('  <!doctype html>'), 'isFullDocument: doctype');
  assert.ok(isFullDocument('<HTML>'), 'isFullDocument: html tag');
  assert.ok(!isFullDocument('<h2>hi</h2>'), 'isFullDocument: fragment');
  console.log('ok - full documents pass through unchanged');

  assert.strictEqual(escapeHtmlText('a&b'), 'a&amp;b', 'escapeHtmlText basic');
  console.log('ok - escapeHtmlText');

  // --- CLI behavior via the .sh entry point ---

  const fragmentFile = path.join(TEST_DIR, 'dashboard-final.html');
  fs.writeFileSync(fragmentFile, fragment);
  const outputFile = path.join(TEST_DIR, 'assets/2026-07-10-demo/dashboard.html');

  const stdout = execFileSync(SH_PATH, [fragmentFile, outputFile, '--title', 'Dashboard'], {
    encoding: 'utf-8',
  });
  const info = JSON.parse(stdout);
  assert.strictEqual(info.type, 'mockup-exported', 'CLI prints mockup-exported JSON');
  assert.strictEqual(info.output, outputFile, 'CLI reports absolute output path');
  const written = fs.readFileSync(outputFile, 'utf-8');
  assert.ok(written.includes('cards-here'), 'CLI wrote the wrapped artifact');
  assert.ok(written.includes('Dashboard — locked design'), 'CLI passed --title through');
  console.log('ok - CLI exports and creates parent directories');

  const defaultTitle = path.join(TEST_DIR, 'assets/2026-07-10-demo/settings.html');
  execFileSync(SH_PATH, [fragmentFile, defaultTitle], { encoding: 'utf-8' });
  assert.ok(fs.readFileSync(defaultTitle, 'utf-8').includes('settings — locked design'),
    'CLI defaults title to output basename');
  console.log('ok - CLI defaults title to output basename');

  const noArgs = spawnSync(SH_PATH, [], { encoding: 'utf-8' });
  assert.notStrictEqual(noArgs.status, 0, 'missing args exit non-zero');
  assert.ok(noArgs.stderr.includes('usage:'), 'missing args print usage');
  const noInput = spawnSync(SH_PATH, [path.join(TEST_DIR, 'nope.html'), outputFile], {
    encoding: 'utf-8',
  });
  assert.notStrictEqual(noInput.status, 0, 'missing input exits non-zero');
  assert.ok(noInput.stderr.includes('not found'), 'missing input names the problem');
  console.log('ok - CLI errors on bad usage and missing input');

  cleanup();
  console.log('export-mockup tests passed');
}

main();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tests/brainstorm-server && node export-mockup.test.js`
Expected: FAIL with `Cannot find module '.../skills/brainstorming/scripts/export-mockup.cjs'`

- [ ] **Step 3: Write the implementation**

Create `skills/brainstorming/scripts/export-mockup.cjs`:

```javascript
#!/usr/bin/env node
/**
 * Export a locked mockup fragment as a self-contained standalone HTML file.
 *
 * Wraps a content fragment with the frame template's CSS — no branding link
 * or remote logo, no connection status, no helper script, no WebSocket code.
 * The output is a static design artifact suitable for committing next to a
 * spec (the "design lock").
 *
 * Full documents (starting with <!DOCTYPE or <html) are copied through
 * unchanged.
 *
 * Usage: export-mockup.sh <fragment-file> <output-file> [--title "Screen name"]
 */

const fs = require('fs');
const path = require('path');

function isFullDocument(html) {
  const trimmed = html.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

// Duplicated from server.cjs: requiring server.cjs would start the server.
function escapeHtmlText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function exportMockup(fragmentHtml, { title = 'Locked design' } = {}) {
  if (isFullDocument(fragmentHtml)) {
    return fragmentHtml;
  }
  const frameTemplate = fs.readFileSync(
    path.join(__dirname, 'frame-template.html'),
    'utf-8'
  );
  const brand =
    '<div class="brand"><span class="brand-copy">' +
    escapeHtmlText(title) +
    ' — locked design</span></div>';
  return frameTemplate
    .split('<!-- BRANDING -->').join(brand)
    .replace('<div class="status">Connecting…</div>', '')
    .replace('<!-- CONTENT -->', fragmentHtml);
}

function main() {
  const args = process.argv.slice(2);
  const positional = [];
  let title;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title') {
      i += 1;
      title = args[i];
      if (title === undefined) {
        process.stderr.write('error: --title requires a value\n');
        process.exit(1);
      }
    } else {
      positional.push(args[i]);
    }
  }
  const fragmentFile = positional[0];
  const outputFile = positional[1];
  if (!fragmentFile || !outputFile || positional.length > 2) {
    process.stderr.write(
      'usage: export-mockup.sh <fragment-file> <output-file> [--title "Screen name"]\n'
    );
    process.exit(1);
  }
  if (!fs.existsSync(fragmentFile)) {
    process.stderr.write('error: fragment file not found: ' + fragmentFile + '\n');
    process.exit(1);
  }
  if (title === undefined) {
    title = path.basename(outputFile).replace(/\.[^.]*$/, '');
  }
  const fragment = fs.readFileSync(fragmentFile, 'utf-8');
  const resolvedOutput = path.resolve(outputFile);
  fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });
  fs.writeFileSync(resolvedOutput, exportMockup(fragment, { title }));
  process.stdout.write(
    JSON.stringify({ type: 'mockup-exported', output: resolvedOutput }) + '\n'
  );
}

module.exports = { isFullDocument, escapeHtmlText, exportMockup };

if (require.main === module) {
  main();
}
```

Note: the `…` in `Connecting…` is U+2026 HORIZONTAL ELLIPSIS, matching `frame-template.html` exactly — three ASCII dots will not match and the status chrome would leak into artifacts (the test's `Connecting` assertion catches this).

Create `skills/brainstorming/scripts/export-mockup.sh`:

```bash
#!/usr/bin/env bash
#
# Export a locked mockup fragment as a self-contained HTML artifact.
#
# Usage:
#   export-mockup.sh <fragment-file> <output-file> [--title "Screen name"]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/export-mockup.cjs" "$@"
```

Run: `chmod +x skills/brainstorming/scripts/export-mockup.sh skills/brainstorming/scripts/export-mockup.cjs`

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tests/brainstorm-server && node export-mockup.test.js`
Expected: PASS — nine `ok - ...` lines then `export-mockup tests passed`

- [ ] **Step 5: Register the test and run the full suite**

In `tests/brainstorm-server/package.json`, change the `test` script line:

Old:

```json
    "test": "node ws-protocol.test.js && node helper.test.js && node browser-launcher.test.js && node auth.test.js && node branding.test.js && node server.test.js && node lifecycle.test.js && bash start-server.test.sh && bash stop-server.test.sh"
```

New:

```json
    "test": "node ws-protocol.test.js && node helper.test.js && node export-mockup.test.js && node browser-launcher.test.js && node auth.test.js && node branding.test.js && node server.test.js && node lifecycle.test.js && bash start-server.test.sh && bash stop-server.test.sh"
```

Run: `cd tests/brainstorm-server && npm install && npm test`
Expected: all suites pass, including `export-mockup tests passed`

- [ ] **Step 6: Lint the shell script**

Run: `scripts/lint-shell.sh skills/brainstorming/scripts/export-mockup.sh`
Expected: exit 0, no ShellCheck findings

- [ ] **Step 7: Commit**

```bash
git add skills/brainstorming/scripts/export-mockup.cjs \
        skills/brainstorming/scripts/export-mockup.sh \
        tests/brainstorm-server/export-mockup.test.js \
        tests/brainstorm-server/package.json
git commit -m "feat(brainstorming): add deterministic mockup export script for design lock"
```

---

### Task 2: `visual-companion.md` — design-system discovery + locking sections

**Files:**
- Modify: `skills/brainstorming/visual-companion.md`

**Interfaces:**
- Consumes: `export-mockup.sh <fragment-file> <output-file> [--title ...]` CLI from Task 1.
- Produces: the section title **"Locking a Design"** and the artifact path convention `docs/superpowers/specs/assets/YYYY-MM-DD-<topic>/<screen>.html`, both referenced by Tasks 3 and 4.

- [ ] **Step 1: Insert the "Existing Design Systems" section**

In `skills/brainstorming/visual-companion.md`, insert immediately before the line `## The Loop`:

```markdown
## Existing Design Systems

Before writing the first mockup in a project that already has a UI, resolve
design-system intent — otherwise the user selects a mockup that looks nothing
like what will ship.

1. **Inspect the codebase for design tokens:** CSS custom properties, Tailwind
   (or similar) config, theme files, component libraries.
2. **Ask the user one question** (terminal or browser, per the usual test):

   > "Should mockups follow your app's existing design system, or explore a
   > new visual direction?"

3. **Apply the answer:**
   - **Existing system** — embed the app's real tokens in each mockup via a
     scoped `<style>` block inside the fragment. What the user selects is an
     honest preview of what ships.
   - **New direction** — mock freely; the design lock (see Locking a Design)
     captures the new look as the design source of truth.
   - **Greenfield project** — skip the question; the locked mockup seeds the
     design system.

Record the answer — it becomes the **fidelity decision** in the spec's Design
Lock section. If discovery was skipped or the answer is ambiguous when a
design is locked, ask then — lock time is the fallback checkpoint, not the
primary one.

```

- [ ] **Step 2: Add the lock pointer to The Loop**

In the same file, in "## The Loop" step 4, make this edit:

Old:

```markdown
4. **Iterate or advance** — if feedback changes current screen, write a new file (e.g., `layout-v2.html`). Only move to the next question when the current step is validated.
```

New:

```markdown
4. **Iterate or advance** — if feedback changes current screen, write a new file (e.g., `layout-v2.html`). Only move to the next question when the current step is validated. When a visual choice is final, lock it — see **Locking a Design** below.
```

- [ ] **Step 3: Insert the "Locking a Design" section**

In the same file, insert immediately before the line `## Design Tips`:

````markdown
## Locking a Design

When a visual choice is finalized — the selection that ends exploration for a
screen, not every click — lock it so the design survives into the spec, the
plan, and implementation:

1. **Push a final-design fragment** to `screen_dir` containing only the
   winning design — no A/B/C chooser, no selection UI, no `onclick` handlers.
   This doubles as visual confirmation for the user.
2. **Export it** with the deterministic export script:

   ```bash
   scripts/export-mockup.sh $SCREEN_DIR/dashboard-final.html \
     docs/superpowers/specs/assets/YYYY-MM-DD-<topic>/dashboard.html \
     --title "Dashboard"
   ```

   The output is a self-contained standalone HTML file: frame CSS inlined, no
   helper script, no connection chrome, no external references. One file per
   locked screen. (User preferences for spec location override this default.)
3. **Opportunistic screenshot:** if your harness has a browser screenshot tool
   (Playwright MCP, Chrome DevTools MCP, etc.), also capture `<screen>.png`
   beside the HTML. Never install tooling to get one; with no tool available,
   skip silently. The HTML is the artifact of record.
4. **Commit the artifacts together with the spec**, and record them in the
   spec's **Design Lock** section (see the brainstorming skill): artifact
   paths, the fidelity decision from design-system discovery, and 3–7
   plain-language load-bearing properties per screen.

````

- [ ] **Step 4: Verify the sections landed**

Run: `grep -n "^## Existing Design Systems\|^## Locking a Design\|lock it — see" skills/brainstorming/visual-companion.md`
Expected: three matches — the two new section headings and the Loop step-4 pointer, with "Existing Design Systems" before "The Loop" and "Locking a Design" before "Design Tips".

- [ ] **Step 5: Commit**

```bash
git add skills/brainstorming/visual-companion.md
git commit -m "feat(brainstorming): design-system discovery and design-lock flow in visual companion"
```

---

### Task 3: `brainstorming/SKILL.md` — Design Lock spec requirement

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

**Interfaces:**
- Consumes: the **"Design Lock"** section name and `docs/superpowers/specs/assets/` path convention from Task 2.
- Produces: the spec-side **Design Lock** contract (artifact table, fidelity decision, load-bearing properties) that Task 4's threading rule reads.

- [ ] **Step 1: Extend the Documentation bullets**

In `skills/brainstorming/SKILL.md`, under `**Documentation:**` in the "## After the Design" section, make this edit:

Old:

```markdown
- Write the validated design (spec) to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
  - (User preferences for spec location override this default)
- Use elements-of-style:writing-clearly-and-concisely skill if available
- Commit the design document to git
```

New:

```markdown
- Write the validated design (spec) to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
  - (User preferences for spec location override this default)
- If the visual companion was used and designs were locked, include a **Design Lock** section in the spec:
  - **Artifact table** — screen name → committed artifact path (HTML, plus PNG when captured)
  - **Fidelity decision** — "match the locked mockup as rendered" or "adapt: keep layout, hierarchy, and structure; restyle with the app's existing tokens," naming the actual token sources
  - **Load-bearing properties** — 3–7 plain-language bullets per screen naming what must survive implementation
- Use elements-of-style:writing-clearly-and-concisely skill if available
- Commit the design document to git, including any locked design artifacts under `docs/superpowers/specs/assets/`
```

- [ ] **Step 2: Extend the Spec Self-Review checklist**

In the same file, make this edit:

Old:

```markdown
4. **Ambiguity check:** Could any requirement be interpreted two different ways? If so, pick one and make it explicit.
```

New:

```markdown
4. **Ambiguity check:** Could any requirement be interpreted two different ways? If so, pick one and make it explicit.
5. **Design lock check:** If the spec has a Design Lock section, does every artifact path it cites exist on disk?
```

- [ ] **Step 3: Verify the edits landed**

Run: `grep -n "Design Lock\|Design lock check" skills/brainstorming/SKILL.md`
Expected: matches in both the Documentation bullets and the Spec Self-Review checklist; no other content changed (`git diff --stat` shows only `skills/brainstorming/SKILL.md`).

- [ ] **Step 4: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat(brainstorming): require Design Lock section in specs with locked designs"
```

---

### Task 4: `writing-plans/SKILL.md` — Design Lock threading rule

**Files:**
- Modify: `skills/writing-plans/SKILL.md`

**Interfaces:**
- Consumes: the spec-side **Design Lock** contract from Task 3 and the artifact path convention from Task 2.
- Produces: the plan-side threading rule — this is the channel that delivers the locked design to subagent implementers, who see only their own task text.

- [ ] **Step 1: Insert the threading section**

In `skills/writing-plans/SKILL.md`, insert immediately before the line `## No Placeholders`:

```markdown
## Design Lock Threading

If the spec contains a Design Lock section (locked visual designs from the
brainstorming companion):

- Copy the fidelity decision and artifact paths into **Global Constraints**
  verbatim.
- For every task that implements UI covered by a locked design:
  - Add the artifact to the task's **Files** block:
    `Read: docs/superpowers/specs/assets/<...>/<screen>.html (locked design)`
  - Add a verification step before the commit step: render the result and
    compare against the locked mockup — with browser tooling if available,
    otherwise by diffing DOM structure and styles against the mockup file.
    Deviations from the spec's load-bearing properties are failures, not
    style choices.

Plans are self-contained and a task's implementer sees only their own task —
this threading is how the locked design reaches them.

```

- [ ] **Step 2: Verify the edit landed**

Run: `grep -n "^## Design Lock Threading" skills/writing-plans/SKILL.md && git diff --stat`
Expected: one heading match, positioned between "## Task Structure" and "## No Placeholders"; diff touches only `skills/writing-plans/SKILL.md`.

- [ ] **Step 3: Run the full brainstorm-server suite as a regression gate**

Run: `cd tests/brainstorm-server && npm test`
Expected: all suites pass (doc changes must not have broken anything — this also re-checks Task 1's suite on the final tree).

- [ ] **Step 4: Commit**

```bash
git add skills/writing-plans/SKILL.md
git commit -m "feat(writing-plans): thread Design Lock artifacts into UI plan tasks"
```

---

### Task 5: Skill-content review via writing-skills

**Files:**
- Modify (only if the review finds issues): `skills/brainstorming/visual-companion.md`, `skills/brainstorming/SKILL.md`, `skills/writing-plans/SKILL.md`

**Interfaces:**
- Consumes: the doc changes from Tasks 2–4.
- Produces: skill content confirmed against the project's skill-writing standards (this is the spec's "pressure-tested via superpowers:writing-skills" requirement for the fork round; full multi-session adversarial evals remain out of scope until upstreaming).

- [ ] **Step 1: Invoke the writing-skills skill**

Invoke `superpowers:writing-skills` and review the three changed skill documents against its guidance. Check specifically:

- No carefully-tuned content (Red Flags tables, rationalization lists, "your human partner" language) was reworded or restructured — additions only.
- The new sections match the surrounding voice (imperative, concrete, no hedging).
- Instructions are actionable by an agent with no session context (exact commands, exact paths).

- [ ] **Step 2: Confirm the diff is additive**

Run: `git diff main...HEAD -- skills/ | grep '^-' | grep -v '^---' | grep -v '^-$'`
Expected: only lines that Tasks 2–3 explicitly replaced (the Loop step 4 line, the Documentation bullets, the Ambiguity-check anchor context, the package.json test line) — nothing else removed.

- [ ] **Step 3: Fix anything the review surfaced and commit**

If no issues: nothing to commit; task complete. Otherwise:

```bash
git add skills/
git commit -m "fix(skills): address writing-skills review findings for design lock content"
```

---

## Not In Scope

- superpowers-evals scenarios (required before upstreaming; documented in the spec's Testing Strategy).
- Automated screenshot capture in core, and automated visual diffing of built UI vs. mockup (zero-dependency constraint; harness-dependent).
- Any change to `server.cjs`, session-state persistence, `executing-plans`, `subagent-driven-development`, or `verification-before-completion`.
