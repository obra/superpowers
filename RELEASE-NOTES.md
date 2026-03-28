# FeatureForge Release Notes

## v1.2.0 - 2026-03-28

Execution-runtime hardening release focused on authoritative strategy checkpoints, review-cycle control, and stricter finish-gate provenance contracts.

- route `plan execution recommend` and downstream workflow surfaces through runtime-owned topology/strategy contracts instead of legacy heuristic seams
- add runtime-owned strategy checkpoints (`initial_dispatch`, `review_remediation`, and cycle-break enforcement) with dispatch/reopen tracking and churn guardrails
- require authoritative strategy-checkpoint fingerprint binding in final-review receipts and dedicated reviewer artifacts
- fail closed on authoritative late-gate provenance gaps, including QA `Source Test Plan` symlink-path rejection and stricter canonical artifact checks
- remove legacy pre-harness workflow handoff compatibility paths and tighten fail-closed routing behavior
- expand workflow/runtime/final-review regression coverage for authoritative provenance routing, reviewer binding, and cycle-tracking semantics
- refresh checked-in repo runtime binaries and darwin/windows prebuilt artifacts for `1.2.0`

## v1.1.0 - 2026-03-27

Execution-harness release focused on authoritative workflow truth, durable provenance, and release-ready runtime packaging.

- honor recorded authoritative final-review and downstream finish provenance instead of newer same-branch decoys
- fail `gate-review` closed on stale or missing authoritative late-gate truth
- persist a durable authoritative dependency index on record mutations and fail closed if publishing it breaks
- emit the first production observability sink for authoritative mutations with a persisted counter
- rebuild the repo-root runtime binary and checked-in darwin/windows prebuilt artifacts for `1.1.0`

## v1.0.0 - 2026-03-24

Initial standalone FeatureForge release.

- reset the product version to `1.0.0`
- standardize the supported runtime surface on the canonical `featureforge` binary
- move active skill namespaces to `featureforge:<skill>` and the entry router to `using-featureforge`
- move runtime and install state to `~/.featureforge/`
- move the repo-local default config to `.featureforge/config.yaml`
- preserve historical project documents under `docs/archive/`
- remove wrapper and shim entrypoints from the supported product surface
