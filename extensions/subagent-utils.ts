/**
 * pi-superpowers subagent utility functions (pure, testable)
 *
 * Provides pure functions used by the dispatch_agent tool in subagent.ts.
 * Separated for testability without mocking Pi's ExtensionAPI.
 */

/**
 * Build a role prompt string from an optional role name.
 * Returns empty string when role is undefined or empty.
 *
 * @example
 *   buildRolePrompt("implementer") → "You are a implementer."
 *   buildRolePrompt(undefined)    → ""
 */
export function buildRolePrompt(role: string | undefined): string {
  if (!role) return "";
  const trimmed = role.trim();
  if (!trimmed) return "";
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
