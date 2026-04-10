# Cursor GREEN Raw Output

I skimmed `skills/`, `tests/`, `docs/`, and contributor entrypoints in this repo. Per the classification gate, I propose three schemes; please select exactly one before I create or update any standards artifacts. I will not write `.cursor/rules/${type}.md`, `docs/checklist/${type}.md`, conditional `docs/guides/how-to-create-${type}.md`, or `docs/resources/reuse-inventory.md` until you choose.

Scheme A - contributor surface: Types like `skills-core`, `claude-code-harness`, `contributor-docs`. Boundaries follow where people edit; clear ownership, but cross-cutting changes may touch several types.

Scheme B - validation depth: Types such as `evaluated-skills`, `unevaluated-docs`, `ci-and-scripts`. Groups work by how strictly behavior is tested; good for risk-aware PR review, slightly fuzzier file boundaries.

Scheme C - change blast radius: Types like `behavior-shaping-content`, `supporting-tooling`. Separates high-impact prose from mechanical harness updates; fast triage, with edge cases when a single PR spans both.

I am waiting for your explicit choice of one scheme.

Once you pick it, for each `${type}` in that scheme I will use `superpowers:standards-context-retrieval`, produce `Constraints Summary`, then author rules at `.cursor/rules/${type}.md`, checklists at `docs/checklist/${type}.md`, and `docs/guides/how-to-create-${type}.md` only if the type spans multiple non-trivial files or commonly trips new contributors. I will always produce or merge-update `docs/resources/reuse-inventory.md` once for the run.

Quality gates (blocking): no Must without a mapped Sources path; every Must has at least one checklist item; ban non-operational style policy; honest gaps where evidence is missing; ASCII-only generated files. After gates pass, the delivery summary lists chosen scheme, paths touched, per-type coverage, and known gaps.
