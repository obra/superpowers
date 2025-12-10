# Automation Over Documentation for Mechanical Enforcement

**Core insight:** Mechanically enforce mechanical constraints. Don't fight LLM training with documentation.

## The Problem

**Goal:** Zero emojis in code review output (professional formatting).

**Documentation approach (failed):**
- Cycle 1: "NEVER use emojis" → Agents used ✅ ❌ ⚠️
- Cycle 2: "Not in summaries/headings" → Used in lists
- Result: 0/5 tests passed, RED-GREEN-REFACTOR never stabilized

**Root cause:** Emojis signal status in LLM training data. Documentation fights natural behavior.

## The Solution

**Automation approach (succeeded):**

```python
import emoji

def strip_emojis(text):
    return emoji.replace_emoji(text, replace='')

# Or using regex for zero dependencies:
# import re
# emoji_pattern = re.compile(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF]+')
# return emoji_pattern.sub('', text)
```

**Result:** 5/5 tests passed first try, 100% compliance, zero documentation needed.

## When to Use Each Approach

**Use Automation (Mechanical Enforcement):**
- Requirement is 100% objective (emoji yes/no, line length, format)
- Violation is programmatically detectable
- Agents consistently find rationalization loopholes
- Examples: emoji stripping, line length, JSON validation, whitespace removal

**Use Documentation (Judgment Guidance):**
- Requirement needs human-like reasoning
- Context determines correct choice
- Trade-offs exist between options
- Examples: severity labeling (`blocking` vs `non-blocking`), actionable suggestions, test coverage decisions

## Red Flags: Wrong Tool for the Job

**Consider automation if you're:**
- Iterating rationalization tables without progress
- Adding "no really, I mean NEVER" language
- Multiple TDD cycles without REFACTOR stabilizing

**Why:** You're using the wrong tool. REFACTOR phase won't stabilize when fighting natural LLM behavior.

## Psychology Insight

Agents rationalize around documentation when it conflicts with training data (see persuasion-principles.md, Cialdini 2021). Mechanical enforcement removes the conflict.

## Application to Skill Creation

**Skills should document DECISIONS, not MECHANICS.**

- ✅ Good: "When to use X vs Y" (judgment required)
- ❌ Bad: "Never use X" (if mechanically enforceable)

**TDD signal:** Multiple REFACTOR cycles without stabilization = wrong tool. Automate the mechanical constraint.

**Defense-in-Depth:** Layer mechanical enforcement (code) + judgment guidance (skills) + outcome validation (tests). Example: Strip emojis (Python) → guide severity labeling (skill) → validate actionability (test).

## Cost-Benefit

| Approach | Cost | Benefit | Maintenance |
|----------|------|---------|-------------|
| Documentation | Multiple TDD cycles, bloat | None (0/5 tests) | High (whack-a-mole) |
| Automation | 15 lines code | 100% (5/5 tests) | Near-zero |

**ROI:** Automation paid for itself first test run.

## The Bottom Line

**Mechanical constraints belong in code, not documentation.**

When TDD cycles show agents consistently finding new rationalizations for the same mechanical rule, that's the signal to automate. Save documentation for judgment calls where human-like reasoning matters.

**Evidence-based decision:** Let TDD tell you which tool to use. If REFACTOR phase doesn't stabilize after 2-3 cycles, switch to automation.
