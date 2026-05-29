# ADR 0001: GitHub Issues, Triage Labels, and Canonical Glossary

## Status

Accepted

## Context

The repo needs a single place to record issue-tracking conventions, a stable label vocabulary, and the canonical terms used by agents and contributors.

Without that, setup instructions end up split across chat, ad hoc notes, and inconsistent wording.

## Decision

1. Use GitHub Issues as the canonical issue tracker.
2. Use a small triage label set: `type:bug`, `type:enhancement`, `priority:high`, `status:blocked`, `area:skills`, `area:docs`, and `area:tooling`.
3. Keep canonical repo terminology in `docs/agents/domain.md` and `docs/glossary.md`.

## Consequences

- Issue routing is predictable and easy to describe to agents.
- Labels stay small enough to be remembered and audited.
- Canonical terms have one home instead of drifting through chat history.