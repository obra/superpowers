---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skill compliance and discoverability prior to deployment, excluding one-off problem solutions, project-specific conventions, and mechanically enforceable validation rules.
---

# Writing Skills

## Core Mandate and Operational Hierarchy

- Execute skill authoring and modification through the `RED-GREEN-REFACTOR` cycle defined in `superpowers:test-driven-development`, mapping process documentation directly to empirical subagent verification.
- Apply Anthropic's official skill authoring best practices in `references/anthropic-best-practices.md` alongside the empirical testing workflow in this specification.
- Store personal skills in the active runtime skills directory at `~/.claude/skills/` for Claude Code, or at the runtime-specific paths documented in `../using-superpowers/references/codex-tools.md` and `../using-superpowers/references/gemini-tools.md`; recognize `~/.agents/skills/` as the shared cross-runtime alias across Codex, Copilot CLI, and Gemini CLI.
- Resolve operational conflicts across the authoring lifecycle in descending priority order:
  1. Empirical baseline failure verification in the `RED` phase prior to drafting a new `SKILL.md` or applying edits to an existing `SKILL.md`.
  2. Structural alignment between the guidance form and the observed baseline failure class.
  3. Metadata discoverability and token budget isolation across `SKILL.md` and supporting files.
  4. Syntactic conciseness of inline explanations and code patterns.
- Delete completely any newly drafted skill or skill edit authored prior to running a failing baseline scenario and restart from the `RED` phase, enforcing this gate uniformly across simple additions, section additions, documentation updates, untested reference drafts, and mid-test adaptations.

| TDD Concept | Skill Authoring Equivalent |
| :--- | :--- |
| Test case | Execute a pressure scenario with a subagent |
| Production code | Author the skill document `SKILL.md` |
| Test fails `RED` | Record baseline rule violations and verbatim rationalizations in the absence of the skill |
| Test passes `GREEN` | Verify subagent compliance with the skill present in context |
| Refactor | Eliminate newly discovered rationalizations and loopholes while preserving compliance |
| Write test first | Run the baseline scenario prior to authoring or editing the skill |
| Watch it fail | Document the exact rationalizations the subagent generates under pressure |
| Minimal code | Write the minimal skill instructions required to resolve the observed baseline violations |
| Watch it pass | Confirm subagent compliance on the identical scenario |
| Refactor cycle | Identify new rationalizations, insert explicit counters, and re-verify compliance |

## Skill Qualification and Taxonomy

### Qualification Boundaries

- Create a skill when the technique requires non-obvious operational steps, applies broadly across multiple projects, and provides reusable reference value to future agents.
- Exclude from skill creation any one-off task narratives, standard practices already documented in general references, project-specific conventions belonging in project instruction files, and mechanical constraints enforceable through regular expressions or automated validators.

### Skill Classification and Testing Matrix

| Skill Type | Operational Scope | Canonical Examples | Verification Protocol | Success Criteria |
| :--- | :--- | :--- | :--- | :--- |
| `Discipline-Enforcing` | Enforce strict procedural rules and compliance requirements | `TDD`, `verification-before-completion`, `designing-before-coding` | Test rule comprehension via academic questions, run stress tests combining 3 or more pressures from time limits, sunk cost, authority, and exhaustion, and add explicit counters for observed rationalizations | Subagent follows the rule under maximum combined pressure |
| `Technique` | Provide concrete step-by-step execution methods | `condition-based-waiting`, `root-cause-tracing`, `defensive-programming` | Run application scenarios on target tasks, test variations with edge cases, and probe instructions for information gaps | Subagent applies the technique accurately to novel scenarios |
| `Pattern` | Establish mental models for structuring and decomposing problems | `flatten-with-flags`, `test-invariants`, `reducing-complexity`, `information-hiding` | Run recognition scenarios to trigger the pattern, execute application scenarios using the mental model, and test counter-examples where alternative approaches apply | Subagent identifies the exact conditions for applying or withholding the pattern |
| `Reference` | Supply API documentation, command syntax, and tool guides | `office docs`, API specifications, command references, library guides | Run retrieval scenarios to locate specific entries, test application scenarios using retrieved syntax, and audit coverage for common use cases | Subagent locates and applies the reference specification accurately |

## Directory Architecture and Packaging Rules

### Namespace and File Thresholds

- Organize all skills within a flat searchable namespace under the `skills/skill-name/` directory hierarchy containing a mandatory `SKILL.md` main reference and optional `supporting-file.*` resources:
  ```
  skills/
    skill-name/
      SKILL.md
      supporting-file.*
  ```
- Retain core principles, conceptual overviews, and code patterns under 50 lines inline within `SKILL.md`.
- Separate comprehensive API documentation or syntax references of 100 lines or more and reusable executable scripts, utilities, or templates into dedicated supporting files.
- Invoke bundled scripts explicitly through their runtime interpreter in prose instructions, such as `bash scripts/tool.sh` or `node scripts/tool.js`, to prevent `Permission denied` execution errors when harness plugin packagers strip file executable bits on bare paths like `scripts/tool.sh`.

### Packaging Topologies

1. **Self-Contained Skill** — Consolidate all instructions inline when reference material remains below the 100-line threshold and requires zero external scripts:
   ```
   defense-in-depth/
     SKILL.md
   ```
2. **Skill with Reusable Tool** — Pair the main guide with working helper code ready for direct adaptation:
   ```
   condition-based-waiting/
     SKILL.md
     example.ts
   ```
3. **Skill with Heavy Reference** — Offload large reference specifications such as a 600-line `pptxgenjs.md` API guide or a 500-line `ooxml.md` XML specification alongside executable scripts into separate files:
   ```
   pptx/
     SKILL.md
     pptxgenjs.md
     ooxml.md
     scripts/
   ```

## Content Authoring and Discovery Specification

### Metadata Frontmatter and Discovery Workflow

- Consult `references/discovery.md` when drafting or modifying frontmatter, skill names, descriptions, keyword placement, token budgets, or cross-references to other skills.
- Format the `SKILL.md` YAML frontmatter with `name` and `description` fields within a maximum budget of 1024 characters in accordance with `https://agentskills.io/specification`.
- Restrict the `name` identifier to letters, numbers, and hyphens, excluding parentheses and special characters.
- Author the `description` field in the third person starting with `"Use when..."`, stating exclusively triggering conditions, error messages, and observable symptoms while excluding any summary of the skill's internal workflow so future agents read the full `SKILL.md` body.
- Distribute searchable keywords including error strings, symptoms, and tool names early and frequently across the document to optimize for the 6-step agent discovery workflow:
  1. Encounter an operational problem such as `"tests are flaky"`.
  2. Search available skills by grepping descriptions and browsing categories.
  3. Match the target `SKILL.md` via its `description` triggers.
  4. Scan the overview section to confirm relevance.
  5. Read the quick reference table to extract core patterns.
  6. Load the concrete code example upon implementation.

### Flowcharts and Code Examples

- Consult `references/flowcharts.md` prior to adding or modifying any Graphviz flowchart to verify that the decision logic warrants visual representation and adheres to rendering conventions.
- Provide a single complete, runnable, well-commented code example drawn from a real scenario that explains the underlying rationale and adapts directly to production tasks, excluding implementations across 5 or more languages, fill-in-the-blank templates, and contrived examples while selecting the primary language most relevant to the domain:
  + Testing techniques: `TypeScript` or `JavaScript`
  + System debugging: `Shell` or `Python`
  + Data processing: `Python`
- Replace structural anti-patterns with standardized authoring forms across all sections:
  + **Session-specific narratives**: Replace single-session anecdotes such as dated `projectDir` debugging stories with reusable domain rules.
  + **Multi-language dilution**: Replace parallel implementations across `example-js.js`, `example-py.py`, and `example-go.go` with one high-clarity example in the primary domain language.
  + **Code inside flowcharts**: Replace Graphviz `dot` nodes containing source code such as `step1 [label="import fs"]; step2 [label="read file"];` with copy-pasteable fenced code blocks.
  + **Generic identifiers**: Replace opaque labels such as `helper1`, `helper2`, `step3`, and `pattern4` with semantic domain identifiers.

## Guidance Form Selection Matrix

- Classify the observed baseline failure prior to authoring instructions, and select the structural form that matches the failure mechanism:

| Observed Baseline Failure | Target Guidance Form | Excluded Counterproductive Form |
| :--- | :--- | :--- |
| Violates or skips a known rule under pressure | Explicit boundary rule paired with a rationalization counter-table and red-flags list per `references/bulletproofing.md` | Soft advisory phrasing such as `"prefer..."` or `"consider..."` |
| Complies with intent while producing a malformed, bloated, or disorganized output shape | Positive structural recipe or output contract specifying the exact required components in sequential order | Prohibition lists that trigger agent negotiation under competing incentives such as `"make the prompt self-contained"` |
| Omits a required element from an existing structured artifact | Mandatory `REQUIRED` structural field or slot embedded directly inside the template | Prose reminders placed adjacent to the template |
| Executes unconditional behavior where action depends on runtime context | Conditional rule keyed to an observable predicate such as `"if the brief exists, reference it"` | Unconditional mandate paired with nuance or exemption clauses |

- Enforce strict structural binding across all selected guidance forms:
  + **Eliminate nuance clauses**: Express every legitimate exception as an independent conditional keyed to an observable predicate, avoiding qualifying phrases that reopen negotiation and degrade recipe consistency into noisy distributions.
  + **Isolate exempt components structurally**: Restructure the document or template so scope-limited rules apply exclusively to their target sections, avoiding prose exemption clauses that spill over and suppress exempt blocks such as code blocks.
- Consult `references/bulletproofing.md` when addressing discipline failures to close loopholes, enforce alignment between rule spirit and letter, construct rationalization tables, and compile red-flags lists.

## RED-GREEN-REFACTOR Execution and Verification Gate

### Phase 1 — RED: Establish Failing Baseline

- Follow the complete subagent testing methodology in `references/testing-skills-with-subagents.md` to construct pressure scenarios combining time constraints, sunk cost, authority directives, and context exhaustion, and to apply systematic hole-plugging and meta-testing techniques.
- Run the pressure scenarios with a subagent in the absence of the target skill and record the baseline choices, rule violations, and rationalizations verbatim.
- Create an explicit tracked todo item for each step in the verification sequence across all phases below:
  + Construct pressure scenarios combining 3 or more simultaneous pressures for discipline-enforcing skills.
  + Execute scenarios in the absence of the skill and record verbatim baseline behavior.
  + Extract recurring patterns across observed rationalizations and structural failures.

### Phase 2 — GREEN: Author Minimal Skill and Micro-Test Wording

- Write the minimal `SKILL.md` content required to resolve the specific baseline failures recorded during the `RED` phase, excluding speculative rules for unobserved hypothetical cases.
- Verify behavior-shaping wording through rapid micro-tests prior to running full multi-turn pressure scenarios, applying this micro-test protocol to all behavior-shaping guidance while bypassing it for pure reference skills:
  1. Execute 1 fresh-context API call or single-shot subagent invocation per sample, supplying the complete realistic skill or prompt template as the system prompt and a failure-tempting task as the user message.
  2. Include an unassisted baseline control sample lacking the new guidance; terminate authoring immediately if the control sample already succeeds in the absence of the failure.
  3. Run 5 or more repetitions per wording variant to measure distribution stability.
  4. Read every flagged match manually to filter out template echoes and quoted counter-examples from automated scoring counts.
  5. Evaluate output shape convergence across repetitions, tightening the structural form before adding prose whenever 5 repetitions yield 5 divergent interpretations.
- Re-run the full `RED`-phase pressure scenarios with the skill loaded in context and confirm subagent compliance.

### Phase 3 — REFACTOR: Close Loopholes

- Inspect subagent transcripts from verification runs to uncover newly generated rationalizations or edge-case evasions.
- Insert explicit counters into the rationalization table and update the red-flags list for discipline skills, then re-run the pressure scenarios iteratively until compliance holds across all pressures:

| Observed Testing Bypass Rationalization | Mandatory Operational Reality |
| :--- | :--- |
| Claiming the skill is self-evidently clear | Author clarity differs from subagent interpretation; execute empirical scenario tests |
| Treating a reference skill as exempt from testing | Reference files exhibit retrieval gaps and ambiguous syntax; run retrieval and application scenarios |
| Labeling empirical testing as excessive overhead | Untested skills fail in deployment; invest 15 minutes of scenario testing to prevent multi-hour debugging |
| Deferring testing until post-deployment issues emerge | Post-deployment failures indicate broken agent execution; verify compliance prior to deployment |
| Viewing scenario setup as overly tedious | Pre-deployment testing requires less effort than diagnosing faulty skill behavior in production |
| Relying on personal confidence in draft quality | Unverified confidence masks edge-case loopholes; run the baseline and compliance suite |
| Substituting academic reading for execution testing | Passive review misses runtime pressure dynamics; test active application scenarios |
| Citing time constraints to skip verification | Deploying unverified skills multiplies downstream remediation time; complete the verification gate first |

### Phase 4 — DEPLOY: Final Quality Gate and Release

- Suspend batch creation and complete the full mandatory deployment checklist for the active skill prior to initiating work on any subsequent skill:
  + Confirm YAML frontmatter compliance within 1024 characters, alphanumeric and hyphenated `name` formatting, `"Use when..."` third-person `description` phrasing, and searchable keyword density.
  + Verify inclusion of a clear overview stating the core principle, guidance forms matched to baseline failure types, wording micro-tests for behavior-shaping skills, a quick reference table, a common mistakes section, and a single domain-matched code example inline or linked in a separate file.
  + Confirm that flowcharts appear exclusively for non-obvious decision trees, narrative storytelling is absent, and supporting files contain exclusively reusable tools or 100-line-plus reference documentation.
  + Commit the verified skill to git, push to the configured fork, and submit a pull request when the skill provides cross-project utility.
