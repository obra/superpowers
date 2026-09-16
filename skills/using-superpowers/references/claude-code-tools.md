# Claude Code Tool Notes

Claude Code is the reference harness: skills speak its vocabulary
(`Agent` for a subagent dispatch, todos, `Skill`). These notes cover the
two places Claude Code can run a plan cheaper than the skills' default
shape. Both are opt-in by your human partner; neither changes what the
skills require.

## Cheaper orchestration for subagent-driven development

The controller session is the most expensive seat in a
superpowers:subagent-driven-development run: it reads every dispatch
result and every report, and it usually runs on the session's most
capable model. Claude Code supports nested subagents (three layers below
the main conversation by default; `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`
adjusts it), so the whole loop can run one layer down.

When your human partner asks for it — or has said the session model is
too expensive to spend on coordination — dispatch ONE orchestrator
subagent on a mid-tier model with the plan path and the instruction to
use superpowers:subagent-driven-development end to end. The orchestrator
dispatches its own implementers and reviewers per that skill's Model
Selection; the workspace and ledger live on disk, so nothing is lost to
the extra layer. Its final message must carry the "Rulings I made" list
verbatim — that list is how the decisions reach your human partner, and
you relay it, not summarize it.

Do this only for a whole plan. Nesting a single task's dispatch buys
nothing and adds a seat.

## Workflows

Claude Code's Workflow tool runs a multi-agent script (sequential and
parallel agent stages, each with its own model) whose orchestration is
paid for by the script, not by a model reading every result. It is
opt-in: your human partner types `ultracode` in a prompt, runs
`/effort ultracode` for the session, or turns it on in `/config`. A skill
cannot opt in on their behalf, and a workflow never starts because a
skill would benefit from one.

When they have opted in and a plan is ready, the
superpowers:subagent-driven-development task loop maps onto a workflow:
one stage per task in plan order, each stage an implementer agent
followed by a task-reviewer agent (the skill's prompt templates, with
brief, report, and review-package paths as the script computes them),
with the fix rounds as a bounded loop inside the stage and the cap's
residual findings returned as data rather than adjudicated in-script.
Adjudication, the final whole-branch review, and the rulings list stay
with you after the workflow returns — those are judgment, not
orchestration. Load the `workflow-authoring` skill before writing the
script.

This mapping has not been run at scale. Treat it as the shape to try,
not a tested recipe, and report what it cost against the skill's default
shape.
