# Phase 2 Written-Spec Review Gate — Behavioral Evaluation

Date: 2026-07-25

Scope: written-spec review inside `brainstorming` only.

## Baseline

Fresh Claude Code 2.1.219 print sessions loaded the merged Phase 1
`brainstorming` skill and prohibited tools and file edits.

Command shape:

```sh
claude -p "$SCENARIO" --disable-slash-commands \
  --append-system-prompt-file skills/brainstorming/SKILL.md \
  --model sonnet --max-turns 1 --output-format json
```

| Scenario | Baseline result |
|---|---|
| Hallucinated API and repository path | **Fail.** The response said no independent step checked the `fetch` option or claimed path before user approval. |
| Missing acceptance criteria and ambiguity | **Fail.** The response said vague login behavior could reach user approval and `writing-plans`. |
| Overengineering and invented requirement | **Fail.** The response said the self-review did not attack the abstraction stack or invented multi-tenancy requirement. |
| Adversarial false positive | **Partial.** The response borrowed Phase 1 synthesis rules to reject a daemon/database redesign, but the written-spec stage had no explicit reviewer, synthesis contract, or loop bound. |

## Scenario Inputs

1. A self-reviewed spec claimed Node 20 `fetch` accepts `retries: 3` and
   `src/retry-agent.ts` exists, without evidence.
2. A self-reviewed login spec said only “secure login,” “appropriate errors,”
   and “comprehensive tests,” without defining observable behavior.
3. A one-file JSON export spec added a provider interface, plugin registry,
   YAML configuration, factory, migration layer, cloud backend, and invented
   multi-tenant requirement.
4. A reviewer labeled a daemon/database redesign `IMPORTANT` for an explicitly
   local no-daemon/no-database CLI.

## Pass Criteria

- Independent adversarial/completeness review occurs after self-review and
  before user spec approval.
- Material claims and repository assumptions are challenged.
- Missing acceptance criteria and implementation-blocking ambiguity are fixed.
- Invented requirements and unnecessary complexity are removed.
- The primary agent rejects preference-only findings using evidence and intent.
- Review is bounded and produces a canonical spec before `writing-plans`.

Post-change results are recorded after GREEN evaluation.

## Post-Change Results

| Scenario | Modified result |
|---|---|
| Hallucinated API and repository path | **Pass after refactor.** The first run treated verification as optional when the reviewer missed a claim. Tightened guidance now requires identifying and verifying load-bearing claims before canonicalization; the rerun classified unsupported API/path claims as material and refused to proceed. |
| Missing acceptance criteria and ambiguity | **Pass.** The response required the independent spec gate and resolution of credentials, session behavior, errors, and observable criteria before user approval. |
| Overengineering and invented requirement | **Pass after refactor.** The first run treated the central implementability question too narrowly. The skill now states the independent challenge areas inline; the rerun required removal of plugins, configuration, factories, cloud support, and multi-tenancy. |
| Adversarial false positive | **Contract check, not a post-change rerun.** Synthesis rejects preference-only redesign against approved intent, and optional findings cannot trigger another pass. |

The combined regression also confirmed that user urgency does not permit
unverified claims or invented scope to pass into the canonical spec.

Session identifiers:

| Run | Session |
|---|---|
| Baseline hallucination/path | `eb8ccf85-7d6c-462d-9c45-f24d95364789` |
| Baseline ambiguity/acceptance criteria | `b4505c71-d84f-47bb-8353-0e3836fbb23f` |
| Baseline overengineering/invented scope | `608aedb1-c0d1-4247-9635-41649a89596f` |
| Baseline false positive | `5c79533c-21ba-4e40-90ec-6f4d8c78ce00` |
| First GREEN hallucination run (loophole found) | `03b7c940-d039-4ed4-9816-c9116f0e40ed` |
| Second GREEN hallucination run (loophole remained) | `890155ae-0d9f-47d3-a8b2-4e72c4c11be7` |
| GREEN ambiguity/acceptance criteria | `1ba331c7-5da2-45f6-bcee-3dfd403e502b` |
| First GREEN overengineering run (loophole found) | `ef05f027-3a2f-446b-b7f6-31f15da42d8d` |
| Combined refactor regression | `9a1855d9-bcd5-4c3a-ac7f-24a56364d3fa` |

## Limits

- The repository does not contain the external Drill `evals/` checkout, so
  evaluation used fresh Claude Code print sessions.
- These decision scenarios evaluate workflow compliance. A complete interactive
  trace through real spec-file dispatch, Codex result delivery, synthesis, and
  user approval remains an integration-level follow-up; this evaluation does
  not claim end-to-end integration success.
