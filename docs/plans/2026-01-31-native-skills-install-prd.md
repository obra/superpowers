# PRD: Superpowers Native Skills Installation (Agent-Driven, Full Library)

## Purpose and outcomes

Superpowers needs a clearer, more maintainable Codex installation experience that aligns with native skill discovery rather than a bespoke bootstrap CLI. This PRD defines what success looks like for maintainers and users without prescribing implementation details. The intended audience is Superpowers maintainers and OSS contributors who decide what to build and support.

Business outcomes prioritized are: (1) higher adoption of Superpowers in Codex, (2) lower maintenance cost by removing special-case integration paths, and (3) more reliable skill usage in real sessions. The experience should feel native: skills are discoverable using standard Agent Skills open-spec locations, and installation should not add ongoing per-session overhead. Installation and updates must remain agent-driven by default, while allowing an optional manual path.

This approach also enables a standard open-spec install path across major platforms (e.g., Claude, Codex, OpenCode, Gemini-CLI, Antigravity), so Superpowers can follow a single, interoperable packaging/discovery model rather than per-platform adapters.

Success is defined by operational outcomes: a single agent-run install/update completes without manual intervention; a restart surfaces skills natively; and updates/uninstall leave no stale Superpowers artifacts. Additional non-functional priorities include minimizing session startup overhead, reducing install friction, and ensuring deterministic update behavior.

## Scope and non-goals

Scope:
- Define business goals and requirements for a native, agent-driven install/update experience.
- User-scope installation only (repo-scope installs are deferred).
- Full-library installation is required (partial installs are invalid because skills reference each other).
- Agent-driven installation is a must-have; an optional manual path is allowed.
- Migration compatibility from the current bootstrap-based flow is required.
- Deprecation of the bootstrap path is expected, with a transition period.
- Persistent gating is required via an always-on rule in `AGENTS.md`. The `using-superpowers` gatekeeper should be treated as a rule (always in context) rather than a dynamically loaded skill.

Non-goals for this phase:
- Repo-scope or team-shared installs.
- Partial or selective skill installs.
- Renaming/prefixing or rewriting skills.
- Tool-mapping rewrites within skill bodies.
- Implementation mechanics (manifest format, script layout, etc.)

Platform intent: cross-platform support (macOS, Linux, Windows). A PowerShell-native path may be a documented TODO; any gaps must be explicit rather than silent.

## Requirements and constraints

Core requirements:
- Agent-driven install/update is the default path; optional manual path allowed.
- Full-library install is required; selective installs are not supported.
- Skills must be discoverable from standard open-spec locations to ensure cross-platform consistency.
- Skill identity must be consistent: directory name and `name` in `SKILL.md` must match; mismatches are skipped and reported.
- Validation is required: only valid skills with required metadata are installed; invalid ones are skipped with actionable reporting.

Safety requirements:
- User-owned content must never be overridden.
- If a collision exists at the target location:
  - Non-symlink content requires explicit approval before replacement.
  - A symlink not clearly owned by Superpowers requires explicit approval before replacement.
  - A symlink owned by Superpowers may be replaced during reconciliation.
- Updates and uninstall must be safe and deterministic: re-running install reconciles state; uninstall removes only Superpowers-owned skills and the gating rule.
- Stale Superpowers artifacts must be cleaned up safely; the mechanism is not prescribed.

Gating requirements:
- Persistent, always-on rules (via `AGENTS.md`) are required.
- `using-superpowers` should be treated as a rule rather than a dynamic skill, since it must always be in context.

Migration and deprecation:
- The native flow must detect and remove legacy bootstrap artifacts safely.
- The bootstrap path should be deprecated with a defined sunset period (see Approach Options).

## Approach options

Option A — Native-only, fast deprecation
- Make the native open-spec install path the only supported flow as soon as migration exists.
- Pros: lowest maintenance, clearest story, strongest alignment with the open spec.
- Cons: higher migration risk, less fallback for legacy users.

Option B — Hybrid with explicit sunset (recommended)
- Native install is the primary path; the bootstrap CLI remains supported as a fallback for a defined period.
- Pros: safer migration, preserves a fallback, reduces support friction during transition.
- Cons: higher maintenance temporarily, split documentation risk.

Option C — Cross-platform standardization first
- Frame the PRD around the open-spec install path across all platforms; Codex details in an appendix.
- Pros: maximizes interoperability and reduces platform divergence.
- Cons: may delay Codex-specific improvements.

Decision: Option B.

## Risks and mitigations

1) Legacy cleanup conflicts
- Risk: native flow fails to detect/remove legacy artifacts, leading to duplicate gating or stale paths.
- Mitigation: require migration to detect legacy installs, remove legacy artifacts safely, and report changes explicitly.

2) Collision safety
- Risk: installing into standard locations collides with user skills.
- Mitigation: never override user-owned content; require explicit approval for non-owned collisions; report actionable remediation steps.

3) Stale artifacts and partial uninstalls
- Risk: broken links or stale skills accumulate over time.
- Mitigation: require safe uninstall + safe stale cleanup behavior with deterministic results and a clear report.

4) Platform variability
- Risk: Windows/PowerShell limitations block consistent outcomes.
- Mitigation: document limitations explicitly; ensure correctness where supported; track PowerShell-native path as TODO.

5) Always-on gating semantics
- Risk: rule-based gating semantics differ across platforms.
- Mitigation: specify rule intent clearly and document platform-specific limitations.

6) Maintainer burden during transition
- Risk: supporting legacy and native flows increases cost.
- Mitigation: publish a deprecation timeline; keep behavior requirements aligned to minimize divergence.

## Success criteria and metrics

- One-run install/update completes without manual edits; no unresolved actions remain.
- Native discovery works after restart via standard skill locations.
- Safe uninstall/cleanup removes all Superpowers-owned skills and gating rules with no stale artifacts.
- Lower per-session overhead (no bootstrap on every session; only always-on rules remain).
- Lower install friction compared to the legacy flow.
- Reliable updates: re-running install is a no-op when reconciled; deterministic corrections when out of date.

