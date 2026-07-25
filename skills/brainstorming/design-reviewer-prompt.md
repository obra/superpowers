# Candidate Design Reviewer Prompts

Use these prompts only after the full candidate design is coherent. Give both
reviewers the same compact review brief:

- user intent, success criteria, and constraints;
- relevant inspected repository evidence;
- approaches considered and why the candidate was chosen;
- the complete candidate design;
- material technical claims and their known evidence.

Reviewers are read-only. They report findings; they do not rewrite the design.

## Claude Constructive Review

When a Claude subagent is available, dispatch it with:

```text
Constructively review this candidate design.

Check user-intent alignment, missing requirements or possibilities, important
implications, architectural coherence, simpler or clearer alternatives,
unresolved decisions, and high-level testability.

Do not rewrite the design merely to use different wording. Report only findings
that would materially improve completeness, coherence, practicality, simplicity,
or intent alignment. For each finding, explain its impact and the smallest useful
change.

[REVIEW BRIEF]
```

## Codex Adversarial Review

When the official `codex:codex-rescue` subagent is available, dispatch a fresh,
explicitly read-only review request with:

```text
Adversarially review this candidate design. Do not edit files.

Look specifically for:
1. unsupported assumptions;
2. invented requirements;
3. failure modes and important edge cases;
4. unnecessary complexity;
5. materially simpler alternatives;
6. technical claims requiring verification;
7. contradictions with user intent;
8. dependencies or capabilities assumed without evidence.

Ask: Can this be materially simpler while still fully solving the current
requirement? Do not redesign merely because you prefer another architecture.

Classify each finding as BLOCKER, IMPORTANT, or OPTIONAL. For load-bearing
factual claims where useful, classify them VERIFIED, INFERRED, or UNSUPPORTED.
For every BLOCKER or IMPORTANT finding, state the evidence needed or the smallest
useful correction.

[REVIEW BRIEF]
```

The official `/codex:adversarial-review` command reviews Git state; use the
Codex task subagent above for an in-conversation candidate design. If that
capability is absent before dispatch, the primary agent applies the same
adversarial prompt itself and clearly reports the degraded review. Apply the
same fallback to the constructive prompt when no independent Claude reviewer
exists.

Capability absence is different from invocation failure. If a reviewer is
available but setup, authentication, dispatch, completion, or result retrieval
fails, report the actionable failure and ask whether to retry or continue with
degraded self-review. Never fabricate or silently replace missing reviewer
output.

## Targeted Re-check

Use at most once per gate. Dispatch only the reviewer whose expertise matches
the unresolved issue:

```text
Re-check one unresolved candidate-design issue. Do not reopen settled findings
or offer unrelated improvements.

Unresolved finding: [BLOCKER OR IMPORTANT FINDING]
Relevant user intent and constraints: [ONLY RELEVANT ITEMS]
Design delta since review: [CHANGED PARTS ONLY]
New evidence: [EVIDENCE OR "NONE"]

Return ADDRESSED or NOT ADDRESSED with a brief evidence-based reason. If a
material factual claim remains uncertain, name exactly what would verify it.
```

If that reviewer is unavailable, the primary agent applies this same scoped
check and discloses the missing independent perspective.
