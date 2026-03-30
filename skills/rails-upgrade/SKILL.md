---
name: rails-upgrade
description: Use when upgrading a Rails application from one version to another, assessing upgrade readiness, planning a multi-hop upgrade path, or investigating breaking changes, deprecation warnings, gem compatibility issues, or config.load_defaults transitions between any Rails versions from 5.2 through the latest release.
---

# Rails Upgrade

## Overview

This skill provides a systematic workflow for upgrading Rails applications, covering versions 5.2 through the latest release. It fetches live configuration diffs from railsdiff.org via the GitHub API, performs direct codebase detection using Grep, Glob, and Read tools, and compiles structured upgrade reports — all without requiring external skill dependencies.

**Announce at start:** "I'm using the rails-upgrade skill to guide this upgrade."

## Ruby Version Compatibility

| Rails     | Minimum Ruby | Recommended Ruby |
|-----------|-------------|-----------------|
| 5.2       | 2.2.2       | 2.5+            |
| 6.0–6.1   | 2.5.0       | 2.7+            |
| 7.0–7.1   | 2.7.0       | 3.1+            |
| 7.2       | 3.1.0       | 3.3+            |
| 8.0+      | 3.2.0       | 3.3+            |

## The Workflow

### Step 0: Version Assessment

1. Read `Gemfile` and `Gemfile.lock` to find the current Rails gem version
2. Read `config/application.rb` to find the current `config.load_defaults` value
3. Check `.ruby-version` or `Gemfile` for the Ruby version — verify against the compatibility table above
4. Confirm the target version with the user if not specified
5. If the jump spans more than one minor version, plan sequential hops (e.g., 7.0 → 8.0 requires 7.0 → 7.1 → 7.2 → 8.0)
6. Output: version assessment summary (current Rails, current Ruby, target Rails, required Ruby, upgrade path)

---

### Step 1: Test Suite Verification

```
HARD GATE: Run the test suite before ANY upgrade work.
If tests fail: STOP. Report failures. Do NOT proceed until baseline is green.
A failing baseline makes post-upgrade failures ambiguous.
```

1. Detect framework: check for `spec/` (RSpec) or `test/` (Minitest)
2. Run: `bundle exec rspec` or `bundle exec rails test`
3. Record: total tests, passing, failing, pending
4. If any failures: STOP, report them, offer to help fix
5. If all pass: record as baseline, proceed to Step 2

---

### Step 2: Configuration Diff (railsdiff.org)

Fetch the live config diff from railsdiff.org via its GitHub data source:

```
URL: https://api.github.com/repos/railsdiff/rails-new-output/compare/v{CURRENT}...v{TARGET}
```

Example: `https://api.github.com/repos/railsdiff/rails-new-output/compare/v7.2.0...v8.0.0`

Use WebFetch with this prompt: "List every file that changed between these versions. For each file: its name, status (added/modified/removed), and a 1-2 sentence summary of what changed."

Categorize results into:
- Config files changed (`config/`, `config/environments/`, `config/initializers/`)
- Infrastructure files (`Dockerfile`, `bin/`, `Gemfile` template)
- Asset pipeline changes
- Files added (new to target version)
- Files removed

**Fallback if API fetch fails:** Note it, proceed using `references/detection-patterns.md` and `references/breaking-changes.md` static data only.

**For multi-step upgrades:** Fetch the diff only for the current hop being executed.

---

### Step 3: Code-Level Detection

1. Read the relevant version section from `references/detection-patterns.md`
2. For each pattern, use the Grep tool directly: search for the pattern in the specified paths
3. Collect findings with file:line references and matching content
4. Read `references/gem-compatibility.md` — check `Gemfile.lock` for gems with known issues
5. Cross-reference with `skills/rails-guides/references/upgrading_ruby_on_rails.md` for the relevant "Upgrading from X to Y" section
6. Run searches in parallel where possible (multiple Grep calls in one message)
7. Compile findings:
   - Must fix before upgrade
   - Must fix after upgrade
   - Deprecation warnings to address
   - Gem updates needed

---

### Step 4: load_defaults Verification

```
HARD GATE: Verify config.load_defaults status before proceeding.
If new_framework_defaults_*.rb exists with uncommitted changes from a PREVIOUS upgrade: STOP.
Those must be resolved before starting a new upgrade.
```

1. Read `config/application.rb` — confirm the `config.load_defaults` value
2. Glob for `config/initializers/new_framework_defaults_*.rb`
3. If a file exists with uncommented lines from a prior upgrade: STOP, resolve first
4. Read `references/load-defaults-guide.md` for the relevant version transition
5. Generate the load_defaults transition plan: which settings can be enabled safely vs. which need code changes first

---

### Step 5: Upgrade Report

Compile all findings into a structured report BEFORE making any changes:

```markdown
## Rails Upgrade Report: {CURRENT} → {TARGET}

### Environment
- Current Rails: {version}
- Target Rails: {version}
- Ruby: {version} (compatible: yes/no)
- Test baseline: {N} tests, all passing

### Configuration Changes (from railsdiff.org)
{Categorized list from Step 2, or "Could not fetch — using static reference" if API failed}

### Code Changes Required

#### Must Fix Before Version Bump
{Findings from Step 3 with file:line references}

#### Must Fix After Version Bump (Deprecations Becoming Errors)
{Findings}

#### Deprecation Warnings to Address
{Findings}

### Gem Updates Required
| Gem | Current | Required | Notes |
|-----|---------|----------|-------|
{From Step 3 gem check}

### load_defaults Transition Plan
{From Step 4}

### Recommended Approach
- Direct upgrade (changes are minimal) OR
- Dual-boot with next_rails (changes are substantial — see references/dual-boot-guide.md)

### Estimated Effort
{Based on number and severity of findings}
```

---

### Step 6: Execute Upgrade

```
HARD GATE: Present the upgrade report to the user and get explicit approval.
Do NOT modify any files until the user approves the report.
```

Execution sequence after approval:

1. Create upgrade branch: `git checkout -b rails-{TARGET}-upgrade`
2. Update Gemfile: bump Rails version + identified gem updates
3. `bundle update rails` (fix conflicts as they arise)
4. Apply configuration changes guided by the Step 2 config diff
5. Fix must-fix-before code issues (from Step 3)
6. Run test suite — address failures
7. Run `bin/rails app:update` (review each change, do not auto-accept)
8. Update `config.load_defaults` per the transition plan from Step 4
9. Run test suite again
10. Fix remaining deprecation warnings where possible
11. Report final status with test results

---

## Multi-Step Upgrades

When jumping more than one minor version (e.g., 6.1 → 8.0):

1. Calculate all hops: 6.1 → 7.0 → 7.1 → 7.2 → 8.0
2. Execute Steps 0–6 for each hop sequentially
3. Do NOT proceed to the next hop until all tests pass on the current hop
4. After each hop: ensure `config.load_defaults` is updated before moving on
5. For planning, reference the difficulty table in `references/breaking-changes.md`

---

## When to Use Dual Boot

Use dual-boot (`next_rails` gem) when:
- The upgrade is HIGH or VERY HARD difficulty (7.2 → 8.0, 6.1 → 7.0)
- The app has >50k LOC or complex gem dependencies
- The team needs to ship features during the upgrade

Skip dual-boot when:
- Difficulty is EASY or MEDIUM (8.0 → 8.1, 7.0 → 7.1)
- The codebase is small (<10k LOC)
- Breaking changes are few and localized

See `references/dual-boot-guide.md` for setup.

---

## Reference Files

| File | Contents |
|------|----------|
| `references/breaking-changes.md` | Breaking changes by version pair (5.2+), HIGH/MEDIUM/LOW tables |
| `references/deprecation-timeline.md` | When deprecations were introduced, warned, and removed |
| `references/gem-compatibility.md` | ~50 popular gems with required versions per Rails release |
| `references/load-defaults-guide.md` | Every load_defaults setting 5.2+, risk tiers, transition guidance |
| `references/detection-patterns.md` | Grep/Glob patterns for code-level detection, organized by version pair |
| `references/dual-boot-guide.md` | next_rails dual-boot setup, NextRails.next? patterns, CI config |
| `references/troubleshooting.md` | Common upgrade errors and their solutions |
| `scripts/fetch-changelogs.sh` | Fetches component CHANGELOGs from GitHub for any version |

Also cross-references:
- `skills/rails-guides/references/upgrading_ruby_on_rails.md` — Official Rails upgrading guide (3,000+ lines)

---

## Attribution

Based on work by:
- OmbuLabs.ai / FastRuby.io (MIT) — FastRuby.io upgrade methodology, detection patterns, gem compatibility data
- Mario Alberto Chávez Cárdenas (MIT) — Breaking changes reference tables, deprecation timeline format

Both used under MIT license. Original sources:
- https://github.com/ombulabs/claude-code_rails-upgrade-skill
- https://github.com/mariochavez/rails-upgrade-skill
