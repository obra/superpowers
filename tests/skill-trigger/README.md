# Skill Trigger Evaluation

This directory defines the baseline assets for evaluating skill-trigger behavior across Claude Code and Codex.

## Purpose

Use this test harness to answer the same questions for both hosts:

- Did the host trigger a skill for a given user message?
- Did it trigger the expected skill?
- Did it miss, over-trigger, or choose the wrong skill?
- Did the result differ between Claude Code and Codex?

## Scope

The first evaluation pass focuses on core workflow and routing skills whose boundaries are easy to confuse:

- `brainstorming`
- `writing-plans`
- `executing-plans`
- `subagent-driven-development`
- `systematic-debugging`
- `test-driven-development`
- `requesting-code-review`
- `document-management`

## Files

- `rubric.md`: scoring rules and labeling guidance
- `claude/startup-v1.md`: baseline Claude Code startup profile for trigger evaluation
- `codex/startup-v1.md`: baseline Codex startup profile for trigger evaluation
- `runs/baseline-template.yaml`: blank run record for one evaluation pass
- `runs/README.md`: how to name and store run results

## Evaluation Workflow

1. Choose one startup profile per host.
2. Run the same prompt corpus against Claude Code and Codex.
3. Record one result row per prompt in a copy of `runs/baseline-template.yaml`.
4. Score each result with the rubric in `rubric.md`.
5. Summarize exact, acceptable, miss, wrong, and host-divergence rates.
6. Change only one layer before the next run:
   - shared `SKILL.md` descriptions
   - Claude-specific startup guidance
   - Codex-specific startup guidance

## Guardrails

- Keep the prompt corpus identical across hosts for comparison.
- Record startup profile version, host, model, and skill commit for every run.
- Do not change multiple layers between adjacent runs if the goal is attribution.
- Treat host-specific startup guidance as a controlled variable, not hidden context.

## Notes

This directory is intentionally documentation-first. It provides the scoring and run structure before adding automation scripts or a finalized corpus.
