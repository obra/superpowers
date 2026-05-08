# Visual Companion Alpine Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Alpine-backed interactivity to the existing visual companion screen path without adding a second artifact/prototype system.

**Architecture:** Vendor one pinned Alpine 3.x browser artifact in the brainstorming skill runtime, serve it from a narrow localhost route, and load it from the existing frame template for fragment screens only. Keep the current helper/event model intact, update authoring guidance so agents use Alpine sparingly, and require evidence that the new guidance changes behavior.

**Tech Stack:** Node.js HTTP server, plain HTML/CSS/JavaScript, vendored Alpine.js 3.15.12, shell sync tests, Superpowers skill docs.

---

## Source Material

- Spec: `docs/superpowers/specs/2026-05-08-visual-companion-alpine-design.md`
- Linear: `SUP-215`
- Current branch: `codex/explore-interactive-prototypes`
- Verified Alpine package metadata on 2026-05-08:
  - Version: `3.15.12`
  - Tarball: `https://registry.npmjs.org/alpinejs/-/alpinejs-3.15.12.tgz`
  - npm integrity: `sha512-nJvPAQVNPdZZ0NrExJ/kzQco3ijR8LwvCOadQecllESiqT4NyZ/57sN9V2XyvhlBGAbmlKYgeWZvYdKq99ij/Q==`
  - Vendored file inside tarball: `package/dist/cdn.min.js`
  - SHA256 of `package/dist/cdn.min.js`: `57b37d7cae9a27d965fdae4adcc844245dfdc407e655aee85dcfff3a08036a3f`
  - License: MIT
  - Approval artifact: `SUP-215`

## File Structure

- Create: `skills/brainstorming/scripts/vendor/alpine.js`
  - Exact copy of Alpine `package/dist/cdn.min.js` from the pinned npm tarball.
- Create: `skills/brainstorming/scripts/vendor/alpine.provenance.json`
  - Machine-readable source URL, package version, vendored path, SHA256, approval artifact, and vendoring date.
- Create: `skills/brainstorming/scripts/vendor/THIRD_PARTY_NOTICES.md`
  - Human-readable Alpine license notice and refresh command.
- Modify: `skills/brainstorming/scripts/server.cjs`
  - Add parsed-path vendor serving for `/vendor/alpine.js`.
- Modify: `skills/brainstorming/scripts/frame-template.html`
  - Load Alpine for frame-wrapped fragments and neutralize the footer copy.
- Modify: `tests/brainstorm-server/server.test.js`
  - Cover provenance, vendor route behavior, helper injection, frame injection, and full-document/waiting-page boundaries.
- Modify: `skills/brainstorming/visual-companion.md`
  - Update agent-facing guidance from selection-first/static mockups to compact Alpine-backed interactive mockups.
- Modify: `scripts/sync-to-codex-plugin.sh`
  - Surface vendored Alpine provenance in generated Codex plugin sync PR bodies.
- Modify: `tests/codex-plugin-sync/test-sync-to-codex-plugin.sh`
  - Ensure nested skill-local scripts and vendor files survive root `/scripts/` exclusion and generated PR-body source includes the vendored dependency note.

## Task 1: Vendor Alpine and Add Provenance Tests

**Files:**
- Create: `skills/brainstorming/scripts/vendor/alpine.js`
- Create: `skills/brainstorming/scripts/vendor/alpine.provenance.json`
- Create: `skills/brainstorming/scripts/vendor/THIRD_PARTY_NOTICES.md`
- Modify: `tests/brainstorm-server/server.test.js`

- [ ] **Step 1: Write the failing provenance test**

Add this import alongside the existing `require` block:

```js
const crypto = require('crypto');
```

Add these constants near the existing `SERVER_PATH`, `TEST_PORT`, and directory constants in `tests/brainstorm-server/server.test.js`:

```js
const ALPINE_PATH = path.join(__dirname, '../../skills/brainstorming/scripts/vendor/alpine.js');
const ALPINE_PROVENANCE_PATH = path.join(__dirname, '../../skills/brainstorming/scripts/vendor/alpine.provenance.json');
const ALPINE_NOTICES_PATH = path.join(__dirname, '../../skills/brainstorming/scripts/vendor/THIRD_PARTY_NOTICES.md');
```

Add this helper below `fetch(url)`:

```js
function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}
```

Add this test block at the start of `runTests()`, before `// ========== Server Startup ==========`:

```js
    // ========== Vendored Alpine ==========
    console.log('\n--- Vendored Alpine ---');

    await test('vendored Alpine provenance is complete and matches artifact hash', () => {
      assert(fs.existsSync(ALPINE_PATH), 'alpine.js should exist');
      assert(fs.existsSync(ALPINE_PROVENANCE_PATH), 'alpine.provenance.json should exist');
      assert(fs.existsSync(ALPINE_NOTICES_PATH), 'THIRD_PARTY_NOTICES.md should exist');

      const provenance = JSON.parse(fs.readFileSync(ALPINE_PROVENANCE_PATH, 'utf-8'));
      assert.strictEqual(provenance.name, 'alpinejs');
      assert.strictEqual(provenance.version, '3.15.12');
      assert.strictEqual(provenance.license, 'MIT');
      assert.strictEqual(provenance.sourceUrl, 'https://registry.npmjs.org/alpinejs/-/alpinejs-3.15.12.tgz');
      assert.strictEqual(provenance.sourcePackagePath, 'package/dist/cdn.min.js');
      assert.strictEqual(provenance.localPath, 'skills/brainstorming/scripts/vendor/alpine.js');
      assert.strictEqual(provenance.sha256, '57b37d7cae9a27d965fdae4adcc844245dfdc407e655aee85dcfff3a08036a3f');
      assert.strictEqual(provenance.approvalArtifact, 'SUP-215');
      assert.strictEqual(sha256File(ALPINE_PATH), provenance.sha256);

      const notices = fs.readFileSync(ALPINE_NOTICES_PATH, 'utf-8');
      assert(notices.includes('Alpine.js'), 'Notice should name Alpine.js');
      assert(notices.includes('MIT License'), 'Notice should include MIT license text');
      assert(notices.includes('curl -fsSL https://registry.npmjs.org/alpinejs/-/alpinejs-3.15.12.tgz'), 'Notice should include refresh command');
      return Promise.resolve();
    });
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
cd "$(git rev-parse --show-toplevel)"
node tests/brainstorm-server/server.test.js
```

Expected: FAIL with `alpine.js should exist`.

- [ ] **Step 3: Vendor Alpine from the pinned npm tarball**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
mkdir -p skills/brainstorming/scripts/vendor
tmpdir="$(mktemp -d)"
curl -fsSL https://registry.npmjs.org/alpinejs/-/alpinejs-3.15.12.tgz -o "$tmpdir/alpinejs-3.15.12.tgz"
tar -xzf "$tmpdir/alpinejs-3.15.12.tgz" -C "$tmpdir" package/dist/cdn.min.js
cp "$tmpdir/package/dist/cdn.min.js" skills/brainstorming/scripts/vendor/alpine.js
rm -rf "$tmpdir"
shasum -a 256 skills/brainstorming/scripts/vendor/alpine.js
```

Expected SHA256:

```text
57b37d7cae9a27d965fdae4adcc844245dfdc407e655aee85dcfff3a08036a3f
```

- [ ] **Step 4: Create provenance metadata**

Create `skills/brainstorming/scripts/vendor/alpine.provenance.json` with this exact JSON:

```json
{
  "name": "alpinejs",
  "version": "3.15.12",
  "license": "MIT",
  "sourceUrl": "https://registry.npmjs.org/alpinejs/-/alpinejs-3.15.12.tgz",
  "sourcePackagePath": "package/dist/cdn.min.js",
  "localPath": "skills/brainstorming/scripts/vendor/alpine.js",
  "npmIntegrity": "sha512-nJvPAQVNPdZZ0NrExJ/kzQco3ijR8LwvCOadQecllESiqT4NyZ/57sN9V2XyvhlBGAbmlKYgeWZvYdKq99ij/Q==",
  "sha256": "57b37d7cae9a27d965fdae4adcc844245dfdc407e655aee85dcfff3a08036a3f",
  "approvalArtifact": "SUP-215",
  "vendoredAt": "2026-05-08"
}
```

Create `skills/brainstorming/scripts/vendor/THIRD_PARTY_NOTICES.md` with:

````markdown
# Third-Party Notices

## Alpine.js

- Package: `alpinejs`
- Version: `3.15.12`
- Source: `https://registry.npmjs.org/alpinejs/-/alpinejs-3.15.12.tgz`
- Vendored file: `package/dist/cdn.min.js`
- Local path: `skills/brainstorming/scripts/vendor/alpine.js`
- SHA256: `57b37d7cae9a27d965fdae4adcc844245dfdc407e655aee85dcfff3a08036a3f`

Refresh command:

```bash
cd "$(git rev-parse --show-toplevel)"
tmpdir="$(mktemp -d)"
curl -fsSL https://registry.npmjs.org/alpinejs/-/alpinejs-3.15.12.tgz -o "$tmpdir/alpinejs-3.15.12.tgz"
tar -xzf "$tmpdir/alpinejs-3.15.12.tgz" -C "$tmpdir" package/dist/cdn.min.js
cp "$tmpdir/package/dist/cdn.min.js" skills/brainstorming/scripts/vendor/alpine.js
shasum -a 256 skills/brainstorming/scripts/vendor/alpine.js
rm -rf "$tmpdir"
```

License:

```text
MIT License

Copyright © 2019-2025 Caleb Porzio and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
````

- [ ] **Step 5: Run the provenance test**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
node tests/brainstorm-server/server.test.js
```

Expected: the vendored Alpine provenance test passes. Later HTTP tests may still fail until Task 2 if they have already been added; do not commit until this command exits 0 after Task 2.

- [ ] **Step 6: Commit Task 1**

After Task 2 also passes the full server test, commit Task 1 and Task 2 together. The vendored file and server route are one behavioral unit.

## Task 2: Serve Alpine and Inject It Into Frame-Wrapped Fragments

**Files:**
- Modify: `skills/brainstorming/scripts/server.cjs`
- Modify: `skills/brainstorming/scripts/frame-template.html`
- Modify: `tests/brainstorm-server/server.test.js`

- [ ] **Step 1: Add failing HTTP and injection tests**

Add this test after `returns Content-Type text/html`:

```js
    await test('waiting page does not inject Alpine', async () => {
      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert(!res.body.includes('/vendor/alpine.js'), 'Waiting page should not inject Alpine');
    });
```

Add these tests after `returns 404 for non-root paths`:

```js
    await test('serves vendored Alpine from exact vendor route', async () => {
      const res = await fetch(`http://localhost:${TEST_PORT}/vendor/alpine.js`);
      assert.strictEqual(res.status, 200);
      assert(res.headers['content-type'].includes('application/javascript'), 'Should be JavaScript');
      assert(res.body.includes('Alpine'), 'Should serve Alpine script content');
    });

    await test('serves vendored Alpine when query string is present', async () => {
      const res = await fetch(`http://localhost:${TEST_PORT}/vendor/alpine.js?v=3.15.12`);
      assert.strictEqual(res.status, 200);
      assert(res.body.includes('Alpine'), 'Should ignore query string for exact vendor pathname');
    });

    await test('exact-match vendor route rejects non-allowlisted pathnames', async () => {
      const paths = [
        '/vendor/unknown.js',
        '/vendor/alpine.js/extra',
        '/vendor/../alpine.js',
        '/vendor/%2e%2e/alpine.js',
        '/vendor/%2E%2E/alpine.js'
      ];

      for (const requestPath of paths) {
        const res = await fetch(`http://localhost:${TEST_PORT}${requestPath}`);
        assert.strictEqual(res.status, 404, `${requestPath} should 404`);
      }
    });
```

This test should assert the actual defense: the route is an exact parsed-pathname
allowlist. Do not describe `/vendor/../alpine.js` as proving filesystem
canonicalization, because the URL parser normalizes that request before the
vendor allowlist sees it.

Update `serves full HTML documents as-is (not wrapped)` with this assertion:

```js
      assert(!res.body.includes('/vendor/alpine.js'), 'Should NOT inject Alpine into full documents');
```

Update `wraps content fragments in frame template` with these assertions:

```js
      assert(res.body.includes('<script defer src="/vendor/alpine.js"></script>'), 'Fragment should load Alpine');
      assert(res.body.includes('Interact with the mockup, then return to the terminal'), 'Frame copy should be neutral');
```

Add this test after `wraps content fragments in frame template`:

```js
    await test('preserves Alpine attributes in frame-wrapped fragments', async () => {
      const fragment = '<div x-data="{ open: false }"><button @click="open = !open">Toggle</button><div x-show="open">Details</div></div>';
      fs.writeFileSync(path.join(CONTENT_DIR, 'alpine-fragment.html'), fragment);
      await sleep(300);

      const res = await fetch(`http://localhost:${TEST_PORT}/`);
      assert(res.body.includes('x-data="{ open: false }"'), 'Should preserve x-data');
      assert(res.body.includes('@click="open = !open"'), 'Should preserve @click');
      assert(res.body.includes('x-show="open"'), 'Should preserve x-show');
      assert(res.body.includes('/vendor/alpine.js'), 'Should include Alpine script');
    });
```

- [ ] **Step 2: Run the failing tests**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
node tests/brainstorm-server/server.test.js
```

Expected: FAIL because `/vendor/alpine.js` returns 404 and the frame does not include Alpine yet.

- [ ] **Step 3: Implement exact vendor serving**

In `skills/brainstorming/scripts/server.cjs`, add these constants after `helperInjection`:

```js
const ALPINE_VENDOR_PATH = path.join(__dirname, 'vendor', 'alpine.js');

function loadVendorFile(filePath, name) {
  try {
    return fs.readFileSync(filePath);
  } catch (error) {
    throw new Error(
      `Failed to load vendored ${name} at ${filePath}; ` +
      'run the refresh command in skills/brainstorming/scripts/vendor/THIRD_PARTY_NOTICES.md. ' +
      error.message
    );
  }
}

const VENDOR_FILES = new Map([
  ['/vendor/alpine.js', {
    content: loadVendorFile(ALPINE_VENDOR_PATH, 'Alpine'),
    contentType: 'application/javascript; charset=utf-8'
  }]
]);
```

Add these helpers after `getNewestScreen()`:

```js
function parseRequestUrl(req) {
  return new URL(req.url, 'http://localhost');
}

function serveVendorFile(requestUrl, res) {
  const vendorFile = VENDOR_FILES.get(requestUrl.pathname);
  if (!vendorFile) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  res.writeHead(200, { 'Content-Type': vendorFile.contentType });
  res.end(vendorFile.content);
}
```

Change the start of `handleRequest(req, res)` to parse once and use `pathname`:

```js
function handleRequest(req, res) {
  touchActivity();
  const requestUrl = parseRequestUrl(req);

  if (req.method === 'GET' && requestUrl.pathname === '/') {
```

Add the vendor branch before `/files/`:

```js
  } else if (req.method === 'GET' && requestUrl.pathname.startsWith('/vendor/')) {
    serveVendorFile(requestUrl, res);
  } else if (req.method === 'GET' && requestUrl.pathname.startsWith('/files/')) {
    const fileName = requestUrl.pathname.slice(7);
```

Keep the rest of the `/files/` branch unchanged except that it now uses `fileName` from `requestUrl.pathname`.

- [ ] **Step 4: Inject Alpine from the frame template**

In `skills/brainstorming/scripts/frame-template.html`, add this script tag immediately before `</head>`:

```html
  <script defer src="/vendor/alpine.js"></script>
```

Change the indicator copy to:

```html
    <span id="indicator-text">Interact with the mockup, then return to the terminal</span>
```

- [ ] **Step 5: Run the server tests**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
node tests/brainstorm-server/server.test.js
```

Expected: `PASS` and `0 failed`.

- [ ] **Step 6: Commit Tasks 1 and 2**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
git add \
  skills/brainstorming/scripts/server.cjs \
  skills/brainstorming/scripts/frame-template.html \
  skills/brainstorming/scripts/vendor/alpine.js \
  skills/brainstorming/scripts/vendor/alpine.provenance.json \
  skills/brainstorming/scripts/vendor/THIRD_PARTY_NOTICES.md \
  tests/brainstorm-server/server.test.js
git commit -m "feat: add Alpine to visual companion runtime"
```

## Task 3: Preserve Alpine Through Codex Plugin Sync

**Files:**
- Modify: `scripts/sync-to-codex-plugin.sh`
- Modify: `tests/codex-plugin-sync/test-sync-to-codex-plugin.sh`

- [ ] **Step 1: Add failing sync fixture coverage**

In `write_upstream_fixture()`, extend the `mkdir -p` block with:

```bash
        "$repo/skills/brainstorming/scripts/vendor" \
```

After the example skill fixture, add:

```bash
    cat > "$repo/skills/brainstorming/scripts/server.cjs" <<'EOF'
console.log('fixture server')
EOF

    cat > "$repo/skills/brainstorming/scripts/helper.js" <<'EOF'
window.fixtureHelper = true
EOF

    cat > "$repo/skills/brainstorming/scripts/frame-template.html" <<'EOF'
<html><body><!-- CONTENT --></body></html>
EOF

    printf 'fixture alpine\n' > "$repo/skills/brainstorming/scripts/vendor/alpine.js"

    cat > "$repo/skills/brainstorming/scripts/vendor/alpine.provenance.json" <<'EOF'
{"name":"alpinejs","version":"3.15.12","localPath":"skills/brainstorming/scripts/vendor/alpine.js","sha256":"fixture","approvalArtifact":"SUP-215"}
EOF

    cat > "$repo/skills/brainstorming/scripts/vendor/THIRD_PARTY_NOTICES.md" <<'EOF'
# Third-Party Notices

Alpine.js fixture notice.
EOF
```

Add these paths to the `git -C "$repo" add` list:

```bash
        skills/brainstorming/scripts/server.cjs \
        skills/brainstorming/scripts/helper.js \
        skills/brainstorming/scripts/frame-template.html \
        skills/brainstorming/scripts/vendor/alpine.js \
        skills/brainstorming/scripts/vendor/alpine.provenance.json \
        skills/brainstorming/scripts/vendor/THIRD_PARTY_NOTICES.md \
```

In `write_synced_destination_fixture()`, extend the `mkdir -p` block with:

```bash
        "$repo/plugins/superpowers/skills/brainstorming/scripts/vendor" \
```

Add the same fixture files under `plugins/superpowers/skills/brainstorming/scripts/`, then add those paths to the destination `git add` list.

Add these preview assertions after `Preview reflects dirty tracked destination file`:

```bash
    assert_contains "$preview_section" "skills/brainstorming/scripts/server.cjs" "Preview includes skill-local server runtime"
    assert_contains "$preview_section" "skills/brainstorming/scripts/helper.js" "Preview includes skill-local helper runtime"
    assert_contains "$preview_section" "skills/brainstorming/scripts/frame-template.html" "Preview includes skill-local frame template"
    assert_contains "$preview_section" "skills/brainstorming/scripts/vendor/alpine.js" "Preview includes vendored Alpine"
    assert_contains "$preview_section" "skills/brainstorming/scripts/vendor/alpine.provenance.json" "Preview includes Alpine provenance"
    assert_contains "$preview_section" "skills/brainstorming/scripts/vendor/THIRD_PARTY_NOTICES.md" "Preview includes Alpine notice"
```

Add these no-op fixture path variables near `noop_openai_metadata_path`:

```bash
    local noop_alpine_path
    local noop_alpine_provenance_path
    local noop_alpine_notice_path
```

Assign them after `noop_openai_metadata_path=...`:

```bash
    noop_alpine_path="$noop_apply_dest/plugins/superpowers/skills/brainstorming/scripts/vendor/alpine.js"
    noop_alpine_provenance_path="$noop_apply_dest/plugins/superpowers/skills/brainstorming/scripts/vendor/alpine.provenance.json"
    noop_alpine_notice_path="$noop_apply_dest/plugins/superpowers/skills/brainstorming/scripts/vendor/THIRD_PARTY_NOTICES.md"
```

Add these no-op assertions after the OpenAI metadata assertion:

```bash
    assert_file_equals "$noop_alpine_path" "fixture alpine" "Clean no-op local apply preserves vendored Alpine"
    assert_file_equals "$noop_alpine_provenance_path" "{\"name\":\"alpinejs\",\"version\":\"3.15.12\",\"localPath\":\"skills/brainstorming/scripts/vendor/alpine.js\",\"sha256\":\"fixture\",\"approvalArtifact\":\"SUP-215\"}" "Clean no-op local apply preserves Alpine provenance"
    assert_contains "$(cat "$noop_alpine_notice_path")" "Alpine.js fixture notice." "Clean no-op local apply preserves Alpine notice"
```

Add this source assertion near the existing source assertions:

```bash
    assert_contains "$script_source" "Vendored third-party code included in this sync" "Source calls out vendored third-party code in sync PR body"
```

- [ ] **Step 2: Run the failing sync test**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh
```

Expected: FAIL on the source assertion because the sync PR body does not mention vendored third-party code yet.

- [ ] **Step 3: Update generated PR body language**

In `scripts/sync-to-codex-plugin.sh`, add this helper before
`if [[ $BOOTSTRAP -eq 1 ]]; then` in the commit/PR section. Keep it generic:
the sync script should discover vendored third-party provenance files and read
the approval artifact from each provenance JSON file, not hardcode `SUP-215` or
Alpine-specific approval text into the script body.

```bash
vendor_notice_for_pr_body() {
  local provenance_glob="$DEST"/skills/*/scripts/vendor/*.provenance.json

  if ! compgen -G "$provenance_glob" > /dev/null; then
    return 0
  fi

  python3 - "$DEST" <<'PY'
import glob
import json
import os
import sys

dest = sys.argv[1]
provenance_files = sorted(glob.glob(os.path.join(dest, "skills", "*", "scripts", "vendor", "*.provenance.json")))
if not provenance_files:
    raise SystemExit(0)

print()
print("Vendored third-party code included in this sync:")
for provenance_file in provenance_files:
    with open(provenance_file, "r", encoding="utf-8") as fh:
        provenance = json.load(fh)

    rel_provenance = os.path.relpath(provenance_file, dest)
    rel_vendor_dir = os.path.dirname(rel_provenance)
    basename = os.path.basename(provenance_file).removesuffix(".provenance.json")
    local_path = provenance.get("localPath") or os.path.join(rel_vendor_dir, f"{basename}.js")
    notice_path = os.path.join(rel_vendor_dir, "THIRD_PARTY_NOTICES.md")
    name = provenance.get("name", "unknown")
    version = provenance.get("version", "unknown")
    approval = provenance.get("approvalArtifact", "not recorded")
    sha256 = provenance.get("sha256", "not recorded")

    print(f"- `{local_path}`: {name} {version}")
    print(f"  - Approval artifact: {approval}")
    print(f"  - License notice: `{notice_path}`")
    print(f"  - Provenance: `{rel_provenance}`")
    print(f"  - SHA256: `{sha256}`")
PY
}
```

Append `$(vendor_notice_for_pr_body)` to both `PR_BODY` strings before their closing quote. For the normal sync body, the final paragraph should become:

```bash
Running the sync tool again against the same upstream SHA should produce a PR with an identical diff — use that to verify the tool is behaving.$(vendor_notice_for_pr_body)"
```

For the bootstrap body, the final paragraph should become:

```bash
This is a one-time bootstrap. Subsequent syncs will be normal (non-bootstrap) runs using the same tracked upstream plugin files.$(vendor_notice_for_pr_body)"
```

- [ ] **Step 4: Run the sync test**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh
```

Expected: `PASS`.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
git add scripts/sync-to-codex-plugin.sh tests/codex-plugin-sync/test-sync-to-codex-plugin.sh
git commit -m "test: cover Alpine in Codex plugin sync"
```

## Task 4: Update Visual Companion Guidance

**Files:**
- Modify: `skills/brainstorming/visual-companion.md`

- [ ] **Step 1: Invoke the skill-writing workflow**

Read `skills/writing-skills/SKILL.md` before editing `visual-companion.md`.

- [ ] **Step 2: Update the selection-first copy**

Change the `How It Works` paragraph to:

```markdown
The server watches a directory for HTML files and serves the newest one to the browser. You write HTML content to `screen_dir`, the user tries the mockup in their browser, and they respond in the terminal. Use `[data-choice]` only when you are deliberately asking the user to pick among named A/B/C visual options.
```

Change Loop step 2 to:

```markdown
2. **Tell user what to expect and end your turn:**
   - Remind them of the URL (every step, not just first)
   - Give a brief text summary of what's on screen (e.g., "Showing an interactive meal-planning mockup with tabs and an editable grocery list")
   - Ask them to respond in the terminal: "Take a look, try the mockup, and tell me what feels right or wrong."
   - If the screen is a deliberate A/B/C choice, also say: "Click an option if you'd like; your terminal feedback is still the source of truth."
```

- [ ] **Step 3: Add compact Alpine guidance before the current minimal example**

Insert this section before `**Minimal example:**`:

````markdown
## Interactive Mockups With Alpine

Frame-wrapped fragments automatically load Alpine.js. Use Alpine when visible interaction is central to the design question: tabs, toggles, accordions, modal open/close, wizard next/back, lightweight form validation, or simple add/remove list behavior.

Keep it illustrative. Do not build a fake application just because realistic chrome includes many controls. If an interaction is not part of the question, render that area as passive content.

```html
<div x-data="{ tab: 'week', items: [{ id: 1, label: 'Taco night' }, { id: 2, label: 'Soup prep' }], nextId: 3, newItem: '' }">
  <div style="display:flex;gap:0.5rem;margin-bottom:1rem">
    <button class="mock-button" @click="tab = 'week'">Week</button>
    <button class="mock-button" @click="tab = 'list'">Grocery list</button>
  </div>

  <section x-show="tab === 'week'">
    <h3>Week plan</h3>
    <p class="subtitle">Three realistic meals are enough for the mockup.</p>
  </section>

  <section x-show="tab === 'list'">
    <h3>Grocery list</h3>
    <ul>
      <template x-for="item in items" :key="item.id">
        <li x-text="item.label"></li>
      </template>
    </ul>
    <input class="mock-input" x-model="newItem" placeholder="Add item">
    <button class="mock-button" @click="if (newItem.trim()) { items.push({ id: nextId++, label: newItem.trim() }); newItem = '' }">Add</button>
  </section>
</div>
```

Rules:

- Write content fragments by default; do not add an Alpine `<script>` tag.
- Generate 2-5 compact, realistic records for the user's domain. Put records in `x-data` only when interaction needs state.
- Use stable ids for repeatable records; do not key dynamic lists by user-entered labels.
- Keep terminal feedback primary. Alpine interactions are for understanding, not telemetry.
- Use `data-choice` only for deliberate named options the agent should read next turn.
- Use `@click.stop` or separate controls when an Alpine control is near a `[data-choice]` surface.
- Do not call `fetch`, simulate backend writes, or use `localStorage` / `sessionStorage`.
- Do not load live Unsplash or other network images. Use local `/files/<basename>` assets when the project provides them, or use a simple local placeholder.
````

- [ ] **Step 4: Relabel existing option/card examples as deliberate choices**

Change `### Options (A/B/C choices)` to:

```markdown
### Deliberate Options (A/B/C choices)
```

Add this sentence immediately below that heading:

```markdown
Use these only when you want a structured choice event. Do not wrap ordinary Alpine controls in `[data-choice]`.
```

Change `### Cards (visual designs)` to:

```markdown
### Deliberate Cards (visual design choices)
```

Add this sentence immediately below that heading:

```markdown
Use `[data-choice]` cards for visual alternatives, not for normal clickable app UI.
```

- [ ] **Step 5: Update event and design-tip language**

Change `## Browser Events Format` intro to:

```markdown
When the user clicks deliberate `[data-choice]` options in the browser, those selections are recorded to `$STATE_DIR/events` (one JSON object per line). Ordinary Alpine interactions such as tabs, toggles, forms, and modals are not recorded. The file is cleared automatically when you push a new screen, so each screen starts with a clean event log. The terminal message remains the primary feedback.
```

Replace the Unsplash design tip with:

```markdown
- **Use local assets when images matter** — if the project has relevant images, reference them through `/files/<basename>`. Do not load live network images just to make a mockup feel polished.
```

- [ ] **Step 6: Run a docs sanity scan**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
rg -n "Click an option above|Unsplash|click to select options|live network images" skills/brainstorming/visual-companion.md
```

Expected: no matches for `Click an option above`, `Unsplash`, or `click to select options`; the only `live network images` match is the new "Do not load live network images" rule.

- [ ] **Step 7: Commit Task 4**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
git add skills/brainstorming/visual-companion.md
git commit -m "docs: guide visual companion Alpine mockups"
```

## Task 5: Capture Skill Behavior Evidence

**Files:**
- No required repo file changes. Evidence goes in the implementation PR body or handoff comment.

- [ ] **Step 1: Run the five pressure prompts**

Use a clean agent session with the updated `skills/brainstorming/visual-companion.md`. For each prompt, ask for a visual companion mockup and inspect the generated fragment.

Prompt 1:

```text
Show a visual companion mockup for a family meal-planning app with tabs, an add-item grocery list, and meal details.
```

Expected: uses Alpine directives, does not add an Alpine script tag, includes 2-5 domain-specific meal/grocery records, no `data-choice`, no backend/storage/network behavior, asks for terminal feedback.

Prompt 2:

```text
Show three visual layout directions for a compact workshop scheduling app and let me choose one.
```

Expected: uses deliberate `[data-choice]` options or cards, preserves selection semantics, asks for terminal feedback.

Prompt 3:

```text
Show a static visual comparison of two information-density approaches for a settings page.
```

Expected: no Alpine when interactivity is not useful.

Prompt 4:

```text
Show a dense SaaS dashboard mockup with filters, search, tabs, export, row actions, modals, and onboarding steps.
```

Expected: limits interactivity to the current visual question, avoids building full fake search/export/CRUD/wizard behavior, leaves surrounding chrome passive when appropriate.

Prompt 5:

```text
Show a photography portfolio mockup where images matter.
```

Expected: no live Unsplash/network URLs; uses `/files/<basename>` if the project has local images, otherwise uses a simple local placeholder.

- [ ] **Step 2: Record evidence for the PR**

Record a compact evidence table in the PR body or implementation handoff with
these exact five row labels: `Meal planner interactive mockup`, `Workshop
layout choice`, `Static settings comparison`, `Dense dashboard`, and
`Photography portfolio`. Each row must include the expected behavior from Step
1, a one-sentence observation from the actual generated fragment, and a
pass/fail result.

## Task 6: Manual Browser Dogfood

**Files:**
- Temporary dogfood files under a throwaway project directory.

- [ ] **Step 1: Start the visual companion**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
tmp_project="$(mktemp -d)"
scripts/start-server.sh --project-dir "$tmp_project"
```

Capture `url`, `screen_dir`, and `state_dir` from the JSON output.

- [ ] **Step 2: Write an Alpine fragment**

Write a new file in `screen_dir` named `alpine-dogfood.html` with:

```html
<div x-data="{ tab: 'overview', open: false, items: [{ id: 1, label: 'Dinner plan' }, { id: 2, label: 'Grocery run' }] }">
  <h2>Alpine dogfood</h2>
  <p class="subtitle">Try the tabs, disclosure, and nested control.</p>

  <div class="options">
    <div class="option" data-choice="direction-a" onclick="toggleSelect(this)">
      <div class="letter">A</div>
      <div class="content">
        <h3>Choice surface</h3>
        <button class="mock-button" @click.stop="open = !open">Toggle nested detail</button>
        <p x-show="open">Nested Alpine click did not select the card.</p>
      </div>
    </div>
  </div>

  <div style="display:flex;gap:0.5rem;margin-top:1rem">
    <button class="mock-button" @click="tab = 'overview'">Overview</button>
    <button class="mock-button" @click="tab = 'items'">Items</button>
  </div>

  <section x-show="tab === 'overview'" style="margin-top:1rem">
    <h3>Overview</h3>
    <p>Alpine initialized and `x-show` is active.</p>
  </section>

  <section x-show="tab === 'items'" style="margin-top:1rem">
    <h3>Items</h3>
    <ul>
      <template x-for="item in items" :key="item.id">
        <li x-text="item.label"></li>
      </template>
    </ul>
  </section>
</div>
```

- [ ] **Step 3: Verify in the browser**

Open the captured URL. Verify:

- The page has no console errors.
- The frame HTML contains `/vendor/alpine.js`.
- The waiting page did not contain `/vendor/alpine.js` before the fragment was pushed.
- The "Items" tab changes visible content.
- The nested "Toggle nested detail" button toggles detail text without selecting the `[data-choice]` card.
- Clicking the `[data-choice]` card still writes one choice event to `state_dir/events`.

- [ ] **Step 4: Record browser evidence**

Record browser evidence in the PR body or implementation handoff. Include the
actual localhost URL, whether Alpine initialized with no console errors,
whether `@click` changed state, whether `x-show` toggled visibility, whether
nested `@click.stop` avoided an accidental choice event, and whether
`[data-choice]` still wrote to `state/events`.

## Task 7: Final Verification and Review Prep

**Files:**
- No new files unless tests or implementation require final adjustments.

- [ ] **Step 1: Run full relevant checks**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
node tests/brainstorm-server/server.test.js
bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh
git diff --check
```

Expected: both test commands pass and `git diff --check` prints no output.

- [ ] **Step 2: Check the focused diff base**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
git diff --name-status origin/dev..HEAD
git diff --stat origin/dev..HEAD
```

Expected: the diff against `origin/dev` contains only SUP-215 files and focused plan/spec commits.

- [ ] **Step 3: Confirm third-party approval evidence**

Before opening or handing off a PR, cite SUP-215 as the durable approval artifact for this prototype. SUP-215 is a maintainer-created Linear ticket whose V1 scope explicitly includes vendoring Alpine into the visual companion runtime.

- [ ] **Step 4: Run roborev**

Invoke the `roborev-review-branch` skill for the current branch. If using the
local `roborev` CLI directly, use `roborev review` with the appropriate branch
or commit range; this CLI does not provide a hyphenated branch-review subcommand.

If roborev reports findings, invoke `roborev-fix` to resolve them before PR handoff.

- [ ] **Step 5: Prepare PR notes**

Include these points in the PR body:

- SUP-215 adds Alpine-backed mockups to the existing visual companion path. It
  does not add a second artifact/prototype system.
- Alpine.js 3.15.12 is vendored as a maintainer-approved SUP-215 experiment.
- The third-party exception section cites SUP-215 as the approval artifact.
- License/provenance are in
  `skills/brainstorming/scripts/vendor/THIRD_PARTY_NOTICES.md` and
  `skills/brainstorming/scripts/vendor/alpine.provenance.json`.
- SHA256 is
  `57b37d7cae9a27d965fdae4adcc844245dfdc407e655aee85dcfff3a08036a3f`.
- Verification lists successful runs of
  `node tests/brainstorm-server/server.test.js`,
  `bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh`, and
  `git diff --check`.
- Browser dogfood evidence from Task 6 is included as concrete observations.
- Skill behavior evidence from Task 5 is included as concrete observations.

- [ ] **Step 6: Final commit if any verification fixes were needed**

Run:

```bash
cd /Users/drewritter/prime-rad/superpowers
git status --short
```

If verification required changes, commit them with a focused message that names the affected area. If no files changed, do not create an empty commit.

## Self-Review

- Spec coverage:
  - Vendored Alpine 3.x, provenance, license notice, and SHA verification are covered in Task 1.
  - Vendor route, exact allowlist, query handling, traversal rejection, frame injection, waiting/full-doc boundaries, and neutral frame copy are covered in Task 2.
  - Codex plugin sync preservation and PR-body disclosure are covered in Task 3.
  - Alpine authoring guidance, terminal-first feedback, `data-choice` separation, no fake mini-app guidance, no network/storage guidance, and Unsplash removal are covered in Task 4.
  - Skill behavior evidence matrix is covered in Task 5.
  - Browser runtime proof for Alpine, `x-show`, `@click`, `@click.stop`, and `[data-choice]` is covered in Task 6.
  - PR-base, approval artifact, final verification, and roborev review are covered in Task 7.
- Placeholder scan:
  - The plan does not contain replacement markers or deferred implementation
    steps.
- Type and naming consistency:
  - `alpine.provenance.json`, `THIRD_PARTY_NOTICES.md`, `approvalArtifact`, and `/vendor/alpine.js` are named consistently across runtime, tests, sync, and PR notes.
