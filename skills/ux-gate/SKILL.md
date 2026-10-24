---
name: ux-gate
description: "Use before final review of new user flows or material changes to interaction, layout, or responsive behavior, or when UX review is explicitly requested. Routine color, copy, or isolated CSS adjustments do not trigger this review on their own."
---

# UX Gate

**Entry:** changed routes, the base..head range, approved acceptance criteria, and a running isolated environment. Judge the rendered effect, not line count.
**Exit:** `Pass` bound to the reviewed head SHA, or `Changes Required` with component-level findings. The gate fixes nothing.

A gate runner (role `errand`) runs this skill and returns the verdict to its caller, which sends the review file to the owning implementer.

## 0. Preflight

The environment must serve the changed routes with queryable data. Without that, the gate cannot run and nothing may claim UX was verified.

## 1. Coverage

Pick the smallest set of pathways covering the diff and the acceptance criteria's entry points and states. Read `.toolbelt/ux-policy.md` when present for launch, auth, theme, data, viewports, exceptions, and design references; infer and record what it lacks.

- Use the relevant breakpoints for changed markup, copy, or layout, or one width when presentation cannot vary.
- Capture every supported theme for every changed surface.
- Reach the criteria's states (empty, loading, error, dense data, overlays) with isolated fixtures or seeded data, never by editing app source.
- Check changed hover or focus, keyboard reach for changed interactions, and scrolling past the fold. Prove Tab reach with `press` and `expectFocus`; a direct `focus` does not. Use `capture: false` for assertion-only steps, and `motion: true` for changed motion.
- When the plan's `Reuses:` or the prototype ledger names a screen to match, capture that screen as its own pathway, named with the `match-` prefix (see [matrix.md](matrix.md)). Give it whatever steps reach the matching state, such as opening the slide-out panel, at the same viewports and themes as the changed surface. That pathway is unchanged code: its stills are references for the reviewer, and its mechanical results are ignored, so a problem that was already on that screen never fails the gate for the changed one.

Record why any dimension is omitted.

## 2. Capture

Read [matrix.md](matrix.md) and write `.toolbelt/ux/matrix.json`. Set `UX_SKILL_DIR` to this skill's absolute directory and run from the project root:

```bash
"$UX_SKILL_DIR/scripts/ux-capture" .toolbelt/ux/matrix.json \
  --project-root "$PWD" --out .toolbelt/ux/head/ \
  --baseline .toolbelt/ux/baseline/
```

Use the prototype ledger's absolute baseline path when present; otherwise capture the same matrix first on the base branch, served in isolation. With no baseline, omit `--baseline`, review every still as `new`, and record why. An incomplete step is a finding. Exit 2 means capture did not run.

Run any token or palette check the policy names. A mechanical finding at `should` or above joins the review's findings, except on a `match-` pathway, whose mechanical results you ignore.

## 3. Review

Route one `reviewer` with specialty `ux` through agent-routing, on a vision-capable model. Send changed and new captures, useful crops, reference screens, and any unchanged capture a criterion needs, images first, labelled `Image N: <tag>`, then criteria, mechanical results, the design-reference path, and the review file path (`.toolbelt/ux/<capture-dir>/review.md`). When a `match-` pathway exists, send its stills beside the changed surface they match. The reviewer reads `docs/REVIEW-GUIDANCE.md` when present and judges without driving the browser:

> Pass 1: mark each criterion met, not met, or not evidenced, citing the evidence.
>
> Pass 2: identify visible inconsistencies or usability problems in spacing, alignment, typography, contrast, action hierarchy, and states. Use the project's design rules and reference screens. When a matching screen was sent beside the changed surface, judge the changed surface against that screen and report any difference in hierarchy, spacing, information order, and actions that the criteria do not explain. Explain the consequence and relevant criterion or convention. Distinguish legitimate disabled states from unfinished controls. Code review checks component imports; screenshots cannot establish them.
>
> Each finding names a severity (blocker, should, nit), the evidence, expected and actual behavior, and component/file when known. Missing evidence can block a criterion.
>
> Write the report to the review file. Reply with only the verdict, one line per blocker and should, the nit count, and the path.

Return that reply, with the head, to your caller.

## 4. One fix round

The owning implementer fixes every finding, nits included. Recapture the pathways the fix touched with `--pathway` and `--out .toolbelt/ux/head-2/`, and send them to the same reviewer thread. There is no second round: return remaining blockers with their evidence for your human partner, and the rest as Minor findings.

Every capture binds to the head it was taken at. Carry a pathway's evidence to a new head only while its rendered dependencies and fixtures are unchanged, and record the source head; a shared style or token change touches every consuming pathway. A docs-only push carries everything forward. Report pathways covered separately from the screenshot count.
