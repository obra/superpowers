/**
 * pi-superpowers subagent extension
 *
 * Registers the `dispatch_agent` custom tool for the LLM.
 * This tool enables the LLM to dispatch isolated subagent tasks by spawning
 * a `pi --no-session --print` child process, simulating Claude Code's `Task` tool.
 *
 * Usage by LLM:
 *   dispatch_agent({ task: "Implement feature X and report results", role: "implementer" })
 *
 * Architecture:
 *   subagent-utils.ts  ← pure functions (tested in subagent.test.ts)
 *   subagent.ts        ← Pi ExtensionAPI integration
 *
 * Note: Requires `pi` binary to be available in PATH.
 * If `pi` is not found, the tool returns an error message without crashing.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { buildRolePrompt, buildPiArgs, parseSubagentResult } from "./subagent-utils.js";

// Subagent timeout: 5 minutes (tasks can be long-running)
const SUBAGENT_TIMEOUT_MS = 5 * 60 * 1000;

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "dispatch_agent",
    label: "Dispatch Subagent",
    description:
      "Dispatch a subagent to handle an isolated task in a separate pi session. " +
      "Returns the agent's response. Use this instead of the Task tool for independent subtasks. " +
      "Roles: implementer, spec-reviewer, code-quality-reviewer.",

    parameters: Type.Object({
      task: Type.String({
        description:
          "Full task description and context for the subagent. Include all necessary information " +
          "since the subagent has no access to the current conversation history.",
      }),
      role: Type.Optional(
        Type.String({
          description:
            "Optional role for the subagent. One of: implementer, spec-reviewer, code-quality-reviewer. " +
            "When provided, a role system prompt is prepended.",
        })
      ),
    }),

    async execute(toolCallId, params, signal, onUpdate, _ctx) {
      const rolePrompt = buildRolePrompt(params.role);
      const args = buildPiArgs(params.task, rolePrompt);

      const roleLabel = params.role ?? "agent";
      onUpdate?.({
        content: [{ type: "text", text: `Dispatching ${roleLabel}...` }],
        details: undefined,
      });

      try {
        const result = await pi.exec("pi", args, {
          signal,
          timeout: SUBAGENT_TIMEOUT_MS,
        });

        const output = parseSubagentResult(
          result.stdout ?? "",
          result.stderr ?? "",
          result.code ?? 0
        );

        const isError = (result.code ?? 0) !== 0;

        return {
          content: [{ type: "text", text: output }],
          details: {
            role: roleLabel,
            exitCode: result.code,
            stderr: result.stderr || undefined,
          },
          isError,
        };
      } catch (err: any) {
        const message =
          err?.code === "ENOENT"
            ? "pi binary not found in PATH. Ensure pi is installed and accessible."
            : `Subagent dispatch failed: ${err?.message ?? String(err)}`;

        return {
          content: [{ type: "text", text: message }],
          details: { error: err?.message },
          isError: true,
        };
      }
    },
  });
}
