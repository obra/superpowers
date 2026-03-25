# Plan Contract Fixture Design

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Fixture spec for plan-contract helper regression coverage.
It also anchors schema-backed packet and evidence compatibility checks.

## Requirement Index

- [REQ-001][behavior] Execution-bound specs must include a parseable `Requirement Index`.
- [REQ-002][behavior] Implementation plans must include a parseable `Requirement Coverage Matrix` mapping every indexed requirement to one or more tasks.
- [REQ-003][behavior] FeatureForge must provide a `featureforge plan contract` that lints traceability and builds canonical task packets.
- [DEC-001][decision] Markdown artifacts remain authoritative and helper output must preserve exact approved statements rather than paraphrase them.
- [NONGOAL-001][non-goal] Do not introduce hidden workflow authority outside repo-visible markdown artifacts.
- [VERIFY-001][verification] Regression coverage must cover missing indexes, missing coverage, unknown IDs, unresolved open questions, malformed task structure, malformed `Files:` blocks, path traversal rejection, and stale packet handling.
