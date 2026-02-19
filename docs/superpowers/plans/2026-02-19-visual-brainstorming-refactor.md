# Visual Brainstorming Refactor Implementation Plan

> **For Claude:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor visual brainstorming from blocking TUI feedback model to non-blocking "Browser Displays, Terminal Commands" architecture.

**Architecture:** Browser becomes an interactive display; terminal stays the conversation channel. Server writes user events to a per-screen `.events` file that Claude reads on its next turn. Eliminates `wait-for-feedback.sh` and all `TaskOutput` blocking.

**Tech Stack:** Node.js (Express, ws, chokidar), vanilla HTML/CSS/JS

**Spec:** `docs/superpowers/specs/2026-02-19-visual-brainstorming-refactor-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/brainstorm-server/index.js` | Modify | Server: add `.events` file writing, clear on new screen, replace `wrapInFrame` |
| `lib/brainstorm-server/frame-template.html` | Modify | Template: remove feedback footer, add content placeholder + selection indicator |
| `lib/brainstorm-server/helper.js` | Modify | Client JS: remove send/feedback functions, narrow to click capture + indicator updates |
| `lib/brainstorm-server/wait-for-feedback.sh` | Delete | No longer needed |
| `skills/brainstorming/visual-companion.md` | Modify | Skill instructions: rewrite loop to non-blocking flow |
| `tests/brainstorm-server/server.test.js` | Modify | Tests: update for new template structure and helper.js API |

---

## Chunk 1: Server, Template, Client, Tests, Skill

### Task 1: Update `frame-template.html`

**Files:**
- Modify: `lib/brainstorm-server/frame-template.html`

- [ ] **Step 1: Remove the feedback footer HTML**

Replace the feedback-footer div (lines 227-233) with a selection indicator bar:

```html
  <div class="indicator-bar">
    <span id="indicator-text">Click an option above, then return to the terminal</span>
  </div>
```

Also replace the default content inside `#claude-content` (lines 220-223) with the content placeholder:

```html
    <div id="claude-content">
      <!-- CONTENT -->
    </div>
```

- [ ] **Step 2: Replace feedback footer CSS with indicator bar CSS**

Remove the `.feedback-footer`, `.feedback-footer label`, `.feedback-row`, and the textarea/button styles within `.feedback-footer` (lines 82-112).

Add indicator bar CSS:

```css
    .indicator-bar {
      background: var(--bg-secondary);
      border-top: 1px solid var(--border);
      padding: 0.5rem 1.5rem;
      flex-shrink: 0;
      text-align: center;
    }
    .indicator-bar span {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    .indicator-bar .selected-text {
      color: var(--accent);
      font-weight: 500;
    }
```

- [ ] **Step 3: Verify template renders**

Run the test suite to check the template still loads:
```bash
cd /Users/drewritter/prime-rad/superpowers && node tests/brainstorm-server/server.test.js
```
Expected: Tests 1-5 should still pass. Tests 6-8 may fail (expected — they assert old structure).

- [ ] **Step 4: Commit**

```bash
git add lib/brainstorm-server/frame-template.html
git commit -m "Replace feedback footer with selection indicator bar in brainstorm template"
```

---

### Task 2: Update `index.js` — content injection and `.events` file

**Files:**
- Modify: `lib/brainstorm-server/index.js`

- [ ] **Step 1: Write failing test for `.events` file writing**

Add to `tests/brainstorm-server/server.test.js` after Test 4 area — a new test that sends a WebSocket event with a `choice` field and verifies `.events` file is written:

```javascript
    // Test: Choice events written to .events file
    console.log('Test: Choice events written to .events file');
    const ws3 = new WebSocket(`ws://localhost:${TEST_PORT}`);
    await new Promise(resolve => ws3.on('open', resolve));

    ws3.send(JSON.stringify({ type: 'click', choice: 'a', text: 'Option A' }));
    await sleep(300);

    const eventsFile = path.join(TEST_DIR, '.events');
    assert(fs.existsSync(eventsFile), '.events file should exist after choice click');
    const lines = fs.readFileSync(eventsFile, 'utf-8').trim().split('\n');
    const event = JSON.parse(lines[lines.length - 1]);
    assert.strictEqual(event.choice, 'a', 'Event should contain choice');
    assert.strictEqual(event.text, 'Option A', 'Event should contain text');
    ws3.close();
    console.log('  PASS');
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/drewritter/prime-rad/superpowers && node tests/brainstorm-server/server.test.js
```
Expected: New test FAILS — `.events` file doesn't exist yet.

- [ ] **Step 3: Write failing test for `.events` file clearing on new screen**

Add another test:

```javascript
    // Test: .events cleared on new screen
    console.log('Test: .events cleared on new screen');
    // .events file should still exist from previous test
    assert(fs.existsSync(path.join(TEST_DIR, '.events')), '.events should exist before new screen');
    fs.writeFileSync(path.join(TEST_DIR, 'new-screen.html'), '<h2>New screen</h2>');
    await sleep(500);
    assert(!fs.existsSync(path.join(TEST_DIR, '.events')), '.events should be cleared after new screen');
    console.log('  PASS');
```

- [ ] **Step 4: Run test to verify it fails**

```bash
cd /Users/drewritter/prime-rad/superpowers && node tests/brainstorm-server/server.test.js
```
Expected: New test FAILS — `.events` not cleared on screen push.

- [ ] **Step 5: Implement `.events` file writing in `index.js`**

In the WebSocket `message` handler (line 74-77 of `index.js`), after the `console.log`, add:

```javascript
    // Write user events to .events file for Claude to read
    if (event.choice) {
      const eventsFile = path.join(SCREEN_DIR, '.events');
      fs.appendFileSync(eventsFile, JSON.stringify(event) + '\n');
    }
```

In the chokidar `add` handler (line 104-111), add `.events` clearing:

```javascript
    if (filePath.endsWith('.html')) {
      // Clear events from previous screen
      const eventsFile = path.join(SCREEN_DIR, '.events');
      if (fs.existsSync(eventsFile)) fs.unlinkSync(eventsFile);

      console.log(JSON.stringify({ type: 'screen-added', file: filePath }));
      // ... existing reload broadcast
    }
```

- [ ] **Step 6: Replace `wrapInFrame` with comment placeholder injection**

Replace the `wrapInFrame` function (lines 27-32 of `index.js`):

```javascript
function wrapInFrame(content) {
  return frameTemplate.replace('<!-- CONTENT -->', content);
}
```

- [ ] **Step 7: Run all tests**

```bash
cd /Users/drewritter/prime-rad/superpowers && node tests/brainstorm-server/server.test.js
```
Expected: New `.events` tests PASS. Existing tests may still have failures from old assertions (fixed in Task 4).

- [ ] **Step 8: Commit**

```bash
git add lib/brainstorm-server/index.js tests/brainstorm-server/server.test.js
git commit -m "Add .events file writing and comment-based content injection to brainstorm server"
```

---

### Task 3: Simplify `helper.js`

**Files:**
- Modify: `lib/brainstorm-server/helper.js`

- [ ] **Step 1: Remove `sendToClaude` function**

Delete the `sendToClaude` function (lines 92-106) — the function body and the page takeover HTML.

- [ ] **Step 2: Remove `window.send` function**

Delete the `window.send` function (lines 120-129) — was tied to the removed Send button.

- [ ] **Step 3: Remove form submission and input change handlers**

Delete the form submission handler (lines 57-71) and the input change handler (lines 73-89) including the `inputTimeout` variable.

- [ ] **Step 4: Remove `pageshow` event listener**

Delete the `pageshow` listener we added earlier (no textarea to clear anymore).

- [ ] **Step 5: Narrow click handler to `[data-choice]` only**

Replace the click handler (lines 36-55) with a narrower version:

```javascript
  // Capture clicks on choice elements
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-choice]');
    if (!target) return;

    sendEvent({
      type: 'click',
      text: target.textContent.trim(),
      choice: target.dataset.choice,
      id: target.id || null
    });
  });
```

- [ ] **Step 6: Add indicator bar update on choice click**

After the `sendEvent` call in the click handler, add:

```javascript
    // Update indicator bar
    const indicator = document.getElementById('indicator-text');
    if (indicator) {
      const label = target.querySelector('h3, .content h3, .card-body h3')?.textContent?.trim() || target.dataset.choice;
      indicator.innerHTML = '<span class="selected-text">' + label + ' selected</span> — return to terminal to continue';
    }
```

- [ ] **Step 7: Remove `sendToClaude` from `window.brainstorm` API**

Update the `window.brainstorm` object (lines 132-136) to remove `sendToClaude`:

```javascript
  window.brainstorm = {
    send: sendEvent,
    choice: (value, metadata = {}) => sendEvent({ type: 'choice', value, ...metadata })
  };
```

- [ ] **Step 8: Run tests**

```bash
cd /Users/drewritter/prime-rad/superpowers && node tests/brainstorm-server/server.test.js
```

- [ ] **Step 9: Commit**

```bash
git add lib/brainstorm-server/helper.js
git commit -m "Simplify helper.js: remove feedback functions, narrow to choice capture + indicator"
```

---

### Task 4: Update tests for new structure

**Files:**
- Modify: `tests/brainstorm-server/server.test.js`

**Note:** Line references below are from the _original_ file. Task 2 inserted new tests earlier in the file, so actual line numbers will be shifted. Find tests by their `console.log` labels (e.g., "Test 5:", "Test 6:").

- [ ] **Step 1: Update Test 5 (full document assertion)**

Find the Test 5 assertion `!fullRes.body.includes('feedback-footer')`. Change it to: Full documents should NOT have the indicator bar either (they're served as-is):

```javascript
    assert(!fullRes.body.includes('indicator-bar') || fullDoc.includes('indicator-bar'),
      'Should not wrap full documents in frame template');
```

- [ ] **Step 2: Update Test 6 (fragment wrapping)**

Line 125: Replace `feedback-footer` assertion with indicator bar assertion:

```javascript
    assert(fragRes.body.includes('indicator-bar'), 'Fragment should get indicator bar from frame');
```

Also verify content placeholder was replaced (fragment content appears, placeholder comment doesn't):

```javascript
    assert(!fragRes.body.includes('<!-- CONTENT -->'), 'Content placeholder should be replaced');
```

- [ ] **Step 3: Update Test 7 (helper.js API)**

Lines 140-142: Update assertions to reflect the new API surface:

```javascript
    assert(helperContent.includes('toggleSelect'), 'helper.js should define toggleSelect');
    assert(helperContent.includes('sendEvent'), 'helper.js should define sendEvent');
    assert(helperContent.includes('selectedChoice'), 'helper.js should track selectedChoice');
    assert(helperContent.includes('brainstorm'), 'helper.js should expose brainstorm API');
    assert(!helperContent.includes('sendToClaude'), 'helper.js should not contain sendToClaude');
```

- [ ] **Step 4: Replace Test 8 (sendToClaude theming) with indicator bar test**

Replace Test 8 (lines 145-149) — `sendToClaude` no longer exists. Test the indicator bar instead:

```javascript
    // Test 8: Indicator bar uses CSS variables (theme support)
    console.log('Test 8: Indicator bar uses CSS variables');
    const templateContent = fs.readFileSync(
      path.join(__dirname, '../../lib/brainstorm-server/frame-template.html'), 'utf-8'
    );
    assert(templateContent.includes('indicator-bar'), 'Template should have indicator bar');
    assert(templateContent.includes('indicator-text'), 'Template should have indicator text element');
    console.log('  PASS');
```

- [ ] **Step 5: Run full test suite**

```bash
cd /Users/drewritter/prime-rad/superpowers && node tests/brainstorm-server/server.test.js
```
Expected: ALL tests PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/brainstorm-server/server.test.js
git commit -m "Update brainstorm server tests for new template structure and helper.js API"
```

---

### Task 5: Delete `wait-for-feedback.sh`

**Files:**
- Delete: `lib/brainstorm-server/wait-for-feedback.sh`

- [ ] **Step 1: Verify no other files import or reference `wait-for-feedback.sh`**

Search the codebase:
```bash
grep -r "wait-for-feedback" /Users/drewritter/prime-rad/superpowers/ --include="*.js" --include="*.md" --include="*.sh" --include="*.json"
```

Expected references: only `visual-companion.md` (rewritten in Task 6) and possibly release notes (historical, leave as-is).

- [ ] **Step 2: Delete the file**

```bash
rm lib/brainstorm-server/wait-for-feedback.sh
```

- [ ] **Step 3: Run tests to confirm nothing breaks**

```bash
cd /Users/drewritter/prime-rad/superpowers && node tests/brainstorm-server/server.test.js
```
Expected: All tests PASS (no test referenced this file).

- [ ] **Step 4: Commit**

```bash
git add -u lib/brainstorm-server/wait-for-feedback.sh
git commit -m "Delete wait-for-feedback.sh: replaced by .events file"
```

---

### Task 6: Rewrite `visual-companion.md`

**Files:**
- Modify: `skills/brainstorming/visual-companion.md`

- [ ] **Step 1: Update "How It Works" description (line 18)**

Replace the sentence about receiving feedback "as JSON" with:

```markdown
The server watches a directory for HTML files and serves the newest one to the browser. You write HTML content, the user sees it in their browser and can click to select options. Selections are recorded to a `.events` file that you read on your next turn.
```

- [ ] **Step 2: Update fragment description (line 20)**

Remove "feedback footer" from the description of what the frame template provides:

```markdown
**Content fragments vs full documents:** If your HTML file starts with `<!DOCTYPE` or `<html`, the server serves it as-is (just injects the helper script). Otherwise, the server automatically wraps your content in the frame template — adding the header, CSS theme, selection indicator, and all interactive infrastructure. **Write content fragments by default.** Only write full documents when you need complete control over the page.
```

- [ ] **Step 3: Rewrite "The Loop" section (lines 36-61)**

Replace the entire "The Loop" section with:

```markdown
## The Loop

1. **Write HTML** to a new file in `screen_dir`:
   - Use semantic filenames: `platform.html`, `visual-style.html`, `layout.html`
   - **Never reuse filenames** — each screen gets a fresh file
   - Use Write tool — **never use cat/heredoc** (dumps noise into terminal)
   - Server automatically serves the newest file

2. **Tell user what to expect and end your turn:**
   - Remind them of the URL (every step, not just first)
   - Give a brief text summary of what's on screen (e.g., "Showing 3 layout options for the homepage")
   - Ask them to respond in the terminal: "Take a look and let me know what you think. Click to select an option if you'd like."

3. **On your next turn** — after the user responds in the terminal:
   - Read `$SCREEN_DIR/.events` if it exists — this contains the user's browser interactions (clicks, selections) as JSON lines
   - Merge with the user's terminal text to get the full picture
   - The terminal message is the primary feedback; `.events` provides structured interaction data

4. **Iterate or advance** — if feedback changes current screen, write a new file (e.g., `layout-v2.html`). Only move to the next question when the current step is validated.

5. Repeat until done.
```

- [ ] **Step 4: Replace "User Feedback Format" section (lines 165-174)**

Replace with:

```markdown
## Browser Events Format

When the user clicks options in the browser, their interactions are recorded to `$SCREEN_DIR/.events` (one JSON object per line). The file is cleared automatically when you push a new screen.

```jsonl
{"type":"click","choice":"a","text":"Option A - Simple Layout","timestamp":1706000101}
{"type":"click","choice":"c","text":"Option C - Complex Grid","timestamp":1706000108}
{"type":"click","choice":"b","text":"Option B - Hybrid","timestamp":1706000115}
```

The full event stream shows the user's exploration path — they may click multiple options before settling. The last `choice` event is typically the final selection, but the pattern of clicks can reveal hesitation or preferences worth asking about.

If `.events` doesn't exist, the user didn't interact with the browser — use only their terminal text.
```

- [ ] **Step 5: Update "Writing Content Fragments" description (line 65)**

Remove "feedback footer" reference:

```markdown
Write just the content that goes inside the page. The server wraps it in the frame template automatically (header, theme CSS, selection indicator, and all interactive infrastructure).
```

- [ ] **Step 6: Update Reference section (lines 200-203)**

Remove the helper.js reference description about "JS API" — the API is now minimal. Keep the path reference:

```markdown
## Reference

- Frame template (CSS reference): `${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/frame-template.html`
- Helper script (client-side): `${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/helper.js`
```

- [ ] **Step 7: Commit**

```bash
git add skills/brainstorming/visual-companion.md
git commit -m "Rewrite visual-companion.md for non-blocking browser-displays-terminal-commands flow"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/drewritter/prime-rad/superpowers && node tests/brainstorm-server/server.test.js
```
Expected: ALL tests PASS.

- [ ] **Step 2: Manual smoke test**

Start the server manually and verify the flow works end-to-end:

```bash
cd /Users/drewritter/prime-rad/superpowers && lib/brainstorm-server/start-server.sh --project-dir /tmp/brainstorm-smoke-test
```

Write a test fragment, open in browser, click an option, verify `.events` file is written, verify indicator bar updates. Then stop the server:

```bash
lib/brainstorm-server/stop-server.sh <screen_dir from start output>
```

- [ ] **Step 3: Verify no stale references remain**

```bash
grep -r "wait-for-feedback\|sendToClaude\|feedback-footer\|send-to-claude\|TaskOutput.*block.*true" /Users/drewritter/prime-rad/superpowers/ --include="*.js" --include="*.md" --include="*.sh" --include="*.html" | grep -v node_modules | grep -v RELEASE-NOTES | grep -v "\.md:.*spec\|plan"
```

Expected: No hits outside of release notes and the spec/plan docs (which are historical).

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git status
# Review untracked/modified files, stage specific files as needed, commit if clean
```
