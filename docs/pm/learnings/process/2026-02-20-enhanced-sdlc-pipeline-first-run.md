---
date: 2026-02-20
project: scaffolding-platform
project_type: claude-code-plugin
category: process
tags: [sdlc-pipeline, tdd, browser-testing, agent-browser, autonomous-run, static-analysis, security-scan]
outcome: success
---

# Enhanced SDLC Pipeline — First Autonomous Run

## Context

This learning captures the results of the first full run of the enhanced 10-stage SDLC pipeline, tested against a mobile-first React/TypeScript web app (CatHabits). The pipeline was run fully autonomously in `--auto` mode with no human gates.

## What Worked

### TDD enforcement caught 3 real bugs before shipping

The `execute-plan` stage switching from `executing-plans` to `subagent-driven-development` with explicit TDD enforcement produced measurable quality improvement:

1. **P1 bug: duplicate aria-label** — Two elements in AddHabitForm had `aria-label=/cancel/i`. This would have caused screen reader confusion and broken Playwright tests downstream. Caught by the TDD spec compliance reviewer.

2. **P3 bug: missing aria-pressed** — Toggle button didn't have `aria-pressed` attribute. Pure accessibility defect. Caught by the TDD test expectation.

3. **P1 bug: build config split** — `vite.config.ts` with Vitest's `test:` key broke `tsc -b && vite build`. Would have broken every CI/CD pipeline. Caught by the static-analysis stage.

None of these would have been caught by a code review alone — they required runnable tests and a build step.

### Static analysis as P1 gate stopped a real build-breaking issue

The `vite.config.ts` / `vitest.config.ts` split was required by TypeScript's build mode. Without the static analysis gate, this would have shipped as a broken CI config. The gate caught it immediately and the fix was applied before proceeding.

### browser-test stage with agent-browser confirmed real E2E behavior

The smoke check, mobile layout verification (iPhone 15 viewport), and E2E flow walkthrough using `snapshot -i` refs worked without a live browser session. The stage confirmed:
- The app loads and renders on mobile
- The primary user flow (add habit → check → see streak) works end-to-end
- No JS errors on load

### Pipeline effectiveness ratings from the run

| Stage | Rating | Verdict |
|-------|--------|---------|
| pm-discover | 2/5 | High overhead when requirements are provided; needed for collaborative/ambiguous contexts |
| brainstorm/design | 4/5 | ADR documentation is genuinely useful; prevents re-debating decisions |
| write-plan | 4/5 | TDD task ordering drove discipline — worth keeping |
| execute-plan (TDD) | 5/5 | Caught 3 bugs; highest ROI stage |
| static-analysis | 5/5 | Caught P1 build issue that tests wouldn't catch |
| security-scan | 3/5 | Low signal for pure client-side apps with no backend |
| browser-test | 4/5 | Confirmed real E2E; agent-browser headless worked cleanly |
| release-review | 3/5 | In autonomous mode, this is partially redundant with verifier output |

## What Didn't Work

### PM discovery overhead for well-specified projects

When the project concept is clear (provided by the user), running 6-phase PM discovery adds significant overhead with low incremental value. The artifacts produced are high quality but took substantial pipeline time.

**Recommendation:** Make `pm-discover` conditional. If `docs/pm/*-pm-spec.md` already exists (passed in by the user), skip PM discovery and go straight to brainstorm.

### Security scan signal/noise for client-side apps

`npm audit` on a fresh Vite project finds dev-dependency vulnerabilities that are not exploitable in production (the dev deps don't ship to users). The 10 moderate findings in devDependencies were all accepted-as-P3 noise. This cluttered the security report.

**Recommendation:** Filter `npm audit` output to `--omit=dev`. Only include production dependency vulnerabilities in P1/P2 classification. Dev-only findings are P3 by default.

### agent-browser session management

The agent-browser daemon sometimes holds state from a previous session. On the second browser-test run attempt, the daemon was connected to a stale tab. Running `agent-browser close` before each new session fixes this but needs to be in the `browser-tester` agent's Step 1.

### Missing: a simple "did it start?" check in setup-environment

The `setup-environment` stage verified dependencies were installed but didn't run `npm run dev` to confirm the dev server actually starts. This is a fast check (5 seconds) that would catch misconfigured start scripts before the browser-test stage tries to open the URL.

## Reusable Patterns

### Pattern: Split vite.config.ts and vitest.config.ts for TypeScript projects

When a Vite + Vitest project uses `tsc -b` build mode, the Vitest-specific `test:` configuration key is not recognized by `tsconfig.json`. Always split into two files:
- `vite.config.ts` — build config only, clean for `tsc`
- `vitest.config.ts` — extends vite.config, adds `test:` section

This pattern applies to all Vite + TypeScript + Vitest projects.

### Pattern: Filter npm audit to production deps

```bash
npm audit --omit=dev --json 2>/dev/null
```

Only count production dependency vulnerabilities as P1/P2. Dev dependency vulnerabilities are P3 by default.

### Pattern: Close agent-browser session before opening a new one

```bash
agent-browser close 2>/dev/null || true   # Ignore error if no session
agent-browser open http://localhost:PORT
```

Include this at the start of every `browser-tester` agent run to avoid stale daemon state.

### Pattern: Warm amber + rounded card design works for mobile habit trackers

The warm amber/orange color palette (Tailwind: `amber-50`, `amber-100`, `amber-500`, `orange-600`) with large rounded cards (`rounded-2xl`), 16px minimum touch targets, and bottom-fixed action buttons produces a cozy mobile-first feel appropriate for personal habit tracking apps. Reuse for similar apps.
