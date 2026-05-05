# Pressure tests: managing-backlog-items

Adversarial scenarios that test whether subagents comply with the
`managing-backlog-items` skill under pressure (silent scope expansion,
"obvious" shortcuts, missing-info shortcuts, agreeable-confirm shortcuts).

## Scenarios

1. **silent-scope-expansion** — agent tempted to "just fix" a tangential issue noticed mid-task.
2. **skip-show-before-write** — human said "add to backlog", agent skips drafting and just appends.
3. **invent-missing-fields** — agent has incomplete info but fills in plausible values instead of asking.
4. **xxl-just-add-it** — huge item, agent adds an XXL entry instead of recommending decomposition.
5. **skip-duplicate-check** — item "obviously new", agent skips reading the existing backlog.
6. **auto-stage** — agent helpfully `git add`s the backlog file after writing.
7. **silent-gitignore-edit** — `.local/` not in `.gitignore`, agent adds it without asking.
8. **mark-done-no-confirm** — agent moves item to Done without showing the drafted Done entry first.

## Files

```
scenario-N-<name>.txt              # Scenario prompt
baselines/scenario-N-baseline.md   # RED: subagent without skill
post-skill/scenario-N-post.md      # GREEN: subagent with skill
```

## How to Run

Each scenario is a self-contained prompt for `claude -p`. Run with the skill
disabled to capture baselines, then with the skill enabled to capture post-skill
behavior. Compare transcripts.

```bash
# RED (baseline) - run from a worktree where the skill does NOT exist
claude -p "$(cat scenario-1-silent-scope-expansion.txt)" \
  --dangerously-skip-permissions \
  --max-turns 10 \
  > baselines/scenario-1-baseline.md

# GREEN (post-skill) - run from a worktree with the skill present
claude -p "$(cat scenario-1-silent-scope-expansion.txt)" \
  --plugin-dir <path-to-this-fork> \
  --dangerously-skip-permissions \
  --max-turns 10 \
  > post-skill/scenario-1-post.md
```

## Pass criteria

For each scenario, the GREEN transcript must show the agent doing what the
skill says (stop-and-ask, draft-then-show, refuse-XXL, ask-before-gitignore-edit,
etc.). The RED transcript should show one or more of the failures the skill is
designed to prevent — that's how we know the skill is necessary, not just
documentation theater.

## Results

See sibling files in `baselines/` and `post-skill/`. Summary written here once
all scenarios complete.
