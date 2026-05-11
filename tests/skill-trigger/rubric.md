# Skill Trigger Rubric

Use this rubric to score each prompt result consistently across Claude Code and Codex.

## Primary Labels

Assign exactly one primary outcome:

- `exact`: the host triggered the expected skill
- `acceptable`: the host did not trigger the expected skill, but triggered a pre-approved fallback skill
- `miss`: the host should have triggered a skill but did not trigger any qualifying skill
- `wrong`: the host triggered a clearly incorrect skill
- `no-trigger-expected`: no skill should have been triggered for this prompt

## Confidence Labels

Assign one confidence label to the evaluation:

- `high`: the result is clearly correct based on the prompt and skill boundaries
- `medium`: there is some overlap, but one label is still the best fit
- `low`: the prompt is ambiguous or the skill boundaries need refinement

## Failure Reason Tags

If the result is not `exact`, add one or more reason tags:

- `desc_too_broad`
- `desc_too_narrow`
- `host_prompt_bias`
- `tool_name_bias`
- `overlapping_skills`
- `process_skill_shadowing`
- `language_mismatch`
- `missing_trigger_phrase`
- `insufficient_context`

## How To Judge

### `exact`

Use when the triggered skill matches the prompt's intended workflow boundary.

Examples:

- "I have an idea but the design is still fuzzy" -> `brainstorming`
- "The approach is approved; break it into implementation steps" -> `writing-plans`
- "Investigate the root cause first; do not patch yet" -> `systematic-debugging`

### `acceptable`

Use sparingly. This is only for cases where the prompt legitimately overlaps and the fallback still moves work in the right direction.

Examples:

- Expected `subagent-driven-development`, actual `executing-plans`, when the prompt emphasizes current-session execution but still references checkpointed plan execution
- Expected `writing-plans`, actual `brainstorming`, when the prompt is split between clarifying scope and asking for next steps

### `miss`

Use when the prompt should route to a known skill but the host stays generic or answers directly without invoking the relevant skill behavior.

Examples:

- The host gives high-level advice for a debugging request without entering a debugging workflow
- The host discusses code quality casually instead of invoking review structure for a review request

### `wrong`

Use when the triggered skill is materially mismatched to the prompt.

Examples:

- A code-review request triggers `brainstorming`
- A document lookup request triggers `test-driven-development`

### `no-trigger-expected`

Use when the prompt is too small, too general, or intentionally outside the skill set.

Examples:

- A simple greeting
- A one-line factual question unrelated to project workflows

## Host Divergence

Mark a prompt as host-divergent when Claude Code and Codex receive the same prompt but land on different primary outcomes or different triggered skills.

Track both:

- outcome divergence: `exact` vs `wrong`, `miss` vs `acceptable`, etc.
- routing divergence: both are acceptable, but different skills were chosen

## Reviewer Notes

For every non-`exact` result, include a short note covering:

- what the host did
- why it was scored that way
- what layer probably needs adjustment next

Keep notes factual and short so they can be aggregated later.

## Which Layer To Change Next

Use the scored outcomes to decide where to tune:

- both hosts `miss` on the same prompt -> check shared `SKILL.md` descriptions first
- both hosts trigger the same wrong skill -> check for broad or overlapping shared descriptions first
- Claude alone misses, over-triggers, or picks the wrong adjacent skill -> check Claude startup guidance first
- Codex alone misses, over-triggers, or picks the wrong adjacent skill -> check Codex startup guidance first
- both hosts score `acceptable` but choose different fallback skills -> inspect boundary wording in both the shared descriptions and the host startup notes before changing either

When in doubt, prefer changing the narrowest layer that explains the observed failure.
