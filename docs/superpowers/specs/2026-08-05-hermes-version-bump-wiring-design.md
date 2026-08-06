# Hermes Version-Bump Wiring Design

**Date:** 2026-08-05
**Status:** Draft for Drew review

## Goal

Keep `.hermes-plugin/plugin.yaml` in lockstep with the repository version by
registering it in `.version-bump.json` and teaching `scripts/bump-version.sh`
to process YAML without implementing a YAML parser in Bash.

## Design

- Add `{ "path": ".hermes-plugin/plugin.yaml", "field": "version" }` to
  `.version-bump.json`.
- Dispatch manifest reads and writes by extension.
- Keep the existing `jq` path for JSON manifests.
- Use Mike Farah `yq` v4 for `.yaml` and `.yml` manifests.
- Limit YAML entries to one top-level field such as `version`; dotted YAML
  paths are out of scope.
- Route `--check`, `--audit`, and version updates through the same dispatcher.

Non-help commands fail with an actionable message when a required tool is
missing, `yq` is not the Mike Farah v4 implementation, a YAML field is nested
or missing, or a configured extension is unsupported. Existing JSON behavior
and unrelated release-script semantics remain unchanged.

## Tests

Behavioral tests run the real script against an isolated temporary fixture and
prove:

- aligned JSON and YAML manifests pass `--check`;
- YAML drift fails `--check`;
- a version bump updates both formats;
- nested YAML fields and an incompatible `yq` fail clearly; and
- the real Hermes manifest is registered in `.version-bump.json`.

Verification also runs the existing Hermes tests, shell lint, and
`scripts/bump-version.sh --check` against the repository.

## Non-Goals

- No hand-written YAML parser.
- No general nested-YAML support.
- No Hermes runtime changes.
- No refactor of unrelated audit, missing-file, or version-validation behavior.
