# Dimension 4 — Prompt Quality (Meta-validation)

> **Question:** Does `SKILL.md` itself transfer **expert reviewer behavior**,
> or is it a topic checklist that an LLM can recite without acting on?

This dimension uses the repo's own `prompt-validator-generator` skill,
applied to `code-review` as the target domain.

**v1 status:** Designed. Execution is one-shot (not a recurring harness)
because the validator is generated, applied, and discarded per `SKILL.md`
revision.

## Execution

Per `skills/prompt-validator-generator/SKILL.md`, run the **3-agent**
architecture:

1. **Main agent** — identifies the domain only (`"code review"`) and
   launches Subagent 1.
2. **Subagent 1** — receives only the domain name. Completes Phases 1–5:
   - Phase 1: Domain analysis (expert vs novice reviewers, failure modes).
   - Phase 2: Prompt-type classification (Enforcement-heavy with Diagnostic
     elements — likely).
   - Phase 3: Capture expert reviewer knowledge (tacit heuristics, context
     factors, validation methodology).
   - Phase 4: Design testing methodology.
   - Phase 5: Generate the validator.
   Returns the validator document.
3. **Subagent 2** — receives the validator AND `SKILL.md`. Runs Phase 6:
   meta-validates the validator on `SKILL.md`, calibrates against
   intentionally-weakened variants (see § Differential testing), refines.

**Critical:** Subagent 1 must not see `SKILL.md` — otherwise the validator
circularly grades the skill against itself.

## Differential testing

To verify the generated validator is sensitive (not just permissive), run
it against three variants of `SKILL.md`:

| Variant | What we remove | Expected validator response |
|---------|---------------|-----------------------------|
| **Current** | nothing | High score |
| **Ablated** | Steps 5 and 6 (multi-model critique + grilling) | Substantially lower score; validator should call out the gap |
| **Topic-only** | All process steps, keep only "What to Look For" | Low score; validator should detect it's a topic list, not a behavior transfer |

If the validator scores all three similarly, the validator itself is
broken — re-run Phase 6.

## Fixtures

`fixtures/prompt-meta/` holds the artifacts of past runs:

```
fixtures/prompt-meta/
├── runs/
│   └── 2026-05-28/
│       ├── domain.txt              # "code review"
│       ├── validator.md            # Subagent 1 output
│       ├── phase6-results.md       # Subagent 2 output
│       └── differential-scores.md  # current vs ablated vs topic-only
└── variants/
    ├── current.md                  # symlink/copy of SKILL.md
    ├── ablated.md                  # SKILL.md - Steps 5 & 6
    └── topic-only.md               # only "What to Look For"
```

## What "expert reviewer behavior" means here

From the rubber-duck critique on this dimension, the validator should ask:

- Does the skill prevent **anchoring** (reading PR narrative before forming
  an assessment)?
- Does it prevent **diff-only shallowness** (reading only the diff hunks,
  not surrounding files / callers)?
- Does it prevent **false confidence** (treating one confirmed finding as
  evidence of coverage)?
- Does it prevent **style nitpicking** (commenting on what CI catches, or
  on consistent local style)?
- Does it prevent **severity inflation** to look thorough?
- Does it adapt between **PR mode and standalone mode**?
- Does it create **observable artifacts** that can be audited (a verdict,
  per-finding evidence, a documented Step 5 or skip notice)?

## Limits of this dimension

> **From the critique:** "Hard truth: prompt meta-validation is weaker
> evidence than corpus performance. Use it to improve the skill, not to
> prove the skill works."

Treat the meta-validation as a hypothesis generator for SKILL.md edits.
Confirm the hypotheses against the **detection-quality** corpus before
declaring an improvement.
