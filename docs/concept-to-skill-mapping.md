# Extracted Concepts → Skill Enhancement Mapping

**Created**: 2025-10-22
**Purpose**: Map 14 extracted concepts from consolidation to existing skills for enhancement

---

## Concept Overview

From the consolidation effort, we extracted 14 valuable concepts that aren't full skills but represent patterns worth incorporating. This document maps each concept to existing skills that could benefit from these patterns.

---

## High-Priority Enhancements

### 1. External Source Adaptation → brainstorming

**Source Concept**: (from CCPlugins/implement)
- GitHub URLs/docs pattern matching to project architecture
- Smart repo sampling (test files, core modules, docs)
- source-analysis.md artifact generation
- Dependency resolution

**Target Skill**: `skills/brainstorming/SKILL.md`

**Enhancement Value**: HIGH
- Brainstorming phase often references external examples/patterns
- "Inspired by X" is common in design discussions
- Could add "Reference Analysis" phase that examines external sources systematically
- Pattern: Analyze reference → Extract applicable patterns → Map to current project

**Specific Addition**:
```markdown
## When Working with External References

If your partner references external code, repos, or patterns:

1. **Smart sampling**: Focus on tests (behavior), core modules (patterns), README (architecture)
2. **Pattern extraction**: What conventions does it follow? What problems does it solve?
3. **Context mapping**: How does their context differ from ours? What translates? What doesn't?
4. **Document insights**: Create `design-notes/reference-analysis.md` capturing learnings

Don't copy blindly. Understand, extract, adapt.
```

---

### 2. Continuous Validation → executing-plans

**Source Concept**: (from CCPlugins/refactor)
- Validate after EVERY change
- De-para mapping (detect parameter changes, update all call sites)
- Auto-fix broken references
- Multi-phase validation gates

**Target Skill**: `skills/executing-plans/SKILL.md`

**Enhancement Value**: HIGH
- executing-plans runs through batches of tasks
- Currently: review between batches
- Enhancement: validation WITHIN batches after each task

**Specific Addition**:
```markdown
## Validation Within Batches

After EACH task in a batch:

1. **Type check**: Run mypy/tsc/equivalent immediately
2. **Reference check**: Grep for potential broken call sites if you changed signatures
3. **Test subset**: Run tests related to changed files (not full suite)
4. **Fix forward**: If validation fails, fix it before next task

Don't accumulate validation debt. Each task leaves codebase in valid state.

Exception: Refactors that intentionally break across multiple files (document the plan, validate at batch boundary).
```

---

### 3. Proactive Issue Discovery → requesting-code-review

**Source Concept**: (from CCPlugins/contributing)
- Scan remote repo for matching issues
- Smart matching algorithm (keywords, labels, similar titles)
- Context detection
- Mandatory pre-flight checks

**Target Skill**: `skills/requesting-code-review/SKILL.md`

**Enhancement Value**: MEDIUM
- Code review skill already has comprehensive checklist
- Enhancement: Add pre-flight check for existing related issues/PRs

**Specific Addition**:
```markdown
## Pre-flight: Check for Related Work

Before requesting code review:

1. **Search issues**: Look for existing issues related to your changes
   - Search by keywords from your implementation
   - Check labels (bug, enhancement, etc.)
2. **Search PRs**: Look for similar or conflicting PRs
   - Open PRs that might conflict
   - Closed PRs that solved similar problems (learn from their approach)
3. **Document findings**: If found, reference in PR description
   - "Fixes #123"
   - "Related to #456"
   - "Alternative approach to closed PR #789"

This prevents duplicate work and provides context for reviewers.
```

---

### 4. Auto-fix Patterns → systematic-debugging

**Source Concept**: (from CCPlugins/test)
- Common test failure patterns (async/timing, mocks, imports)
- Log/console diagnostics
- Context-aware test selection
- Flaky test detection

**Target Skill**: `skills/systematic-debugging/SKILL.md`

**Enhancement Value**: MEDIUM-HIGH
- systematic-debugging is comprehensive but doesn't have test-specific patterns
- These are battle-tested failure patterns worth documenting

**Specific Addition**:
```markdown
## Common Test Failure Patterns

When investigating test failures, check these common patterns first:

### Async/Timing Issues
- **Symptom**: Test passes sometimes, fails sometimes
- **Check**: Are you awaiting all promises? Using proper async test syntax?
- **Pattern**: Missing `await`, forgotten `async`, race conditions
- **Fix**: Add awaits, use condition-based waiting (not arbitrary timeouts)

### Mock/Stub Issues
- **Symptom**: "X is not a function" or unexpected values
- **Check**: Are mocks properly set up? Restored between tests?
- **Pattern**: Mock not matching real signature, stale mocks, improper cleanup
- **Fix**: Match real signatures, use beforeEach/afterEach, verify mock calls

### Import Issues
- **Symptom**: "Cannot find module" or wrong module loaded
- **Check**: Import paths correct? Module resolution working?
- **Pattern**: Relative vs absolute imports, circular dependencies, missing __init__.py
- **Fix**: Consistent import style, break circular deps, check module structure

### Flaky Tests
- **Symptom**: Test fails in CI but passes locally (or vice versa)
- **Check**: Environment dependencies? Timing assumptions? Test isolation?
- **Pattern**: Hardcoded paths, timezone dependencies, shared state between tests
- **Fix**: Use fixtures for paths, explicit timezone handling, proper test isolation

Don't debug blind. Recognize patterns, apply known fixes.
```

---

### 5. Pattern Discovery → writing-plans

**Source Concept**: (from CCPlugins/scaffold)
- Analyze codebase to understand conventions
- Replicate existing patterns
- Incremental generation with checkpoints

**Target Skill**: `skills/writing-plans/SKILL.md`

**Enhancement Value**: MEDIUM
- writing-plans creates implementation tasks
- Enhancement: Add "pattern survey" step before detailed planning

**Specific Addition**:
```markdown
## Step: Survey Existing Patterns (for implementation plans)

Before writing detailed implementation tasks, understand the codebase conventions:

1. **Find similar features**: Search for existing implementations similar to what you're building
2. **Extract patterns**: How are they structured? What conventions do they follow?
   - File organization (where do similar files live?)
   - Naming conventions (how are similar classes/functions named?)
   - Testing patterns (how are similar features tested?)
   - Import patterns (how are dependencies imported?)
3. **Document conventions**: Capture patterns in plan
4. **Design for consistency**: Follow discovered patterns unless you have strong reason to diverge

Example:
```
## Existing Patterns Survey
- Similar feature: User authentication (src/auth/)
- File pattern: {feature}/handlers.py, {feature}/models.py, {feature}/tests/
- Naming: Use FooHandler classes, handle_foo() functions
- Testing: Each handler has corresponding test_handlers.py with pytest fixtures
→ Our feature should follow same structure
```

Consistency makes codebases learnable. Replicate good patterns.
```

---

### 6. Vulnerability Assessment → predict-issues

**Source Concept**: (from CCPlugins/security-scan)
- Multi-dimensional security analysis
- Risk-based prioritization
- Extended thinking for complex threats
- Safe remediation patterns

**Target Skill**: `skills/predict-issues/SKILL.md`

**Enhancement Value**: MEDIUM
- predict-issues has risk framework (likelihood × impact × timeline × effort)
- Enhancement: Add security-specific risk dimensions

**Specific Addition**:
```markdown
## Security-Specific Risk Analysis

When analyzing potential security issues:

### Additional Risk Dimensions
- **Exploitability**: How easily can this be exploited? (trivial/moderate/difficult)
- **Exposure**: What's exposed? (credentials/data/system access)
- **Blast radius**: Impact if exploited? (single user/all users/system compromise)

### Common Security Anti-patterns to Check
1. **Credentials in code**: Hardcoded API keys, passwords, tokens
2. **Injection vulnerabilities**: SQL injection, command injection, XSS
3. **Broken authentication**: Weak session management, missing validation
4. **Insecure dependencies**: Known CVEs in dependencies
5. **Insufficient logging**: Can't detect or investigate incidents
6. **Missing input validation**: Trusting user input without sanitization

### Risk Scoring for Security Issues
```
Security Risk = Exploitability × Exposure × Blast Radius

Examples:
- Hardcoded API key in public repo: 1.0 × 1.0 × 0.8 = 0.80 (CRITICAL)
- Missing input validation on admin endpoint: 0.7 × 0.9 × 0.9 = 0.57 (HIGH)
- Outdated dependency with theoretical vulnerability: 0.3 × 0.5 × 0.6 = 0.09 (LOW)
```

Prioritize by exploitability first, exposure second, blast radius third.
```

---

### 7. Systematic Codebase Analysis → test-driven-development

**Source Concept**: (from CCPlugins/understand)
- 5-phase discovery process
- Technology stack detection
- Pattern recognition
- Integration point mapping

**Target Skill**: `skills/test-driven-development/SKILL.md`

**Enhancement Value**: LOW-MEDIUM
- TDD is focused on RED-GREEN-REFACTOR cycle
- Enhancement: Add "context gathering" pre-step for unfamiliar codebases

**Specific Addition**:
```markdown
## Before RED-GREEN-REFACTOR: Understand the Context

When applying TDD in unfamiliar codebase:

1. **Find similar tests**: Locate tests for similar features
2. **Understand test patterns**: How are tests structured? What helpers exist?
   - Test file organization
   - Fixture patterns
   - Assertion style
   - Mock/stub patterns
3. **Identify integration points**: What dependencies will your feature interact with?
4. **Check test utilities**: What test helpers/factories exist?

Then proceed with RED-GREEN-REFACTOR following established patterns.

Don't invent new test patterns. Match existing style first, improve later if needed.
```

---

### 8. Pre-commit Quality Gates → verification-before-completion

**Source Concept**: (from CCPlugins/commit)
- MUST run build/test/lint before commit
- Commit message generation from change analysis
- Conventional commit format

**Target Skill**: `skills/verification-before-completion/SKILL.md`

**Enhancement Value**: HIGH
- verification-before-completion already has verification commands requirement
- Enhancement: Make it more explicit about WHAT to run and WHEN

**Specific Addition**:
```markdown
## Quality Gates Checklist

Before claiming work is complete, run these in order:

### 1. Type Check
```bash
# Python
uv run mypy src/

# TypeScript
npm run type-check
```

### 2. Lint
```bash
# Python
uv run ruff check src/

# TypeScript
npm run lint
```

### 3. Format Check
```bash
# Python
uv run ruff format --check src/

# TypeScript
npm run format:check
```

### 4. Tests
```bash
# Run full test suite
uv run pytest
npm test

# Or if that's slow, at minimum run affected tests
uv run pytest tests/test_affected_module.py
```

### 5. Build (if applicable)
```bash
npm run build
docker build .
```

**All must pass**. If any fail:
- Fix the issues
- Re-run from step 1 (earlier steps might now fail)
- Don't claim complete until all gates pass

No "tests pass except for..." or "build works on my machine". Gates are binary.
```

---

## Medium-Priority Enhancements

### 9. Progressive Reasoning Framework → brainstorming

**Source Concept**: (from claude-codex-settings/update-pr-summary)
- Open-ended exploration before patterns
- Multi-lens categorization
- Systematic verification with test cases
- Steel man reasoning
- Bias detection
- Alternative perspective simulation

**Target Skill**: `skills/brainstorming/SKILL.md`

**Enhancement Value**: MEDIUM
- Brainstorming already has rigorous phases
- Enhancement: Add "challenge your assumptions" phase

**Specific Addition**:
```markdown
## Phase 4.5: Challenge Your Design (before finalizing)

Before exiting brainstorming, stress-test your design:

1. **Steel man the alternatives**: What's the BEST argument for approaches you rejected?
2. **Bias check**: Are you favoring this because it's familiar? Trendy? Comfortable?
3. **Simulate perspectives**:
   - **Operations**: "How do I debug this in production?"
   - **Future maintainer**: "How do I modify this in 6 months?"
   - **Security**: "How do I exploit this?"
4. **Test cases for the design**: Can you describe scenarios that would prove/disprove this approach?

If you can't defend your design against these challenges, return to exploration.
```

---

### 10. Documentation Synchronization → finishing-a-development-branch

**Source Concept**: (from claude-codex-settings/pr-manager)
- Review diff to identify affected docs
- Update before PR creation
- Inline markdown links to code
- Source verification for claims
- PR formatting standards

**Target Skill**: `skills/finishing-a-development-branch/SKILL.md`

**Enhancement Value**: MEDIUM
- finishing-a-development-branch checks for completion
- Enhancement: Add documentation sync check

**Specific Addition**:
```markdown
## Documentation Sync Check

Before considering branch complete:

1. **Review your changes**: `git diff main...HEAD`
2. **Ask**: What docs need updating?
   - Did you add/change public APIs? → Update API docs
   - Did you change behavior? → Update relevant guides
   - Did you add dependencies? → Update installation docs
   - Did you change config? → Update configuration docs
3. **Update documentation**: Make changes in same branch
4. **Verify claims**: If docs reference code, ensure references are accurate
5. **Link to code**: Use relative links so docs stay synchronized
   - Example: `See [UserHandler](../src/handlers/user.py:45)`

Documentation drift = technical debt. Sync before merging.
```

---

### 11. Multi-commit Splitting → finishing-a-development-branch

**Source Concept**: (from claude-codex-settings/commit-manager)
- Determine logical commit groupings
- Precise file management for splits
- README sync before commits
- Big picture messages

**Target Skill**: `skills/finishing-a-development-branch/SKILL.md`

**Enhancement Value**: LOW-MEDIUM
- This is a specific technique, not universal
- Enhancement: Add as optional "clean history" section

**Specific Addition**:
```markdown
## Optional: Clean Commit History

If your branch has messy commits and you want clean history:

### When to Clean
- Multiple "WIP" or "fix" commits
- Logical changes spread across multiple commits
- Want each commit to be independently reviewable

### How to Clean
```bash
# Interactive rebase to main
git rebase -i main

# In editor:
# - Use 'squash' to combine related commits
# - Use 'reword' to improve commit messages
# - Use 'edit' to split commits

# To split a commit:
# - Mark commit as 'edit' in rebase
# - When it stops: git reset HEAD^
# - Stage and commit in logical groups
# - Continue: git rebase --continue
```

### Logical Grouping
Group changes by:
- Feature vs tests vs docs
- Refactoring vs new functionality
- Public API vs implementation details

Each commit should be independently understandable and (ideally) pass tests.

**Only do this before pushing/before PR**. Don't rewrite published history.
```

---

### 12. Pattern Alignment → receiving-code-review

**Source Concept**: (from claude-codex-settings/code-simplifier)
- Search codebase for similar implementations
- Smart keyword-based search
- Pattern comparison framework
- Proactive duplicate detection
- Over-engineering prevention

**Target Skill**: `skills/receiving-code-review/SKILL.md`

**Enhancement Value**: MEDIUM
- receiving-code-review handles feedback application
- Enhancement: Add "pattern alignment check" before implementation

**Specific Addition**:
```markdown
## Pattern Alignment Check

Before implementing reviewer feedback, check for existing patterns:

### If Reviewer Says: "Extract this to a helper function"
1. **Search**: Do similar helpers exist already?
   ```bash
   rg "def.*helper" --type py
   grep -r "formatUser" src/
   ```
2. **Compare**: If found, does existing helper solve same problem?
3. **Decide**:
   - Use existing helper (best)
   - Extend existing helper to handle both cases (good)
   - Create new helper only if truly different (rare)

### If Reviewer Says: "This pattern seems complex"
1. **Search**: How do we solve similar problems elsewhere?
2. **Compare**: Is your approach consistent or outlier?
3. **Decide**:
   - Match existing pattern if it works
   - Propose refactoring BOTH if existing pattern is also bad
   - Justify uniqueness if your case truly differs

Reviewers often spot inconsistency. Use it as prompt to align or improve patterns.
```

---

## Lower-Priority / Specialized Enhancements

### 13. Git Notes Retrospective Annotation

**Source Concept**: (from superclaude)
- Add AI-generated explanatory notes to existing commit history
- Using `git notes` system
- Viewable with `git log --show-notes`

**Target Skill**: Could create new skill: `skills/meta/annotating-git-history/`

**Enhancement Value**: LOW
- Very specialized technique
- Not commonly used
- Git notes aren't well-known or widely adopted
- Better as standalone skill if needed at all

**Recommendation**: **SKIP** - Too specialized, low ROI. If Jacob wants this later, create dedicated skill.

---

### 14. Multi-level Changelog Framework

**Source Concept**: (from superclaude)
- Daily (tactical/conversational)
- Weekly (thematic/mixed audience)
- Monthly (strategic/stakeholder)
- Audience-appropriate language

**Target Skill**: Could enhance `skills/documentation-management/SKILL.md`

**Enhancement Value**: LOW-MEDIUM
- Very specific changelog methodology
- Most projects don't need multi-level changelogs
- Could be useful for larger projects

**Specific Addition** (if desired):
```markdown
## Changelog Strategy (for multi-audience projects)

If your project has multiple audiences, consider multi-level changelogs:

### Daily/Sprint Changelog (Development Team)
- Tactical changes
- Technical detail
- Links to PRs/commits
- Conversational tone
- Example: "Fixed race condition in user service (PR #123)"

### Release Changelog (Mixed Audience)
- Feature-focused
- Balance technical & user-facing
- Group by theme (Features, Fixes, Breaking Changes)
- Example: "Added webhook support for real-time notifications"

### Monthly/Quarterly Summary (Stakeholders)
- Strategic outcomes
- Business impact
- High-level themes
- Non-technical language
- Example: "Improved system reliability, reducing downtime by 40%"

Match detail level to audience technical depth.
```

**Recommendation**: Include only if Jacob's projects need multi-level changelogs. Otherwise **SKIP**.

---

## Enhancement Priority Summary

### HIGH Priority (Implement ASAP)
1. ✅ External Source Adaptation → brainstorming
2. ✅ Continuous Validation → executing-plans
3. ✅ Pre-commit Quality Gates → verification-before-completion

### MEDIUM-HIGH Priority (Strong ROI)
4. ✅ Auto-fix Patterns → systematic-debugging
5. ✅ Vulnerability Assessment → predict-issues

### MEDIUM Priority (Valuable additions)
6. ✅ Pattern Discovery → writing-plans
7. ✅ Proactive Issue Discovery → requesting-code-review
8. ✅ Progressive Reasoning Framework → brainstorming
9. ✅ Documentation Synchronization → finishing-a-development-branch
10. ✅ Pattern Alignment → receiving-code-review

### LOW-MEDIUM Priority (Situational value)
11. ✅ Systematic Codebase Analysis → test-driven-development
12. ✅ Multi-commit Splitting → finishing-a-development-branch

### LOW Priority / SKIP
13. ❌ Git Notes Retrospective Annotation (too specialized)
14. ❌ Multi-level Changelog Framework (too specific)

---

## Implementation Approach

For each enhancement:

1. **Read target skill**: Understand current structure and content
2. **Identify insertion point**: Where does concept fit naturally?
3. **Write enhancement**: Follow skill's existing voice and format
4. **Verify consistency**: Check it doesn't conflict with existing content
5. **Test readability**: Ensure it flows naturally
6. **Commit**: One enhancement per commit with clear message

Example commit message:
```
enhance(brainstorming): add external source adaptation pattern

Adds systematic approach for analyzing external references/repos
during brainstorming phase. Pattern extracted from CCPlugins/implement
command during consolidation.

- Smart sampling strategy (tests, core, docs)
- Pattern extraction framework
- Context mapping to current project
- Artifact generation (design-notes/reference-analysis.md)
```

---

## Success Criteria

- [ ] All HIGH priority enhancements implemented
- [ ] At least 75% of MEDIUM priority enhancements implemented
- [ ] Each enhancement feels natural within target skill
- [ ] No redundancy or conflicts created
- [ ] Concepts seamlessly integrated, not bolted on
- [ ] All enhancements tested by reading enhanced skill start-to-finish

---

## Notes

- Prioritization based on: frequency of use, broad applicability, concrete value
- Some concepts (git notes, multi-level changelogs) too specialized for base skills
- Focus on patterns that enhance existing workflows, not niche techniques
- Each enhancement should make target skill more valuable without bloat
