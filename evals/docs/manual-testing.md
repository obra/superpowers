# Manual Testing (Codex App)

Some scenarios cannot run automatically because drill has no harness adapter for the target — the Codex App desktop client has no CLI or tmux entry point the way `claude` and `codex` do. These scenarios are marked `manual: true` in their YAML and use a human-in-the-loop protocol.

## Protocol

Three phases. The agent never runs Codex App directly. The tester never writes a verdict by hand.

1. **Agent prepares the handoff** — reads the scenario file, renders setup + turn intents into something a human can act on, hands the package to the tester.
2. **Tester executes** — sets up the repo fixture, opens Codex App, pastes the prompt, handles any follow-ups, copies the transcript + final filesystem state back to the agent.
3. **Agent judges and records** — evaluates the transcript against `verify.criteria`, writes a verdict JSON, saves to `results/<scenario>/codex-app/YYYY-MM-DD-manual/verdict.json`.

## Phase 1: Agent prepares the handoff

Deliver as one self-contained message to the tester:

### Fixture state
Exact repo state Codex App should be launched against. Pull from `setup.notes` if present, otherwise translate `setup.helpers` + `setup.assertions` into prose. Include: which repo/directory, branch, whether to expect a worktree vs normal checkout, any required/forbidden files (e.g. `.gitignore` entries).

### Prompt to paste
Render turn 1's `intent` as a natural first-person message the tester can paste verbatim into Codex App. **Don't leak internal test language** like *"Do NOT say 'create a worktree'"* — that's instruction for the test author, not the end user. Convert it to what a real user would actually type.

Example:
> Intent: *"Ask the agent to use the worktree skill to get set up for a notifications feature. Do NOT say 'create a worktree' — just reference the skill by name."*
>
> Rendered prompt: *"hey, can you use the worktree skill to get me set up for a notifications feature?"*

### Follow-up guidance
For each additional turn, give the tester a short decision rule — not a verbatim script. E.g. *"If the agent asks a clarifying question like branch name, answer concisely. If it stops to ask whether you want a worktree at all, tell it you already asked for the skill and it should proceed."*

### What to capture
Ask the tester to paste back:
- Full agent transcript (messages, tool calls, tool outputs)
- Final filesystem state if criteria depend on it (`git worktree list`, directory tree, branch state)
- Any observations they want on the record

## Phase 2: Tester executes

1. Set up the repo fixture per the instructions
2. Open Codex App in that repo
3. Paste the prompt
4. Follow up per the guidance
5. Copy the transcript + filesystem state back to the agent

## Phase 3: Agent judges and records

For each criterion in `verify.criteria`, write one entry:

```json
{
  "criterion": "<verbatim from scenario>",
  "passed": true | false,
  "evidence": "<quoted snippet from transcript>",
  "rationale": "<only if passed is inconclusive or needs context>"
}
```

**Rules:**
- Quote the transcript directly in `evidence`. No paraphrasing.
- If a criterion is genuinely inconclusive from the transcript, mark `passed: false` with `rationale` explaining what was missing. Don't guess.
- Don't grade on intent you can't see. The agent's internal thoughts aren't visible — only messages, tool calls, and results.

### Verdict file

Save to `results/<scenario>/codex-app/YYYY-MM-DD-manual/verdict.json`:

```json
{
  "scenario": "<scenario-name>",
  "backend": "codex-app",
  "manual": true,
  "user_posture": "<spec-aware|naive|...>",
  "passed": <true iff every criterion.passed is true>,
  "criteria": [ ... ],
  "notes": "<optional: cross-criterion observations>"
}
```

Matches the format of the existing `results/worktree-codex-app-detached-head/codex-app/2026-04-09-manual/verdict.json`.

## When to invoke

- A scenario's YAML has `manual: true`
- The tester explicitly asks for a manual Codex App run of any scenario
- An automated test result is inconclusive and we want a human-verified cross-check

Do NOT use this procedure for scenarios drill can run itself (`claude`, `codex`, `gemini` backends) — use `drill run` instead.

## Pitfalls

- **Don't skip the fixture step.** Codex App's default environment (detached HEAD under `$CODEX_HOME/worktrees/`) is load-bearing for worktree scenarios. The same prompt gives different results in a normal checkout.
- **Don't render prompts literally.** Scenario intents are written for test authors; they often contain "Do NOT mention X" style instructions. Translate before handing to the tester.
- **Don't grade on missing evidence.** If the transcript doesn't show the agent doing something the criterion asks about, that's a fail, not a pass-by-default.
