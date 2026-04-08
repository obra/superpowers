/**
 * Subagent extension utility function tests.
 *
 * Tests pure functions that build the `dispatch_agent` tool's behavior:
 *   - buildRolePrompt: converts optional role name → system prompt string
 *   - buildPiArgs: assembles `pi --no-session --print ...` argument list
 *   - parseSubagentResult: extracts text content from subagent output
 *
 * TDD order:
 *   RED  → these tests fail (subagent-utils.ts doesn't exist yet)
 *   GREEN → implement minimal functions to pass
 *   REFACTOR → clean up if needed
 */

import { describe, it, expect } from "vitest";
import {
  buildRolePrompt,
  buildPiArgs,
  parseSubagentResult,
} from "../extensions/subagent-utils.js";

// ─────────────────────────────────────────────────────────────────────────────
// buildRolePrompt
// ─────────────────────────────────────────────────────────────────────────────

describe("buildRolePrompt", () => {
  it("returns empty string when role is undefined", () => {
    expect(buildRolePrompt(undefined)).toBe("");
  });

  it("returns 'You are a implementer.' for role 'implementer'", () => {
    expect(buildRolePrompt("implementer")).toBe("You are a implementer.");
  });

  it("returns 'You are a spec-reviewer.' for role 'spec-reviewer'", () => {
    expect(buildRolePrompt("spec-reviewer")).toBe("You are a spec-reviewer.");
  });

  it("returns full Senior Code Reviewer prompt for role 'code-quality-reviewer'", () => {
    const prompt = buildRolePrompt("code-quality-reviewer");
    expect(prompt).toContain("Senior Code Reviewer");
    expect(prompt).toContain("Plan Alignment Analysis");
    expect(prompt).toContain("Code Quality Assessment");
    expect(prompt).toContain("Architecture and Design Review");
    expect(prompt).toContain("Critical (must fix)");
    expect(prompt).not.toBe("You are a code-quality-reviewer.");
  });

  it("trims whitespace from role", () => {
    expect(buildRolePrompt("  implementer  ")).toBe("You are a implementer.");
  });

  it("returns empty string for empty string role", () => {
    expect(buildRolePrompt("")).toBe("");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildPiArgs
// ─────────────────────────────────────────────────────────────────────────────

describe("buildPiArgs", () => {
  it("includes --no-session and --print flags", () => {
    const args = buildPiArgs("do the task", "");
    expect(args).toContain("--no-session");
    expect(args).toContain("--print");
  });

  it("task text is last argument", () => {
    const args = buildPiArgs("do the task", "");
    expect(args[args.length - 1]).toBe("do the task");
  });

  it("does NOT include --append-system-prompt when rolePrompt is empty", () => {
    const args = buildPiArgs("do the task", "");
    expect(args).not.toContain("--append-system-prompt");
  });

  it("includes --append-system-prompt with value when rolePrompt is provided", () => {
    const args = buildPiArgs("do the task", "You are a implementer.");
    const idx = args.indexOf("--append-system-prompt");
    expect(idx).toBeGreaterThan(-1);
    expect(args[idx + 1]).toBe("You are a implementer.");
  });

  it("still has task as last arg when rolePrompt is present", () => {
    const args = buildPiArgs("implement feature X", "You are a implementer.");
    expect(args[args.length - 1]).toBe("implement feature X");
  });

  it("returns an array of strings", () => {
    const args = buildPiArgs("task", "role");
    expect(Array.isArray(args)).toBe(true);
    args.forEach((a) => expect(typeof a).toBe("string"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseSubagentResult
// ─────────────────────────────────────────────────────────────────────────────

describe("parseSubagentResult", () => {
  it("returns stdout when non-empty", () => {
    expect(parseSubagentResult("hello output", "", 0)).toBe("hello output");
  });

  it("returns '(no output)' when stdout is empty and code is 0", () => {
    expect(parseSubagentResult("", "", 0)).toBe("(no output)");
  });

  it("returns '(no output)' when stdout is only whitespace", () => {
    expect(parseSubagentResult("   \n  ", "", 0)).toBe("(no output)");
  });

  it("includes stderr in result when stderr is non-empty and code != 0", () => {
    const result = parseSubagentResult("", "Error: something went wrong", 1);
    expect(result).toContain("Error: something went wrong");
  });

  it("returns stdout regardless of stderr when exit code is 0", () => {
    const result = parseSubagentResult("success output", "some warning", 0);
    expect(result).toBe("success output");
  });

  it("indicates failure when exit code is non-zero and no stdout", () => {
    const result = parseSubagentResult("", "fatal error", 127);
    expect(result).toMatch(/fatal error|exit code 127|failed/i);
  });
});
