# Run Records

Store one file per evaluation pass in this directory.

## Naming

Use a date plus a short run label:

- `2026-05-11-baseline.yaml`
- `2026-05-12-claude-startup-v2.yaml`
- `2026-05-13-description-tuning-round-1.yaml`

## What To Copy

Start from `baseline-template.yaml` for every new run:

1. copy the template
2. rename it for the run
3. fill in commit, model, corpus version, and results

## Baseline File Meaning

- `2026-05-11-baseline-v1.yaml` is a dry-run baseline record, not a completed full-corpus benchmark.
- It may contain a mix of observed samples and untouched placeholders.
- When only part of the corpus is observed, state that explicitly in the `purpose` field and keep the remaining rows clearly unfilled.

## What Each Run Should Capture

Every run file should include:

- the skill-set commit or revision under test
- the Claude startup profile version
- the Codex startup profile version
- the model used for each host
- one scored entry per corpus prompt
- summary totals for each host
- divergence totals between hosts

## Startup Profile Integrity

- Recording `startup_profile` in a run YAML is not enough by itself.
- The runner used for that pass must actually inject the profile into the host invocation.
- If startup guidance was tested through an ad hoc script or a corrected runner, say that explicitly in the `purpose` field or per-case notes.

## Change Discipline

For clean attribution, change only one layer between neighboring runs:

- shared skill descriptions
- Claude-specific startup guidance
- Codex-specific startup guidance
- corpus revisions

Document the intended variable in the run file's `purpose` field or reviewer notes.

## Reviewer Guidance

- keep notes short and factual
- use the tags from `../rubric.md`
- record uncertainty with `confidence: low` instead of hiding ambiguity
- do not silently overwrite an old run; create a new file for each pass
