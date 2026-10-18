---
name: writing-skills
description: Use when creating or editing a skill, or editing any agent-consumed document such as AGENTS.md, CLAUDE.md, or a dispatch prompt template
---

# Writing Skills

These rules apply to every document an agent reads: a skill, `AGENTS.md`, `CLAUDE.md`, a dispatch prompt, or a linked reference.

New behavior-shaping guidance (a new skill, rule, or gate) needs a baseline first: watch an agent fail without it, then write against that failure. The method is in [testing-skills-with-subagents.md](testing-skills-with-subagents.md). An edit that leaves behavior unchanged, such as condensing or fixing a link, only needs to be correct. If an agent would behave differently after the edit, run the baseline.

## When a skill is warranted

Create a skill when the technique is not obvious, recurs across projects, and applies broadly. Project conventions belong in the consuming project's instructions file. A mechanical constraint belongs in a script or validator.

Split by trigger, not by size. A distinct entry condition earns its own skill and description, however short the body. One description that straddles two entry conditions degrades both.

## The description

The description decides whether the skill loads at all. It sits in context on every turn.

- Say when to use the skill, starting "Use when".
- Leave the workflow out. An agent follows a workflow summary and skips the body; one such description produced one review where the body required two.
- Put the trigger first, in the symptoms and error strings an agent would search for: "flaky", "ENOTEMPTY", "Hook timed out".
- Give each trigger one phrasing. Two synonyms for one case are that case written twice.
- Frontmatter is `name` and `description` only, under 1,024 characters.

## Structure

- `SKILL.md` holds what every branch of the task needs. Material that only some branches reach goes in its own file, behind a link that says when to read it.
- Keep one concept's rule, reason, and caveats under one heading.
- Skills call their scripts as `bash scripts/<name>`, relative to the skill directory.
- Use relative markdown links. An `@` link force-loads the file before it is needed.
- End every step on a checkable completion condition. "Every modified model accounted for" beats "understanding reached".
- Draw a flowchart only for a non-obvious decision or loop. Follow `graphviz-conventions.dot`; render with `./render-graphs.js <skill-directory>`.

## Prose

- Write normal imperative sentences. Give the reason in one clause where the rule is not obvious.
- Put one idea in each sentence. State each rule once, in one place.
- State the target behavior. Use a prohibition only where a positive instruction cannot carry it.
- Use plain terms, not metaphor. Define a new term where it first appears.
- Leave out all-caps emphasis, "think carefully", and instructions to re-check finished work.
- Add one positive example where a pattern is hard to describe.
- Suggest a subagent only for large, independent work, never to double-check the agent's own. The roles that delivery, quick-task, and review require are not discretionary.
- Delete lines that no longer bear on the document. Settle whether a line is a no-op by running the document with and without it.
- Leave out what the environment already says (`package.json` scripts, config files, `--help`) unless the task needs the exact value inline.
- Keep exact commands, paths, and quoted user-facing messages verbatim.

## Match the form to the failure

| Baseline failure | Form |
|---|---|
| Skips a known rule under pressure | One sentence with its reason; escalate only after it measurably fails |
| Output has the wrong shape | A recipe: what the output is, its parts in order |
| Omits an element | A required slot in the template |
| Behavior depends on a condition | A conditional on an observable predicate |

In dispatch-prompt tests, "don't X" produced more unwanted content than a recipe. A nuance clause such as "unless it matters" reopens the negotiation, so write a real exception as a conditional. An exemption clause does not scope a rule; restructure so the rule cannot reach the exempt part.

## Gates

A `<HARD-GATE>` or `<ENTRY-GATE>` block marks a step whose failure is expensive or irreversible. Keep it to two or three sentences: the condition, who owns the exception, and why. All-caps emphasis belongs only inside such a block.

Add a rationalization table only where a brief rule measurably failed under pressure. Each row quotes a baseline excuse verbatim. Re-test every gate and table when the model changes.

## Handoffs

A skill names exactly one next skill and says "Do NOT invoke any other skill." Cite a skill the reader needs as `toolbelt:<name>` and say that it is required.

## Anthropic's best practices

Anthropic publishes [skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices). Toolbelt applies these eight:

1. Assume the model is capable, and add only the context it lacks.
2. Match freedom to fragility: prose for judgment calls, exact commands or a script for fragile steps.
3. Write the description in third person with concrete trigger terms.
4. Keep `SKILL.md` under 500 lines and every reference one level deep.
5. Give a reference file over 100 lines a table of contents.
6. Give a multi-step workflow a checklist and a validate, fix, repeat loop.
7. Make scripts handle their own errors and justify their constants.
8. Build evaluations before writing extensive guidance, and test with every model the skill will run on.
