# UI Evaluator Prompt Template

Dispatch this template via Task tool from `expert-reviewer` skill.
**Only dispatch when: Tier = Large AND UI file count > 0 in diff.**

Read this file, fill the 4 placeholders, then pass the filled prompt to Task tool (general-purpose agent).

**Placeholders to fill:**
- `{SPEC_PATH}` — e.g. `docs/superpowers/specs/2026-05-14-add-fastforward.md`
- `{CHANGE_ID}` — spec filename without `.md`
- `{BASE_SHA}` — output of `git merge-base HEAD main`
- `{HEAD_SHA}` — output of `git rev-parse HEAD`

---

```
Task tool (general-purpose):
  description: "UI evaluation — Playwright e2e + spec §2 design compliance check"
  prompt: |
    You are a UI Evaluator for the Vattention team. Verify UI changes using Playwright,
    checking behavior and spec §2 design compliance.

    ## Context

    Spec: {SPEC_PATH}
    Change ID: {CHANGE_ID}
    Git range: {BASE_SHA}..{HEAD_SHA}

    ## Step 1: Read spec §2 and identify changed UI files

    ```bash
    cat {SPEC_PATH}
    # Focus on §2 Design perspective — component names, colors, layout, interactions
    ```

    Identify changed UI files:
    ```bash
    git diff --name-only {BASE_SHA}..{HEAD_SHA} \
      | grep -E "\.tsx$|\.vue$|\.css$|\.scss$|/components/|/pages/|/styles/"
    ```

    ## Step 2: Start dev server

    Find dev command:
    ```bash
    cat package.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('scripts',{}).get('dev','') or d.get('scripts',{}).get('start',''))"
    ```

    Start it (background):
    ```bash
    npm run dev > /tmp/dev-server.log 2>&1 &
    DEV_PID=$!
    echo "Dev server PID: $DEV_PID"
    sleep 8
    curl -sf http://localhost:3000 > /dev/null && echo "Server ready" \
      || (cat /tmp/dev-server.log && echo "SERVER FAILED TO START")
    ```

    If server fails → report as MUST FIX with startup log; stop evaluation.

    ## Step 3: Run existing e2e tests

    Find Playwright tests:
    ```bash
    find . -name "*.spec.ts" -path "*/e2e/*" -o \
           -name "*.spec.ts" -path "*/playwright/*" -o \
           -name "*.test.ts" -path "*/e2e/*" 2>/dev/null | head -20
    ```

    If tests found, run:
    ```bash
    npx playwright test --reporter=list 2>&1 | tail -30
    ```

    Record: pass count, fail count, any failure messages.

    ## Step 4: Screenshot changed pages

    Using webapp-testing skill's Playwright MCP tools:
    For each changed component/page identified in Step 1, navigate to its route and capture a screenshot.

    Describe what you see vs. what spec §2 requires:
    - Colors / tokens match spec
    - Component layout matches spec description
    - Interactive states (hover, focus, error) work as described
    - Responsive behavior as specified (if §2 mentions it)

    If Playwright MCP is not available, document this limitation and flag as INFO.

    ## Step 5: Cleanup

    ```bash
    kill $DEV_PID 2>/dev/null; echo "Dev server stopped"
    ```

    ## Output Format

    ```
    ## UI Evaluator Results — {CHANGE_ID}

    Dev Server: STARTED on port 3000 | FAILED (see error below)

    E2E Tests: Pass=N / Fail=M / Skip=K
    Failed tests:
    - [test name]: [failure reason]
    (or "None")

    Screenshots captured: [list of pages/components]

    Spec §2 Compliance:
    - [requirement]: PASS | FAIL | NOT_CHECKED
    - [requirement]: ...

    ### MUST FIX
    - [e.g., "3 e2e tests failing after change to FastForward component"]
    - [e.g., "Button color #FF3B30 but spec §2 requires --color-primary token"]
    (or "None")

    ### SHOULD
    - [e.g., "Hover state not tested — spec §2 mentions it"]
    (or "None")

    ### INFO
    - [e.g., "Playwright MCP unavailable — screenshots not captured"]
    (or "None")
    ```
```
