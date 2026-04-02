# Task-Type Prompt Blueprints

Each task type has a different prompt structure because each type requires different thinking from Claude Code. A bug fix needs verification-first thinking. A feature needs pattern-following thinking. A migration needs careful incremental thinking. The prompt shape signals the right mode.

Every blueprint includes a docs-check preamble — Claude Code should read the relevant Anthropic docs and project CLAUDE.md before starting work.

## Table of Contents
1. Bug Fix / Debugging
2. New Feature / Implementation
3. Refactor / Code Improvement
4. Migration / Upgrade
5. Performance Optimization
6. Security Hardening
7. Investigation / Understanding Code
8. Testing / Test Coverage

---

## 1. Bug Fix / Debugging

**Thinking mode:** Investigate first, understand the root cause, then fix. Never guess-and-patch.

**Prompt structure:**

```
Before starting, read @CLAUDE.md for project conventions and review Anthropic's prompting best practices on investigation-first workflows: https://docs.claude.com/en/docs/claude-code/overview

## Bug report
[What's happening — symptoms, error messages, reproduction steps]

## Expected behavior
[What should happen instead]

## Affected code
[Specific files/functions where the bug likely lives — grounded from code analysis]

## Investigation steps
1. First, reproduce the issue by [specific steps/commands]
2. Read and understand the relevant code path: [grounded file list]
3. Identify the root cause — explain what's wrong and why before writing any fix
4. Check if this same bug pattern exists elsewhere in the codebase
5. Implement the fix
6. Verify the fix resolves the issue without introducing regressions

## Constraints
- Do NOT apply a surface-level patch — find and fix the root cause
- Do NOT modify [files/modules that should stay untouched]
- Preserve existing behavior for [related functionality]

## Verification
- Run `[actual test command from project]` — all tests must pass
- Specifically test: [the exact scenario that was broken]
- Run `[lint/typecheck command]` — no new warnings
```

**Key principle:** The prompt explicitly tells Claude to *understand before fixing*. This prevents the most common bug-fix failure: Claude patches the symptom instead of the cause.

---

## 2. New Feature / Implementation

**Thinking mode:** Follow existing patterns, build incrementally, verify as you go.

**Prompt structure:**

```
Before starting, read @CLAUDE.md for project conventions and review Anthropic's best practices on agentic coding patterns: https://docs.claude.com/en/docs/claude-code/overview

## Context
[What part of the app, what the current state is, why this feature is needed — business context]

## Feature requirements
[Clear description of what to build]

## Pattern reference
Follow the existing implementation pattern in @[reference file] for:
- [Routing / API structure]
- [Validation approach]
- [Error handling]
- [Response format]
- [Test structure]

## Implementation plan
1. [Step-by-step breakdown — each step is a verifiable unit]
2. After each step, run `[test command]` to verify nothing broke
3. [Continue steps...]

## Scope boundaries
- IN scope: [explicit list]
- OUT of scope: [explicit list — things Claude should NOT build]
- Do NOT refactor existing code unless directly necessary for this feature

## Technical notes
- [Version-specific guidance from web research]
- [Dependency notes — use existing X, don't add new Y]
- [Architecture notes from code analysis]

## Done criteria
- [ ] Feature works as described
- [ ] Tests written and passing: `[test command]`
- [ ] Types/interfaces updated
- [ ] No lint errors: `[lint command]`
- [ ] Follows existing patterns — code should look like it belongs
```

**Key principle:** The prompt points Claude to an existing implementation as a reference. This produces code that feels native to the codebase instead of foreign.

---

## 3. Refactor / Code Improvement

**Thinking mode:** Understand the current state deeply, change structure without changing behavior, verify continuously.

**Prompt structure:**

```
Before starting, read @CLAUDE.md for project conventions and review Anthropic's guidance on maintaining behavior during refactors: https://docs.claude.com/en/docs/claude-code/overview

## Current state
[What the code looks like now — specific files, the problem with the current structure]

## Desired state
[What the code should look like after — the structural improvement, not new behavior]

## The rule: behavior must not change
This is a refactor, not a feature. The external behavior of [specific module/API/component] must remain identical. Every existing test must continue to pass at every step.

## Files in scope
[Explicit grounded list of files to touch]

## Files NOT in scope — do not modify
[Explicit list of files to leave alone]

## Approach
1. First, run `[test command]` to establish a green baseline
2. [First refactor step — small, verifiable]
3. Run tests again — must still pass
4. [Next step]
5. Run tests again
6. [Continue pattern — never more than one structural change between test runs]

## Refactoring guidelines
- [Specific patterns to follow — e.g., "extract into separate service like @existing-service.ts"]
- [Anti-patterns to avoid — e.g., "don't introduce abstract base classes, keep it flat"]
- [Naming conventions from the codebase]

## Verification
- All existing tests pass: `[test command]`
- No new lint warnings: `[lint command]`
- No type errors: `[typecheck command]`
- Git diff should show structural changes only — no behavior changes
```

**Key principle:** The prompt hammers home "behavior must not change" and enforces a test-between-every-step cadence. This is the #1 failure mode in refactor prompts.

---

## 4. Migration / Upgrade

**Thinking mode:** Incremental, backwards-compatible, rollback-aware. Never big-bang.

**Prompt structure:**

```
Before starting, read @CLAUDE.md for project conventions and review Anthropic's best practices on multi-step task decomposition: https://docs.claude.com/en/docs/claude-code/overview

## Migration overview
[What's being migrated — from X to Y, why, what's at stake]

## Current stack
- [Framework/library]: [current version]
- [Relevant config files]
- [Current patterns in use]

## Target stack
- [Framework/library]: [target version]
- [New patterns to adopt]
- [Deprecations to address]

## Migration strategy: incremental, not big-bang
Do NOT attempt to migrate everything at once. Work in these phases:

### Phase 1: Preparation
1. [Setup step — e.g., install new dependency alongside old]
2. Verify existing tests still pass: `[test command]`
3. [Config changes]

### Phase 2: Gradual migration
1. [Migrate one module/file as a pilot]
2. Test thoroughly: `[test command]`
3. [Continue with next module, one at a time]
4. Test after each module

### Phase 3: Cleanup
1. [Remove old dependencies/code]
2. [Update configs]
3. Final full test run

## Backwards compatibility requirements
- [What must keep working during migration]
- [API contracts that can't break]
- [Data format requirements]

## Rollback plan
- If tests fail at any phase, stop and explain what went wrong
- Do NOT continue past a failing step

## Known gotchas
[Version-specific issues from web research — breaking changes, renamed APIs, etc.]

## Verification
- Full test suite passes at the end of each phase: `[test command]`
- No deprecation warnings from [target framework]
- `[lint/typecheck command]` clean
```

**Key principle:** The prompt enforces incremental migration with test gates between phases. The "stop if tests fail" instruction prevents Claude from snowballing broken migrations.

---

## 5. Performance Optimization

**Thinking mode:** Measure first, optimize the bottleneck, verify improvement with numbers.

**Prompt structure:**

```
Before starting, read @CLAUDE.md for project conventions and review Anthropic's guidance on investigation-first approaches: https://docs.claude.com/en/docs/claude-code/overview

## Performance problem
[What's slow — specific endpoint, operation, or page. Include any metrics if available]

## Affected code
[Grounded file paths and functions involved in the slow path]

## Investigation first — do NOT optimize before profiling
1. Read and trace the full execution path for [the slow operation]
2. Identify the actual bottleneck — is it DB queries? Network calls? Computation? Memory?
3. If there are N+1 queries, count them
4. Explain the bottleneck and your proposed optimization before implementing

## Optimization constraints
- Do NOT change the external API/behavior
- Do NOT add new dependencies without mentioning it first
- Preserve [specific functionality] — it may look unused but [reason]
- Readability over cleverness — a 10% perf gain isn't worth unreadable code

## Approaches to consider
[Based on web research — caching strategies, query optimization, lazy loading, etc. specific to the stack]

## Verification
- Run existing tests: `[test command]` — must pass
- [Benchmark command or profiling step to prove improvement]
- Check that [related endpoints] aren't negatively affected
- No new lint/type errors: `[lint command]`
```

**Key principle:** "Do NOT optimize before profiling." This prevents Claude from spending time optimizing code that isn't the bottleneck.

---

## 6. Security Hardening

**Thinking mode:** Assume adversarial input. Audit systematically, fix comprehensively.

**Prompt structure:**

```
Before starting, read @CLAUDE.md for project conventions and review Anthropic's prompting guidance on thorough, systematic approaches: https://docs.claude.com/en/docs/claude-code/overview

## Security concern
[What needs hardening — specific area, known vulnerability, or general audit scope]

## Scope
- Audit and harden: [specific files/modules/endpoints]
- Do NOT modify: [unrelated files]

## Systematic audit checklist
For each file in scope, check:
1. **Input validation** — Are all user inputs validated and sanitized? Check [specific entry points]
2. **Authentication** — Are all protected routes properly guarded? Check middleware chain in [file]
3. **Authorization** — Can users access only their own resources? Check [specific access patterns]
4. **Data exposure** — Are sensitive fields stripped from responses? Check [serialization layer]
5. **Secrets handling** — Are secrets in env vars, not hardcoded? Check for hardcoded strings
6. **SQL/NoSQL injection** — Are queries parameterized? Check [ORM usage patterns]
7. **XSS/CSRF** — Are outputs escaped? CSRF tokens in place? Check [template/response layer]
8. **Dependencies** — Run `npm audit` or equivalent and report findings

## Fix approach
- For each vulnerability found, explain the risk before fixing
- Apply fixes that follow the existing codebase patterns
- Don't over-engineer — use the framework's built-in security features where available
- Reference: [relevant security docs from web research for the stack]

## Constraints
- Do NOT change authentication flow without explicit approval
- Do NOT modify [sensitive files] without explaining why
- Preserve all existing functionality — security fixes should be invisible to end users

## Verification
- All existing tests pass: `[test command]`
- `npm audit` (or equivalent) shows no high/critical vulnerabilities
- [Manual verification steps for specific fixes]
- No new lint errors: `[lint command]`
```

**Key principle:** The prompt provides a systematic checklist rather than a vague "make it secure." Claude works through each vector methodically.

---

## 7. Investigation / Understanding Code

**Thinking mode:** Read, trace, explain. No modifications unless explicitly asked.

**Prompt structure:**

```
Before starting, read @CLAUDE.md for project context and review Anthropic's guidance on code exploration: https://docs.claude.com/en/docs/claude-code/overview

## What I want to understand
[The question — how does X work? Why does Y happen? What does Z depend on?]

## Starting points
[Grounded file paths and functions to start investigating from]

## Investigation approach
1. Read the relevant code paths starting from [entry point]
2. Trace the execution flow — what calls what, in what order
3. Map the dependencies — what does this code depend on, and what depends on it
4. Identify any non-obvious behavior (side effects, implicit dependencies, hidden config)

## Output format
Explain your findings in plain language:
- Start with a high-level summary (2-3 sentences)
- Then walk through the flow step-by-step
- Call out anything surprising, risky, or poorly documented
- If relevant, suggest improvements (but do NOT implement them unless I ask)

## Rules
- READ ONLY — do not modify any files
- If you need to run commands to understand behavior, explain what you're running and why first
- Don't guess — if something is ambiguous, say so and point to what you'd need to check
```

**Key principle:** The prompt makes it explicitly READ ONLY. Without this, Claude Code often starts "helpfully" fixing things during an investigation, which isn't what the developer wanted.

---

## 8. Testing / Test Coverage

**Thinking mode:** Understand the code's contract, then write tests that verify the contract — including edge cases.

**Prompt structure:**

```
Before starting, read @CLAUDE.md for testing conventions and review Anthropic's best practices on systematic approaches: https://docs.claude.com/en/docs/claude-code/overview

## What to test
[Specific module/function/endpoint — grounded paths]

## Existing test setup
- Test framework: [from package.json — e.g., Jest, Vitest, pytest]
- Test location convention: [where tests live — e.g., `__tests__/`, `*.test.ts` alongside source]
- Existing test examples: follow the patterns in @[reference test file]

## Coverage requirements
Write tests for:
1. **Happy path** — [the normal expected behavior]
2. **Edge cases** — [specific edge cases identified from code analysis]
3. **Error cases** — [what should fail and how — bad input, missing data, network errors]
4. **Boundary conditions** — [empty arrays, null values, max lengths, concurrent access]

## Test style guidelines
- Follow the existing test patterns in @[reference test file]
- Use [describe/it | test] blocks matching the project convention
- [Mock/stub guidelines — what to mock, what to test for real]
- Test names should describe the behavior: "should return 401 when token is expired" not "test auth"

## Constraints
- Do NOT modify the source code — only add/modify test files
- Do NOT change the test configuration
- Use existing test utilities in @[test helpers file if found]

## Verification
- All new tests pass: `[test command]`
- All existing tests still pass: `[full test command]`
- No lint errors in test files: `[lint command]`
- Explain any cases you chose NOT to test and why
```

**Key principle:** The prompt specifies "do NOT modify source code" because Claude often tries to "fix" code to make tests pass, which defeats the purpose of test-first workflows.

---

## How to select the right blueprint

When classifying a task, look for these signals:

| Signal | Task type |
|--------|-----------|
| "bug", "broken", "not working", "error", "fix" | Bug Fix |
| "add", "build", "create", "implement", "new" | New Feature |
| "refactor", "clean up", "reorganize", "simplify" | Refactor |
| "migrate", "upgrade", "update to", "switch from X to Y" | Migration |
| "slow", "optimize", "performance", "speed up", "cache" | Performance |
| "secure", "vulnerability", "auth", "injection", "audit" | Security |
| "how does", "explain", "understand", "trace", "what does" | Investigation |
| "test", "coverage", "spec", "write tests for" | Testing |

If a task spans multiple types (e.g., "fix this bug and add tests"), use the **primary** type as the base structure and incorporate relevant sections from the secondary type. For compound tasks, consider suggesting the developer break it into separate prompts — one per type.
