---
name: predict-issues
description: Use when completing features, before deployment, or during code reviews - identifies potential problems through systematic risk analysis (likelihood × impact × timeline × effort)
---

# Predict Issues

## Overview

Proactive problem identification prevents issues before they impact projects. Analyze codebases for patterns that commonly lead to problems, assess risk systematically, and provide actionable recommendations with priority levels.

## When to Use

- After implementing features
- Before deployment
- During architecture reviews
- When evaluating technical decisions
- During code reviews for new functionality

## Risk Assessment Framework

Evaluate each potential issue across four dimensions:

| Dimension | Assessment |
|-----------|-----------|
| **Likelihood** | How probable is this issue? Consider code patterns, usage patterns, scale trends |
| **Impact** | How severe would consequences be? Downtime, data loss, security breach, poor UX |
| **Timeline** | When might this become a problem? Immediate, weeks, months, at 10x scale |
| **Effort** | How hard to fix now vs later? Technical debt cost, refactoring complexity |

## Problem Categories

Focus analysis on these common categories:

**Performance**
- O(n²) algorithms that break at scale
- Memory leaks and resource exhaustion
- Inefficient database queries (N+1, missing indexes)
- Unoptimized API calls

**Maintainability**
- High cyclomatic complexity
- Poor naming and unclear intent
- Tight coupling between components
- Code duplication across modules

**Security**
- Input validation gaps
- Exposed secrets or credentials
- Weak authentication patterns
- Missing authorization checks

**Scalability**
- Hardcoded limits and assumptions
- Single points of failure
- Stateful designs that don't scale horizontally
- Resource bottlenecks

## Analysis Process

1. **Identify risk areas**: Use Grep to find problematic patterns, Glob to analyze file structure growth, Read to examine complex functions
2. **Assess each issue**: Apply risk framework (likelihood × impact × timeline × effort)
3. **Prioritize findings**: Rank by risk level (Critical/High/Medium/Low)
4. **Provide recommendations**: Specific, actionable fixes with effort estimates

## Output Format

For each prediction:
- **Location**: Specific file and line references (e.g., [auth.ts:42](auth.ts#L42))
- **Problem**: What pattern will cause issues and why
- **Risk assessment**: Likelihood, impact, timeline, effort to fix
- **Recommendation**: Concrete steps to prevent the problem
- **Priority**: Critical/High/Medium/Low based on risk dimensions

## Common Patterns to Check

**Complexity hotspots**
- Functions over 50 lines
- Files with high change frequency
- Deep nesting levels (>3)

**Performance concerns**
- Nested loops over collections
- Synchronous operations in critical paths
- Missing pagination for list operations

**Architecture stress points**
- Circular dependencies
- God objects with too many responsibilities
- Integration points without error handling

**Technical debt indicators**
- TODO/FIXME comments accumulating
- Commented-out code blocks
- Temporary workarounds still present

## Tracking Predictions

After analysis, ask user how to track findings:
- **Memory**: Store risk assessments for future reference using remember()
- **TodoWrite**: Create structured task list for systematic review
- **Summary only**: Provide report without creating tasks

Never add AI attribution, Claude Code watermarks, or assistant signatures to issues or reports.
