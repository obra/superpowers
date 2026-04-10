# Project Standards Authoring Cursor RED Report

## Scenario

- Harness: Cursor session (not `claude -p` CLI).
- Prompt intent: request standards generation in one pass, explicitly discouraging classification choice and evidence retrieval.
- Goal: capture expected baseline anti-pattern behavior without enforced skill process.

## Observations

- No 2-3 classification proposal gate appeared.
- No explicit human-selection wait state appeared.
- Output focused on generic, one-pass standards documents with broad defaults.

## Evidence

- Raw output: `docs/testing-reports/project-standards-authoring-cursor-red/assistant-output.md`
- Signal checks:
  - Missing: `standards-context-retrieval`
  - Missing: `Constraints Summary`
  - Present: direct "generate all standards now" behavior

## Conclusion

- RED baseline in Cursor reproduces the target risk: skipping stage gates and producing non-evidence-grounded standards.
- This validates that the new skill guardrails are necessary.
