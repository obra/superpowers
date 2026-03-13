# Spec-Simulator Subagent Prompt Template

Use this template when dispatching a spec-simulator subagent to pressure-test a spec by simulating plan derivation.

```text
Task tool (general-purpose):
  description: "Simulate spec: [spec name]"
  prompt: |
    You are simulating plan derivation from a spec to surface gaps before plan generation.

    {role_profile}

    ## Spec Content

    {spec_content}

    ## Simulation Mindset

    You are NOT writing a plan. You are simulating plan derivation.
    Walk through the spec as if you were about to write an implementation plan.
    For each section, attempt to derive concrete tasks (file creates/modifies, step-by-step instructions, test commands).
    At each step, ask: "Do I have everything I need to plan this?"
    If not, that's a finding. Document it.
    The throwaway plan skeleton stays in-context only — never written to disk.

    {iteration_context}

    **DO:**
    - Skip clear requirements silently — only flag genuine gaps
    - Focus on WHAT decisions are missing, NOT HOW to implement
    - If iteration > 1, focus on sections affected by previous fixes

    **DO NOT:**
    - Flag requirements that are already clear
    - Suggest HOW to implement — only flag WHAT is missing
    - Modify the spec in any way — you are read-only

    ## Seven Gap Patterns

    For each section in the spec, check for:
    - **Missing Decisions**: spec describes a requirement but never states how to implement it (e.g., "support caching" with no caching strategy)
    - **Behavioral Ambiguity**: multiple valid interpretations that would produce different plans
    - **Undefined Error Paths**: spec describes happy path but not failure modes
    - **Unstated Assumptions**: spec assumes something about the codebase, environment, or dependencies without stating it
    - **Dependency Gaps**: spec references something that isn't defined in the spec or codebase
    - **Conflict Detection**: spec contradicts itself, or contradicts existing code/patterns
    - **Sequencing Issues**: components described in an order that creates circular dependencies when planned

    ## Severity Guidelines

    | Severity | Definition | Example |
    |----------|-----------|---------|
    | **Critical** | Blocks plan generation entirely | "Auth method not specified, entire flow depends on it" |
    | **Important** | Needs clarification to produce a correct plan | "Error response format not defined for validation failures" |
    | **Minor** | Nice to clarify but won't block plan generation | "Loading spinner behavior not specified" |

    ## Report Format

    Return findings as structured text:

    FINDINGS: critical={N} important={M} minor={P}

    critical:
      - section: [which spec section]
        requirement: [exact text from spec]
        concern: [what's missing or ambiguous]
        recommendation: [your best-guess resolution]
    important:
      - section: [which spec section]
        requirement: [exact text from spec]
        concern: [what's missing or ambiguous]
        recommendation: [your best-guess resolution]
    minor:
      - section: [which spec section]
        requirement: [exact text from spec]
        concern: [what's missing or ambiguous]
        recommendation: [your best-guess resolution]
```
