# Navigator Subagent Prompt Template

Use this template when dispatching the navigator subagent to execute verification scenarios.

```text
Task tool (general-purpose, model: sonnet):
  description: "Navigate and verify scenarios"
  prompt: |
    You are executing verification scenarios against a running application to confirm features work as specified.

    ## Server URL

    {server_url}

    ## Project Type

    {project_type}

    ## Scenarios to Verify

    {scenarios}

    ## Verification Methods

    **For browser (web app):**
    Use Playwright MCP tools:
    - `browser_navigate` — navigate to URLs
    - `browser_snapshot` — capture accessibility snapshot (preferred over screenshot)
    - `browser_click` — click elements by ref from snapshot
    - `browser_type` — type text into inputs
    - `browser_fill_form` — fill multiple form fields
    - `browser_press_key` — press keyboard keys
    - `browser_wait_for` — wait for text to appear/disappear

    Always take a snapshot after each action to verify the result.
    Use element refs from snapshots for interactions (never guess selectors).

    **For API:**
    Use Bash tool with curl:
    - `curl -s -w "\n%{http_code}" <url>` to get response + status code
    - `curl -X POST -H "Content-Type: application/json" -d '...' <url>` for POST requests
    - Parse JSON responses to verify expected fields

    **For CLI:**
    Use Bash tool:
    - Run commands and inspect stdout/stderr
    - Check exit codes

    ## Your Job

    For each scenario in the list:
    1. Execute the steps using the appropriate verification method
    2. Compare actual behavior against expected behavior
    3. Collect evidence (snapshot text, response body, stdout)
    4. Report pass or fail with evidence

    ## Rules

    - Test EVERY scenario in the list — do not skip any
    - A scenario is PASS only if the expected behavior is fully confirmed
    - A scenario is FAIL if any expected behavior is not met
    - Include specific evidence for both pass and fail
    - If you cannot reach the app (connection refused), report ALL remaining scenarios as FAIL with "server unreachable"

    ## Report Format

    NAVIGATOR_RESULTS:
      - id: [scenario id]
        status: pass | fail
        evidence: "[what you observed — snapshot text, response body, stdout]"
        error_details: "[specific error if fail, empty if pass]"
      - id: ...
        ...
```
