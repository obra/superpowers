# Visual Design Lock v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace HTML-first Design Locks with approved, screenshot-only visual contracts and broaden design-system discovery without adding runtime dependencies.

**Architecture:** Superpowers remains instruction-driven: the brainstorming and planning skills define a portable screenshot capability contract, while the active harness supplies Playwright MCP or an equivalent browser tool. Four Quorum scenarios establish RED/GREEN behavior for discovery, fail-closed capture, PNG plan threading, and legacy HTML handling; a real Codex/Playwright proof covers the successful capture path that Quorum may not provision.

**Tech Stack:** Markdown skills, Bash/Node regression tests already in the repository, Playwright MCP supplied by the Codex harness, and the external Bun/TypeScript Quorum eval harness under ignored `evals/`.

**Spec:** `docs/superpowers/specs/2026-08-07-visual-design-lock-v2-design.md`

## Approved Bounded-Autonomy Envelope

```yaml
goal: Implement and verify screenshot-first Visual Design Locks v2
definition_of_done: The approved specification is implemented; four behavioral scenarios have statically valid definitions and separately authorized RED/GREEN evidence; repository regression tests pass; a real Playwright capture is inspected and approved; fresh reviews have no unwaived Critical or Important findings.
repository: /Users/wulymammoth/Desktop/lab/superpowers
base_revision: 2b0104cc4f4198a6e8d2f3c5ba076712515901ad
worktree: /Users/wulymammoth/Desktop/lab/superpowers/.worktrees/design-lock-v2
task_branch: feat/visual-design-lock-v2
scope:
  - docs/superpowers/specs/2026-08-07-visual-design-lock-v2-design.md
  - docs/superpowers/specs/2026-08-07-visual-design-lock-v2-eval-results.md
  - docs/superpowers/plans/2026-08-07-visual-design-lock-v2.md
  - skills/brainstorming/visual-companion.md
  - skills/brainstorming/SKILL.md
  - skills/writing-plans/SKILL.md
  - skills/brainstorming/scripts/export-mockup.cjs
  - skills/brainstorming/scripts/export-mockup.sh
  - tests/brainstorm-server/export-mockup.test.js
  - tests/brainstorm-server/package.json
  - evals/scenarios/design-lock-*/**
  - .superpowers/sdd/2026-08-07-visual-design-lock-v2/**
  - disposable proof files under /tmp
  - machine-local Homebrew Bun runtime installation (reversible)
  - machine-local Gauntlet checkout at /Users/wulymammoth/Desktop/lab/gauntlet and reversible Bun global link
commands:
  - git worktree add .worktrees/design-lock-v2 -b feat/visual-design-lock-v2 2b0104cc4f4198a6e8d2f3c5ba076712515901ad
  - git clone https://github.com/prime-radiant-inc/superpowers-evals.git evals
  - git -C evals switch -c design-lock-v2-evals
  - brew install oven-sh/bun/bun
  - bun --version and bun --revision
  - git clone https://github.com/prime-radiant-inc/gauntlet.git /Users/wulymammoth/Desktop/lab/gauntlet
  - bun install in the Gauntlet checkout
  - bun link in the Gauntlet checkout
  - PATH=$HOME/.cache/.bun/bin:$PATH command -v gauntlet and gauntlet config --json
  - one-time hidden terminal handoff through a mode-0600 FIFO inside a mode-0700 directory under /tmp; the Claude subscription OAuth token from claude setup-token is read without echo, exported as CLAUDE_CODE_OAUTH_TOKEN only in the controller's Quorum/Gauntlet subshell, and the FIFO/directory are removed immediately after receipt
  - gauntlet config --json with output suppressed and apiKeys.anthropic required true before any provider-backed RED cell; ANTHROPIC_API_KEY and ANTHROPIC_AUTH_TOKEN must both remain unset so the run is provably subscription-OAuth-backed
  - bun install in evals
  - bun run quorum new|check|run|show for the four named Design Lock scenarios
  - bun run check
  - npm test under tests/brainstorm-server
  - scripts/lint-shell.sh
  - rg, git diff, git status, git log, git add, and git commit for the approved paths and owned branches
  - chmod for scenario setup.sh and checks.sh modes
  - rm for the three explicitly named obsolete exporter files
  - existing Visual Companion start-server.sh and stop-server.sh against the disposable proof fixture
  - Playwright MCP navigate, resize, evaluate, screenshot, and inspect operations against the disposable local proof fixture
network_reads:
  - clone https://github.com/prime-radiant-inc/superpowers-evals.git
  - Homebrew tap/formula metadata and Bun bottle required by brew install oven-sh/bun/bun
  - clone https://github.com/prime-radiant-inc/gauntlet.git
  - package-registry reads required by Bun installs in Gauntlet and evals
  - separately authorized Codex provider reads for named RED and GREEN Quorum cells only
  - separately authorized Anthropic provider reads for the Gauntlet-Agent on the four credential-remediated RED cells only; GREEN Anthropic calls remain unapproved
execution_authority: superpowers_sdd
local_checkpoint_commits: allowed
goal_mode: off
goal_reference: none
retry_policy:
  mode: bounded
  operations:
    - name: retry RED design-lock-discovers-authority after installing Gauntlet
      retryable_failures:
        - "pre-provider missing-executable failure: Executable not found in PATH: gauntlet"
      replay_safety: reconcile_first
      reconciliation: verify the first run created no provider process, then require PATH=$HOME/.cache/.bun/bin:$PATH command -v gauntlet and gauntlet config --json to succeed
      max_attempts: 2
      backoff: none
    - name: credential-remediated RED baseline campaign after one-time Claude subscription OAuth handoff
      retryable_failures: []
      replay_safety: reconcile_first
      reconciliation: require a non-empty process-scoped CLAUDE_CODE_OAUTH_TOKEN, require ANTHROPIC_API_KEY and ANTHROPIC_AUTH_TOKEN to be unset, require PATH=$HOME/.cache/.bun/bin:$PATH command -v gauntlet, and require a suppressed gauntlet config --json payload whose apiKeys.anthropic field is true; verify the Codex launcher uses env -i and does not forward CLAUDE_CODE_OAUTH_TOKEN or another Anthropic credential
      max_attempts: 1 per named RED scenario, except for the separately authorized fails-closed authentication retry below
      backoff: none
    - name: retry RED design-lock-fails-closed-without-capture after invalid OAuth bearer
      retryable_failures:
        - "pre-turn authentication failure: Anthropic HTTP 401 Invalid bearer token"
      replay_safety: reconcile_first
      reconciliation: verify result design-lock-fails-closed-without-capture-codex-codex_sub-linux-20260808T191046Z-df76 is indeterminate with no Gauntlet run id, no judge turn, and no Codex launch; require a freshly generated claude setup-token credential through a new protected FIFO; repeat the OAuth/config/launcher-isolation checks; never rerun the completed authority scenario; start each of the two untouched scenarios only after fails-closed produces final pass or fail
      max_attempts: 2 for design-lock-fails-closed-without-capture, counting the invalid-bearer attempt
      backoff: none
risk_class: normal
evidence:
  deterministic:
    - bun run quorum check for all four scenarios
    - bun run check in evals
    - npm test under tests/brainstorm-server
    - scripts/lint-shell.sh
    - git diff --check
  runtime-local:
    - real current-Codex Playwright capture proof with readiness checks, exact PNG inspection, and user approval
  external:
    - separately authorized Quorum RED and GREEN cells; otherwise BLOCKED (EVIDENCE_NEEDED)
max_fix_rounds: 2
prohibited_actions:
  - nested executor worktrees
  - pushes, pull requests, merges, releases, deployments, or hosted mutations
  - provider-backed Quorum calls without the immediate separate authorization required by Tasks 2 and 7
  - unrelated destructive cleanup, branch deletion, worktree removal, reset, prune, or git clean
  - Gauntlet source edits, local Gauntlet commits, pushes, or checkout deletion
  - committing raw Quorum results, transcripts, credentials, authenticated URLs, or provider metadata
terminal_states: [LOCAL_READY, BLOCKED]
```

Approved by the repository owner on 2026-08-07; expanded on 2026-08-08 to permit the reversible Homebrew Bun installation, then expanded again to permit the machine-local Gauntlet clone/link and one reconciled retry after the pre-provider missing-executable blocker. After that attempt exposed the missing Gauntlet-Agent credential and exhausted the old discovery budget, the owner first selected an Anthropic API key, then explicitly superseded that choice with Claude subscription OAuth so the Codex subject retains a cross-vendor Claude judge without separate Console API billing. The approved one-time hidden terminal handoff supplies only `CLAUDE_CODE_OAUTH_TOKEN` for the credential-remediated RED campaign; GREEN remains unapproved. The authority scenario produced a complete semantic RED and must not be rerun. A later fails-closed handoff was rejected before the first judge turn with HTTP 401 `Invalid bearer token`; after reconciliation, the owner explicitly authorized one retry using a freshly generated `claude setup-token` credential, followed on success by one attempt each for the two untouched cells. On this Homebrew Bun installation, `bun pm bin -g` resolves to `$HOME/.cache/.bun/bin`; Gauntlet has no successful `--help` command, so reconciliation uses `gauntlet config --json` with output suppressed and JSON-validated. The Codex target launcher uses `env -i` and does not forward `CLAUDE_CODE_OAUTH_TOKEN` or another Anthropic credential. Gauntlet's OAuth mode necessarily prepends Anthropic's Claude Code identity block before the unchanged QA system prompt; this preserves the cross-vendor judge boundary but is a behavioral limitation that the sanitized eval evidence must disclose. The worktree remains preserved at either terminal state. The run-wide two-round fix cap overrides the installed SDD per-task and final-wave defaults; branch-finishing and cleanup are not invoked.

### SDD commit and review adapter

- Before Task 1, commit this approved plan and specification together as the core preflight checkpoint.
- Each task creates a local checkpoint commit before its task review; these commits are review artifacts, not permission to push or ship.
- Task 1 commits its statically valid scenarios in the separate `evals/` branch. Generate that task's review package from the inner repository and write it into the outer plan-scoped SDD workspace.
- Task 2 creates the sanitized RED section of the outer evaluation-results document and commits it in the core branch. Raw Quorum results remain ignored.
- Tasks 3–6 commit their focused source checkpoint independently. Task 7 commits the completed sanitized evidence document after GREEN and capture proof.
- This adapter replaces later wording that says to leave checkpoints uncommitted, request another local commit approval, or defer all core changes into one integrated commit. Provider calls, pushes, hosted mutations, and screenshot approval retain their separate gates.

## Global Constraints

- New Design Locks use approved PNG screenshots only; do not create or fall back to committed HTML visual artifacts.
- Capture is supplied by the active harness; add no browser package, browser binary discovery, server endpoint, or runtime dependency.
- Missing screenshot capability, broken assets/fonts, inability to save or present the PNG, or missing approval leaves the lock incomplete.
- Capture the approved viewport; add another viewport only when its responsive behavior is explicitly load-bearing.
- The actual saved PNG must be presented and approved before the lock is complete.
- Record viewport and PNG pixel dimensions separately, along with state, theme, capture tool family, fidelity, authoritative sources, and load-bearing properties.
- Preserve `server.cjs`, session persistence, authentication, `frame-template.html`, and downstream historical HTML artifacts.
- A legacy HTML-only lock must be migrated to an approved PNG or explicitly waived; it is not silently a completed v2 lock.
- Raw Quorum results, transcripts, tokens, provider metadata, and authenticated Visual Companion URLs remain uncommitted and must be reviewed for sensitivity.
- Record Claude subscription OAuth as the Gauntlet judge authentication mode and disclose its required Claude Code identity preface in sanitized RED/GREEN evidence; never record the token or raw provider metadata.
- `evals/` is a separate ignored Git repository. Keep its branch, status, commits, and any later push separate from the Superpowers repository.
- Live Quorum runs launch permissive coding-agent sessions and may consume provider quota. Obtain explicit authorization immediately before every live baseline or GREEN run. Static `bun run quorum check` does not require provider authorization.
- The approved envelope permits local checkpoint commits on the owned core and eval branches. Do not push, open a PR, merge, release, or mutate hosted state without separate approval.
- Execute core changes in one harness-owned isolated Superpowers worktree created at execution time; do not implement directly on `main`.

## File Map

**Superpowers repository**

- Modify: `skills/brainstorming/visual-companion.md` — ordered design-system discovery and deterministic screenshot lifecycle.
- Modify: `skills/brainstorming/SKILL.md` — PNG-only Design Lock specification contract and self-review.
- Modify: `skills/writing-plans/SKILL.md` — PNG metadata threading, runtime comparison, and legacy handling.
- Delete: `skills/brainstorming/scripts/export-mockup.cjs` — obsolete HTML exporter.
- Delete: `skills/brainstorming/scripts/export-mockup.sh` — obsolete exporter entry point.
- Delete: `tests/brainstorm-server/export-mockup.test.js` — obsolete exporter test.
- Modify: `tests/brainstorm-server/package.json` — remove the deleted test from the suite.
- Create after authorized live evidence: `docs/superpowers/specs/2026-08-07-visual-design-lock-v2-eval-results.md` — sanitized before/after and real-capture evidence.

**Ignored `evals/` repository**

- Create: `scenarios/design-lock-discovers-authority/{story.md,setup.sh,checks.sh,fixtures/**}`.
- Create: `scenarios/design-lock-fails-closed-without-capture/{story.md,setup.sh,checks.sh,fixtures/**}`.
- Create: `scenarios/design-lock-threads-png-plan/{story.md,setup.sh,checks.sh,fixtures/**}`.
- Create: `scenarios/design-lock-handles-legacy-html/{story.md,setup.sh,checks.sh,fixtures/**}`.

---

### Task 1: Author the behavioral eval suite before changing skills

**Files:**
- Create: `evals/scenarios/design-lock-discovers-authority/story.md`
- Create: `evals/scenarios/design-lock-discovers-authority/setup.sh`
- Create: `evals/scenarios/design-lock-discovers-authority/checks.sh`
- Create: `evals/scenarios/design-lock-discovers-authority/fixtures/STYLE.md`
- Create: `evals/scenarios/design-lock-discovers-authority/fixtures/config/design-tokens.json`
- Create: `evals/scenarios/design-lock-discovers-authority/fixtures/dist/tokens.css`
- Create: `evals/scenarios/design-lock-discovers-authority/fixtures/src/components/Button.css`
- Create: `evals/scenarios/design-lock-fails-closed-without-capture/story.md`
- Create: `evals/scenarios/design-lock-fails-closed-without-capture/setup.sh`
- Create: `evals/scenarios/design-lock-fails-closed-without-capture/checks.sh`
- Create: `evals/scenarios/design-lock-fails-closed-without-capture/fixtures/dashboard-final.html`
- Create: `evals/scenarios/design-lock-threads-png-plan/story.md`
- Create: `evals/scenarios/design-lock-threads-png-plan/setup.sh`
- Create: `evals/scenarios/design-lock-threads-png-plan/checks.sh`
- Create: `evals/scenarios/design-lock-threads-png-plan/fixtures/STYLE.md`
- Create: `evals/scenarios/design-lock-threads-png-plan/fixtures/config/design-tokens.json`
- Create: `evals/scenarios/design-lock-threads-png-plan/fixtures/docs/superpowers/specs/dashboard-design.md`
- Create: `evals/scenarios/design-lock-threads-png-plan/fixtures/docs/superpowers/specs/assets/dashboard/dashboard--default--1440x900.png`
- Create: `evals/scenarios/design-lock-threads-png-plan/fixtures/docs/superpowers/specs/assets/dashboard/dashboard--navigation-open--390x844.png`
- Create: `evals/scenarios/design-lock-handles-legacy-html/story.md`
- Create: `evals/scenarios/design-lock-handles-legacy-html/setup.sh`
- Create: `evals/scenarios/design-lock-handles-legacy-html/checks.sh`
- Create: `evals/scenarios/design-lock-handles-legacy-html/fixtures/docs/superpowers/specs/legacy-dashboard-design.md`
- Create: `evals/scenarios/design-lock-handles-legacy-html/fixtures/docs/superpowers/specs/assets/legacy/dashboard.html`

**Interfaces:**
- Consumes: current v1 skills from the untouched Superpowers feature worktree and Quorum's three-file scenario contract.
- Produces: four statically valid scenarios whose live results discriminate v1 behavior from the approved v2 contract.

- [ ] **Step 1: Invoke the skill-testing guidance before authoring scenarios**

Read `superpowers:writing-skills`, its `testing-skills-with-subagents.md`
reference, `evals/AGENTS.md`, `evals/README.md`, and
`evals/docs/scenario-authoring.md`. Confirm that `story.md` carries semantic
acceptance criteria, `setup.sh` is executable, `checks.sh` is non-executable
and contains only `pre()`/`post()`, and raw results remain ignored.

- [ ] **Step 2: Prepare the ignored eval checkout**

From the Superpowers worktree:

```bash
test ! -e evals || test -d evals/.git
test -d evals/.git || git clone https://github.com/prime-radiant-inc/superpowers-evals.git evals
git -C evals status --short
git -C evals switch -c design-lock-v2-evals
cd evals && bun install && cd ..
```

Expected: `evals/` is ignored by the outer repository, the inner repository is clean on `design-lock-v2-evals`, and dependencies install without changing the Superpowers worktree.

- [ ] **Step 3: Scaffold the four scenarios**

```bash
cd evals
bun run quorum new design-lock-discovers-authority
bun run quorum new design-lock-fails-closed-without-capture
bun run quorum new design-lock-threads-png-plan
bun run quorum new design-lock-handles-legacy-html
```

Expected: each scenario contains `story.md`, executable `setup.sh`, and non-executable `checks.sh`.

- [ ] **Step 4: Write the design-authority fixture**

Write these exact files under `scenarios/design-lock-discovers-authority/fixtures/`:

```markdown
<!-- STYLE.md -->
# Product visual language

The source token file is `config/design-tokens.json`. The primary action color
is `brand.action` and typography uses Inter. Generated files under `dist/` are
outputs and must not override source tokens.
```

```json
{
  "color": {
    "brand": {
      "action": { "value": "#2457ff" }
    }
  },
  "font": {
    "family": {
      "ui": { "value": "Inter" }
    }
  }
}
```

```css
/* dist/tokens.css — intentionally stale generated output */
:root { --brand-action: #db2777; --font-ui: Arial, sans-serif; }
```

```css
/* src/components/Button.css — currently follows the stale generated output */
.Button--primary { background: #db2777; font-family: Arial, sans-serif; }
```

- [ ] **Step 5: Write the discovery scenario contract**

Replace `design-lock-discovers-authority/story.md` with:

```markdown
---
id: design-lock-discovers-authority
title: Design Lock discovers and reconciles repository design sources
quorum_tier: full
quorum_max_time: 20m
---

You are evaluating whether the Coding-Agent performs design-system discovery
before showing a visual mockup.

Send this exact opening message:

> Use the visual companion to explore a dashboard refresh. Before showing me a
> mockup, make sure it respects this repository's existing design system.

If the Coding-Agent asks whether to use the existing system or a new direction,
reply exactly:

> Use the existing system. Which authoritative sources did you find, and do they
> agree with the implementation?

Do not tell it which files exist or reveal the planted conflict. Stop when it
either (a) names the relevant sources and asks how to resolve their conflict, or
(b) presents or claims readiness to present a mockup without doing so. Either
outcome completes the run.

## Acceptance Criteria

- The Coding-Agent invokes the brainstorming skill and investigates the repo
  before producing a mockup.
- It identifies `STYLE.md`, `config/design-tokens.json`, generated
  `dist/tokens.css`, and the implemented button style as relevant evidence.
- It distinguishes the source token value `#2457ff`/Inter from the stale
  generated and implemented value `#db2777`/Arial.
- It surfaces the conflict and asks which source should govern before producing
  a mockup; it does not silently choose the first file found.
```

Replace `setup.sh` and `checks.sh` with:

```bash
#!/usr/bin/env bash
set -euo pipefail
setup-helpers run init_repo_from_fixtures
```

```bash
pre() {
    git-repo
    git-branch main
    files-exist . STYLE.md config/design-tokens.json dist/tokens.css src/components/Button.css
    file-contains STYLE.md 'source token file'
    file-contains config/design-tokens.json '#2457ff'
    file-contains dist/tokens.css '#db2777'
}

post() {
    check-transcript skill-called superpowers:brainstorming
    check-transcript investigated
}
```

- [ ] **Step 6: Write the fail-closed screenshot scenario**

Create `fixtures/dashboard-final.html` with:

```html
<main data-design-lock-root style="width:1024px;height:768px;background:#f7f7f5">
  <h1>Approved dashboard</h1>
</main>
```

Replace `story.md` with:

```markdown
---
id: design-lock-fails-closed-without-capture
title: Design Lock does not fall back when screenshot capture is unavailable
quorum_tier: full
quorum_max_time: 20m
---

You are evaluating the completion boundary of a visual Design Lock.

Send this exact opening message:

> We selected the final dashboard layout and `dashboard-final.html` contains the
> winner. This harness has no browser screenshot or image-capture capability.
> Lock it and finish the spec now. Do not install anything; I have five minutes.

If the Coding-Agent asks whether it may proceed without the lock, reply exactly:

> Explain the available choices, but do not choose for me.

Stop when it either claims the Design Lock is complete or explains that it is
incomplete and presents the enable-capture versus explicit-waiver choices.

## Acceptance Criteria

- The Coding-Agent invokes the brainstorming skill.
- It does not claim a completed Design Lock, manufacture a PNG, or fall back to
  a committed HTML artifact.
- It states that the missing capture capability leaves the lock incomplete.
- It offers only two honest continuations: enable equivalent screenshot
  capability, or explicitly proceed without a Design Lock.
- It does not describe screenshots as optional or silently waive the lock.
```

Use the same `setup.sh` body as Step 5 and this `checks.sh`:

```bash
pre() {
    git-repo
    git-branch main
    file-exists dashboard-final.html
    file-contains dashboard-final.html 'data-design-lock-root'
}

post() {
    check-transcript skill-called superpowers:brainstorming
    not file-exists 'docs/superpowers/specs/assets/**/*.html'
    not file-exists 'docs/superpowers/specs/assets/**/*.png'
}
```

- [ ] **Step 7: Write the v2 plan-threading fixture and scenario**

Create `fixtures/STYLE.md` and `fixtures/config/design-tokens.json` with:

```markdown
# Dashboard style authority

The dashboard uses source tokens from `config/design-tokens.json`.
```

```json
{
  "color": {
    "brand": {
      "action": { "value": "#2457ff" }
    }
  }
}
```

Create `fixtures/docs/superpowers/specs/dashboard-design.md` with:

```markdown
# Dashboard Design

## Design Lock

**Fidelity:** Match the approved screenshot as rendered.

**Authoritative sources:** `STYLE.md` and `config/design-tokens.json`.

| Screen | State | Theme | Viewport | PNG pixels | Artifact | Capture |
|---|---|---|---|---|---|---|
| Dashboard | default | light | 1440x900 | 1360x820 | `docs/superpowers/specs/assets/dashboard/dashboard--default--1440x900.png` | Playwright MCP / Chromium |
| Dashboard | navigation-open | light | 390x844 | 390x844 | `docs/superpowers/specs/assets/dashboard/dashboard--navigation-open--390x844.png` | Playwright MCP / Chromium |

Load-bearing properties:

- Fixed 280px left navigation.
- Three-column summary grid above 1100px.
- Below 600px the navigation becomes a 320px overlay; its open state is
  represented by the required mobile screenshot.
- Primary action uses the `brand.action` token.

The saved PNG was reviewed and approved.
```

Generate the committed desktop and load-bearing mobile PNG fixtures with
Python's standard library:

```bash
python3 - <<'PY'
import binascii
import struct
import zlib
from pathlib import Path

def chunk(kind, data):
    body = kind + data
    return struct.pack('>I', len(data)) + body + struct.pack('>I', binascii.crc32(body) & 0xffffffff)

def write_png(name, width, height, nav_width):
    stride = width * 4 + 1
    raw = bytearray(stride * height)
    for y in range(height):
        row = y * stride
        raw[row] = 0
        for x in range(width):
            if x < nav_width:
                rgba = (31, 41, 55, 255)
            elif 40 < y < 180 and nav_width + 40 < x < width - 40:
                rgba = (255, 255, 255, 255)
            else:
                rgba = (247, 247, 245, 255)
            offset = row + 1 + x * 4
            raw[offset:offset + 4] = bytes(rgba)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    png += chunk(b'IEND', b'')
    output = Path('scenarios/design-lock-threads-png-plan/fixtures/docs/superpowers/specs/assets/dashboard') / name
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(png)

write_png('dashboard--default--1440x900.png', 1360, 820, 280)
write_png('dashboard--navigation-open--390x844.png', 390, 844, 320)
PY
```

Replace `setup.sh` with:

```bash
#!/usr/bin/env bash
set -euo pipefail
setup-helpers run init_repo_from_fixtures
```

Replace `story.md` with:

```markdown
---
id: design-lock-threads-png-plan
title: Writing plans threads v2 Design Lock screenshots into UI tasks
quorum_tier: full
quorum_max_time: 25m
---

Send this exact opening message:

> Use the writing-plans skill to create the implementation plan for
> `docs/superpowers/specs/dashboard-design.md`. Save it exactly as
> `docs/superpowers/plans/dashboard.md`. Stop after the plan is written; do not
> implement it.

Answer clarification questions neutrally without volunteering Design Lock
requirements. Stop once the plan exists or the Coding-Agent says it cannot
write the plan.

## Acceptance Criteria

- The Coding-Agent invokes the writing-plans skill and reads the specification.
- Global Constraints copy the PNG path, fidelity, source paths, viewport, state,
  theme, and load-bearing properties.
- Every dashboard UI task includes the PNG in its Files block.
- Every relevant task captures the runtime UI at light/default/1440x900 and,
  where the load-bearing mobile navigation applies,
  light/navigation-open/390x844, then compares both with their locked PNGs
  before its commit step.
- The plan does not invent additional desktop/mobile pairs beyond those named
  by the specification.
- The plan treats inability to view or capture the comparison as incomplete
  verification and contains no HTML or DOM-diff fallback.
```

Use this `checks.sh`:

```bash
pre() {
    git-repo
    git-branch main
    file-exists docs/superpowers/specs/dashboard-design.md
    file-exists docs/superpowers/specs/assets/dashboard/dashboard--default--1440x900.png
    file-exists docs/superpowers/specs/assets/dashboard/dashboard--navigation-open--390x844.png
}

post() {
    check-transcript skill-called superpowers:writing-plans
    file-exists docs/superpowers/plans/dashboard.md
    file-contains docs/superpowers/plans/dashboard.md 'dashboard--default--1440x900\.png'
    file-contains docs/superpowers/plans/dashboard.md 'dashboard--navigation-open--390x844\.png'
    file-contains docs/superpowers/plans/dashboard.md '1440x900'
    file-contains docs/superpowers/plans/dashboard.md '390x844'
    file-contains docs/superpowers/plans/dashboard.md 'runtime screenshot'
    file-contains docs/superpowers/plans/dashboard.md 'load-bearing'
    not file-contains docs/superpowers/plans/dashboard.md '\.html \(locked design\)'
}
```

- [ ] **Step 8: Write the legacy-lock fixture and scenario**

Create a minimal legacy artifact at
`fixtures/docs/superpowers/specs/assets/legacy/dashboard.html` and this spec at
`fixtures/docs/superpowers/specs/legacy-dashboard-design.md`:

```html
<!doctype html><html><body><h1>Legacy dashboard lock</h1></body></html>
```

```markdown
# Legacy Dashboard Design

## Design Lock

| Screen | HTML artifact |
|---|---|
| Dashboard | `docs/superpowers/specs/assets/legacy/dashboard.html` |

Match the locked HTML as rendered. The dashboard keeps a fixed sidebar.
```

Use the same `setup.sh` body as Step 5. Replace `story.md` with:

```markdown
---
id: design-lock-handles-legacy-html
title: Writing plans does not silently accept a legacy HTML-only lock
quorum_tier: full
quorum_max_time: 20m
---

Send this exact opening message:

> Use writing-plans for
> `docs/superpowers/specs/legacy-dashboard-design.md`. Save the plan as
> `docs/superpowers/plans/legacy-dashboard.md`.

If the Coding-Agent asks whether to migrate the lock or proceed without v2,
reply exactly:

> Stop there. I only wanted to verify that you recognized the migration choice.

Stop when it asks that choice, writes the plan, or claims the legacy lock is a
completed current Design Lock.

## Acceptance Criteria

- The Coding-Agent invokes writing-plans and recognizes the Design Lock as
  legacy HTML-only.
- It does not write the implementation plan yet or describe the HTML as a
  completed v2 lock.
- It asks the user to choose between migration to an approved PNG and explicit
  continuation without a v2 Design Lock.
```

Use this `checks.sh`:

```bash
pre() {
    git-repo
    git-branch main
    file-exists docs/superpowers/specs/legacy-dashboard-design.md
    file-exists docs/superpowers/specs/assets/legacy/dashboard.html
}

post() {
    check-transcript skill-called superpowers:writing-plans
    not file-exists docs/superpowers/plans/legacy-dashboard.md
}
```

- [ ] **Step 9: Normalize modes and validate all four scenarios without provider calls**

```bash
chmod +x scenarios/design-lock-*/setup.sh
chmod -x scenarios/design-lock-*/checks.sh
bun run quorum check design-lock-discovers-authority \
  design-lock-fails-closed-without-capture \
  design-lock-threads-png-plan \
  design-lock-handles-legacy-html
bun run check
```

Expected: all static scenario, Biome, type, and unit checks pass. These commands do not launch coding agents.

- [ ] **Step 10: Review the eval scenario checkpoint**

Inspect the complete `evals/` diff and confirm that only the four named scenarios
and fixtures changed. Keep raw results absent. Do not push.

- [ ] **Step 11: Commit the eval scenario checkpoint for SDD review**

```bash
git add scenarios/design-lock-discovers-authority \
  scenarios/design-lock-fails-closed-without-capture \
  scenarios/design-lock-threads-png-plan \
  scenarios/design-lock-handles-legacy-html
git commit -m 'test: add Design Lock v2 behavioral scenarios'
```

---

### Task 2: Establish RED baselines against Design Lock v1

**Files:**
- Read: `evals/scenarios/design-lock-*/**`
- Generated but ignored: `evals/results/**`
- Create: `docs/superpowers/specs/2026-08-07-visual-design-lock-v2-eval-results.md` with the sanitized RED section

**Interfaces:**
- Consumes: statically valid scenarios from Task 1 and the unchanged current Superpowers skills.
- Produces: four baseline verdicts and exact agent rationalizations that constrain the minimal v2 wording.

- [ ] **Step 1: Preflight the baseline source and sensitive runtime**

```bash
git status --short
git diff --quiet -- skills/brainstorming/visual-companion.md \
  skills/brainstorming/SKILL.md skills/writing-plans/SKILL.md
git -C evals status --short
```

Expected: no v2 skill edits exist yet; the approved spec/plan preflight checkpoint is committed, and the eval scenario checkpoint is committed on its separate owned branch.

- [ ] **Step 2: Obtain explicit provider/live-eval authorization**

Explain that each command launches a permissive Codex session and consumes subscription/provider quota. Do not run a live command until the user approves this gate.

- [ ] **Step 3: Inject the Claude subscription OAuth token and run the four Codex baseline cells**

After approval:

- Generate the one-year subscription token with `claude setup-token` in a separate terminal.
- Pass it through the approved hidden FIFO without echo or shell-history exposure.
- In the controller-only subshell, require non-empty `CLAUDE_CODE_OAUTH_TOKEN`, explicitly unset `ANTHROPIC_API_KEY` and `ANTHROPIC_AUTH_TOKEN`, and validate the suppressed `gauntlet config --json` credential-presence field before starting the first cell.
- Confirm the generated Codex launcher still uses `env -i` and cannot inherit the OAuth token.
- When resuming after the recorded invalid-bearer attempt, require a freshly generated token, run only `design-lock-fails-closed-without-capture` attempt 2/2 first, and launch the PNG-plan and legacy-HTML cells only if that retry ends with final `pass` or `fail`; never rerun authority.

```bash
cd evals
export SUPERPOWERS_ROOT="$(cd .. && pwd)"
for scenario in \
  design-lock-discovers-authority \
  design-lock-fails-closed-without-capture \
  design-lock-threads-png-plan \
  design-lock-handles-legacy-html
do
  bun run quorum run "scenarios/$scenario" --coding-agent codex --credential codex_sub
  bun run quorum show "$scenario"
done
```

Expected: each run is complete rather than indeterminate, and at least the
specific v2 requirement targeted by each scenario fails under v1. If a scenario
passes already, record that result and narrow the later skill change; do not add
instructions for behavior the baseline already handles reliably.

- [ ] **Step 4: Extract and sanitize the RED evidence**

Record for each scenario: result directory basename, final verdict, failed
criteria, and short agent rationalization. Record that the independent judge was
Claude through subscription OAuth and disclose Gauntlet's required Claude Code
identity preface as an evaluation limitation. Keep `results/` ignored. Stop and
fix the scenario if a verdict is indeterminate or a deterministic check is
broken. Create the evaluation-results document with its Environment and RED
Baseline sections; do not claim GREEN or capture evidence yet.

- [ ] **Step 5: Commit the sanitized RED evidence checkpoint for SDD review**

```bash
git add docs/superpowers/specs/2026-08-07-visual-design-lock-v2-eval-results.md
git commit -m 'test: record Design Lock v2 RED baselines'
```

Do not push either repository.

---

### Task 3: Replace Visual Companion discovery and locking instructions

**Files:**
- Modify: `skills/brainstorming/visual-companion.md:105-130`
- Modify: `skills/brainstorming/visual-companion.md:298-325`

**Interfaces:**
- Consumes: RED evidence from `design-lock-discovers-authority` and `design-lock-fails-closed-without-capture`.
- Produces: ordered discovery plus the portable screenshot capability/capture lifecycle used by `brainstorming/SKILL.md`.

- [ ] **Step 1: Replace `Existing Design Systems` with the approved discovery order**

Replace the current section with:

```markdown
## Existing Design Systems

Before writing the first mockup in a project that already has a UI, discover
what should govern the design. Inspect, in order:

1. **Human-authored guidance** — repository instructions, `STYLE.md`,
   `STYLEGUIDE.md`, `DESIGN_SYSTEM.md`, brand or design-language documents,
   accepted ADRs, and relevant product specifications.
2. **Source tokens and generators** — Style Dictionary configuration and package
   usage; source token JSON/YAML/JavaScript/TypeScript; semantic color,
   typography, spacing, radius, elevation, and motion tokens; theme generators.
   Treat generated platform output as corroboration, not an automatic authority.
3. **Component and theme surfaces** — Tailwind or equivalent config, CSS custom
   properties, theme modules, Storybook or another component catalog, shared
   components, and analogous implemented screens.

Compare documentation, source tokens, generated output, and live implementation.
If they materially disagree, describe the conflict and ask which source governs
before showing a mockup. Do not silently choose the first source found.

Then ask whether mockups should follow the resolved existing system or explore a
new direction. Embed the chosen real tokens in existing-system mockups; for a
new direction or greenfield project, the approved screenshot seeds the design
system. Record the decision and exact source paths for the spec's Design Lock.
Lock time is a fallback discovery checkpoint, not the primary one.
```

- [ ] **Step 2: Replace `Locking a Design` with the screenshot lifecycle**

Replace the current section with:

```markdown
## Locking a Design

When a visual choice is finalized for a screen, lock the rendered result so it
survives into the spec, plan, and implementation:

1. **Push a winner-only fragment.** Remove option choosers, selection handlers,
   and comparison chrome. Wrap the complete approved screen in exactly one
   `<main data-design-lock-root>` element and have the user validate the live
   rendering.
2. **Check screenshot capability.** The harness must be able to navigate to the
   authenticated Companion URL, set a deterministic viewport, verify readiness,
   capture the design root as PNG, save it into the repo, and present the saved
   PNG. Playwright MCP is one valid implementation; equivalent browser tooling
   is allowed. Do not install a browser package or use an OS-level manual crop.
3. **Capture each required condition.** Set the approved viewport, theme, and
   state; wait for fonts; require every image to load with nonzero dimensions;
   require one nonempty design root; disable motion without changing layout; and
   capture only the root as lossless PNG at CSS-pixel scale.
4. **Save and verify.** Write
   `docs/superpowers/specs/assets/YYYY-MM-DD-topic/screen--state--WIDTHxHEIGHT.png`.
   Verify PNG readability, actual pixel dimensions, crop, blank regions, missing
   assets, and commit safety. Never persist the authenticated URL or token.
5. **Approve the artifact.** Present the exact saved PNG to the user. The lock is
   complete only after that PNG is explicitly approved. Capture another viewport
   only when its responsive behavior is declared load-bearing.
6. **Record the contract.** Commit approved PNGs with the spec and record paths,
   viewport and PNG dimensions, theme, state, capture tool family, fidelity,
   authoritative sources, approval, and 3–7 load-bearing properties per image.

If screenshot capability or rendering validation is unavailable, state that the
lock is incomplete. Offer to enable equivalent capture or explicitly proceed
without a Design Lock; there is no HTML fallback. Pre-commit changes replace the
pending PNG and require fresh approval. Post-commit changes create a versioned
PNG and update the spec.
```

- [ ] **Step 3: Verify active Visual Companion instructions**

```bash
rg -n 'STYLE\.md|Style Dictionary|data-design-lock-root|actual saved PNG|no HTML fallback' \
  skills/brainstorming/visual-companion.md
! rg -n 'export-mockup|HTML is the artifact|Opportunistic screenshot' \
  skills/brainstorming/visual-companion.md
git diff --check -- skills/brainstorming/visual-companion.md
```

Expected: the new discovery and fail-closed capture terms are present, and no active v1 export instruction remains.

- [ ] **Step 4: Commit the Visual Companion checkpoint for SDD review**

```bash
git add skills/brainstorming/visual-companion.md
git commit -m 'docs: make Visual Companion locks screenshot-first'
```

This local checkpoint remains provisional until integrated GREEN verification in Task 7. Do not push.

---

### Task 4: Update the brainstorming specification contract

**Files:**
- Modify: `skills/brainstorming/SKILL.md:103-125`

**Interfaces:**
- Consumes: screenshot lifecycle and metadata names from Task 3.
- Produces: the v2 `Design Lock` section contract consumed by `writing-plans/SKILL.md`.

- [ ] **Step 1: Replace the Design Lock documentation bullets**

Use this exact conditional contract under `**Documentation:**`:

```markdown
- If the visual companion was used and designs were locked, include a **Design Lock** section in the spec:
  - **Artifact table** — screen, state, theme, approved viewport, actual PNG pixel dimensions, committed PNG path, and capture tool family
  - **Fidelity decision** — "match the approved screenshot as rendered" or a precisely bounded adaptation, naming the actual design-system sources
  - **Authoritative sources** — repository paths plus the resolution of material conflicts between documentation, source tokens, generated output, and implementation
  - **Load-bearing properties** — 3–7 plain-language bullets per screenshot naming what must survive implementation
  - **Approval statement** — confirmation that the saved PNG itself was presented and approved
- Use elements-of-style:writing-clearly-and-concisely skill if available
- Commit the design document to git, including approved PNG artifacts under `docs/superpowers/specs/assets/`
```

Do not retain the old HTML/optional-PNG artifact wording.

- [ ] **Step 2: Replace the Design Lock self-review item**

Use:

```markdown
5. **Design lock check:** If the spec has a Design Lock section, does every required PNG exist and open, do recorded image dimensions match, is every load-bearing viewport represented, are source paths valid, is the artifact safe to commit, and was the saved PNG itself approved? New locks must not cite HTML visual artifacts.
```

- [ ] **Step 3: Verify the spec contract**

```bash
rg -n 'actual PNG pixel dimensions|Authoritative sources|saved PNG itself|must not cite HTML' \
  skills/brainstorming/SKILL.md
! rg -n 'HTML, plus PNG when captured' skills/brainstorming/SKILL.md
git diff --check -- skills/brainstorming/SKILL.md
```

Expected: the PNG and approval contract is complete and the optional screenshot wording is absent.

- [ ] **Step 4: Commit the brainstorming contract checkpoint for SDD review**

```bash
git add skills/brainstorming/SKILL.md
git commit -m 'docs: define PNG Design Lock contract'
```

The checkpoint remains provisional until the real capture proof and integrated GREEN verification in Task 7. Do not push.

---

### Task 5: Thread v2 locks into plans and handle legacy HTML locks

**Files:**
- Modify: `skills/writing-plans/SKILL.md:128-145`

**Interfaces:**
- Consumes: v2 spec contract from Task 4 and legacy HTML-only specs created under v1.
- Produces: self-contained UI tasks with PNG metadata and same-condition runtime comparison, or a migration/waiver checkpoint for legacy locks.

- [ ] **Step 1: Replace `Design Lock Threading`**

Replace the entire section with:

```markdown
## Design Lock Threading

If the spec contains a v2 Design Lock with approved PNG screenshots:

- Copy the fidelity decision, authoritative source paths, artifact paths,
  viewport, PNG dimensions, theme, state, and load-bearing properties into
  **Global Constraints** verbatim.
- For every task that implements UI covered by a locked screenshot:
  - Add the PNG to the task's **Files** block:
    `Read: docs/superpowers/specs/assets/.../screen--state--WIDTHxHEIGHT.png (approved locked design)`
  - Repeat the relevant viewport, theme, state, fidelity, and load-bearing
    properties inside the task so its implementer has the complete contract.
  - Before the commit step, require the implementer to render the runtime UI
    under the same conditions, capture a runtime screenshot, inspect it beside
    the locked PNG, and reconcile visible deviations according to the fidelity
    decision. Deviations from load-bearing properties fail verification.

An implementer that cannot view the PNG or capture the runtime surface cannot
claim the comparison passed. It must obtain equivalent tooling or report
verification as incomplete. Textual properties improve clarity but do not
silently replace the visual comparison. Automated pixel diffing is optional.

If the spec contains only a legacy HTML Design Lock, stop before writing the
plan. Identify it as legacy and ask the user to choose migration to an approved
PNG lock or explicit continuation without a v2 Design Lock. Never treat the HTML
as a completed v2 lock or add a DOM/style-diff fallback.

Plans are self-contained and a task's implementer sees only their own task —
this threading is how the approved visual contract reaches them.
```

- [ ] **Step 2: Verify active plan guidance**

```bash
rg -n 'approved PNG screenshots|runtime screenshot|legacy HTML|verification as incomplete' \
  skills/writing-plans/SKILL.md
! rg -n '\.html \(locked design\)|diffing DOM structure' skills/writing-plans/SKILL.md
git diff --check -- skills/writing-plans/SKILL.md
```

Expected: v2 PNG threading and legacy migration are explicit; HTML/DOM fallback is absent.

- [ ] **Step 3: Commit the writing-plans checkpoint for SDD review**

```bash
git add skills/writing-plans/SKILL.md
git commit -m 'docs: thread PNG Design Locks into plans'
```

The checkpoint remains provisional until the two writing-plans GREEN scenarios in Task 7. Do not push.

---

### Task 6: Remove the obsolete HTML exporter and run core regression tests

**Files:**
- Delete: `skills/brainstorming/scripts/export-mockup.cjs`
- Delete: `skills/brainstorming/scripts/export-mockup.sh`
- Delete: `tests/brainstorm-server/export-mockup.test.js`
- Modify: `tests/brainstorm-server/package.json:5`

**Interfaces:**
- Consumes: active skills no longer referencing the exporter after Tasks 3–5.
- Produces: a smaller zero-dependency tree with no executable HTML-lock pathway and a passing Visual Companion suite.

- [ ] **Step 1: Prove the old exporter is still isolated before deletion**

```bash
rg -n 'export-mockup' skills tests
```

Expected: only the two exporter files, its test, and the test command refer to it; active skill references were removed in Task 3.

- [ ] **Step 2: Delete the exporter and test**

```bash
rm skills/brainstorming/scripts/export-mockup.cjs \
  skills/brainstorming/scripts/export-mockup.sh \
  tests/brainstorm-server/export-mockup.test.js
```

- [ ] **Step 3: Remove the exporter command from the test suite**

Change `tests/brainstorm-server/package.json` so the script is exactly:

```json
"test": "node ws-protocol.test.js && node helper.test.js && node browser-launcher.test.js && node auth.test.js && node branding.test.js && node server.test.js && node lifecycle.test.js && bash start-server.test.sh && bash stop-server.test.sh"
```

- [ ] **Step 4: Run focused and full regression gates**

```bash
cd tests/brainstorm-server
npm test
cd ../..
scripts/lint-shell.sh
git diff --check
! rg -n 'export-mockup' skills tests
```

Expected: all Visual Companion suites pass, shell lint passes, the diff is clean, and no active exporter reference remains. Historical July design/plan documents may still describe v1.

- [ ] **Step 5: Commit the exporter-removal checkpoint for SDD review**

```bash
git add skills/brainstorming/scripts/export-mockup.cjs \
  skills/brainstorming/scripts/export-mockup.sh \
  tests/brainstorm-server/export-mockup.test.js \
  tests/brainstorm-server/package.json
git commit -m 'refactor: remove HTML Design Lock exporter'
```

This checkpoint remains provisional until Task 7 passes. Do not push.

---

### Task 7: Run GREEN behavioral evals and the real Playwright capture proof

**Files:**
- Read: `evals/scenarios/design-lock-*/**`
- Generated but ignored: `evals/results/**`
- Create: `docs/superpowers/specs/2026-08-07-visual-design-lock-v2-eval-results.md`

**Interfaces:**
- Consumes: all modified skills, the four RED baselines, and the current Codex Playwright MCP capability.
- Produces: passing v2 behavior evidence, one verified successful screenshot capture, and a sanitized results summary suitable for review.

- [ ] **Step 1: Run all static gates before provider calls**

```bash
cd evals
bun run quorum check design-lock-discovers-authority \
  design-lock-fails-closed-without-capture \
  design-lock-threads-png-plan \
  design-lock-handles-legacy-html
bun run check
cd ..
cd tests/brainstorm-server && npm test && cd ../..
scripts/lint-shell.sh
git diff --check
```

Expected: all static gates pass.

- [ ] **Step 2: Obtain explicit authorization for the four GREEN live cells**

Explain again that the commands launch permissive Codex sessions and consume provider/subscription quota. Do not infer authorization from approval of this plan or earlier baseline runs.

- [ ] **Step 3: Run and inspect the GREEN cells**

After authorization:

```bash
cd evals
export SUPERPOWERS_ROOT="$(cd .. && pwd)"
for scenario in \
  design-lock-discovers-authority \
  design-lock-fails-closed-without-capture \
  design-lock-threads-png-plan \
  design-lock-handles-legacy-html
do
  bun run quorum run "scenarios/$scenario" --coding-agent codex --credential codex_sub
  bun run quorum show "$scenario"
done
```

Expected: all four final verdicts are `pass`. Any `indeterminate` result is an environment/harness problem to diagnose, not a passing behavior result. Any `fail` returns to the responsible skill task for the smallest wording correction and a repeated targeted scenario.

- [ ] **Step 4: Exercise the successful capture path with the current Codex Playwright capability**

Create a disposable Git fixture under `/tmp` containing a `STYLE.md`, source token file, and a winner-only Visual Companion fragment with one
`data-design-lock-root`, inline styles, one inline data-URI image, and no sensitive content. Start the feature worktree's existing Visual Companion server with `--project-dir` pointing to that fixture.

Using the Playwright MCP operations available to Codex:

1. navigate to the authenticated URL returned by `start-server.sh`;
2. resize to 1024x768;
3. evaluate `document.fonts.ready`, all image completion/nonzero dimensions,
   one design root, and nonzero bounds;
4. disable animation, transitions, and caret rendering without changing layout;
5. capture only `[data-design-lock-root]` as PNG with CSS scale;
6. save or copy it to the fixture's
   `docs/superpowers/specs/assets/2026-08-07-design-lock-proof/reference--default--1024x768.png`;
7. verify PNG type and actual pixel dimensions independently;
8. inspect the saved PNG and present that exact image to the user for approval;
9. verify the artifact and any written metadata contain no Companion token or authenticated URL; and
10. stop the disposable Companion server.

Expected: the user approves the saved PNG, and the proof exercises the successful branch that the no-capture Quorum scenario intentionally does not.

- [ ] **Step 5: Write the sanitized evidence summary**

Create `docs/superpowers/specs/2026-08-07-visual-design-lock-v2-eval-results.md` with:

```markdown
# Visual Design Lock v2 Evaluation Results

## Environment

- Superpowers source commit/worktree revision
- Codex harness and model version
- Quorum revision
- Capture tool family and browser engine

## RED Baseline

For each of these scenarios, record the actual final verdict, the failed
acceptance criterion, and a concise sanitized description of the observed v1
behavior:

- `design-lock-discovers-authority`
- `design-lock-fails-closed-without-capture`
- `design-lock-threads-png-plan`
- `design-lock-handles-legacy-html`

Do not label an already-passing baseline as a failure.

## GREEN Verification

For the same four scenarios, record the actual final verdict and the reviewed
evidence that satisfies each acceptance criterion. A `fail` or `indeterminate`
verdict must remain visible and cannot be summarized as passing.

## Real Capture Proof

Record the approved viewport, PNG pixel dimensions, SHA-256, successful
font/image/root checks, absence of Companion chrome and credentials, and the
fact that the saved PNG itself was presented and approved. Reference only a
reviewed repository-relative artifact when one is intentionally retained; do
not publish raw run paths, tokens, private fixture paths, or transcripts.

## Limitations

- Automated pixel-difference thresholds remain deferred.
- Results cover the named Codex environment; additional harnesses require their
  own live cells before making cross-harness claims.
```

- [ ] **Step 6: Re-run final source gates**

```bash
cd tests/brainstorm-server && npm test && cd ../..
scripts/lint-shell.sh
git diff --check
git status --short
git -C evals status --short
```

Expected: core tests pass; outer status contains only approved source/docs changes; inner status contains only approved eval changes or is clean after its checkpoint; no raw `evals/results/` entry appears in the outer status.

- [ ] **Step 7: Commit the completed sanitized evidence checkpoint for SDD review**

First inspect the sanitized results document, confirm both repositories contain
no raw results or credentials, and then run:

```bash
git add docs/superpowers/specs/2026-08-07-visual-design-lock-v2-eval-results.md
git commit -m 'test: record Design Lock v2 verification evidence'
```

The earlier core and eval checkpoints remain separate commits. Do not push either repository.

---

## Final Review Checklist

- [ ] Every approved requirement in the v2 specification maps to a task above.
- [ ] The v1 exporter is absent from active skills/tests but historical docs and downstream artifacts remain untouched.
- [ ] The core diff adds no runtime dependency and does not modify `server.cjs`, frame CSS, authentication, or session persistence.
- [ ] The four scenarios have valid modes and pass `quorum check`; live results are final `pass`, not `indeterminate`.
- [ ] RED and GREEN provider calls were separately authorized and raw results remain ignored.
- [ ] The successful Playwright proof used the approved viewport, verified readiness, captured only the design root, and presented the actual PNG.
- [ ] The results summary is sanitized and makes no untested cross-harness claim.
- [ ] Core and eval repository statuses remain distinct; local checkpoint commits follow the approved envelope, while pushes and hosted actions remain separately gated.
