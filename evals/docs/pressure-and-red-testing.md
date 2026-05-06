# Pressure / RED phase testing in drill

## What "RED phase" means

The bash test family in superpowers/tests/ used three implicit phases
when stress-testing skill content:

* **GREEN** — current skill text. Baseline behavior under normal user
  prompts. This is what most drill scenarios exercise.
* **PRESSURE** — current skill text, but the user prompt creates
  conditions that make the skill's recommended path inconvenient
  (urgency, an "easier" alternative already on disk, etc.). Lifted
  as `worktree-creation-under-pressure.yaml`.
* **RED** — *modified* skill text where the section under test has
  been removed or weakened. Used to confirm a passing GREEN/PRESSURE
  result actually depended on the skill text and isn't just baseline
  model behavior.

GREEN and PRESSURE both run against the current `SUPERPOWERS_ROOT`.
RED needs a *different* superpowers checkout — one with the section
under test stripped out — and runs the same scenario against that.

## The drill primitive: vary `SUPERPOWERS_ROOT`

Every backend YAML interpolates `${SUPERPOWERS_ROOT}` into its
`--plugin-dir` arg (claude.yaml line 6, gemini.yaml line 5, etc.).
That env var is the only knob you need: point drill at a different
plugin checkout and the agent under test loads a different version
of the skill.

```bash
# GREEN: current skill text
drill run worktree-creation-from-main -b claude

# RED: same scenario, against a checkout where Step 1a is deleted
SUPERPOWERS_ROOT=/path/to/superpowers-without-step-1a \
  drill run worktree-creation-from-main -b claude
```

Compare verdicts. If GREEN passes and RED fails, the skill text is
load-bearing. If both pass, the model produces the right behavior
without the skill — meaning either the skill is redundant or the
test isn't probing what it claims to probe.

## Recommended workflow

1. Make a git worktree of superpowers at the commit/branch you want
   to test. For RED variants, edit the skill in that worktree to
   remove the section under test.

   ```bash
   cd ~/Documents/GitHub/superpowers/superpowers
   git worktree add ../superpowers-red-no-step-1a HEAD
   # edit skills/using-git-worktrees/SKILL.md in the worktree
   ```

2. Run the same drill scenario against each variant. Use
   `--n N` to get statistical signal — single runs are noisy,
   especially under pressure conditions.

   ```bash
   for variant in main red-no-step-1a; do
     SUPERPOWERS_ROOT=~/Documents/GitHub/superpowers/superpowers-${variant#main}superpowers \
       drill run worktree-creation-from-main -b claude --n 10
   done
   ```

3. Compare with `drill compare`. Look for the RED variant's pass
   rate dropping (skill is load-bearing) or holding (skill is
   redundant or scenario isn't probing what it claims).

## When to add a new pressure scenario vs. add a turn variation

* **New scenario** when the *filesystem* setup is different (e.g.,
  pre-existing `.worktrees/` for the worktree-pressure case).
  Setup helpers are scenario-scoped.
* **New `--n` sweep with different prompts** when only the
  *user prompt* shape varies (e.g., urgency, framing).

Drill doesn't yet have a way to vary turn intents within a single
scenario YAML — multi-prompt sweeps require multiple scenario files
or running the same scenario with different intents externally.

## Open follow-ups

* `--plugins=A,B,C` sweep dimension (parallel to `--models`) so a
  single drill invocation can run RED + GREEN + PRESSURE variants
  in one batch and `drill compare` shows them side-by-side. Not yet
  implemented; tracked as drill-internal future work.
