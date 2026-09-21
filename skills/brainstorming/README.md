# Brainstorming — acceptance-driven branch

This branch contains an acceptance-driven evolution of
`obra/superpowers/skills/brainstorming`, based on upstream blob
`e3f17885f8d5f87d7a92f0469141662b476e1288`.

The fork preserves the three-path flow (Spike / Bounded / Architectural) and
human approval gates, while adding:

- Probe / Mini / Full Acceptance Contracts
- behavioral-ambiguity handling
- focused Acceptance Challenge
- regression invariants
- Acceptance -> Design traceability
- Acceptance Readiness before writing-plans
- anti-overdesign calibration

See `evals/` for the RED/GREEN contract.