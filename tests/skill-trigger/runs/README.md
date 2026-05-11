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

## What Each Run Should Capture

Every run file should include:

- the skill-set commit or revision under test
- the Claude startup profile version
- the Codex startup profile version
- the model used for each host
- one scored entry per corpus prompt
- summary totals for each host
- divergence totals between hosts

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
