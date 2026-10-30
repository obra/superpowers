# Hermes Version-Bump Wiring Design

**Date:** 2026-08-05
**Revised:** 2026-08-06
**Status:** Approved

## Goal

Keep `.hermes-plugin/plugin.yaml` in lockstep with the repository version by
registering it in `.version-bump.json` and teaching `scripts/bump-version.sh`
to process YAML without implementing a YAML parser in Bash.

## Design

- Add `{ "path": ".hermes-plugin/plugin.yaml", "field": "version" }` to
  `.version-bump.json`.
- Route `.json` through the existing `jq` helpers and `.yaml` through Mike
  Farah `yq` v4. The YAML key and value are passed as data, not interpolated
  into the expression.
- Support only a present top-level YAML string field. Nested fields and `.yml`
  are out of scope.
- Route `--check`, `--audit`, and version updates through the same small
  read/write dispatcher.
- Before a version bump writes any manifest, run one read-only preflight that
  validates the required tools and reads every present declared manifest
  through the dispatcher. This prevents a deterministic YAML failure from
  occurring after earlier JSON files have already been updated. Missing-file
  behavior remains unchanged, and `--help` still works without `jq` or `yq`.

The preflight is the only reliability addition. It does not make the script
transactional or redesign its existing audit and error-status behavior.

## Tests

Three focused behavioral tests run the real script against an isolated
temporary fixture and prove:

- aligned JSON and YAML pass `--check` and `--audit`, and a bump updates both
  formats;
- an actual bump with JSON declared first and a later YAML manifest whose
  top-level `version` is not a string exits nonzero and leaves every manifest
  byte-for-byte unchanged; and
- the real `.version-bump.json` registers the Hermes manifest.

Verification also runs shell lint and `scripts/bump-version.sh --check` against
the repository.

## Non-Goals

- No hand-written YAML parser.
- No `.yml` or nested-YAML support.
- No Hermes runtime changes.
- No rollback framework, general config-schema layer, audit/status refactor, or
  exhaustive failure matrix.
- No change to the separate version-validation and JSON-expression issue found
  during review.
