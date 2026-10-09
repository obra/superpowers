---
name: ux-gate
description: "Use before final review of new user flows or material changes to interaction, layout, or responsive behavior, or when UX review is explicitly requested. Routine color, copy, or isolated CSS adjustments do not trigger this review on their own."
---

# UX Gate

**Entry:** changed routes, base..head range, approved acceptance criteria, and a running isolated environment. Judge the rendered effect, not line count: a one-line shared-layout change can need review; a button-color change usually does not.
**Exit:** `Pass` bound to the reviewed head SHA, or `Changes Required` with component-level findings. The gate does not fix anything.

## Ownership

A dispatched gate runner (role `errand`) runs this skill: it captures every round, dispatches the `ux` reviewer, and returns the verdict to its caller, which routes the review file to the owning implementer and resumes the runner for the recapture. Neither runner nor reviewer fixes anything. An implementer captures only its own task's smoke pass, a scripted check that never invokes this reviewer.

## 0. Runtime preflight

The environment must serve the changed routes with queryable data before capture. Without preflight evidence the gate cannot run and nothing downstream may claim UX was verified.

## 1. Choose coverage

Derive the smallest set of navigation pathways covering what this diff changed, including the acceptance criteria's entry points and states.

Read `.toolbelt/ux-policy.md` when present for launch, auth, theme, data, viewports, exceptions, design reference, reference screens, and harness notes; infer and record what it lacks.

Enumerate the capture matrix first:

- Use relevant breakpoints for changed markup, copy, or layout, including shared styling or layout the step consumes. Use one width when presentation cannot vary.
- Capture every supported theme for every changed surface.
- Exercise criteria-named states with isolated fixtures or seeded data: empty, loading, error, dense data, and overlays as applicable.
- Check hover or focus appearance when it changes, keyboard reach and activation for changed interactions, and scrolling when content extends past the fold. Use `press` and `expectFocus` for keyboard checks; direct `focus` does not prove Tab reachability. Use `capture: false` for steps that need assertions but no images.
- Mark changed motion with `motion: true`. Repeat interaction checks across dimensions only when behavior can differ.

Record the reason for omitted dimensions. Choose enough evidence for the feature's complexity; there is no fixed image-count limit.

## 2. Capture

Read [matrix.md](matrix.md) for the input schema and actions. Write `.toolbelt/ux/matrix.json`. Set `UX_SKILL_DIR` to this skill’s absolute directory and run this command from the project root:

```bash
"$UX_SKILL_DIR/scripts/ux-capture" .toolbelt/ux/matrix.json \
  --project-root "$PWD" --out .toolbelt/ux/head/ \
  --baseline .toolbelt/ux/baseline/
```

Use the prototype ledger’s absolute baseline path when present; otherwise serve the base branch in isolation and capture the same matrix first, then stop that server. If no baseline can be served, omit `--baseline`, review all stills as `new`, and record the limitation. An inaccessible prototype baseline is missing evidence to resolve. Stills are `<pathway>-<step>-<state>-<width>-<theme>.png`. An incomplete step is a finding, not a skip. Exit 2 means capture did not run; resolve it before review.

## 3. Mechanical findings first

Every mechanical finding at `should` or above goes to the fix loop before image review. Run any token or palette check the policy names and attach its output. An unavailable optional check is a reported limitation, not a pass.

## 4. Review

Route one `reviewer` with specialty `ux` via agent-routing; use a vision-capable model. Send changed and new captures, useful crops or filmstrips, reference screens, and any unchanged capture needed to judge a criterion. Omit redundant images, but keep meaningful changes with a small pixel ratio.

Put images first, labelled `Image N: <tag>`, then criteria, mechanical results, the design-reference path, and the review file path (`.toolbelt/ux/<capture-dir>/review.md`). The reviewer reads `docs/REVIEW-GUIDANCE.md` when present and judges without driving the browser:

> Pass 1: mark each criterion met, not met, or not evidenced, citing the evidence.
>
> Pass 2: identify visible inconsistencies or usability problems in spacing, alignment, typography, contrast, action hierarchy, and states. Use the project's design rules and reference screens. Explain the consequence and relevant criterion or convention. Distinguish legitimate disabled states from unfinished controls. Code review checks component imports; screenshots cannot establish them.
>
> Each finding names a severity (blocker, should, nit), the evidence, expected and actual behavior, and component/file when known. Missing evidence can block a criterion.
>
> Write the report to the review file. Reply with only the verdict, one line per blocker and should, the nit count, and the path.

Return that reply, with the head, to your caller; the caller never reads the review file.

## 5. Fix loop

The caller sends the owning implementer the review file path; the implementer fixes blockers and shoulds and lists nits in its report. Then rerun the capture script on the new head for affected pathways, including one nearest previously passing unchanged state for each affected component. Use `--pathway` and `--out .toolbelt/ux/head-<n>/`, comparing each pathway to its last capture.

Carry unaffected evidence forward only while its rendered dependencies and fixtures are unchanged; a shared style or token change invalidates every consuming capture. Record carried versus recaptured evidence and its source head; send updates to the same reviewer thread. After two failed rounds, return the remaining findings and evidence for your human partner.

Report pathways covered separately from raw screenshot count.

## Rules

- One primary UX reviewer by default; justify any other.
- Do not manufacture states by editing app source; use isolated fixtures and seeded data.
- Every round binds to the reviewed head; a new push invalidates prior evidence except recorded carry-forward and docs-only pushes.
- Run before the final gate verdict so fixes land in the reviewed head.
