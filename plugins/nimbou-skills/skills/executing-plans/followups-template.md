# Follow-ups Template

Skeleton for the `<plan>.followups.md` artifact that `nimbou-skills:executing-plans` writes (Step 3) when the executed plan leaves deferred items behind. Drop this file only when the collected list is non-empty.

**Filename rule:** same directory and basename as the plan, with the `.followups.md` suffix. Example: `docs/plans/feature-x.md` → `docs/plans/feature-x.followups.md`.

**Allowed `<Tipo>` values:**

- `spec-issue` — `❌ Issues found` items returned by the per-wave spec reviewer subagent in `executing-plans` (advisory, since reviews there are non-blocking).
- `spec-deferred` — `⚠️ Deferred` items returned by the per-wave spec reviewer in `executing-plans`.
- `review-critical` — Critical findings from the per-wave `nimbou-skills:code-reviewer` subagent in `executing-plans` (advisory). The user must triage these before merging.
- `review-important` — Important findings from a per-wave `nimbou-skills:code-reviewer` / `nimbou-skills:request-review` that were not treated as blockers.
- `review-minor` — Minor findings from a per-wave `nimbou-skills:code-reviewer` / `nimbou-skills:request-review`.
- `concern` — Controller-reported concerns during execution (architectural doubt, file growing too large, refactor suggestion, etc.).
- `pos-execucao` — Items inherited from the original plan's `## Pos-execucao` section (typical for `nuxt-plan` outputs).

---

```markdown
# Follow-ups: <plan title>

Geradas em <YYYY-MM-DD> a partir de `<caminho relativo do plano>`.

## Itens

- [ ] **<Tipo>** — <Origem (Onda N / reviewer Y)> — <Descrição em uma linha>
  - Ref: `<file:line>` <!-- omit when not applicable -->
  - Próximo passo: <ação concreta sugerida pelo reviewer ou "a definir">

- [ ] **<Tipo>** — <Origem> — <Descrição>
  - Ref: `<file:line>`
  - Próximo passo: <ação>

## Itens herdados de `## Pos-execucao` do plano original

<!-- Omitir esta seção inteira se o plano original não tinha `## Pos-execucao`. -->

- [ ] <copiar literal do plano>
- [ ] <copiar literal do plano>
```

---

**Rules for the controller filling this in:**

1. One bullet per finding. Never merge two reviewer items into a single bullet — each is independently actionable.
2. Always carry the `<Origem>` so a reader can trace back to the wave/reviewer that produced the item.
3. Keep `Ref:` only when there is a concrete file/line. Do not invent paths to satisfy the template.
4. The `Próximo passo` line is required. If the reviewer did not propose one, write `a definir` rather than leaving it empty.
5. Inherit `## Pos-execucao` items **verbatim** — do not paraphrase. They were already approved as part of the plan.
6. Do not delete the `## Itens` heading even if all collected entries came from `## Pos-execucao`. In that case, write `_Sem itens novos coletados durante a execução._` under it.
