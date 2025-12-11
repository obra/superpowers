---
name: code-style-review
description: Use when writing or reviewing Python code - ensures consistent, clean, and maintainable code through automated linting and manual review
---

# Code Style Review

## Overview
Python code style guide that enforces clean, maintainable code through automated checks (ruff) and manual review. Four-tier priority system (Must/Should/Optional/Nice) guides remediation efforts.

## When to Use
**Use when:**
- Writing new Python code that needs style validation
- Reviewing existing Python code for quality
- Onboarding new contributors who need style guidance
- Before merging Python code to main branch

**Don't use when:**
- Code is in another language (only Python supported)
- Project has conflicting style guides (prefer project-specific rules)
- Rapid prototyping where style is not a priority

**Symptoms this solves:**
- Inconsistent naming conventions across codebase
- Non-English comments causing readability issues
- Poor code organization and structure
- Missing type hints on public APIs

## Core Pattern

**Before (inconsistent):**
```python
class data_loader:  # Wrong: lowercase class name
    def __init__(self, Path):
        self.Path = Path  # Wrong: PascalCase for variable

    def getdata(self):  # Wrong: snake_case should use verb-first
        # 读取数据 - Wrong: non-English comment
        pass

max_retries = 10  # OK: UPPER_CASE for module-level constant
```

**After (compliant):**
```python
class DataLoader:  # Correct: PascalCase for class
    def __init__(self, path: Path):
        self.path = path  # Correct: snake_case for variable

    def load_data(self) -> None:  # Correct: verb-first naming, type hints
        # Load data from file
        pass

MAX_RETRIES = 10  # Correct: UPPER_CASE for constant
```

## Quick Reference

### Naming Conventions (Must)
| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `DataLoader`, `ConfigManager` |
| Functions/Methods | snake_case (verb-first) | `load_data()`, `process_batch()` |
| Constants | UPPER_CASE | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |
| Math vars | Single letter OK | `N`, `D`, `x`, `y` |

### Priority Levels
| Level | Meaning | Action |
|-------|---------|--------|
| 必须 (Must) | Rule violations → errors | Must fix |
| 尽量 (Should) | Best practices → warnings | Should fix |
| 可选 (Optional) | Improvements → suggestions | Nice to fix |
| 加分项 (Nice) | Enhancements → optional | Up to you |

### Code Philosophy
- **Fail-fast**: No defensive try/except, errors should crash early
- **Simplicity**: No over-engineering, keep it simple (Occam's Razor)
- **Comments**: English only, explain "why" not "what"
- **Type hints**: Python 3.10+ syntax for public methods

## Implementation

### Automated Checks
This skill uses two automated tools:

1. **ruff** - Fast Python linter for syntax and style
   - Config: `ruff.toml` (included)
   - Checks: Naming, imports, basic formatting

2. **style_check.py** - Custom checker for rules ruff can't cover
   - Non-ASCII comment detection
   - Priority: must/should/optional/nice classification

### Manual Review Areas
- Over-engineering detection
- Naming clarity and consistency
- Code aesthetics and readability
- Architecture and design patterns

### Usage with Codex
```bash
codex exec -m gpt-5.1-codex-max \
  -c model_reasoning_effort="xhigh" \
  --sandbox danger-full-access \
  --full-auto \
  --skip-git-repo-check \
  "You are a code style reviewer. Review the Python code for style compliance.

## Paths (absolute)
- Skill directory: {SKILL_DIR}
- Target to review: {TARGET}

## Setup (run once if tools missing)
bash {SKILL_DIR}/setup.sh

## Your Tasks
1. Read the style guide: cat {SKILL_DIR}/SKILL.md
2. Run automated linter: ruff check --config {SKILL_DIR}/ruff.toml {TARGET}
3. Run custom checker: python3 {SKILL_DIR}/style_check.py {TARGET}
4. Read and analyze the target code
5. Combine automated results with your own analysis

## Output Format
Provide a structured review:
- **Summary**: Overall assessment (pass/needs work/fail)
- **Automated Issues**: List violations from ruff and style_check.py
- **Manual Review**: Issues requiring human judgment
- **Suggestions**: Specific, actionable improvements with code examples

## Priority Levels
- 必须 (Must): Violations are errors, must fix
- 尽量 (Should): Violations are warnings, should fix
- 可选 (Optional): Suggestions for improvement
- 加分项 (Nice to Have): Optional enhancements"
```

### Files Included
- `setup.sh` - Installs ruff dependency
- `style_check.py` - Custom style checker for non-ASCII comments
- `ruff.toml` - Ruff configuration with priority mapping

## Common Mistakes

**Mistake: Using defensive try/except**
```python
# Bad - hides errors
try:
    result = process(data)
except Exception:
    result = None
```

**Fix - Fail fast**
```python
# Good - errors crash early for debugging
result = process(data)
if result is None:
    logger.warning("Processing returned None")
```

**Mistake: Over-engineering with complex abstractions**
```python
# Bad - unnecessary complexity
class DataProcessor:
    def __init__(self, config: Config, validator: Validator,
                 serializer: Serializer, cache: Cache):
        ...

```

**Fix - Keep it simple**
```python
# Good - minimal, focused function
def load_data(path: Path) -> Data:
    return Data(path.read_text())
```

**Mistake: Non-English comments**
```python
# 读取配置数据
data = get_config()
```

**Fix - English comments**
```python
# Load configuration data
data = get_config()
```

**Mistake: Hiding complexity with comments**
```python
# This does complex thing (don't do this)
x = (a * b + c) / (d - e)  # Calculate final value
```

**Fix - Self-explanatory code**
```python
# No comment needed - code explains itself
effective_rate = (principal * multiplier + fee) / (denominator - discount)
```

## Real-World Impact

**Team Benefits:**
- Consistent codebase reduces cognitive load for all contributors
- Automated checks catch 80% of style issues before review
- Four-tier priority system helps focus on high-impact improvements
- English-only comments improve accessibility for global teams

**Code Quality Improvements:**
- Naming conventions make code self-documenting
- Fail-fast error handling reduces debugging time
- Type hints improve IDE support and catch bugs early
- Simple architecture reduces maintenance burden

**Integration Points:**
- Works with any Python project (configurable via ruff.toml)
- Integrates with Codex for intelligent code review
- Supports both file-level and directory-level checking
- Priority system aligns with project urgency levels
