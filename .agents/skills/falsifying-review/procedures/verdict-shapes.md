# Reviewer verdict shapes

Standalone: the reviewer's two verdict shapes and the `priorFindings` semantics.
Numbered 1–3. Every reference out of this file names its file. The severity enum and the
advisory-disposition rules live in the agent body — they are assigned while finding, not
at emit time. Read this before emitting a verdict.

Return exactly one of these two shapes. Do not include prose outside the JSON — the coordinator
parses the verdict programmatically.

`checksRun` names only the gates you actually ran, by their key names from `docs/agent_invariants.md` → Gate commands (`test_command`, `lint_command`, …, and each stage-scoped gate by its key) — the same vocabulary the implementer's hand-back uses. A gate left blank in
`docs/agent_invariants.md` → Gate commands is omitted from it and named as skipped in
`summary`.

Every finding carries a `category` from this enum — pick the closest; never invent one:

`bug` · `security` · `invariant` · `criteria-fit` · `test-adequacy` · `test-coverage` ·
`misleading-comment` · `design` · `simplification` · `duplication` · `dead-code` ·
`naming` · `performance` · `formatting` · `documentation`

## 1 — Approval

```json
{
  "verdict": "approve",
  "summary": "One-sentence summary, e.g. 'lint clean, tests green (quote the run's own passed/skipped line), all 3 acceptance criteria addressed, no invariant, security or bug findings.'",
  "checksRun": ["lint_command", "typecheck_command", "format_command", "test_command", "build_command", "<stage-scoped gate keys>", "bug-scan", "security-scan", "invariant-scan", "criteria-fit", "design-review"],
  "claimsVerified": [
    {
      "claim": "the implementer's assertion, quoted",
      "method": "how you falsified or confirmed it",
      "result": "holds | refuted"
    }
  ],
  "criteriaFit": [
    { "bullet": "AC1 from issue body", "status": "met" },
    { "bullet": "AC2 from issue body", "status": "met" }
  ],
  "advisory": [
    {
      "file": "src/orders/summary.ext",
      "line": 88,
      "category": "simplification",
      "description": "What is complex, the concrete cost, and the specific alternative.",
      "disposition": "apply",
      "suggestedTicket": "One-line ticket title if disposition is ticket."
    }
  ],
  "priorFindings": [
    {
      "round": 1,
      "severity": "blocker",
      "file": "src/orders/limits.ext",
      "line": 142,
      "description": "The earlier round's finding, quoted or summarised in one line.",
      "status": "fixed",
      "note": "How you observed it; for a retraction, why you withdrew it and whether the PR body still cites the claim."
    }
  ]
}
```

`advisory` is present on **both** verdicts and may be empty. It never affects the verdict
— an `approve` with five advisory findings is still an approve, and the implementer is not
asked to act on them beyond what the coordinator routes back per their `disposition`.

## 2 — Changes requested

```json
{
  "verdict": "changes-requested",
  "blockingFindings": 2,
  "summary": "One-sentence summary, e.g. 'lint clean; tests pass; retry cap read from a hardcoded constant instead of the configured limit.'",
  "findings": [
    {
      "file": "src/orders/limits.ext",
      "line": 142,
      "severity": "blocker",
      "category": "invariant",
      "description": "The retry cap is read from a hardcoded constant rather than the configured limit, so changing the configuration silently has no effect and every downstream count is wrong without an error. Hits '<the condition's bold lead phrase>' in docs/agent_invariants.md → Blocking conditions."
    },
    {
      "file": "src/orders/summary.ext",
      "line": 58,
      "severity": "major",
      "category": "criteria-fit",
      "description": "AC3 requires the summary to include cancelled orders; the current filter omits them. Either include them or relax AC3 in the issue body."
    }
  ],
  "checksRun": ["lint_command", "typecheck_command", "format_command", "test_command", "build_command", "<stage-scoped gate keys>", "bug-scan", "security-scan", "invariant-scan", "criteria-fit", "design-review"],
  "claimsVerified": [
    {
      "claim": "the implementer's assertion, quoted",
      "method": "how you falsified it",
      "result": "refuted"
    }
  ],
  "criteriaFit": [
    { "bullet": "AC1 from issue body", "status": "met" },
    { "bullet": "AC2 from issue body", "status": "met" },
    { "bullet": "AC3 from issue body", "status": "partial" }
  ],
  "advisory": [],
  "priorFindings": []
}
```

`criteriaFit` is present on **both** verdicts, never only on `approve`. The coordinator reports its
tally in the PR comment as the evidence for criteria-fit (`coordinator-review-gate.md` §2.5),
naming individually only the bullets that are not `met`, and that comment is written for the
merged PR — so a round that returned `changes-requested` still has to say which bullets it
checked and found `met`. `status` is `met`, `partial` or `unmet`; every `partial` or `unmet`
bullet must also appear in `findings` with its severity and a description of what is missing.

## 3 — `priorFindings` — earlier findings, accounted for

Present on **both** verdicts. Omit it (or return `[]`) in round 1, where there is nothing
prior. From round 2 on it carries **one entry for every `findings` entry you returned in an
earlier round** — `blocker` and `major` only. An advisory you still stand behind is out of
scope: it never gates, and the coordinator already knows its fate from its own routing and the implementer's
hand-back. **An advisory you withdraw is the one exception** and gets an entry with
`status: "retracted"`, because its absence from this round's `advisory` array is otherwise
indistinguishable, to the coordinator, from the coordinator having already routed it. Each entry repeats the
shape of the `findings` entry it refers to — `round`,
`severity`, `file`, `line`, `description` — so the coordinator can build a table row from it without
matching prose back to an earlier round's JSON, and adds a `status`:

- **`fixed`** — you observed the fix in the diff, not the implementer's report of it.
- **`retracted`** — the finding was not real, or an implementer measurement refuted it
  (`reviewer-review.md` section 3).
  Withdraw it here rather than restating it at a finer resolution, and say in `note` whether
  the PR body still cites the claim the retraction knocks out.
- **`open`** — still standing. It also appears in `findings` this round, with its severity.

A finding you simply drop from `findings` without an entry here is indistinguishable, to
everyone downstream, from one you fixed. The coordinator's verdict comment renders `fixed` and
`retracted` as different resolutions and is forbidden from inferring which is which by
diffing rounds, so this array is the only thing that carries the distinction.
