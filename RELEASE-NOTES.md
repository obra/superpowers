# FeatureForge Release Notes

## v1.0.0 - 2026-03-24

Initial standalone FeatureForge release.

- reset the product version to `1.0.0`
- standardize the supported runtime surface on the canonical `featureforge` binary
- move active skill namespaces to `featureforge:<skill>` and the entry router to `using-featureforge`
- move runtime and install state to `~/.featureforge/`
- move the repo-local default config to `.featureforge/config.yaml`
- preserve historical project documents under `docs/archive/`
- remove wrapper and shim entrypoints from the supported product surface
