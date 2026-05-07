# Follow-ups Template (Ad-Hoc)

Skeleton for the `<branch-name>.followups.md` artifact that `nimbou-skills:finishing-ad-hoc-change` writes (Step 6) when the synchronous review leaves Minor items behind. Drop this file only when the collected list is non-empty.

**Filename rule:** `<branch-name>.followups.md` at the repo root (worktree root). Example: branch `fix/login-redirect` → `fix-login-redirect.followups.md` (replace `/` with `-` to keep the path flat).

**Allowed `<Tipo>` values:**

- `review-minor` — Minor findings from the synchronous `nimbou-skills:code-reviewer` dispatch in Step 5. Critical and Important are applied in-place by `nimbou-skills:apply-review` and never land here.

Critical and Important findings must not be deferred to this artifact. If the controller chose not to apply one (after verification + technical pushback documented in the wrap-up report), record that decision in the report — not as a follow-up bullet.

---

```markdown
# Follow-ups: <branch name>

Geradas em <YYYY-MM-DD> a partir de `nimbou-skills:finishing-ad-hoc-change` sobre o range `<BASE_SHA>..<HEAD_SHA>`.

## Itens

- [ ] **review-minor** — `nimbou-skills:code-reviewer` — <descrição em uma linha>
  - Ref: `<file:line>` <!-- omit when not applicable -->
  - Próximo passo: <ação concreta sugerida pelo reviewer ou "a definir">

- [ ] **review-minor** — `nimbou-skills:code-reviewer` — <descrição>
  - Ref: `<file:line>`
  - Próximo passo: <ação>
```

---

**Rules for the controller filling this in:**

1. One bullet per Minor finding. Never merge two reviewer items into a single bullet.
2. The `Origem` is always `nimbou-skills:code-reviewer` here (single synchronous dispatch).
3. Keep `Ref:` only when there is a concrete file/line. Do not invent paths to satisfy the template.
4. The `Próximo passo` line is required. If the reviewer did not propose one, write `a definir` rather than leaving it empty.
5. Do not include Critical/Important findings — those are applied in Step 6 or documented as pushback in the wrap-up report.
6. Do not commit this file as part of the fixes commit. Either commit it separately as a docs commit or hand it to the user — let `nimbou-skills:finishing-a-development-branch` decide how to integrate it on the next pass.
