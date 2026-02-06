---
name: requesting-code-review
description: Use between implementation tasks to ensure quality and spec compliance
inclusion: always
---

# Requesting Code Review

## Overview

Systematic code review process to catch issues early and ensure quality. Reviews happen at multiple stages: after each task, and before completion.

## When to Use

- After completing implementation tasks
- Before merging features
- When making significant changes
- As part of subagent-driven development workflow

## Two-Stage Review Process

### Stage 1: Spec Compliance Review

**Focus:** Does the code match the specification exactly?

**Questions to ask:**
- Are all requirements implemented?
- Is anything extra added that wasn't requested?
- Does behavior match the spec precisely?
- Are edge cases from spec handled?

**Pass criteria:** Code implements exactly what was specified, nothing more, nothing less.

### Stage 2: Code Quality Review

**Focus:** Is the code well-built and maintainable?

**Areas to examine:**
- **Structure:** Clear organization, appropriate abstractions
- **Readability:** Clear names, good comments, logical flow
- **Testing:** Comprehensive test coverage, good test design
- **Error Handling:** Appropriate error handling and edge cases
- **Performance:** No obvious performance issues
- **Security:** No security vulnerabilities
- **Best Practices:** Follows language/framework conventions

## Review Checklist

### Functionality
- [ ] Code does what it's supposed to do
- [ ] All requirements implemented
- [ ] Edge cases handled appropriately
- [ ] Error conditions handled gracefully

### Code Quality
- [ ] Clear, descriptive names for variables/functions/classes
- [ ] Functions are focused and single-purpose
- [ ] No code duplication (DRY principle)
- [ ] No unnecessary complexity (YAGNI principle)
- [ ] Consistent formatting and style

### Testing
- [ ] Tests exist for new functionality
- [ ] Tests follow TDD principles (were written first)
- [ ] Tests cover edge cases and error conditions
- [ ] Tests are clear and maintainable
- [ ] All tests pass

### Documentation
- [ ] Code is self-documenting with clear names
- [ ] Complex logic has explanatory comments
- [ ] Public APIs are documented
- [ ] README updated if needed

## Review Severity Levels

**Critical (Must Fix):**
- Security vulnerabilities
- Data corruption risks
- Spec violations
- Broken functionality

**Important (Should Fix):**
- Performance issues
- Maintainability problems
- Test coverage gaps
- Code style violations

**Minor (Nice to Fix):**
- Naming improvements
- Comment additions
- Minor refactoring opportunities

## Review Response Process

When receiving review feedback:

1. **Acknowledge all feedback** - Show you've read and understood
2. **Fix critical issues immediately** - Don't proceed until resolved
3. **Address important issues** - Fix or explain why not
4. **Consider minor suggestions** - Implement if they improve code
5. **Ask for clarification** - If feedback is unclear
6. **Request re-review** - After making changes

## Self-Review Before Requesting

Before asking for review, do your own check:

1. **Read through all changes** - Fresh eyes catch issues
2. **Run all tests** - Ensure nothing is broken
3. **Check against spec** - Verify requirements met
4. **Look for common issues** - Naming, duplication, complexity
5. **Consider edge cases** - What could go wrong?

## Integration with Other Skills

**Workflow integration:**
- **subagent-driven-development** uses this for two-stage reviews
- **test-driven-development** ensures tests exist before review
- **systematic-debugging** uses this to verify bug fixes
- **finishing-a-development-branch** includes final review step

**Review timing:**
- After each implementation task (in subagent workflow)
- Before merging branches
- After bug fixes
- When making architectural changes