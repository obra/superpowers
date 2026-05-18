# Addendum: Completeness & Integration Guarantees

**Date:** 2026-05-17
**Status:** Draft
**Author:** josuerf + AI Assistant
**Parent Spec:** [2026-05-17-agentic-development-harness-design.md](./2026-05-17-agentic-development-harness-design.md)

## Summary

This addendum addresses a critical gap in the original harness design: the absence of **semantic completeness verification**. The original spec covers technical validation (lint, typecheck, test, coverage) but does not verify that implementation matches the spec's acceptance criteria, that code is connected to the broader system, or that no dead code is produced. This addendum introduces four new components to close that gap.

## Problem Statement

When using subagent-driven-development with models below frontier capability, three failure modes consistently appear:

1. **Partial Implementation:** Subagents implement 3 of 5 acceptance criteria, all tests pass, but 2 ACs are silently missing.
2. **Dead Code:** Subagents create files/functions that are never imported or called — code that works in isolation but is disconnected from the system.
3. **Superficial Implementation:** Subagents implement the "happy path" only, ignoring edge cases, error handling, or integration points explicitly required by the spec.

The original harness's `SpecContextInjector` only activates when something **fails**. It does not detect when something is **absent**.

## New Components

### 1. CompletenessVerifier

Verifies that every acceptance criterion in a spec has corresponding implementation.

#### Architecture

```
CompletenessVerifier
├── ACCriteriaExtractor    — Parses spec/US to extract structured ACs
├── ImplementationMatcher  — Maps each AC to code evidence
├── CoverageCrossRef       — Validates each AC has test coverage
└── CompletenessReport     — Generates pass/partial/fail per AC
```

#### Flow

```
1. Load the spec/US for the current task
2. Extract all acceptance criteria (numbered ACs, Given/When/Then, checklists)
3. For each AC:
   a. Search for implementation evidence:
      - Code symbols (functions, classes, routes) mentioned in AC
      - Keywords/semantics from AC description (AST + grep fallback)
      - Test file references matching AC name or description
   b. Search for test evidence:
      - Test name contains AC identifier or keywords
      - Test file exists in expected location per convention
   c. Classify:
      ✅ Implemented — code + test evidence found
      ⚠️ Partial — code found but no test, or test found but incomplete
      ❌ Missing — no evidence of implementation
4. Generate completeness report with per-AC breakdown
```

#### Data Model

```typescript
interface AcceptanceCriterion {
  id: string;           // e.g., "AC-1", "AC-3"
  description: string;  // Full text of the criterion
  keywords: string[];   // Extracted search terms for code matching
  type: 'functional' | 'non-functional' | 'edge-case' | 'security';
}

interface ACEvidence {
  ac: AcceptanceCriterion;
  codeEvidence: {
    found: boolean;
    files: string[];    // Files that appear to implement this AC
    symbols: string[];  // Function/class/route names found
    confidence: 'high' | 'medium' | 'low';
  };
  testEvidence: {
    found: boolean;
    testFiles: string[];
    testNames: string[];
    coversEdgeCases: boolean;
  };
  status: 'implemented' | 'partial' | 'missing';
  gapDescription?: string; // Why it's partial/missing
}

interface CompletenessReport {
  taskId: string;
  specTitle: string;
  timestamp: string;
  criteria: ACEvidence[];
  summary: {
    total: number;
    implemented: number;
    partial: number;
    missing: number;
    score: number; // 0-100
  };
  overallStatus: 'pass' | 'partial' | 'fail';
}
```

#### ACCriteriaExtractor

Parses spec files to extract structured acceptance criteria. Supports multiple formats:

- **Numbered ACs:** `AC-1:`, `AC1.`, `1.`, `- [ ]`
- **BDD/Gherkin:** `Given/When/Then` blocks
- **User Story format:** `As a... I want... So that...` with `Acceptance Criteria:` section
- **Checklist format:** `- [ ]` items under a "Requirements" or "Criteria" heading

```typescript
interface SpecParser {
  format: 'numbered' | 'gherkin' | 'user-story' | 'checklist';
  detect(content: string): boolean;
  extract(content: string): AcceptanceCriterion[];
}
```

#### Integration with Harness Pipeline

Runs **before** `verify-local` in the pipeline. If completeness score < threshold (default: 100%), blocks progression and returns detailed gap report to the agent for correction.

```
Pipeline order:
1. completeness    ← NEW: verify all ACs are implemented
2. lint
3. typecheck
4. test
5. coverage
```

### 2. Enhanced ContextInjection for Subagents

Replaces the current `extract-boundary` approach (which only resolves technical dependencies) with a **semantic context envelope** that ensures subagents understand *what* they're building, *why*, and *how it connects*.

#### Problem with Current Approach

`extract-boundary` maps imports, types, and function signatures. It answers "what does this file depend on?" but not:

- What user story is this task part of?
- What are the acceptance criteria?
- How does this component fit into the user-facing flow?
- What constraints or non-goals exist?

#### ContextEnvelope Structure

```typescript
interface ContextEnvelope {
  // Semantic context (NEW)
  userStory: {
    title: string;
    description: string;
    actor: string;     // "As a [actor]"
    goal: string;      // "I want [goal]"
    value: string;     // "So that [value]"
  };
  acceptanceCriteria: AcceptanceCriterion[];
  flowContext: {
    triggeredBy: string;  // What calls/uses this component
    triggers: string[];   // What this component calls/uses
    pageOrRoute?: string; // Where in the UI this appears
  };
  constraints: {
    mustNot: string[];    // Explicit non-goals
    mustFollow: string[]; // Architecture patterns, conventions
    stackSpecific: Record<string, string>;
  };

  // Technical context (existing extract-boundary)
  technicalDependencies: {
    imports: string[];
    typesReferenced: string[];
    sharedHooks: string[];
    apiContracts: string[];
  };

  // Task context
  taskDescription: string;
  filesToModify: string[];
  filesToCreate: string[];
  relatedSpecs: string[]; // Links to related spec files
}
```

#### Injection into Subagent Prompt

The context envelope is serialized into the subagent dispatch prompt as a structured preamble:

```markdown
## Context: What You're Building

**User Story:** [title]
As a [actor], I want [goal], so that [value].

**Acceptance Criteria (ALL must be implemented):**
- AC-1: [description]
- AC-2: [description]
- AC-3: [description]

**Where This Fits:**
- Triggered by: [component/flow]
- Used by: [component/flow]
- Appears on: [page/route]

**Constraints:**
- Must NOT: [non-goals]
- Must follow: [patterns]

## Your Task

[task description]

## Files

- Modify: [files]
- Create: [files]

## Technical Dependencies

[existing extract-boundary output]

## After Implementation

Run `npx harness verify-local` to confirm all checks pass.
The completeness verifier will check that ALL acceptance criteria above have corresponding code and tests.
```

### 3. DeadCodeDetector

Detects symbols (functions, classes, components, routes) created by a task that are never imported, called, or referenced outside the task's own files.

#### Architecture

```
DeadCodeDetector
├── SymbolExtractor    — Lists all new symbols created by the task
├── ImportGraphBuilder — Builds import/usage graph across the project
├── ReachabilityAnalyzer — Checks if each symbol is reachable from entry points
└── DeadCodeReport     — Flags unreachable symbols with spec cross-reference
```

#### Flow

```
1. Identify files modified/created by the current task (via git diff or harness tracking)
2. For each new/modified file:
   a. Extract all exported symbols (functions, classes, components, types, routes)
   b. For each symbol:
      - Is it imported by any file OUTSIDE the task's file set?
      - Is it referenced in route definitions, component trees, or DI containers?
      - Is it called from an entry point (page, API route, main module)?
   c. If no external usage found:
      - Check spec: was this symbol expected? (keyword match against ACs)
      - If expected → flag as "integration gap" (should be connected but isn't)
      - If not expected → flag as "potential dead code" (unnecessary creation)
3. Generate dead code report
```

#### Data Model

```typescript
interface SymbolInfo {
  name: string;
  kind: 'function' | 'class' | 'component' | 'route' | 'type' | 'constant';
  file: string;
  line: number;
  exported: boolean;
}

interface ReachabilityResult {
  symbol: SymbolInfo;
  isReachable: boolean;
  reachableFrom?: string[]; // Entry points that reach this symbol
  importedBy?: string[];    // Files that import this symbol
  status: 'connected' | 'isolated' | 'dead';
  specExpected: boolean;    // Does the spec mention this symbol?
  recommendation: string;   // Actionable suggestion
}

interface DeadCodeReport {
  taskId: string;
  timestamp: string;
  symbolsAnalyzed: number;
  results: ReachabilityResult[];
  summary: {
    connected: number;
    isolated: number;
    dead: number;
    integrationGaps: number; // Expected by spec but not connected
  };
}
```

#### Integration Points Detected

The detector recognizes framework-specific connection patterns:

| Stack | Connection Pattern |
|-------|-------------------|
| React/Next.js | Imported in page/component tree, used in JSX, registered in route handler |
| C#/ASP.NET | Registered in DI container, attributed with `[ApiController]`, referenced in middleware pipeline |
| Express | Registered with `app.get/post/etc`, used in middleware chain |
| Python/FastAPI | Decorated with `@router.get/post`, imported in main app |
| Go | Registered with `http.HandleFunc`, used in handler map |
| Terraform | Referenced in resource graph, used in module output |

### 4. `/explain-drift` Command

The semantic diff between plan/spec and actual implementation. This automates the manual "clean context analysis" the user currently performs post-development.

#### Purpose

Answers: "Given the spec says X, Y, Z, and the code implements A, B, C — what's the gap?"

#### Architecture

```
/explain-drift
├── SpecReader        — Loads and parses the original spec/plan
├── ImplementationReader — Scans actual codebase for relevant files
├── SemanticDiff      — Compares spec requirements vs implementation
├── GapClassifier     — Categorizes gaps (missing, partial, divergent)
└── DriftReport       — Generates human-readable drift analysis
```

#### Flow

```
1. Load the spec/plan for the feature
2. Extract all requirements, ACs, architecture decisions from spec
3. Scan codebase for files that should implement each requirement
4. For each requirement:
   a. Does corresponding code exist?
   b. Does it match the spec's intent? (semantic similarity)
   c. Does it match the spec's architecture? (patterns, file structure)
   d. Is it tested per spec requirements?
5. Classify gaps:
   - MISSING: Spec requires it, no code exists
   - PARTIAL: Code exists but doesn't fully satisfy spec
   - DIVERGENT: Code exists but implements something different from spec
   - EXTRA: Code exists but spec doesn't mention it (potential scope creep)
6. Generate drift report with severity ratings
```

#### Data Model

```typescript
interface DriftItem {
  requirement: string;      // From spec
  requirementId: string;    // e.g., "AC-2", "ARCH-1"
  status: 'aligned' | 'missing' | 'partial' | 'divergent' | 'extra';
  severity: 'critical' | 'high' | 'medium' | 'low';
  specDescription: string;
  implementationSummary: string; // What was actually built (or "not found")
  files: string[];          // Relevant implementation files
  gapDescription: string;   // Human-readable explanation of the gap
  suggestedFix: string;     // Actionable recommendation
}

interface DriftReport {
  feature: string;
  specFile: string;
  timestamp: string;
  items: DriftItem[];
  summary: {
    total: number;
    aligned: number;
    missing: number;
    partial: number;
    divergent: number;
    extra: number;
    healthScore: number;    // 0-100
  };
  overallStatus: 'aligned' | 'drift-detected' | 'critical-drift';
}
```

#### Usage

```bash
# As CLI
npx harness explain-drift --spec path/to/spec.md --feature auth-middleware

# As skill activation
/harness explain-drift    # Uses current branch's spec
/harness explain-drift --spec path/to/other-spec.md

# As part of verify-all pipeline (step 8)
verify-all:
  1-7. [existing steps]
  8. drift-analysis → /explain-drift
```

## Updated Pipeline

### verify-local (unchanged + completeness)

1. **completeness** ← NEW: Verify all ACs implemented
2. **lint**
3. **typecheck**
4. **test**
5. **coverage**

**Target:** < 45s | Fail-fast with structured gap report

### verify-all (unchanged + drift)

1-5. Everything from verify-local
6. **security**
7. **integration**
8. **domain-specific**
9. **dead-code** ← NEW: Detect unreachable symbols
10. **drift-analysis** ← NEW: /explain-drift semantic diff

**Target:** < 8min | Generates comprehensive report

## Updated Integration with subagent-driven-development

```
1. Before dispatch → invoke enhanced context injection (NOT just extract-boundary)
   - Inject full ContextEnvelope with user story, ACs, flow context, constraints
2. Subagent implements → runs verify-local after each change
3. After subagent completes → Main Agent runs:
   a. CompletenessVerifier → checks all ACs implemented
   b. DeadCodeDetector → checks no orphaned code
   c. If gaps found → delegates correction to same subagent with specific gap list
4. After correction → re-runs verify-local
5. ReviewerAgent reviews → approves or requests changes
6. When all tasks complete → Main Agent runs verify-all (includes drift-analysis)
7. If drift detected → creates correction tasks for misaligned implementations
```

## Report Format Additions

### Completeness Report

```markdown
# Completeness Report — auth-middleware
Date: 2026-05-17T14:30:00Z | Score: 60%

## Acceptance Criteria Status
✅ AC-1: Returns 401 for unauthenticated requests
   Code: src/middleware/auth.ts:12 (AuthMiddleware function)
   Test: tests/middleware/auth.test.ts:8 ("should return 401")

⚠️ AC-2: Validates JWT token format
   Code: src/middleware/auth.ts:25 (validateToken function)
   Test: MISSING — no test for invalid token format
   Gap: Edge cases not covered (expired, malformed, wrong issuer)

❌ AC-3: Supports role-based access control
   Code: NOT FOUND
   Test: NOT FOUND
   Gap: No RBAC implementation detected

❌ AC-4: Logs authentication attempts
   Code: NOT FOUND
   Test: NOT FOUND
   Gap: No logging integration

## Summary
- Implemented: 1/4 (25%)
- Partial: 1/4 (25%)
- Missing: 2/4 (50%)
- Overall: FAIL — 2 ACs completely missing, 1 partial
```

### Dead Code Report

```markdown
# Dead Code Report — auth-middleware
Date: 2026-05-17T14:30:00Z

## Analysis
✅ src/middleware/auth.ts:AuthMiddleware — Connected (imported by src/routes/api.ts)
✅ src/middleware/auth.ts:validateToken — Connected (called by AuthMiddleware)
⚠️ src/utils/token-helpers.ts:decodeToken — Isolated (exported but never imported externally)
   Spec mentions "decode token" in AC-2 → likely should be connected
   Recommendation: Import in auth.ts or remove if unused

❌ src/utils/legacy-auth.ts — Dead (no imports, not mentioned in spec)
   Recommendation: Remove file
```

### Drift Report

```markdown
# Drift Report — auth-middleware
Date: 2026-05-17T14:30:00Z | Health: 45% | Status: CRITICAL DRIFT

## Spec vs Implementation

✅ ARCH-1: Middleware pattern for auth
   Spec: "Implement as Express/Next.js middleware"
   Implementation: src/middleware/auth.ts follows middleware pattern correctly

❌ AC-3: Role-based access control
   Spec: "Check user roles from JWT claims against route-level role requirements"
   Implementation: NOT FOUND
   Severity: CRITICAL — core feature missing
   Suggested fix: Implement role-checking layer in auth middleware

⚠️ AC-2: JWT validation
   Spec: "Validate token signature, expiry, issuer, and audience"
   Implementation: Only validates signature and expiry
   Severity: HIGH — missing issuer and audience validation
   Suggested fix: Add issuer/audience checks to validateToken

➕ EXTRA: src/utils/token-helpers.ts
   Spec: Not mentioned
   Implementation: Utility file with token decoding helpers
   Severity: LOW — may be preparatory or scope creep
   Suggested fix: Confirm with spec author or remove
```

## Design Principles (Addendum)

8. **Spec-first verification:** Completeness is checked before technical quality. A perfectly linted implementation of 3 out of 5 ACs is a failure.
9. **Semantic over syntactic:** Matching spec to code uses semantic understanding, not just keyword grep. AST parsing + LLM-assisted similarity for ambiguous cases.
10. **Reachability matters:** Code that works in isolation but isn't connected to the system is indistinguishable from no code at all.
11. **Drift is inevitable, hiding it is not:** The harness should surface spec-implementation gaps early and explicitly, not let them accumulate until manual review.
