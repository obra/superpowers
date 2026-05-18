# Learning Harness — Design Spec

**Date:** 2026-05-18
**Status:** Approved for implementation
**Author:** AI-assisted design (brainstorming session)

---

## Scope

Add a persistent, compounding knowledge layer to the Superpowers plugin that captures corrections from user feedback, catalogs them as reusable patterns (errors and good practices), and injects them into both the SDD ContextEnvelope and the Harness verification pipeline.

### Goals

1. User corrections during implementation are automatically detected and cataloged
2. Patterns compound across sessions and optionally across projects (team mode)
3. Subagents receive relevant patterns proactively in their ContextEnvelope
4. Harness verifies code against known error patterns, blocking on high-severity recurrences
5. Wiki self-maintains via lint, staleness detection, and supersession

### Non-Goals

- Cross-project recall for users with multiple unrelated repos (out of scope for v1)
- Embedding-based semantic search (index.md + grep is sufficient for <500 patterns)
- Automatic pattern creation without any human gate (bootstrap mode is the exception, not the rule)
- UI/dashboard for pattern browsing (CLI-only for v1)

---

## Architecture

### Four Sub-Projects

```
┌──────────────────────────────────────────────────────────────┐
│                    LEARNING HARNESS                           │
│                                                               │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ 1. KNOWLEDGE│◄───│ 2. CAPTURE   │    │ 4. MAINTENANCE   │  │
│  │    BASE     │    │    HOOK      │───►│    (lint,        │  │
│  │             │    │              │    │     supersede,    │  │
│  │ Global +    │    │ Keyword→LLM  │    │     stale)        │  │
│  │ Project     │    │ →Threshold   │    │                   │  │
│  │ Overlay     │    │ →Bootstrap   │    │                   │  │
│  └──────┬──────┘    └──────────────┘    └──────────────────┘  │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              3. INJECTION LAYER                           │  │
│  │                                                          │  │
│  │  ContextEnvelope          Harness Patterns Check         │  │
│  │  ┌─────────────────┐     ┌──────────────────────────┐   │  │
│  │  │ Learned Patterns│     │ verify-patterns step     │   │  │
│  │  │ (preventivo)    │     │ BLOCK if high severity   │   │  │
│  │  │                 │     │ WARN if medium/low       │   │  │
│  │  └─────────────────┘     └──────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Configuration

All pattern settings live in `.harness-config.json`:

```json
{
  "patterns": {
    "enabled": true,
    "globalWiki": true,
    "globalPath": "~/.superpowers/patterns-wiki",
    "bootstrapThreshold": 10,
    "recurrenceThreshold": {
      "minFrequency": 3,
      "minProjects": 2
    },
    "staleness": {
      "reviewDays": 30,
      "archiveDays": 90
    }
  }
}
```

| Field | Default | Description |
|---|---|---|
| `enabled` | `true` | Feature on/off |
| `globalWiki` | `true` | `true`: global wiki + project overlay; `false`: project-only wiki |
| `globalPath` | `~/.superpowers/patterns-wiki` | Path to global wiki directory |
| `bootstrapThreshold` | `10` | Accept one-offs when total patterns < this number |
| `recurrenceThreshold.minFrequency` | `3` | Min occurrences in same project to promote |
| `recurrenceThreshold.minProjects` | `2` | Min different projects to promote |
| `staleness.reviewDays` | `30` | Days without sighting before review flag |
| `staleness.archiveDays` | `90` | Days without sighting before auto-archive |

---

## Sub-Project 1: Knowledge Base

### Directory Structure

**Global wiki** (when `globalWiki: true`):
```
~/.superpowers/patterns-wiki/
├── index.md              # Catalog: id, title, category, frequency, projects
├── log.md                # Append-only timeline of adds/changes
├── errors/               # Error pattern entries
├── practices/            # Good practice entries
├── modules/              # Module-specific pattern collections
├── pending/              # Patterns below recurrence threshold
└── archived/             # Stale patterns past archiveDays
```

**Project overlay** (always exists):
```
<project-root>/.superpowers/patterns-wiki/
├── index.md              # References global entries + adds locals
├── local-errors/         # Project-specific error patterns
├── local-practices/      # Project-specific good practices
└── constraints.md        # Non-obvious project facts (sync with project-map.md)
```

When `globalWiki: false`, the project overlay is the only wiki.

### Entry Format

**Error pattern** (`errors/<id>.md`):
```markdown
---
id: react-missing-form-validation
category: error_pattern
module: react-components
severity: high
frequency: 5
first_seen: 2026-05-10
last_seen: 2026-05-17
projects: ["proj-a", "proj-b"]
status: promoted
---

## React Form Missing Validation

**Pattern:** Forms implemented without input validation (client or server).
**Symptom:** User reports "needs validation", "not working right".
**Root cause:** Implementation focuses on happy path, skips error states.
**Fix:** Add Zod/Yup validation + error UI + server-side validation.
**Check:** `grep -rn "<input" src/ | grep -v "required\|pattern\|aria-invalid"`
**CheckRegex:** `<input(?![^>]*(?:required|pattern|aria-invalid))`
**Related:** [[form-input-sanitization]], [[api-response-envelope-pattern]]
```

**Good practice** (`practices/<id>.md`):
```markdown
---
id: form-input-sanitization
category: good_practice
module: react-components
confidence: high
adopted_by: ["proj-a", "proj-c"]
status: promoted
---

## Form Input Sanitization

**Context:** Every feature with forms should sanitize inputs.
**What:** Use Zod schema + controlled inputs + debounced validation.
**Why prevails:** Reduces UX bugs and prevents injection.
**Example:** `z.string().min(1).email().transform(s => s.trim())`
**Related:** [[react-missing-form-validation]]
```

### Index Format

`index.md`:
```markdown
# Patterns Index
_Generated: 2026-05-18 | Global: true | Total: 12_

## Error Patterns
- [react-missing-form-validation](errors/react-missing-form-validation.md) — Forms sem validação (5x, 2 projetos)
- [api-no-error-boundary](errors/api-no-error-boundary.md) — APIs sem error handling (3x, 1 projeto)

## Good Practices
- [form-input-sanitization](practices/form-input-sanitization.md) — Sanitização com Zod (3 projetos)

## Pending
- [react-memo-overuse](pending/react-memo-overuse.md) — useMemo excessivo (2x, 1 projeto)

## Archived
- [react-old-api-pattern](archived/react-old-api-pattern.md) — Superseded, not seen in 90+ days
```

### Query Interface

```typescript
interface PatternQuery {
  module?: string;
  categories?: ("error_pattern" | "good_practice" | "project_constraint")[];
  severity?: ("high" | "medium" | "low")[];
  maxResults?: number;
  excludeArchived?: boolean;
}

interface PatternEntry {
  id: string;
  category: "error_pattern" | "good_practice" | "project_constraint";
  module: string;
  severity: "high" | "medium" | "low";
  frequency: number;
  firstSeen: string;
  lastSeen: string;
  projects: string[];
  status: "promoted" | "pending" | "bootstrap" | "archived";
  title: string;
  pattern: string;
  symptom: string;
  rootCause: string;
  fix: string;
  check: string;
  checkRegex?: string;
  related: string[];
}

// Catalog methods
class PatternCatalog {
  loadForProject(projectRoot: string): PatternEntry[];
  query(query: PatternQuery): PatternEntry[];
  create(entry: PatternEntry): void;
  update(id: string, updates: Partial<PatternEntry>): void;
  incrementFrequency(id: string, project: string): void;
  archive(id: string): void;
  supersede(oldId: string, newId: string): void;
}
```

### Files

| File | Purpose |
|---|---|
| `lib/patterns/catalog.ts` | CRUD operations, query, loadForProject (global + overlay merge) |
| `lib/patterns/types.ts` | PatternEntry, PatternQuery, PatternsConfig interfaces |
| `lib/patterns/matcher.ts` | Grep-based relevance matching against index.md |
| `lib/patterns/threshold.ts` | Bootstrap vs normal mode logic, promotion decisions |
| `lib/patterns/config.ts` | Load patterns config from .harness-config.json |
| `tools/patterns/cli.ts` | CLI: lint, query, show, stats, promote, archive, export |

---

## Sub-Project 2: Capture Hook

### Detection Pipeline

```
User prompt: "isso não ficou bom, falta validar os campos"
         ↓
┌─────────────────────────────────────┐
│  CAPTURE HOOK (PostUserFeedback)    │
│                                     │
│  1. Keyword filter (fast)           │
│     Match correction_triggers       │
│  2. LLM classification              │
│     error_pattern / good_practice   │
│     / project_constraint / one_off  │
│  3. Check existing patterns         │
│     Grep index.md for similar       │
│  4. Apply threshold logic           │
│     Bootstrap (< 10 patterns):      │
│       → Create as "bootstrap"       │
│     Normal mode:                    │
│       If freq >= 3 or projects >= 2 │
│         → Create as "promoted"      │
│       Else                          │
│         → Add to pending/           │
│  5. Append to log.md                │
│  6. Ask user for approval           │
└─────────────────────────────────────┘
```

### Keyword Triggers

`hooks/capture-patterns.json`:
```json
{
  "correction_triggers": [
    "não ficou bom", "precisa validar", "esqueceu", "falta",
    "não está funcionando", "corrigir", "isso deveria",
    "não deveria", "missing", "forgot to", "needs to",
    "should have", "not working as expected", "não funciona",
    "está quebrado", "bug", "error", "wrong", "incorrect"
  ],
  "positive_triggers": [
    "isso sim", "agora ficou bom", "perfeito", "exatamente",
    "great", "perfect", "this works", "now it's good"
  ]
}
```

Positive triggers increment the `confidence` of the last-applied pattern.

### Human Gate

```
"📋 Detected a recurring pattern: 'forms sem validação'
   Category: error_pattern | Severity: high
   This has been seen 4 times across 2 projects.

   Add to patterns-wiki? (y/n/edit)"
```

- `y` → Create entry, append to log.md
- `n` → Append to log.md as `rejected`
- `edit` → Show draft, accept user edits, then save

### Files

| File | Purpose |
|---|---|
| `hooks/capture-hook.js` | Main hook: stdin parsing, trigger matching, user prompt |
| `hooks/capture-classifier.js` | LLM classification step (called by capture-hook) |
| `hooks/capture-patterns.json` | Trigger keywords and patterns |
| `hooks/hooks.json` | Add `PostUserFeedback` hook entry |

### Session Log Entry

```markdown
## 2026-05-18 14:32 [pattern-captured]
Category: error_pattern
ID: react-missing-form-validation
Trigger: "precisa validar os campos do form"
Action: promoted (frequency 4, projects 2)
```

---

## Sub-Project 3: Injection Layer

### 3A — ContextEnvelope Enhancement

Modify `extract-boundary` to append learned patterns:

```typescript
// After detecting module type from task files
const moduleType = detectModuleType(files);
const patterns = catalog.query({
  module: moduleType,
  categories: ["error_pattern", "good_practice"],
  maxResults: 5,
});

const patternsSection = patterns.length > 0
  ? `\n## Learned Patterns (apply these proactively)\n${
      patterns.map(p => `### ${p.title}\n${p.check || p.what}\n`).join("\n")
    }`
  : "";
```

The subagent prompt becomes:
```markdown
## Context: What You're Building
[existing semantic context]

## Learned Patterns (apply these proactively)
⚠️ The following patterns have been learned from past corrections.
Apply them proactively — do NOT wait for the harness to catch them.

### React Form Missing Validation
Check: Every <input> must have associated validation (Zod schema or required + pattern).
Seen: 5 times across 2 projects.

### Form Input Sanitization
What: Use Zod schema + controlled inputs + debounced validation.
Example: z.string().min(1).email().transform(s => s.trim())
```

### 3B — Harness Patterns Validator

New validator: `lib/harness/validators/patterns.ts`

```typescript
async function validatePatterns(cwd, config): Promise<ValidationResult> {
  const patterns = catalog.loadForProject(cwd);
  const violations: PatternViolation[] = [];

  for (const pattern of patterns.filter(p => p.category === "error_pattern")) {
    // Pattern checks use checkRegex field if available (mechanical grep),
    // or fall back to LLM-based check against the check description.
    let violated = false;
    let matchFile = "";
    let matchLine = 0;

    if (pattern.checkRegex) {
      // Mechanical check: grep source files for the regex
      const result = await grepSourceFiles(pattern.checkRegex, cwd);
      if (result.matches.length > 0) {
        violated = true;
        matchFile = result.matches[0].file;
        matchLine = result.matches[0].line;
      }
    } else {
      // LLM-based check: send relevant files + check description to LLM
      // Only for patterns without a mechanical regex
      const result = await llmPatternCheck(pattern, cwd);
      violated = result.violated;
    }

    if (violated) {
      violations.push({
        pattern: pattern.id,
        message: `Known error pattern: ${pattern.title}`,
        severity: pattern.severity,
        fix: pattern.fix,
        file: matchFile,
        line: matchLine,
        recurrence: `Seen ${pattern.frequency} times across ${pattern.projects.length} projects.`,
      });
    }
  }

  const hasBlocking = violations.some(v => v.severity === "high");
  return {
    passed: !hasBlocking,
    violations,
    blocking: hasBlocking,
  };
}
```

Harness pipeline updated:
```
verify-local:
1. completeness
2. lint
3. typecheck
4. test
5. coverage
6. patterns ← NEW

verify-all:
1-6. All of verify-local
7-10. security, integration, domain-specific, dead-code, drift
```

### 3C — Decision Logic

| Severity | Harness Behavior | Subagent Behavior |
|---|---|---|
| **high** | BLOCK — build fails, requires fix | Prompt warns: "CRITICAL — this error has caused failures before" |
| **medium** | WARN — passes but flags in report | Prompt notes: "Watch for this — seen N times before" |
| **low** | WARN — passes but flags in report | Prompt notes: "Consider this pattern" |

### 3D — SDD Skill Updates

**`subagent-driven-development/SKILL.md`:**
- Implementer prompt includes: `"After each change, run harness local to verify (includes pattern checks)."`
- Reviewer prompt includes pattern checklist: `"Verify implementation does NOT trigger known error patterns: [list]"`

**`extract-boundary/SKILL.md`:**
- Add step: "Query patterns catalog for relevant entries based on module type"
- Include patterns in ContextEnvelope structure

### Files

| File | Purpose |
|---|---|
| `lib/harness/validators/patterns.ts` | Pattern violation checker |
| `lib/patterns/injector.ts` | Pattern → ContextEnvelope formatter |
| `lib/harness/index.ts` | Add patterns step to verify pipeline |
| `skills/extract-boundary/SKILL.md` | Add pattern query step |
| `skills/subagent-driven-development/SKILL.md` | Add pattern injection to prompts |
| `skills/harness-verify/SKILL.md` | Add patterns to pipeline modes |

---

## Sub-Project 4: Maintenance

### 4A — Wiki Lint

Command: `npx ts-node tools/patterns/cli.ts lint`

Checks:
- **Contradictions** — Two patterns with opposing checks
- **Stale claims** — Pattern not seen in `reviewDays` (default 30)
- **Orphans** — Pattern with no inbound `[[links]]` in index
- **Bootstrap review** — Bootstrap patterns older than `reviewDays` without recurrence
- **Missing cross-refs** — Pattern mentions another but lacks `[[link]]`
- **Duplicates** — Patterns with semantically similar titles (fuzzy match)

Output:
```markdown
## Wiki Lint Report
⚠️ Stale: react-old-api-pattern (not seen in 73 days) — suggest archive?
❌ Contradiction: form-validation-strict vs form-validation-relaxed
   - One requires Zod, other says "native validation is fine"
📋 Bootstrap review: 3 patterns pending promotion decision
```

### 4B — Supersession

When a new pattern replaces an old one:
```markdown
## [2026-05-18] pattern-captured: react-missing-form-validation
Category: error_pattern
Status: promoted (replaces react-native-validation [superseded])
```

Old pattern gets:
```yaml
---
superseded_by: react-missing-form-validation
superseded_at: 2026-05-18
status: archived
---
```

### 4C — Staleness Lifecycle

| Days without sighting | Action |
|---|---|
| 0–30 | Normal |
| 30–60 | Lint flags for review |
| 60–90 | Lint suggests archive |
| 90+ | Auto-archive to `archived/` |

### 4D — CLI Commands

```
tools/patterns/cli.ts
├── lint          → Wiki health check
├── query <term>  → Search patterns (grep index + read entries)
├── show <id>     → Show full pattern entry
├── stats         → Summary: total, by category, top recurrents
├── promote <id>  → Promote pending → promoted
├── archive <id>  → Archive stale pattern
├── export        → Export as JSON for cross-project sharing
└── import <file> → Import patterns from JSON
```

### Files

| File | Purpose |
|---|---|
| `lib/patterns/linter.ts` | Wiki health checks (contradictions, stale, orphans, duplicates) |
| `lib/patterns/archiver.ts` | Staleness-based archiving logic |
| `tools/patterns/cli.ts` | CLI entry point (shared with Sub-project 1) |

---

## Data Flow Summary

```
User correction detected
         ↓
Capture Hook classifies (error_pattern / good_practice / constraint / one_off)
         ↓
Threshold check (bootstrap < 10 → create; normal → freq >= 3 or projects >= 2)
         ↓
Human gate (y/n/edit)
         ↓
Pattern saved to wiki (global or project-only based on config)
         ↓
Next session: extract-boundary queries wiki → injects into ContextEnvelope
         ↓
Subagent implements with pattern awareness
         ↓
Harness verify-patterns checks for violations
         ↓
BLOCK if high severity, WARN if medium/low
         ↓
Lint periodically checks wiki health
```

---

## Failure Modes

| Failure | Severity | Mitigation |
|---|---|---|
| Wiki grows too large (>500 entries) | Minor | Lint auto-suggests archive; index remains grep-able |
| False positive pattern detection | Low | Human gate prevents auto-save; n rejects |
| Global wiki pollutes project with irrelevant patterns | Medium | Module-type filtering limits injection to relevant patterns only |
| Capture hook slows session start | Low | Hook is async; keyword filter is O(n) on small trigger list |
| Patterns become stale/contradictory | Medium | Lint catches and flags; supersession handles replacements |
| Team member disagrees with pattern | Low | `n` at human gate; existing patterns can be archived via CLI |
