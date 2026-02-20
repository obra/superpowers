# Auditing Existing Skills

**Load this reference when:** reviewing a skill library for quality issues, preparing to fix skill routing problems, or verifying skills meet best practices before deployment.

## Overview

Writing-skills teaches how to CREATE skills with TDD. This reference teaches how to AUDIT existing skills — finding structural issues, trigger conflicts, and quality gaps across a skill library.

**Core principle:** An audit catches the problems that accumulate over time — missing frontmatter, overlapping triggers, oversized files, broken references — that no single skill creation session would reveal.

## When to Audit

- After accumulating 10+ skills (trigger overlap becomes likely)
- When skills activate for wrong prompts (routing problems)
- When adding a new skill to a crowded domain
- Before sharing a skill library with others
- Periodically (quarterly) as a hygiene check

## Audit Checklist

### Phase 1: Structure Scan

Check every skill for structural compliance:

```
For each skill directory:
- [ ] SKILL.md exists (exact spelling, case-sensitive)
- [ ] YAML frontmatter has --- delimiters
- [ ] name: present, kebab-case, matches folder name
- [ ] description: present, under 1024 chars
- [ ] description: starts with action/trigger, NOT "A skill for..."
- [ ] SKILL.md under 500 lines
- [ ] All file references resolve (no broken links)
```

**Automated scan** (run from skills directory):
```bash
for dir in */; do
  skill="${dir%/}"
  file="$dir/SKILL.md"

  # Check SKILL.md exists
  [ ! -f "$file" ] && echo "FAIL: $skill — missing SKILL.md" && continue

  # Check frontmatter
  head -1 "$file" | grep -q "^---" || echo "FAIL: $skill — no frontmatter"

  # Check name field
  grep -q "^name:" "$file" || echo "FAIL: $skill — no name field"

  # Check description field
  grep -q "^description:" "$file" || echo "FAIL: $skill — no description"

  # Check line count
  lines=$(wc -l < "$file")
  [ "$lines" -gt 500 ] && echo "WARN: $skill — $lines lines (target: <500)"

  echo "OK: $skill ($lines lines)"
done
```

### Phase 2: Description Quality

For each skill's description field:

```
- [ ] Describes WHAT it does (action verb, not "A skill for...")
- [ ] Describes WHEN to use it (trigger phrases users say)
- [ ] Written in third person
- [ ] Does NOT summarize workflow (CSO trap — see SKILL.md § CSO)
- [ ] Under 500 characters (ideal) / 1024 characters (max)
```

**Common description anti-patterns:**

| Anti-Pattern | Fix |
|-------------|-----|
| "A skill for managing X" | "Manage X. Use when [triggers]." |
| No trigger phrases | Add "Use when...", "Invoke when user mentions..." |
| Summarizes workflow steps | Remove process details, keep only triggers |
| First person ("I help you...") | Third person ("Helps with...") |
| Too vague ("Helps with documents") | Specific ("Extract text from PDFs, fill forms") |

### Phase 3: Trigger Overlap Detection

**This is the most impactful audit step.** When multiple skills share trigger phrases, Claude cannot reliably route to the correct one.

**Detection method:**

1. Extract all description fields into one list
2. Identify shared trigger phrases across skills
3. For each overlap, assign clear ownership

```bash
# Extract descriptions
for dir in */; do
  skill="${dir%/}"
  desc=$(grep -A5 "^description:" "$dir/SKILL.md" | head -6)
  echo "=== $skill ==="
  echo "$desc"
  echo
done
```

**Resolution pattern:**

| Situation | Fix |
|-----------|-----|
| Two skills claim "interview prep" | Each owns specific verbs: "analyze problem" vs "log practice" |
| Generic phrase matches multiple skills | Replace with specific action verbs |
| Skills in same domain overlap | Create ownership table in each skill |

**Ownership table example** (add to each skill in a contested domain):

```markdown
## Scope Boundary

| This Skill Handles | Another Skill Handles |
|--------------------|-----------------------|
| Problem analysis, concept tiers | practice-tracker: SRS, mastery, reps |
| Pivot prediction, study plans | daily-copilot: scheduling, routines |
```

### Phase 4: Progressive Disclosure Check

For skills over 300 lines:

```
- [ ] Core routing/triggers in SKILL.md (not buried in ref/)
- [ ] Detailed workflows extracted to ref/ or separate files
- [ ] All @ref/ or [file](file.md) links resolve to existing files
- [ ] References are one level deep (no ref → ref → ref chains)
- [ ] Reference files have table of contents if >100 lines
```

### Phase 5: Context Budget Check

All skill descriptions combined consume context on every conversation. Check the total:

```bash
total=0
for dir in */; do
  [ ! -f "$dir/SKILL.md" ] && continue
  chars=$(grep -A20 "^description:" "$dir/SKILL.md" | head -20 | wc -c)
  total=$((total + chars))
done
echo "Total description chars: $total (budget: ~16,000)"
```

If over budget, trim descriptions of least-used skills.

## Audit Report Template

After running the audit, summarize findings:

```markdown
# Skill Audit Report — [Date]

## Summary
- Skills audited: X
- PASS: X | NEEDS_IMPROVEMENT: X | FAIL: X

## Critical Issues
1. [Issue]: [Skills affected] — [Fix]

## Trigger Overlaps Found
| Phrase | Skills | Resolution |
|--------|--------|------------|

## Oversized Skills
| Skill | Lines | Target |
|-------|-------|--------|

## Missing Elements
| Skill | Missing |
|-------|---------|

## Action Items
1. [ ] Fix [issue]
```

## Real-World Example

Auditing 26 personal skills revealed:
- 3 skills with no frontmatter at all (won't activate)
- 13 skills missing description fields (poor routing)
- 11 skills over 500 lines (context waste)
- 4 skills claiming "interview prep" (routing conflicts)
- 2 broken file references

After fixing: all 26 skills had frontmatter + descriptions, all under 500 lines, zero trigger overlap on contested phrases, all references resolved.

## Connection to TDD

Auditing is the REFACTOR phase applied to your entire skill library:
- **RED**: Run audit, find failures
- **GREEN**: Fix each issue
- **REFACTOR**: Prevent recurrence with standards doc + stickiness tests

The audit checklist catches structural issues. TDD pressure testing (see @testing-skills-with-subagents.md) catches behavioral issues. Both are needed.
