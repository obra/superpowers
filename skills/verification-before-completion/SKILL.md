---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
---

# Verification Before Completion

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status:
1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - NO: State actual status with evidence
   - YES: State claim WITH evidence
5. ONLY THEN: Make the claim
```

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check |
| Build succeeds | Build: exit 0 | Linter passing |
| Bug fixed | Test original symptom | Code changed, assumed fixed |
| Agent completed | VCS diff shows changes | Agent reports "success" |

## Red Flags — STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Done!")
- About to commit/push/PR without verification
- Trusting agent success reports
- Thinking "just this once"
- ANY wording implying success without having run verification

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
| "Just this once" | No exceptions |
| "Agent said success" | Verify independently |
| "Partial check enough" | Partial proves nothing |
| "I'm tired" | Exhaustion ≠ excuse |

## Command Detection

When the user claims "done" or "fixed", immediately identify the verification commands for this project:

| Project Signal | Commands to Run |
|---------------|-----------------|
| `package.json` with `test` script | `npm test` or `yarn test` |
| `tsconfig.json` | `npx tsc --noEmit` |
| `.eslintrc` / `eslint.config` | `npx eslint .` |
| `pytest.ini` / `pyproject.toml` | `pytest` |
| `Cargo.toml` | `cargo test && cargo clippy` |
| `go.mod` | `go test ./... && go vet ./...` |

Run ALL applicable commands, not just one. A passing test suite with type errors is not "done."

## The Bottom Line

Run the command. Read the output. THEN claim the result. Non-negotiable.
