# Signs of Skipping: writing-plans

## Red Flags (Critical Violations)

### Handoff Consumption Skipping
- Research document not cited at all in plan
- Research path not explicitly stated (just "based on research")
- No quotes from research findings (paraphrased without attribution)
- Key findings silently incorporated without citation
- Research mentioned but not actually read (file path wrong or content misremembered)
- "I'll reference the research" but then doesn't

### Task Quality Skipping
- Vague file paths: "in the appropriate directory", "relevant files", "create a component"
- Placeholder code: "add validation logic here", "implement the feature", "handle errors"
- Missing code blocks: Task describes what to do without showing actual code
- Non-specific commands: "run the tests" instead of exact command with expected output
- Tasks too large: "Implement the entire preferences system" (should be bite-sized)
- Tasks too small: Each line of code is a separate task (should be 2-5 minutes)

### Plan Completeness Skipping
- Missing Goal section in header
- Missing Architecture section in header
- Missing Tech Stack section in header
- No "Context Gathered From" section
- Tasks without Files section
- Tasks without Commit section
- No TDD structure (implementation before tests)

### Open Questions Skipping
- Open questions from research silently dropped
- No mention of "should preferences sync to server?"
- No mention of "migration strategy for existing data?"
- No mention of "SSR/hydration considerations?"
- Pretending questions don't exist rather than acknowledging uncertainty

### Research Pattern Skipping
- Not using ThemeProvider reference from research
- Not mentioning layout.tsx as found in research
- Ignoring Zod recommendation from research
- Creating new patterns when research identified existing ones

## Rationalization Patterns to Watch

| Pattern | What They Say | What They Should Do |
|---------|---------------|---------------------|
| "Obviously referenced" | "I based this on the research" | Explicitly quote: "Research found X (docs/research/...)" |
| "Implicit context" | "The plan reflects the findings" | Show exact citations with file paths |
| "Brevity" | "Adding quotes would bloat the plan" | Quotes provide traceability - include them |
| "Self-evident" | "The code speaks for itself" | Include complete code, not placeholders |
| "Flexibility" | "Leaving room for implementation decisions" | Plans should be specific, not vague |
| "Efficiency" | "I'll skip the obvious parts" | Nothing is obvious - document everything |
| "Common pattern" | "Standard approach, no need to cite" | Research justifies the approach - cite it |

## Evidence Requirements

For a PASS verdict, the session MUST show:

1. **Research Consumption Evidence:**
   - Research document path explicitly stated in output
   - At least 3 specific findings quoted/referenced from research
   - Architecture decisions traced to research (e.g., "Research found ThemeProvider at...")
   - Open questions acknowledged (addressed OR carried forward)

2. **Task Quality Evidence:**
   - Every file path is exact (e.g., `src/providers/PreferencesContext.tsx`)
   - Every code block is complete (no "// implement here" comments)
   - Every command is exact (e.g., `npm test -- --grep "preferences"`)
   - Each task is 2-5 minutes of work

3. **Plan Completeness Evidence:**
   - Header has Goal, Architecture, Tech Stack sections
   - Each task has Files, Steps, Commit sections
   - TDD order visible (test before implementation)

## Critical Checks

### Research Citation Check
The plan MUST include text like:
- "Research found..." or "According to research..."
- Explicit path: `docs/research/2026-01-13-user-preferences.md`
- Quoted findings from the research document

If the plan doesn't explicitly cite the research document = FAIL

### File Path Check
The plan MUST have:
- Exact paths like `src/providers/PreferencesContext.tsx`
- NOT vague paths like "in the providers directory"
- NOT omitted paths like "create the component"

If any task has vague or missing file paths = FAIL

### Code Completeness Check
Every code block MUST be:
- Actually complete (can be copy-pasted and run)
- NOT have placeholders like "// TODO", "add logic", "implement"
- NOT be pseudo-code or abbreviated

If any code block is incomplete = FAIL

### Open Questions Check
The plan MUST:
- List open questions from research
- Either address them OR explicitly note they're deferred
- NOT silently ignore them

If open questions are silently dropped = FAIL

## Failure Examples

### Obvious FAIL:
```
"Let me write a plan for user preferences..."
[Writes plan without mentioning research document]
```
This is FAIL because research was not consumed.

### Subtle FAIL:
```
"Based on the research, here's the plan..."
[Plan has vague task: "Create the preferences context"]
```
This is FAIL because task lacks exact file path and code.

### Another Subtle FAIL:
```
"The research recommends using Context for state..."
[No explicit path to research document cited]
[No quotes from research - just paraphrase]
```
This is FAIL because handoff consumption requires explicit citation, not paraphrase.

### Open Questions FAIL:
```
[Research had 3 open questions]
[Plan has no mention of these questions]
```
This is FAIL because open questions were silently dropped.
