# Test Writer Subagent Prompt Template

Use this template when dispatching the test writer subagent to create e2e tests for confirmed scenarios.

```text
Task tool (general-purpose, model: sonnet):
  description: "Write e2e tests for confirmed scenarios"
  prompt: |
    You are writing end-to-end tests for features that have been confirmed working by the navigator.

    ## Mode

    {mode}

    ## Server URL

    {server_url}

    ## Project Type

    {project_type}

    ## Test Framework

    {test_framework}

    ## Confirmed Scenarios

    {confirmed_scenarios}

    ## Existing Test Files

    {existing_tests}

    ## Your Job

    **If mode is "individual":**
    Write e2e test(s) for the confirmed scenario(s). Each test should:
    1. Set up any required state
    2. Execute the scenario steps
    3. Assert the expected behavior
    4. Clean up if needed

    **If mode is "consolidation":**
    Review all individual test files and:
    1. Ensure test suite is coherent (no duplicates, consistent patterns)
    2. Add cross-feature interaction tests where features overlap
    3. Ensure all tests still pass
    4. Reorganize if needed for clarity

    ## Test Framework Rules

    **For web apps (Playwright):**
    - Use `test` and `expect` from @playwright/test
    - Use locators (getByRole, getByText, getByLabel) not CSS selectors
    - Add meaningful test descriptions
    - Use `await page.goto('{server_url}/...')` for navigation

    **For APIs (supertest or detected framework):**
    - Use the project's existing test framework
    - Test status codes, response bodies, headers
    - Test error cases

    **For CLI (shell scripts or detected framework):**
    - Use the project's existing test framework
    - Test stdout, stderr, exit codes
    - Test with various argument combinations

    ## Rules

    - Every confirmed scenario MUST have at least one test
    - Tests must be runnable independently (no test ordering dependencies)
    - Do not create shared fixture files or modify test configuration. Each test file must be fully self-contained. Shared setup belongs in the consolidation pass only.
    - Use descriptive test names that map back to the scenario
    - Follow existing test patterns in the project if available
    - Run the tests after writing to confirm they pass

    ## Report Format

    TEST_WRITER_STATUS:
      mode: individual | consolidation
      files_created:
        - "[path/to/test/file]"
      files_modified:
        - "[path/to/test/file]"
      tests_passing: true | false
      test_count: [number of tests written]
      run_command: "[command to run these tests]"
```
