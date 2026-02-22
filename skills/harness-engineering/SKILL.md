---
name: harness-engineering
description: Use when adding or upgrading verification harnesses so local/CI checks are deterministic, evidence-first, and easy for agents to debug.
---

# Harness Engineering

## Overview

Harnesses are control systems for engineering quality.

A good harness gives one clear signal (`pass` or `fail`) with artifacts that explain why.
A bad harness produces noisy failures, hidden coupling, or unverifiable claims.

**Core principle:** enforce invariants mechanically, not through reminders.

**First integration slice in Superpowers:** a `harness-readiness-check` preflight before implementation.

## When to Use

Use this skill when any of these are true:
- You are adding a smoke/e2e/verification command.
- You need one canonical CI gate command.
- Test outcomes depend on time, environment, or ordering.
- Agents can change code faster than humans can manually QA.
- Regressions are recurring and root cause is unclear from logs.

Do not use this skill for domain-level product assertions. This skill is about harness mechanics.

## Harness Contract

Every harness should define these contracts explicitly:

1. **Input determinism**
- Fixed fixtures or reproducible generators.
- Stable env vars (timezone, locale, seed, date window where needed).
- No hidden network or machine-specific dependency unless intentionally mocked.

2. **Output determinism**
- Stable artifact path.
- Stable JSON shape.
- Stable failure taxonomy.

3. **Gate determinism**
- One canonical command for CI.
- Same command runnable locally.
- Non-zero exit on contract violation.

4. **Ownership and scope**
- What this harness guarantees.
- What this harness explicitly does not guarantee.

## Failure Taxonomy

Use these failure classes consistently:
- `CONFIG_ERROR` - Missing/invalid harness configuration or ambiguous contract.
- `ENV_ERROR` - Missing runtime/tool/dependency required for the harness.
- `CHECK_FAIL` - Expected contract assertion failed.
- `NON_DETERMINISM` - Output drift caused by unstable inputs/process.
- `INTERNAL_ERROR` - Harness execution crashed unexpectedly.

## Readiness Preflight (Primary Mode)

Run this checklist before writing implementation code:

1. **Canonical gate exists**
- One command is declared for local + CI (for example `task ci`).
- If there are multiple competing commands, stop and consolidate first.

2. **Deterministic inputs exist**
- Fixture reset path is known.
- Time/locale/seed assumptions are explicit.

3. **Deterministic output contract exists**
- Artifact path is stable.
- Artifact JSON shape is defined.
- Failure taxonomy mapping is documented.

4. **Check vs update boundary exists**
- Mutating regeneration command is separate from read-only check command.
- CI uses the read-only check command.

5. **Failure output is actionable**
- Non-zero exits on failure.
- Output includes concise reason and where to inspect evidence.

If any item fails, do not proceed to implementation until fixed.

## Workflow

1. **Run readiness preflight**
- Execute the preflight checklist above.
- Block implementation when preflight contracts are missing.

2. **Define canonical gate**
- Choose one command (for example: `task ci` or a dedicated smoke script).
- Ensure local and CI behavior are equivalent.

3. **Stabilize inputs first**
- Remove time-based randomness unless seeded/fixed.
- Normalize env assumptions (timezone/locale/paths).

4. **Emit machine-readable artifacts**
- Write JSON artifact to a predictable location.
- Include enough fields to debug quickly (status, check name, duration, error reason).

5. **Validate artifact shape**
- Add schema checks for required fields and enums.
- Fail fast when shape is invalid.

6. **Separate update vs check**
- Update commands may mutate generated artifacts.
- Check commands must be read-only and fail on drift.

7. **Improve failure ergonomics**
- Print concise failure reason.
- Keep logs short but actionable.

## Legibility Rules

Optimize for agent legibility and human verification:
- Keep harness docs close to code.
- Prefer small, composable scripts over hidden logic.
- Encode expectations in lint/tests, not tribal knowledge.
- Make remediation obvious in failure messages.

If a rule matters repeatedly, promote it into code or checks.

## Anti-Entropy Loop

Harnesses drift unless maintained.

Run a periodic cleanup loop:
- Detect stale docs vs real behavior.
- Remove obsolete checks.
- Tighten weak assertions.
- Refactor duplicated harness logic into shared utilities.

Small, frequent cleanup is cheaper than periodic large rewrites.

## Red Flags

Stop and redesign if you see:
- Multiple competing CI gate commands.
- Harness passes but no artifact evidence exists.
- Flakes accepted as "normal" without isolation work.
- "Should pass" claims without fresh command output.
- Test logic depending on current machine/user path by accident.

## Integration

Pair with:
- `verification-before-completion` to enforce evidence-before-claims.
- `test-driven-development` for behavior-level confidence.
- `writing-plans` when introducing multi-step harness architecture changes.

## Boundaries

This skill does not define product business logic correctness.
It defines reliability mechanics for verification systems.
