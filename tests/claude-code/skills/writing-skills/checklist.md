# Checklist: writing-skills Compliance

## RED Phase Gate (COMPULSORY - baseline before skill)
- [ ] Pressure scenarios created (at least 3 distinct scenarios)
- [ ] Scenarios explicitly describe combined pressures (time, confidence, sunk cost)
- [ ] Scenarios run WITHOUT the skill being written
- [ ] Baseline behavior documented VERBATIM (exact quotes of agent rationalizations)
- [ ] Patterns in failures identified and noted

## GREEN Phase Gate (COMPULSORY - skill addresses failures)
- [ ] Specific baseline failures referenced (not generic skill content)
- [ ] Skill written AFTER baseline test (not before)
- [ ] SAME scenarios run WITH the skill present
- [ ] Agent compliance verified (skill now followed)
- [ ] Evidence shown that agents comply under same pressure scenarios

## REFACTOR Phase Gate (COMPULSORY - loopholes closed)
- [ ] New rationalizations identified from compliance testing (if any)
- [ ] Explicit counters added for each rationalization
- [ ] Rationalization table included in skill (>=5 entries)
- [ ] Red flags list included in skill (>=5 violations)
- [ ] Re-testing performed until bulletproof
- [ ] Loopholes explicitly closed with "No exceptions" clauses

## Skill Content Quality
- [ ] YAML frontmatter with name and description (max 1024 chars)
- [ ] Description starts with "Use when..." (triggering conditions only)
- [ ] No workflow summary in description (to prevent shortcut following)
- [ ] Overview section explains core principle
- [ ] CSO keywords throughout for discovery

## TDD Order Verification
- [ ] Clear evidence baseline test created BEFORE skill writing
- [ ] No evidence of skill content written before baseline complete
- [ ] Compliance test run AFTER skill written
- [ ] REFACTOR phase done AFTER GREEN phase
- [ ] Final skill reflects insights from all three phases

## Evidence Requirements
- [ ] Session shows explicit "RED Phase" or baseline testing announcement
- [ ] Session shows pressure scenario execution output
- [ ] Session shows rationalizations captured (quoted text)
- [ ] Session shows explicit "GREEN Phase" or compliance testing announcement
- [ ] Session shows skill creation/writing
- [ ] Session shows explicit "REFACTOR Phase" announcement
- [ ] Session shows rationalization table being added
- [ ] Session shows red flags list being added
