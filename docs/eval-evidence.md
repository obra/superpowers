# Eval Evidence for Superpowers PRs

Superpowers changes are reviewed on evidence, not confidence. This guide
describes the evidence packet to include in pull requests so reviewers can see
what failed before, what changed after, and what limits still remain.

This complements the pull request template and `skills/writing-skills/SKILL.md`.
It does not replace skill testing, plugin tests, or harness transcripts.

## Evidence Packet

Use this structure in the PR `Evaluation` and `Rigor` sections.

1. **Initial trigger**
   - What user prompt, issue, transcript, or code path led to the change?
   - What exact failure mode did you observe?

2. **Baseline behavior**
   - Show what happens before the change.
   - For code bugs, include the failing command or regression test.
   - For skill behavior, include the RED run or transcript summary.
   - For docs-only changes, name the ambiguity or missing guidance the docs fix.

3. **Change boundary**
   - State what this PR changes and what it deliberately does not change.
   - If the linked issue has multiple concerns, name the one concern this PR
     addresses.

4. **After behavior**
   - Show the command, transcript, or check that demonstrates the new behavior.
   - Prefer exact commands and short output summaries over prose claims.

5. **Adversarial or edge evidence**
   - For behavior-shaping skill changes, run pressure scenarios as described in
     `skills/writing-skills/testing-skills-with-subagents.md`.
   - For runtime code, include edge-case regression tests when practical.
   - For docs-only changes, disclose that no behavioral eval was run unless one
     actually was.

6. **Verification commands**
   - List the commands run immediately before opening the PR.
   - Include failures honestly, especially if a failure is unrelated or caused by
     local environment limits.

7. **Limits and follow-ups**
   - State what the evidence does not prove.
   - Do not check rigor boxes that the evidence does not support.

## Evidence by Change Type

| Change type | Minimum evidence | Strong evidence |
| --- | --- | --- |
| Runtime bugfix | Failing regression or live repro, then passing regression | Negative control showing the test fails without the fix |
| Hook or installer fix | Isolated fixture plus parser/exit-code check | Same fixture across affected harness variants |
| Skill behavior change | RED baseline, GREEN run, pressure scenario | Multiple fresh sessions with transcript summaries |
| Skill docs clarification | Before ambiguity plus after static checks | Fresh-session retrieval test showing the guidance is found |
| New harness support | Required clean-session transcript from the PR template | Additional install/update/uninstall smoke checks |
| Docs-only contributor guidance | Static checks plus clear before/after documentation gap | Reviewer checklist or example PR body using the guidance |

## Templates

### Runtime Bugfix

```markdown
## Evaluation

Initial trigger: <issue or observed failure>

Baseline:
- Command: `<command>`
- Result before fix: `<failure summary>`

After:
- Command: `<command>`
- Result after fix: `<pass summary>`

Adversarial or edge coverage:
- `<edge case covered>`

Limits:
- `<what this does not cover>`
```

### Skill Behavior Change

```markdown
## Evaluation

Initial trigger: <prompt or issue>

RED baseline:
- Scenario: <pressure scenario>
- Observed failure: <verbatim or summarized transcript evidence>

GREEN:
- Scenario: <same scenario with changed skill>
- Observed behavior: <how the agent now complies>

Pressure testing:
- Pressures used: <time pressure, authority pressure, sunk cost, etc.>
- Result: <pass/fail summary>

Limits:
- <number of sessions, harnesses not tested, remaining risks>
```

### Docs-Only Guidance

```markdown
## Evaluation

Initial trigger: <review gap, repeated PR issue, or missing guidance>

Before:
- Existing docs explain <what they already cover>
- Missing piece: <what contributors still had to infer>

After:
- Added <file/section>
- Linked from <entry point>

Verification:
- `<markdown/static check command>`

Limits:
- This does not prove behavior changes in live agent sessions.
```

## Common Mistakes

**Claiming "works" without a baseline**

Reviewers need to know what failed before. A passing command after the change is
not enough when the test did not fail before the change.

**Bundling unrelated evidence**

Evidence should support the specific PR. If a command verifies a different
issue or another PR, label it as contextual, not acceptance evidence.

**Checking rigor boxes too broadly**

If you did not run adversarial pressure testing, leave that box unchecked and
explain why. Honest limits are better than overstated rigor.

**Using transcript volume instead of findings**

Do not paste huge transcripts into the PR body. Summarize the relevant moments
and include enough exact wording to support the claim. For new harness support,
follow the PR template and include the required complete transcript.

**Treating docs-only changes as skill evals**

Docs-only contributor guidance can be reviewed with static checks and clear
examples. Do not claim live behavior evidence unless you ran live behavior evals.

## Relationship to Existing Tests

- Use `docs/testing.md` to choose and run plugin tests or skill behavior evals.
- Use `skills/writing-skills/testing-skills-with-subagents.md` for pressure
  testing behavior-shaping skill changes.
- Use this document to package the resulting evidence for reviewers.
