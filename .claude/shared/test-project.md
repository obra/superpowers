# Test Project-Specific Guidance

## Test Commands

**Linting:** Not configured
**Type checking:** Not configured
**Unit tests:** Not configured

## Test Modes

### Smart Mode (detects what changed)
- If markdown files changed: validate syntax
- If JSON files changed: validate JSON structure
- If YAML files changed (if any): validate YAML

### Full Mode (all gates)
Run all available tests regardless of changes

## Regression Tests

No automated regression tests in this repo. Testing is manual:
1. Review documentation changes for accuracy
2. Verify examples still match behavior
3. Check skill references are correct

## Validation Checklist

- [ ] JSON files are valid (e.g., `project-flows.json`)
- [ ] Markdown files render without errors
- [ ] Skill descriptions are clear and complete
- [ ] Cross-references between skills are correct
- [ ] Command documentation is up-to-date
