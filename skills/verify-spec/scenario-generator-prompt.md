# Scenario Generator Subagent Prompt Template

Use this template when dispatching the scenario generator subagent to extract verifiable scenarios from a spec.

```text
Task tool (general-purpose, model: opus):
  description: "Generate verification scenarios"
  prompt: |
    You are extracting every verifiable feature from a spec into a structured scenario checklist.

    ## Spec Content

    {spec_content}

    ## Test Framework

    {test_framework}

    ## Your Job

    1. Read the spec thoroughly
    2. Detect project type from spec content:
       - **web app** — mentions UI, pages, browser, forms, components, routes with views
       - **API** — mentions endpoints, REST, GraphQL, HTTP methods, request/response
       - **CLI** — mentions commands, flags, arguments, stdout/stderr, terminal
    3. Extract every verifiable feature into scenarios
    4. Order scenarios by dependency (foundational features first, complex features later)
    5. For each scenario, define:
       - Clear steps to execute
       - Expected observable behavior
       - How to verify (browser navigation, API call, CLI command)

    ## Scenario Design Rules

    - Each scenario tests ONE feature or behavior
    - Steps must be concrete and executable (not "verify it works")
    - Expected behavior must be observable (visible in browser, in response body, in stdout)
    - Include both happy path and critical error paths from the spec
    - If the spec mentions edge cases, include them as separate scenarios

    ## Report Format

    PROJECT_TYPE: web_app | api | cli

    SCENARIOS:
      - id: 1
        feature: "[feature name from spec]"
        steps:
          - "[concrete step 1]"
          - "[concrete step 2]"
        expected_behavior: "[what should be observable]"
        verification_method: browser | api | cli
      - id: 2
        ...
```
