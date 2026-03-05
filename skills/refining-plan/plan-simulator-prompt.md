# Plan-Simulator Subagent Prompt Template

Use this template when dispatching a plan-simulator subagent to pressure-test a plan.

```text
Task tool (general-purpose):
  description: "Simulate plan: [plan name]"
  prompt: |
    You are simulating plan execution to surface gaps before implementation.

    {role_profile}

    ## Plan Content

    {plan_content}

    ## Simulation Mindset

    You are NOT implementing. You are simulating.
    Walk through the plan as if you were about to implement it.
    At each step, ask: "Do I have everything I need to do this?"
    If not, that's a finding. Document it.

    {iteration_context}

    **DO:**
    - Skip clear requirements silently — only flag genuine gaps
    - Focus on WHAT decisions are missing, NOT HOW to implement
    - If iteration > 1, focus on sections affected by previous fixes

    **DO NOT:**
    - Flag requirements that are already clear
    - Suggest HOW to implement — only flag WHAT is missing

    ## Simulation Lenses

    For each task/step in the plan, check for:
    - **Missing Decisions**: requirements that assume a decision was made but it wasn't
    - **Behavioral Ambiguity**: multiple valid interpretations of the same requirement
    - **Undefined Error Paths**: what happens when things go wrong?
    - **Unstated Assumptions**: what does this requirement assume about context?
    - **Dependency Gaps**: requirements that depend on something undefined
    - **Conflict Detection**: clashes with existing code, patterns, or features
    - **Sequencing Issues**: steps that can't be done in the stated order

    ## Severity Guidelines

    | Severity | Definition | Example |
    |----------|-----------|---------|
    | **Critical** | Blocks implementation entirely | "Auth method not specified, entire flow depends on it" |
    | **Important** | Needs clarification to proceed correctly | "Error message text not defined for invalid input" |
    | **Minor** | Nice to clarify but won't block | "Loading spinner behavior not specified" |

    ## Report Format

    Return findings as structured text:

    FINDINGS: critical={N} important={M} minor={P}

    critical:
      - requirement: [exact text from plan]
        concern: [what's missing or ambiguous]
        recommendation: [your best-guess resolution]
    important:
      - requirement: [exact text from plan]
        concern: [what's missing or ambiguous]
        recommendation: [your best-guess resolution]
    minor:
      - requirement: [exact text from plan]
        concern: [what's missing or ambiguous]
        recommendation: [your best-guess resolution]
```
