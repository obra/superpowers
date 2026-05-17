---
name: dependency-management
description: >
  MUST USE when updating, migrating, or auditing project dependencies: upgrading
  packages, fixing security vulnerabilities (CVEs), resolving breaking changes,
  migrating to new major versions, or auditing outdated dependencies. Enforces
  incremental updates with verification at each step. Distinct from systematic-debugging
  (which fixes application bugs) and refactoring (which restructures application code).
  Triggers on: "update dependencies", "upgrade packages", "npm update", "pip upgrade",
  "outdated", "vulnerability", "CVE", "security advisory", "breaking change",
  "migration guide", "dependency conflict", "peer dependency",
  "update to latest", "audit dependencies", "npm audit", "dependabot".
  Routed by using-superpowers, or invoke directly via /dependency-management.
---

# Dependency Management

Update one thing at a time. Verify after each. Never batch major upgrades.

## Why This Exists

Dependency updates look simple — bump a version number, run install, done. In practice, they're one of the most common sources of hard-to-diagnose breakage: silent API changes, peer dependency conflicts, transitive dependency resolution shifts, and build tool incompatibilities. This skill enforces a structured approach that catches breakage at the smallest possible blast radius.

## Phase 1: Audit

Before changing any versions, understand what needs updating and why.

1. **List outdated dependencies:**
   - Node.js: `npm outdated` or `yarn outdated`
   - Python: `pip list --outdated` or `pip-audit`
   - Go: `go list -m -u all`
   - Rust: `cargo outdated`
   - General: check the package manager's audit/outdated command

2. **Categorize each update by urgency:**
   - **Security** — CVE or advisory with known exploit. Update immediately.
   - **Breaking** — major version bump with documented breaking changes. Plan carefully.
   - **Feature** — minor/patch version with new features or non-breaking fixes. Low risk.
   - **Transitive** — a dependency of a dependency. Usually handled by lockfile update.

3. **Prioritize:** Security > Breaking (if blocking other work) > Feature. Don't update everything at once — pick the highest-priority items first.

## Phase 2: Impact Assessment

For each dependency to update (especially major versions):

1. **Read the changelog/migration guide.** Look for:
   - Breaking API changes (renamed functions, removed options, changed signatures)
   - Dropped platform/runtime support (minimum Node version, Python version, etc.)
   - Peer dependency changes (requires React 18, drops support for React 16)
   - Changed default behavior (opt-in → opt-out, strict mode, new warnings)

2. **Search the codebase for usage of changed APIs.** For each renamed/removed API, run separate searches for:
   - Direct calls and type references
   - String literals and dynamic access (`obj["methodName"]`)
   - Import statements and re-exports
   - Test files and mocks
   
   Do not assume a single search caught everything — a function name may appear as a type annotation, a string key, or in a mock, each of which requires a separate pattern.

3. **Check peer dependency compatibility:** Will this update conflict with other installed packages? The package manager usually warns, but check proactively for frameworks with tight coupling (React + React DOM, Angular packages, etc.).

4. **Classify the risk level:**
   - **Low risk:** Patch/minor update, no breaking changes documented, limited usage in codebase.
   - **Medium risk:** Minor update with deprecation warnings, or major update with few breaking changes that don't affect our usage.
   - **High risk:** Major update with breaking changes that affect our usage, or dependency with deep integration (ORM, framework, build tool).

## Phase 3: Update Incrementally

One dependency at a time. Verify after each.

1. **Update the dependency:**
   - For a specific package: `npm install package@version` / `pip install package==version`
   - For lockfile refresh: `npm install` / `pip install -r requirements.txt`
   - Commit the lockfile change separately from any code changes the update requires.

2. **Run the full test suite.** If tests fail:
   - Read the error — does it match a documented breaking change from Phase 2?
   - If yes: apply the migration (API rename, config change, etc.) and re-run tests.
   - If no: investigate before proceeding. An undocumented breaking change is a red flag — consider pinning or waiting.

3. **Run the build.** Type errors, import resolution failures, and build tool incompatibilities often surface here, not in tests.

4. **Smoke test at runtime** if the dependency affects runtime behavior (not just types/build). Start the app, hit the affected codepath, verify it works.

5. **Stage the changes.** When the user asks for a commit, use a message that names the package and version: `chore(deps): upgrade lodash 4.17.20 → 4.17.21 (CVE-2021-23337)`. Do not auto-commit unless explicitly asked.

6. **Repeat** for the next dependency.

## Phase 4: Verification

After all planned updates are applied:

1. **Full test suite green** — no skipped, no flaky.
2. **Build succeeds** — no type errors, no unresolved imports.
3. **Lockfile committed** — the lockfile reflects all updates and nothing else.
4. **No unrelated changes** — dependency updates should not include code changes that aren't required by the update. Refactoring "while I'm here" belongs in a separate commit.

## Special Case: Security Vulnerabilities

When a CVE or security advisory requires urgent action:

1. **Assess exploitability:** Does the vulnerability affect how the dependency is used in this project? A ReDoS in a regex function you never call is low urgency regardless of CVSS score.
2. **Check for patch availability:** Is there a patched version? If not, is there a workaround?
3. **If patch exists:** Follow the standard update flow (Phase 2 → 3 → 4).
4. **If no patch:** Document in `known-issues.md` with the CVE, affected dependency, workaround (if any), and date to re-check.

## Lockfile Merge Conflicts

Lockfile conflicts are common when dependency updates happen on parallel branches. Never hand-edit a lockfile to resolve conflicts — the resolution process is:

1. Accept either side of the conflict (typically the target branch's version).
2. Re-run the install command (`npm install`, `yarn install`, `pip install -r requirements.txt`) to regenerate the lockfile with the correct resolution.
3. Verify the lockfile reflects all intended dependency versions.

## Version Pinning Strategy

- **Production dependencies:** Use exact versions or lockfiles to ensure reproducible builds. Ranges (`^`, `~`) are acceptable when the lockfile is committed.
- **Dev dependencies:** Ranges are fine — breakage is caught in CI, not production.
- **Monorepos:** If dependencies are shared across packages, coordinate updates to avoid version skew. Update the shared dependency in all packages in one commit to keep them in sync.

## Rules

- Never batch multiple major version upgrades into one commit. If something breaks, you need to know which upgrade caused it.
- Never remove a lockfile to "start fresh" — lockfile deletion changes every transitive dependency at once, making any breakage nearly impossible to diagnose.
- Don't upgrade dev dependencies and production dependencies in the same commit unless they're tightly coupled (e.g., `typescript` + `@types/*`).
- If an update requires code changes, commit the version bump and the code changes together — they're atomic. But don't mix two different dependency updates in one commit.

## Related Skills

- `systematic-debugging` — when an update causes unexpected failures
- `test-driven-development` — when the update requires new tests for changed behavior
- `error-recovery` — to document recurring dependency issues in `known-issues.md`
