# Contributing Lessons Learned

Guide for deciding when and how to contribute improvements back to super_agents from your consuming repository.

## Philosophy

Super_agents is a **generic skill library**. Your consuming repo has **project-specific implementations**. Knowing which is which helps everyone.

**Contribute back:**
- Generic improvements that help all users
- Bug fixes in skills or commands
- New skills applicable to many projects
- Documentation improvements

**Keep local:**
- Project-specific configuration
- Company-specific workflows
- Proprietary techniques or tools
- One-off customizations

## Decision Framework

### When to Contribute

#### Generic Improvements ✅

**Skill enhancements:**
- Better error handling in bug-triage
- More efficient hypothesis testing
- Improved test output formatting
- Clearer prompts or instructions

**Example:**
```markdown
You improved bug-triage to detect when hypotheses can run in parallel.
This helps everyone → Contribute it back.
```

**New generic skills:**
- Security scanning workflow
- Performance profiling process
- Database migration handling
- API compatibility checking

**Example:**
```markdown
You created a skill for handling database migrations in any language.
Generic and reusable → Contribute it back.
```

**Bug fixes:**
- Loop orchestrator not parsing markers correctly
- Testing-gates failing on valid test output
- Setup command creating invalid JSON

**Example:**
```markdown
You found that testing-gates crashes on empty test output.
This is a bug affecting everyone → Contribute it back.
```

**Documentation improvements:**
- Clearer setup instructions
- Missing examples in skills
- Typo fixes
- Better troubleshooting guides

**Example:**
```markdown
You clarified confusing instructions in INTEGRATION_GUIDE.md.
Helps all new users → Contribute it back.
```

#### Project-Specific Changes ❌

**Company workflows:**
- Internal approval processes
- Proprietary deployment steps
- Company-specific security scanning
- Custom tooling integration

**Example:**
```markdown
You added a stage for internal security review using your company's tool.
Company-specific → Keep it local.
```

**Configuration:**
- Your branch naming conventions
- Your test command paths
- Your language-specific setup
- Your UAT infrastructure

**Example:**
```markdown
You configured Docker UAT for your specific stack.
Configuration, not generic → Keep it local in .claude/shared/.
```

**Proprietary techniques:**
- Trade secret algorithms
- Competitive advantage methods
- Licensed tool integrations
- Internal IP

**Example:**
```markdown
You improved hypothesis testing using a proprietary analysis tool.
Contains trade secrets → Keep it local (or abstract away the proprietary parts).
```

**One-off customizations:**
- Workarounds for legacy systems
- Temporary fixes for migrations
- Project-specific edge cases
- Quick hacks

**Example:**
```markdown
You added special handling for your legacy Python 2 code.
One-off workaround → Keep it local.
```

### Gray Areas

Sometimes it's unclear. Ask:

1. **Would this help other teams?** If yes → lean toward contributing
2. **Does it require project-specific knowledge?** If yes → keep local
3. **Is it configurable?** Make it generic, then contribute
4. **Does it expose internal details?** If yes → keep local

**Example: Language-specific test commands**

```markdown
❌ Don't contribute:
"test_commands": {
  "unit_tests": "pytest test/unit/services/"  ← Your specific path
}

✅ Do contribute:
Documentation explaining how to configure test commands for different languages.
```

## How to Contribute

### 1. Extract Generic Parts

Separate the generic improvement from project-specific details:

**Before (project-specific):**
```markdown
# In your bug-triage-project.md
When investigating Python bugs, always check:
- Our custom logging at /var/log/myapp/
- Our Redis cache at redis://prod.internal:6379
```

**After (generic):**
```markdown
# Generic improvement to bug-triage/SKILL.md
When investigating bugs, check:
- Application logs (configure path in triage-project.md)
- Cache state (configure connection in triage-project.md)

# In your bug-triage-project.md (project-specific)
Log paths: /var/log/myapp/
Cache: redis://prod.internal:6379
```

### 2. Test the Generic Version

Before contributing, test that it works without project-specific dependencies:

```bash
# Create a test scenario
# - Remove project-specific references
# - Use placeholder configuration
# - Test with generic example

# If it works generically → ready to contribute
# If it requires your setup → keep local or make it more generic
```

### 3. Open a Pull Request

**Fork and branch:**
```bash
# Fork super_agents on GitHub
git clone https://github.com/YOUR-USERNAME/super-agents
cd super-agents
git checkout -b feature/improved-hypothesis-testing
```

**Make your changes:**
- Update relevant skill or command files
- Add examples if helpful
- Update documentation
- Add to CHANGELOG.md

**Test your changes:**
```bash
# Follow the skill's test methodology
# If changing a skill, test with subagents (see writing-skills/SKILL.md)
```

**Submit PR:**
```markdown
## Description
Improved parallel hypothesis testing in bug-triage skill.

## Motivation
When investigating complex bugs, independent hypotheses can be tested concurrently.
This saves time and provides better evidence for root cause analysis.

## Changes
- Added logic to detect independent hypotheses
- Integrated dispatching-parallel-agents skill
- Updated examples and documentation

## Testing
- Tested with 3 sample bugs (concurrency issues, memory leaks, API failures)
- Verified hypotheses run in parallel when independent
- Verified sequential execution when hypotheses depend on each other

## Breaking Changes
None - backward compatible with existing workflows.
```

**Address feedback:**
- Respond to review comments
- Make requested changes
- Re-test after changes

### 4. Document the Contribution

In your consuming repo, note that you contributed:

```markdown
# In your repo's CHANGELOG.md or docs/CONTRIBUTIONS.md
## 2026-03-23: Improved Hypothesis Testing

Contributed parallel hypothesis testing improvement to super_agents.
PR: https://github.com/superpowers-agent/super-agents/pull/123

Our implementation in .claude/shared/triage-project.md uses this generic
capability with our specific tool configurations.
```

## Contribution Checklist

Before opening a PR, verify:

- [ ] Change is generic, not project-specific
- [ ] No proprietary information or trade secrets
- [ ] No hardcoded paths, credentials, or internal URLs
- [ ] Documentation updated
- [ ] Examples added (if applicable)
- [ ] Tested in isolation from your project
- [ ] CHANGELOG.md updated
- [ ] Follows existing code style and patterns
- [ ] Backward compatible (or migration guide provided)

## Types of Contributions

### Skill Improvements

**Scope:** Enhancements to existing skills

**Examples:**
- Better error handling in bug-fix
- Improved output formatting in testing-gates
- More robust parsing in loop-orchestrator

**Process:**
1. Modify skill's SKILL.md
2. Test with subagents (see writing-skills)
3. Update examples
4. Submit PR

### New Skills

**Scope:** Brand new generic skills

**Examples:**
- Security vulnerability scanning
- Performance profiling workflow
- API contract validation

**Process:**
1. Follow writing-skills/SKILL.md for structure
2. Create skills/<skill-name>/SKILL.md
3. Test thoroughly with diverse scenarios
4. Add to README.md skills list
5. Submit PR with detailed description

### Bug Fixes

**Scope:** Fixes for broken functionality

**Examples:**
- Loop orchestrator crashes on certain markers
- Setup command generates invalid JSON
- Testing-gates doesn't detect all test failures

**Process:**
1. Create issue describing the bug
2. Fix in a branch
3. Add regression test if applicable
4. Submit PR referencing the issue

### Documentation

**Scope:** Improvements to docs, guides, or examples

**Examples:**
- Clearer setup instructions
- Missing examples in skills
- Improved troubleshooting guides

**Process:**
1. Identify unclear or missing docs
2. Make improvements
3. Review for accuracy
4. Submit PR (documentation PRs are quick to review!)

### Commands

**Scope:** New or improved commands

**Examples:**
- Enhanced /setup validation
- New /diagnose command for troubleshooting
- Improved /loop filtering

**Process:**
1. Create commands/<command>.md
2. Create commands/<command>-implementation.md
3. Test interactively
4. Document usage and examples
5. Submit PR

## Community Contributions

### Discuss First

For large changes, open a discussion first:

```markdown
# GitHub Discussions → Ideas

Title: Add performance profiling skill

Description:
I'd like to add a skill for systematic performance profiling. Before
building it out, wanted to check:
- Is this in scope for super_agents?
- Any existing work in this area?
- Preferred approach or structure?
```

### Small Changes Welcome

Don't hesitate on small fixes:
- Typos in documentation
- Broken links
- Formatting issues
- Example improvements

Just open a PR directly.

## Attribution

When contributing, you'll be attributed in:
- Git commit history
- CHANGELOG.md entry
- Contributors list

If you want company attribution:
```
Co-Authored-By: Your Name <you@company.com>
On-Behalf-Of: @your-company
```

## Licensing

All contributions are under MIT License (same as super_agents). By contributing:
- You grant rights to use, modify, and distribute
- You confirm you have rights to contribute
- You agree to MIT License terms

See [LICENSE](../LICENSE) for full details.

## Recognition

Contributors appear in:
- GitHub contributors list
- CHANGELOG.md for significant features
- Community spotlights in Discord

Top contributors may be invited to:
- Maintainer role
- Design discussions
- Beta testing new features

## What Happens After You Contribute

1. **Review** - Maintainers review your PR (usually within a week)
2. **Feedback** - You may receive requests for changes
3. **Merge** - Once approved, PR is merged to main
4. **Release** - Included in next release
5. **Credit** - You're credited in changelog and git history

## Example: End-to-End Contribution

### Scenario

You improved bug-triage to better handle async/concurrent bugs by checking for race conditions.

### Steps

**1. Identify the improvement:**
```markdown
Current: Bug-triage treats all bugs the same
Improvement: Add special handling for concurrency bugs
Generic? Yes - applies to any language with concurrency
```

**2. Extract generic parts:**
```markdown
# Generic (contribute this):
When investigating bugs, check for:
- Race conditions
- Deadlocks
- State synchronization issues

Add hypothesis testing for:
- Thread interleaving
- Timing dependencies
- Shared state access

# Project-specific (keep local):
Your specific concurrency patterns (actor model, CSP, etc.)
Your logging tools for thread analysis
```

**3. Make changes:**
```bash
git checkout -b feature/concurrency-bug-triage
# Edit skills/bug-triage/SKILL.md
# Add section on concurrency-specific investigations
# Add examples
```

**4. Test:**
```markdown
Test with 3 types of concurrency bugs:
- Race condition in counter
- Deadlock in resource allocation
- Data race in cache

All detected correctly with new guidance.
```

**5. Submit PR:**
```markdown
## Improved concurrency bug detection

Adds guidance for investigating race conditions, deadlocks, and
synchronization issues during bug triage.

Helps identify concurrency bugs faster by checking common patterns
like thread interleaving, timing dependencies, and shared state.

Tested with sample bugs in Python (threading), Go (goroutines),
and JavaScript (async/await).
```

**6. Update your repo:**
```markdown
# In your .claude/shared/triage-project.md
For concurrency bugs (now supported upstream):
- Our actor system uses Akka - check message ordering
- Thread dumps at /var/log/myapp/threads/
- Enable race detector: go run -race ./...
```

## Questions?

- **Discord**: Ask in #contributing channel
- **Discussions**: Open a GitHub Discussion
- **Issues**: Create an issue for bugs or feature requests

## Related Docs

- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Getting started
- [UPDATING_FROM_SUPER_AGENTS.md](UPDATING_FROM_SUPER_AGENTS.md) - Pulling updates
- [writing-skills/SKILL.md](../skills/writing-skills/SKILL.md) - Creating skills
