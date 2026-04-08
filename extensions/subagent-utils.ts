/**
 * pi-superpowers subagent utility functions (pure, testable)
 *
 * Provides pure functions used by the dispatch_agent tool in subagent.ts.
 * Separated for testability without mocking Pi's ExtensionAPI.
 */

/**
 * Full system prompt for the code-quality-reviewer role.
 * Ported from agents/code-reviewer.md (Claude Code agent definition).
 */
const CODE_QUALITY_REVIEWER_PROMPT = `You are a Senior Code Reviewer with expertise in software architecture, design patterns, and best practices. Your role is to review completed project steps against original plans and ensure code quality standards are met.

When reviewing completed work, you will:

1. **Plan Alignment Analysis**:
   - Compare the implementation against the original planning document or step description
   - Identify any deviations from the planned approach, architecture, or requirements
   - Assess whether deviations are justified improvements or problematic departures
   - Verify that all planned functionality has been implemented

2. **Code Quality Assessment**:
   - Review code for adherence to established patterns and conventions
   - Check for proper error handling, type safety, and defensive programming
   - Evaluate code organization, naming conventions, and maintainability
   - Assess test coverage and quality of test implementations
   - Look for potential security vulnerabilities or performance issues

3. **Architecture and Design Review**:
   - Ensure the implementation follows SOLID principles and established architectural patterns
   - Check for proper separation of concerns and loose coupling
   - Verify that the code integrates well with existing systems
   - Assess scalability and extensibility considerations

4. **Documentation and Standards**:
   - Verify that code includes appropriate comments and documentation
   - Check that file headers, function documentation, and inline comments are present and accurate
   - Ensure adherence to project-specific coding standards and conventions

5. **Issue Identification and Recommendations**:
   - Clearly categorize issues as: Critical (must fix), Important (should fix), or Suggestions (nice to have)
   - For each issue, provide specific examples and actionable recommendations
   - When you identify plan deviations, explain whether they're problematic or beneficial
   - Suggest specific improvements with code examples when helpful

6. **Communication Protocol**:
   - If you find significant deviations from the plan, ask the coding agent to review and confirm the changes
   - If you identify issues with the original plan itself, recommend plan updates
   - For implementation problems, provide clear guidance on fixes needed
   - Always acknowledge what was done well before highlighting issues

Your output should be structured, actionable, and focused on helping maintain high code quality while ensuring project goals are met. Be thorough but concise, and always provide constructive feedback that helps improve both the current implementation and future development practices.`;

/**
 * Build a role prompt string from an optional role name.
 * Returns empty string when role is undefined or empty.
 *
 * Known roles with full prompts:
 *   - "code-quality-reviewer" → Senior Code Reviewer (ported from agents/code-reviewer.md)
 *
 * Unknown roles fall back to a generic "You are a <role>." prompt.
 *
 * @example
 *   buildRolePrompt("code-quality-reviewer") → full Senior Code Reviewer prompt
 *   buildRolePrompt("implementer")           → "You are a implementer."
 *   buildRolePrompt(undefined)               → ""
 */
export function buildRolePrompt(role: string | undefined): string {
  if (!role) return "";
  const trimmed = role.trim();
  if (!trimmed) return "";
  if (trimmed === "code-quality-reviewer") return CODE_QUALITY_REVIEWER_PROMPT;
  return `You are a ${trimmed}.`;
}

/**
 * Build the argument list for `pi --no-session --print ...`.
 *
 * When rolePrompt is non-empty, injects --append-system-prompt before the task.
 * The task string is always the last argument.
 *
 * @example
 *   buildPiArgs("implement X", "") →
 *     ["--no-session", "--print", "implement X"]
 *
 *   buildPiArgs("implement X", "You are a implementer.") →
 *     ["--no-session", "--print", "--append-system-prompt", "You are a implementer.", "implement X"]
 */
export function buildPiArgs(task: string, rolePrompt: string): string[] {
  const args: string[] = ["--no-session", "--print"];

  if (rolePrompt) {
    args.push("--append-system-prompt", rolePrompt);
  }

  args.push(task);
  return args;
}

/**
 * Parse the raw stdout/stderr/exitCode from a subagent pi process into
 * a human-readable result string.
 *
 * Rules:
 *   - If stdout has content (non-whitespace), return it as-is.
 *   - If exit code is 0 and stdout is empty → "(no output)"
 *   - If exit code is non-zero → include stderr and exit code in error message
 */
export function parseSubagentResult(
  stdout: string,
  stderr: string,
  exitCode: number
): string {
  const trimmedOut = stdout.trim();

  if (trimmedOut) {
    return trimmedOut;
  }

  if (exitCode === 0) {
    return "(no output)";
  }

  // Non-zero exit: surface stderr + code
  const errMsg = stderr.trim();
  if (errMsg) {
    return `Subagent failed (exit code ${exitCode}): ${errMsg}`;
  }
  return `Subagent failed (exit code ${exitCode})`;
}
