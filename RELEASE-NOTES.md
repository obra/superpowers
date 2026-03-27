# FeatureForge Release Notes

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
