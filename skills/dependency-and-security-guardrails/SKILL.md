---
name: dependency-and-security-guardrails
description: Use when adding or upgrading a dependency, editing lockfiles, handling secrets / API keys / .env files, or when a supply-chain breach or malicious-package advisory is trending — before the install, commit, or paste happens.
---

# Dependency and Security Guardrails

## Overview

The agent vets what enters the codebase and never leaks secrets. Your human partner owns account-level security (2FA, password manager) — remind, don't attempt.

**Core principle:** A new dependency and a leaked secret are both one-way doors. Check before, not after.

## When to Use

- Before any package install or lockfile change (`npm`/`pnpm`/`yarn`/`pip`/`uv`/`cargo`/`go get` ...)
- Before committing files that could contain secrets
- When a supply-chain breach or malicious package version is reported

**Not for:** reading code, or edits that touch no dependencies and no secrets.

## Dependency Gate

Before adding or upgrading a dependency:

1. Check **age, adoption, and provenance** — publish date, download counts, source repo, maintainers.
2. **STOP and flag to your human partner** (get explicit approval before installing) if the package is:
   - less than 14 days old (tunable default),
   - near-zero usage or a single unknown maintainer,
   - typo-squat-shaped (name is a near-miss of a popular package),
   - pulling in surprising transitive dependencies.
3. Don't add a dependency for something you can write inline in a few lines (YAGNI).

Report what you found — don't just install and move on.

## Secrets Hygiene

- Never echo, log, paste, or commit secret **values**. Reference env var **names** instead.
- Before committing: scan the diff for keys/tokens, and confirm `.env` (and similar) are gitignored.
- If you discover a secret already committed, stop and tell your human partner — rotation is their call.

## Breach-Exposure Check

When a supply-chain breach or malicious version is reported:

1. Identify the package name and affected version range.
2. Grep lockfiles for it: `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `requirements.txt`, `uv.lock`, `Cargo.lock`, `go.sum`.
3. Report matches (file + version) and the remediation (pin, upgrade, remove). Don't auto-upgrade across majors without approval.

## Quick Reference

| Trigger | Do | Don't |
|---|---|---|
| Adding a dependency | Check age/adoption/provenance; flag if risky | Install silently to save time |
| New tiny dependency | Write it inline if trivial (YAGNI) | Pull a package for 3 lines |
| Handling a secret | Reference the env var name | Echo/log/commit the value |
| Breach reported | Grep lockfiles, report exposure | Assume "probably not affected" |

## Red Flags — STOP

These thoughts mean you're rationalizing past the gate:

| Rationalization | Reality |
|---|---|
| "This package is probably fine" | You didn't check age, adoption, or provenance. |
| "I'll just install it to save time" | The check takes seconds; a supply-chain compromise costs days. |
| "The secret is only for testing" | Test secrets leak too. Reference the env var name. |
| "I'll clean up the committed .env later" | A committed secret is already exposed. Rotation is your partner's call — now. |
| "It's one tiny package, not worth flagging" | Tiny packages are the classic supply-chain vector. Flag it. |
| "I'll just bump it to the patched version" | Don't auto-upgrade/remove a flagged package without approval. |

## Your Human Partner's Job

2FA via an authenticator app (not SMS), and a password manager. These are theirs — remind when relevant, don't attempt them.
