---
name: code-review
description: Use when analyzing code changes for correctness, performance, safety, and quality. Provides review criteria, severity classification, and output format for code reviews. Use standalone when reviewing any code changes, diffs, or patches. Triggers on "review my code", "check this for bugs", "audit this change", "is this safe to merge", "what could go wrong", "look at my changes", or requests to evaluate code quality or find risks.
---

# Code Review

Review code changes for correctness, performance, safety, and consistency with established patterns. This skill provides the analytical framework — what to look for, how to evaluate it, and how to report findings.

**Reviewer mindset:** Be polite but skeptical. Treat PR descriptions and linked issues as claims to verify, not facts to accept. Question stated direction, probe edge cases, and flag concerns even when unsure. A false approval is far worse than an unnecessary question.

## Review Process

**Context modes:** This skill works in two modes. In **PR mode** (reviewing a pull request), follow all steps including Step 3 (reconcile with PR narrative). In **standalone mode** (reviewing a diff, file, or code snippet without a PR), skip Step 3 and proceed directly from Step 2 to Step 4 — there is no author narrative to reconcile against.

### Step 0: Understand the Codebase (Prerequisite)

Before reviewing any changes, build a mental model of the code being changed. **A review is only as good as the reviewer's understanding of the system** — flagging issues requires knowing what is normal, what is intentional, and what role each piece plays. Skipping this phase produces shallow reviews that miss context-dependent issues and generate false positives.

This phase is about **orientation, not analysis**. Resist the urge to start flagging issues — the goal is to know enough about the system that subsequent analysis is grounded in how the code actually works.

1. **Identify the touched components.** Look at the file list. What modules, services, or subsystems are affected? What role do these components play in the larger system?
2. **Learn the domain concepts.** What patterns, abstractions, or architectural ideas does this area rely on? If the changes touch unfamiliar territory (a new service, an unfamiliar framework, a specialized algorithm), read enough surrounding code and documentation to understand the basics before evaluating the diff. If the PR introduces a new pattern or changes an existing one, understand the pattern first.
3. **Map the relationships.** For each touched file, understand:
   - Its purpose — what is this file's single responsibility?
   - Its callers and dependencies — what calls into it, what does it call into?
   - Its place in the data and control flow — where does it sit in the pipeline?
4. **Make connections explicit.** As you encounter each file, connect it to what you already understand. If file B implements an interface defined in file A, note that link. If file C consumes data produced by file D, trace the flow. If a change requires knowing about surrounding code that did not change, learn that context too.

Only after you can articulate what this area of the codebase does and how the touched files fit together should you proceed to Step 1.

### Step 1: Gather Code Context

With a mental model of the codebase in place, collect the specific data points needed for analysis. **Do NOT read the PR description, linked issues, or existing review comments yet.** Form your own independent assessment before exposure to the author's framing — reading the narrative first anchors your judgment and makes you less likely to find real problems.

1. **Diff and file list**: Get the full diff and changed files.
2. **Full source files**: For every changed file, read the **entire source file** — not just diff hunks. Surrounding code reveals invariants, patterns, and data flow that diff-only review misses.
3. **Consumers and callers**: If the change modifies a public API or shared function, search for callers and usages. Understanding consumption reveals whether changes could break existing behavior or violate caller assumptions.
4. **Related code**: If the change fixes a bug or adds a pattern, check whether similar code elsewhere has the same issue or needs the same fix.
5. **Utility and helper files**: If the diff calls into shared utilities, read those to understand the contracts (thread-safety, idempotency, etc.).
6. **Git history**: Check recent commits to changed files (`git log --oneline -20 -- <file>`). Look for related changes, reverts, or prior fix attempts. This reveals whether the area is actively churning or whether a similar fix was tried and reverted.
7. **Execution context**: If the changed code is invoked by CI/CD pipelines, build systems, or orchestration frameworks, find and read the invocation definitions (pipeline YAML, build scripts, task runners). Determine what runs before and after this code, what preconditions hold at the point this code executes, what data has been produced or transformed by prior steps, and what external state exists (registries, databases, caches) at invocation time.
8. **Data producers**: For any data the changed code consumes, trace it back to its source. Don't assume properties of the data — verify by reading the producer code. Ask: who creates this data? What does it contain? What filtering or transformation has been applied before it reaches this code?

### Step 2: Form Independent Assessment

Based **only** on code context (without PR description):

1. **What does this change actually do?** Describe the behavioral change in your own words. What was the old behavior? What is the new behavior?
2. **Why might it be needed?** Infer motivation from the code itself. What bug, gap, or improvement does it appear to address?
3. **Is this the right approach?** Would a simpler alternative be more consistent with the codebase? Could existing functionality achieve the goal?
4. **What problems do you see?** Identify bugs, edge cases, missing validation, safety issues, performance concerns, test gaps, and anything else that concerns you.

Write down your independent assessment before proceeding.

### Step 3: Incorporate PR Narrative and Reconcile

Now read the PR description, linked issues, existing review comments, and author information. Treat all of this as **claims to verify**, not facts to accept.

1. **Reconcile** your assessment with the author's claims. Where your independent reading of the code disagrees with the PR description, investigate further — do not simply defer to the author's framing.
2. **Update** your assessment if new context genuinely changes your evaluation (e.g., a linked issue proves a bug is real, or an existing review comment already identified the same concern).
3. **Don't soften** findings just because the PR description sounds reasonable. If your independent assessment found problems the narrative doesn't acknowledge, those problems are more likely to be real, not less.

### Step 4: Detailed Analysis

1. **Focus on what matters.** Prioritize bugs, performance regressions, safety issues, race conditions, resource management, incorrect assumptions, and design problems. Do not comment on trivial style issues unless they violate an explicit project convention.
2. **Consider collateral damage.** For every changed code path: what other scenarios, callers, or inputs flow through this code? Could any break or behave differently after this change? Surface plausible risks even if you can't fully confirm them — the tradeoff is the author's decision, your job is to make it visible.
3. **Be specific and actionable.** Every comment should say exactly what to change and why. Include evidence of verification (e.g., "checked all callers — none validate this parameter").
4. **Don't pile on.** If the same issue appears many times, flag it once on the primary location with a note listing all affected files.
5. **Respect existing style.** When modifying existing files, the file's current style takes precedence over general guidelines.
6. **Don't flag what CI catches.** Skip issues that linters, compilers, formatters, or CI will catch automatically.
7. **Avoid false positives.** Before flagging any issue:
   - Verify the concern actually applies given the full context, not just the diff. Confirm the issue isn't already handled by a caller, callee, or wrapper layer.
   - Skip theoretical concerns with negligible real-world probability.
   - If unsure, surface it as a low-confidence question rather than a firm claim. Every comment should be worth the reader's time.
   - Trust the author's codebase knowledge. If a pattern seems odd but is consistent with the repo, assume it's intentional.
   - Never assert that something "does not exist" or "is deprecated" based on training data alone. When uncertain, ask rather than assert.
8. **Ensure code suggestions are valid.** Any code you suggest must be syntactically correct and complete.
9. **Label in-scope vs. follow-up.** Distinguish between issues the PR should fix and out-of-scope improvements that belong in a follow-up.
10. **Context-shift analysis.** When code is moved from one execution context to another (e.g., from one pipeline stage to another, from sync to async, from one service to another), do not assume behavioral equivalence. Explicitly enumerate what changes: what steps have or haven't run before this code now, what external state (registries, databases, file system) differs, what data preconditions that held in the old context no longer hold, and whether the same code pattern produces different outcomes in the new context. Treat "same code, different context" as a high-risk area. The claim "this pattern already existed" is insufficient — verify that the pattern is still correct in the new execution environment.

### Step 5: Multi-Model Critique

Run an adversarial review across multiple model families. Different models catch different classes of issues.

If you skip multi-model review for any reason — environment limitation, cost, time, or judgment — you MUST state this fact in the review output along with the reason (e.g., *"Multi-model review skipped: only one model family available in this environment."* or *"Multi-model review skipped: review is for exploratory draft code per author's request."*). Silent skips are not permitted.

**A confirmed finding does not justify skipping this step.** Confirming one bug tells you that bug is real; it tells you nothing about what else you missed. Coverage and finding-confidence are independent properties — do not conflate them.

1. **Select models**: Pick one model from each distinct family (e.g., one Anthropic, one Google, one OpenAI). Use 2-4 models. Pick from models explicitly listed as available — highest capability tier, never "mini" or "fast." Don't select your own model.
2. **Launch in parallel**: Give each agent the same review prompt (diff, review rules, severity format) and your independent assessment from Step 2.
3. **Synthesize**: Deduplicate shared findings, elevate issues flagged by multiple models (higher confidence), include unique findings that meet the confidence bar. When models **disagree on severity**, use the higher severity but note the disagreement — the reviewer can downgrade with context the models lack. When models **contradict** each other (one says it's a bug, another says it's correct), present both perspectives and mark the finding as needing human judgment.
4. **Timeout handling**: If a sub-agent hasn't completed after 10 minutes and you have other results, proceed. Note which models contributed.
5. **Carry into Step 6**: Step 6 (Grill) now operates on the synthesized findings, not your single-model findings alone. Note which findings came from which model so the grill can challenge each source.

### Step 6: Grill Your Assessment

Before producing the review output, interrogate your own assessment relentlessly. The biggest review failure modes are missed issues, overconfident findings, and verdicts shaped by hope rather than evidence — this step exists to catch them.

Walk down each branch of your reasoning one question at a time, resolving each before moving to the next. **If a question can be answered by exploring the codebase, explore it instead of speculating.** Do not skim through these questions as a checklist — each one is meant to genuinely challenge what you've concluded.

**Grill each finding:**
- Have I actually verified this is a problem, or am I pattern-matching on what a bug usually looks like? What is the concrete evidence?
- Could the author have a reason for this that I haven't considered? Is there context elsewhere in the codebase (a caller, a wrapper, a convention) that would justify it?
- If this finding turned out to be wrong, what is the most likely reason? Have I ruled that reason out?
- Is the severity honest, or am I inflating or deflating it to fit a desired verdict?

**Grill what you might have missed:**
- What is the most likely bug in this diff that I have *not* flagged? Why am I confident it isn't there?
- Which assumption did I make about surrounding code that I never actually verified?
- Which class of issue (concurrency, error handling, input validation, resource leaks, off-by-one, security, performance under load) did I not deliberately consider for this change?
- If this change interacts with code I didn't read, what could go wrong at that interaction point?
- Did I treat a single confirmed finding as proof the review is complete? A verified bug demonstrates one issue exists; it says nothing about coverage. If I leaned on "this finding feels concrete enough" to justify skipping rigorous validation (including Step 5), that is a coverage failure dressed up as confidence — re-open the question and complete the skipped work.

**Grill the verdict:**
- If this merges and causes a production incident, what is the most likely failure mode? Did I flag it?
- Am I leaning toward LGTM because the diff is small, looks clean, or matches familiar patterns — rather than because I verified correctness?
- Am I leaning toward "Needs Changes" to appear thorough, rather than because the findings warrant it?
- Would I defend this verdict if every ⚠️/❌ finding turned out to be wrong? Would I defend it if a real bug surfaced post-merge in code I called clean?

Resolve each question — do not just list them. If a question reveals a real gap, update the findings or verdict. If a question reveals overconfidence, downgrade severity or convert the finding to a question. If a question reveals you skipped a check, go do it now.

---

## Common Failure Modes

Patterns that reliably produce bad reviews. If you catch yourself doing any of these, restart the corresponding step rather than rationalizing past it.

- **Coverage-via-confirmation**: Finding one concrete bug and concluding the review is solid. Confirming a single issue says nothing about what you missed. Multi-model critique (Step 5) exists to address this; do not skip it on the strength of one finding.
- **Self-grill substitution**: Treating Step 6 (your own interrogation) as a substitute for Step 5 (independent models). They serve different purposes — introspection cannot surface what you don't know you don't know.
- **Effort-cost rationalization**: Skipping Step 5 because it would be slower, take more context, or cost more tokens. The skill requires it for merge-bound code; cost is not an approved exception. The only approved exceptions are environment limitation (no second model available) and explicitly-exploratory non-merge-bound code.
- **Narrative anchoring**: Reading the PR description, issue, or author comments before Step 2 and then "independently" reaching the same conclusions. Once you've seen the framing, you cannot un-see it.
- **Cleanliness bias**: Concluding LGTM because the diff is short, well-formatted, or matches familiar patterns — without verifying correctness against actual call sites, data flow, or edge cases.
- **Findings-inflation to look thorough**: Inventing or stretching findings to justify a "Needs Changes" verdict. Every finding must be actionable; padding dilutes the signal.

---

## Severity Classification

| Severity | When to use | Examples |
|----------|-------------|---------|
| ❌ **Error** | Must fix before merge | Bugs, security vulnerabilities, data corruption, missing error handling on critical paths |
| ⚠️ **Warning** | Should fix or needs human judgment | Performance regressions, missing validation, inconsistency with established patterns |
| 💡 **Suggestion** | Consider changing | Readability improvements, minor optimizations, naming clarity |

If unsure between two levels, choose the higher one.

**Only surface actionable findings.** Do not include positive confirmations, "looks good" notes, or commentary praising correct code. A finding earns its place in the review only if the reader can act on it — fix it, decide on it, or push back on it. If you have nothing actionable to report, the review can be empty findings with a clean verdict.

---

## Pre-Output Checklist

Before producing the review, confirm each item — do not write the output until all four are true. If any item is false, return to the corresponding step and complete it.

- [ ] **Multi-model critique** (Step 5) was completed, OR the skip and its reason are documented in the review output itself.
- [ ] **Every grill question** in Step 6 has a written, reasoned answer — not just a thought. If a question revealed a gap, the findings or verdict have been updated.
- [ ] **Every finding cites concrete evidence** — file:line reference, observed behavior, test outcome, or quoted code. No findings based purely on pattern-matching or speculation.
- [ ] **The verdict is justified independently** of how "clean" the diff looks, the author's reputation, or how much you trust the PR description. Re-read the verdict with the question: would I defend this if a bug surfaced in code I called clean?

---

## Review Output Format

### Structure

```
## 🤖 Code Review

### Holistic Assessment

**Motivation**: <1-2 sentences on whether the change is justified and the problem is real>

**Approach**: <1-2 sentences on whether the approach is sound>

**Summary**: <✅ LGTM / ⚠️ Needs Human Review / ⚠️ Needs Changes / ❌ Reject>. <2-3 sentence verdict with key points. If "Needs Human Review," state which findings you are uncertain about and what a human reviewer should focus on.>

---

### Detailed Findings

#### ⚠️/❌/💡 <Category> — <Brief description>

<Explanation with specifics. Reference code, line numbers, evidence.>

(Repeat for each finding. Group related findings under a single heading.)
```

### Verdict Rules

1. **The verdict must reflect your most severe finding.** If you have any ⚠️ findings, the verdict cannot be LGTM. Only use LGTM when there are no ❌ or ⚠️ findings and you are confident the change is correct and complete.
2. **When uncertain, always escalate.** If you are unsure whether a concern is valid, the verdict must be "Needs Human Review" — not LGTM. A false LGTM is far worse than an unnecessary escalation.
3. **Separate correctness from completeness.** A change can be correct code that is an incomplete approach. If the code is right for what it does but the approach is insufficient (e.g., treats symptoms without root cause, masks errors, fixes one instance but not others), the verdict must reflect the gap.
4. **Classify each ⚠️/❌ finding as merge-blocking or advisory.** Before writing your summary, decide for each: "Would I be comfortable if this merged as-is?" Any "no" → Needs Changes. Any "unsure" → Needs Human Review.

### Re-Review (Iteration)

When reviewing updated code after a prior review round:

1. **Focus on what changed.** Re-review the new diff, not the entire PR from scratch. Check whether each prior finding was addressed.
2. **Track prior findings.** For each finding from the previous review, classify it as: resolved, partially addressed, unaddressed, or disagreed-upon.
3. **Handle disagreements with evidence.** If the author disagrees with a finding, evaluate their reasoning. If they provide a valid argument or evidence (test results, documentation, codebase conventions), update or withdraw the finding. If their reasoning is insufficient, restate the concern with additional evidence.
4. **Don't introduce new scope.** A re-review should not raise new issues on unchanged code unless a prior finding's resolution reveals a new problem.
5. **Update the verdict.** The re-review verdict applies to the current state of the code, not relative to the prior review.

---

## What to Look For

### Holistic Assessment

Evaluate the change as a whole before reviewing individual lines.

**Motivation & Justification:**
- Does the change articulate what problem it solves and why? Don't accept vague or absent motivation.
- Challenge every addition with "Do we need this?" New code, APIs, and abstractions must justify their existence.
- Demand real-world evidence. Hypothetical benefits are insufficient motivation for expanding surface area.

**Evidence & Data:**
- Performance changes require benchmark evidence — never accept optimization claims at face value.
- Distinguish real performance wins from micro-benchmark noise. Require evidence from realistic, varied inputs.
- Regressions in specific scenarios must be understood and explained, even if there's a net improvement.

**Approach & Alternatives:**
- Does the PR solve the right problem at the right layer? Prefer root cause fixes over workarounds.
- When a PR takes a fundamentally wrong approach, redirect early. Don't iterate on details of a flawed design.
- Always ask "Why not just X?" — prefer the simplest solution. The burden of proof is on the complex approach.

**Cost-Benefit & Complexity:**
- Weigh whether the change is a net positive. A tradeoff that shifts costs around is not automatically beneficial.
- Reject overengineering — complexity is a first-class cost. Unnecessary abstraction for marginal gains is harmful.
- Every addition creates a maintenance obligation. Long-term cost outweighs short-term convenience.

**Scope & Focus:**
- Require large or mixed PRs to be split into focused changes. Each PR should address one concern.
- Defer tangential improvements to follow-up PRs. Even good ideas should wait if they're not part of the core purpose.

**Risk & Compatibility:**
- Flag breaking changes and require documentation. Behavioral changes affecting downstream consumers need explicit acknowledgment.
- Assess regression risk proportional to the change's blast radius. High-risk changes to stable code need proportionally higher value and more thorough validation.

**Codebase Fit:**
- Ensure new code matches existing patterns and conventions. Deviations create confusion.
- Check whether a similar approach has been tried and rejected before. If so, require a clear explanation of what's different.

### Correctness & Safety

**Error Handling:**
- Are error paths handled appropriately? Check for silent failures, swallowed exceptions, uninitialized outputs.
- Include actionable details in error messages — the context needed to diagnose the problem.
- Challenge exception swallowing. When code silently catches and discards errors, question whether the exception represents a truly expected condition or masks a deeper problem. Silently catching errors "that shouldn't happen" hides root causes.
- Ensure output parameters and return values are initialized in all code paths, including error paths.

**Thread Safety:**
- Fields written on one thread and read on another must use appropriate synchronization (atomics, locks, volatile access).
- Watch for race conditions in lazy initialization, caching patterns, and compound check-then-act sequences.
- Use 64-bit counters for timeout calculations to avoid integer overflow.

**Security:**
- Guard integer arithmetic against overflow in size computations, especially multiplication.
- Clean sensitive data (keys, tokens, credentials) after use.
- Don't send credentials proactively without explicit opt-in.
- Limit stack-based allocations with user-controlled sizes.
- Validate and sanitize inputs at trust boundaries.

**Correctness Patterns:**
- Fix root cause, not symptoms. Investigate the source of an issue rather than adding workarounds.
- Prefer safe code over unsafe micro-optimizations without demonstrated performance need.
- Delete dead code, unnecessary wrappers, and unused variables when encountered.
- Prefer correct-by-construction designs over manually maintained parallel data structures.
- Seal types when equality implementations use exact type matching.

### Performance

- **Require benchmark evidence for optimization claims.** Performance changes without numbers have a high probability of being regressions in practice.
- **Avoid premature optimization.** Don't introduce caches, pools, or complex data structures without evidence they're needed. Prefer making the underlying operation faster.
- **Avoid allocations in hot paths.** Watch for closures capturing locals, unnecessary string operations, boxing, and intermediate collections.
- **Pre-allocate collections when size is known.**
- **Place cheap checks before expensive operations.** Order conditionals so cheapest/most-common checks come first.
- **Avoid O(n²) patterns.** Watch for linear scans inside loops, repeated removal from the middle of lists.
- **Allocate resources lazily where possible.** Avoid forcing initialization during startup.
- **Cache repeated expensive calls in locals** when a value is accessed multiple times.
- **Consider scalability, not just throughput.** Evaluate whether solutions hold up at high cardinality or under concurrent load.

### API Design

- **Parameters and contracts must be consistent.** Validate arguments in a consistent order, throw consistent exception types.
- **Follow the project's established API conventions.** Check for existing patterns before introducing new ones.

### Testing

- **Add regression tests for bug fixes and behavior changes.** Every behavioral change needs a test that fails without the fix and passes with it.
- **Test edge cases, error paths, and boundary conditions.** Include empty inputs, negative values, boundary values, and invalid states. Choose inputs that can't accidentally pass if the output wasn't touched.
- **Test assertions must be specific.** Assert exact expected values, not broad conditions like "not null" or "greater than zero."
- **Make test data deterministic.** Avoid culture-dependent, time-dependent, or order-dependent test data.
- **Delete flaky tests rather than patching them.** Do not add tests known to be unreliable.
- **Catch only expected exceptions** in error-path tests. Broad catches mask bugs like undocumented exceptions.

### Code Style

- **Use named constants instead of magic numbers.** Raw hex or decimal constants without explanation are unacceptable.
- **Name methods and variables to accurately reflect behavior.** Update names when behavior changes.
- **Prefer early return to reduce nesting.** Put the error case first, success return last.
- **Narrow warning/lint suppressions to the smallest possible scope.**
- **Match existing style in modified files.** The file's current conventions take precedence over general guidelines.

### Documentation

- **Comments should explain why, not restate code.** Delete comments that just duplicate the code in English.
- **Delete or update stale comments when code changes.** Outdated comments are worse than no comments.
- **Track deferred work with issues, not permanent TODOs.** Reference tracking issues in TODO comments so they can be found and addressed.
- **Don't duplicate documentation** across interface and implementation. Put it on the interface.

### Codebase Consistency

- **Extract duplicated logic into shared helpers.** Fix improvements inside helpers so all callers benefit.
- **Use existing APIs instead of creating parallel ones.** Before introducing new types or helpers, check if existing ones serve the same purpose.
- **Delete dead code and unused declarations aggressively.**
- **Keep PRs focused.** No unrelated refactoring, whitespace noise, accidental file modifications, or build artifacts.
- **Do large refactorings in separate PRs from functional changes.** Separate mechanical changes from logic changes.

### Dependencies & Supply Chain

- **Scrutinize new dependencies.** Every new package introduces supply chain risk and maintenance burden. Verify the package is well-maintained, widely used, and necessary — could the functionality be achieved with existing dependencies or a small utility?
- **Review version bumps.** Check changelogs for breaking changes, security fixes, or behavior changes. Major version bumps deserve extra scrutiny.
- **Watch for dependency sprawl.** Multiple packages solving similar problems (e.g., two HTTP clients, two date libraries) indicate a lack of standardization.
- **Check for known vulnerabilities** in added or updated dependencies when tools are available.

### Observability

- **Ensure changes are diagnosable in production.** New features and error paths should emit appropriate logs, metrics, or traces. If something goes wrong, can an operator figure out what happened?
- **Don't log sensitive data.** Credentials, PII, and tokens must never appear in logs.
- **Preserve existing observability.** If refactoring removes or changes logging/metrics, verify the information is still available through another path.
