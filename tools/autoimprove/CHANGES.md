# Auto-Improve Changes Log

All changes made in this experimental clone that should be applied to the original superpowers-prepared plugin.

## How to use

Each entry below lists the exact file, what changed, and the before/after. Apply these to the original repo in order.

---

## Change 1: skill-rules.json — Improved systematic-debugging triggering

**File:** `hooks/skill-rules.json`
**Rule:** `systematic-debugging`
**Type:** Keywords + intent patterns modified

**Added keyword:**
- `"warning"`

**Removed keyword:**
- `"failure"` — caused false positives in non-debugging contexts ("error rates and failure metrics", "simulates network failures"). The verb forms "failing" and "fails" are retained.

**Added intent patterns (6):**
- `"can('t|\\s*not)\\s+(figure|find|tell|determine)"` — catches "can't figure out why"
- `"(shows?|displays?|renders?|gives?)\\s+(a\\s+)?(blank|white|empty|wrong|incorrect)"` — catches UI symptom descriptions
- `"(went|jumped|spiked|increased|degraded)\\s+(from|to|up|down)"` — catches performance regressions
- `"(but|except|however)\\s+(it\\s+)?(works?|runs?)\\s+(fine|ok|correctly|locally)"` — catches "but works fine locally" (works-then-but order)
- `"(works?|runs?)\\s+(fine|ok|correctly|locally|on\\s+my)\\s+(but|except|however|only)"` — catches "works fine but..." (but-after-works order)
- `"(throw|throwing|throws)\\s+(?!.{0,10}(custom|new|my|our|a\\s+new)).{0,30}(error|warning|exception)"` — catches "throws hydration mismatch warnings" but NOT "throws a custom ValidationError" (implementation intent)

**Full resulting keywords array:**
```json
["bug", "error", "broken", "not working", "crash", "exception", "stack trace", "failing", "fails", "traceback", "undefined", "null pointer", "segfault", "warning"]
```

**Full resulting intentPatterns array:**
```json
["fix\\s+(this|the|a)\\s+(bug|error|issue)", "why\\s+(is|does|isn't)", "not\\s+work(ing)?", "stopped\\s+working", "something\\s+(is\\s+)?wrong", "unexpected\\s+(behavior|result|output|error)", "can('t|\\s*not)\\s+(figure|find|tell|determine)", "(shows?|displays?|renders?|gives?)\\s+(a\\s+)?(blank|white|empty|wrong|incorrect)", "(went|jumped|spiked|increased|degraded)\\s+(from|to|up|down)", "(but|except|however)\\s+(it\\s+)?(works?|runs?)\\s+(fine|ok|correctly|locally)", "(works?|runs?)\\s+(fine|ok|correctly|locally|on\\s+my)\\s+(but|except|however|only)", "(throw|throwing|throws)\\s+(?!.{0,10}(custom|new|my|our|a\\s+new)).{0,30}(error|warning|exception)"]
```

---

## Change 2: skill-rules.json — Improved brainstorming triggering

**File:** `hooks/skill-rules.json`
**Rule:** `brainstorming`
**Type:** Keyword + intent pattern added

**Added keyword:**
- `"refactor"`

**Added intent pattern (1):**
- `"(we|i)\\s+need\\s+to\\s+(add|build|create|implement|refactor|redesign|rework|overhaul)"` — catches "we need to refactor/add/build..."

**Full resulting keywords array:**
```json
["design", "architect", "new feature", "build this", "add a feature", "how should we", "new project", "from scratch", "refactor"]
```

**Full resulting intentPatterns array:**
```json
["(build|create|design|architect)\\s+(a|the|this|new)", "how\\s+should\\s+(we|i)", "what('s|\\s+is)\\s+the\\s+best\\s+(way|approach)", "i\\s+want\\s+to\\s+(add|build|create)", "(we|i)\\s+need\\s+to\\s+(add|build|create|implement|refactor|redesign|rework|overhaul)"]
```

---

## Change 3: using-superpowers SKILL.md — Refined complexity classification hard override

**File:** `skills/using-superpowers/SKILL.md` (line 87 in original)
**Section:** Complexity Classification → Hard overrides

**Before:**
```
- The change affects what the user sees or experiences
```

**After:**
```
- The change affects what the user sees or experiences (excluding cosmetic text changes to existing UI — e.g., updating a label, rewording a message, or changing static copy that doesn't alter flow or behavior)
```

**Why:** Without this carve-out, trivial string changes (e.g., "change error message from X to Y") incorrectly trigger the full brainstorming pipeline. The carve-out exempts cosmetic text edits while still catching real UI changes.

---

## Change 4: systematic-debugging SKILL.md — Expanded description triggers

**File:** `skills/systematic-debugging/SKILL.md`
**Section:** Frontmatter `description` field

**Before:**
```
Invoke BEFORE attempting any fix when a bug, test failure, error, or
unexpected behavior appears. Enforces hypothesis-driven root cause
analysis — no fix without evidence. Triggers on: error messages, stack
traces, "it's broken", "not working", "bug", test failures. Also routed
by using-superpowers for debugging tasks.
```

**After:**
```
Invoke BEFORE attempting any fix when a bug, test failure, error, warning,
unexpected behavior, or performance regression appears. Enforces hypothesis-driven
root cause analysis — no fix without evidence. Triggers on: error messages, stack
traces, "it's broken", "not working", "bug", test failures, blank/white screens,
"works locally but not in production", performance degradation, console warnings,
"can't figure out why". Also routed by using-superpowers for debugging tasks.
```

**Why:** Description now matches the expanded intent patterns in skill-rules.json. Without these trigger phrases in the description, Claude may not invoke the skill even when the rules suggest it.

---

## Change 5: brainstorming SKILL.md — Added refactoring and "need to" triggers

**File:** `skills/brainstorming/SKILL.md`
**Section:** Frontmatter `description` field

**Before:**
```
MUST USE when the user wants new features, behavior changes, or
architecture decisions and no approved design exists yet. Produces an
approved design document before any code is written. Triggers on:
"build this", "add a feature", "I want to change", "how should we",
"design", "architect", "new project". Routed by using-superpowers,
or invoke directly via /brainstorming.
```

**After:**
```
MUST USE when the user wants new features, behavior changes, refactoring
with new capabilities, or architecture decisions and no approved design
exists yet. Produces an approved design document before any code is written.
Triggers on: "build this", "add a feature", "I want to change", "how should we",
"design", "architect", "new project", "refactor", "we need to add/build/create",
"implement a new". Routed by using-superpowers, or invoke directly via /brainstorming.
```

**Why:** "Refactor" and "we need to" are common developer phrasings for design tasks that the original description missed.

---

## Change 6: requesting-code-review SKILL.md — Added informal review triggers

**File:** `skills/requesting-code-review/SKILL.md`
**Section:** Frontmatter `description` field

**Before:**
```
Triggers on: "review my code", "code review", "check this before
merge", "security review", "is this secure". Routed by
using-superpowers or executing-plans after implementation.
```

**After:**
```
Triggers on: "review my code", "code review", "check this before
merge", "security review", "is this secure", "look over my changes",
"second pair of eyes", "check the diff". Routed by
using-superpowers or executing-plans after implementation.
```

**Why:** Developers often use informal phrases like "look over my changes" or "second pair of eyes" instead of "code review".

---

## Change 7: finishing-a-development-branch SKILL.md — Added merge workflow triggers

**File:** `skills/finishing-a-development-branch/SKILL.md`
**Section:** Frontmatter `description` field

**Before:**
```
Triggers on: "merge this",
"create a PR", "we're done with this branch", "clean up the branch",
after verification-before-completion passes.
```

**After:**
```
Triggers on: "merge this",
"create a PR", "squash and merge", "we're done with this branch",
"clean up the branch", "push this", "get it merged", after
verification-before-completion passes.
```

**Why:** "Squash and merge", "push this", and "get it merged" are common git workflow phrases that the original description missed.
