/**
 * pi-superpowers bootstrap extension
 *
 * Injects using-superpowers skill content into the system prompt at the start
 * of each conversation (equivalent to Superpowers' SessionStart hook for Claude Code).
 *
 * Architecture:
 *   bootstrap-utils.ts  ← pure functions (tested in bootstrap.test.ts)
 *   bootstrap.ts        ← Pi ExtensionAPI integration + assembleBootstrap() export
 *
 * Injection strategy:
 *   - Uses before_agent_start event (fires before each LLM call)
 *   - Only injects on the very first user turn (0 prior user messages)
 *   - Tracks injected session to avoid re-injection on follow-up prompts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  stripFrontmatter,
  buildPiToolMapping,
  buildBootstrapContent,
  shouldInjectBootstrap,
} from "./bootstrap-utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve the skills directory relative to this extension file
const DEFAULT_SKILLS_DIR = path.resolve(__dirname, "../skills");

/**
 * Assemble the full bootstrap content from the skills directory.
 * Returns null if the using-superpowers skill cannot be found.
 *
 * Exported for testing.
 */
export function assembleBootstrap(skillsDir: string): string | null {
  const skillPath = path.join(skillsDir, "using-superpowers", "SKILL.md");

  if (!fs.existsSync(skillPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(skillPath, "utf8");
    const body = stripFrontmatter(raw);
    const toolMapping = buildPiToolMapping(skillsDir);
    return buildBootstrapContent(body, toolMapping);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pi Extension Entry Point
// ─────────────────────────────────────────────────────────────────────────────

// Track the last session that received bootstrap injection
let lastInjectedSession: string | undefined;

export default function (pi: ExtensionAPI) {
  // Reset injection tracking whenever a new session starts
  pi.on("session_start", async (_event, ctx) => {
    lastInjectedSession = undefined;
    ctx.ui.notify("✦ pi-superpowers loaded (superpowers skills available)", "info");
  });

  pi.on("before_agent_start", async (event, ctx) => {
    const sessionFile = ctx.sessionManager.getSessionFile() ?? "ephemeral";

    // Only inject once per session
    if (lastInjectedSession === sessionFile) {
      return {};
    }

    // Count prior user messages in this session branch
    const branch = ctx.sessionManager.getBranch();
    const priorUserMessages = branch.filter(
      (e) => e.type === "message" && (e.message as any)?.role === "user"
    ).length;

    if (!shouldInjectBootstrap(sessionFile, priorUserMessages)) {
      return {};
    }

    const bootstrapContent = assembleBootstrap(DEFAULT_SKILLS_DIR);
    if (!bootstrapContent) {
      ctx.ui.notify("pi-superpowers: could not load using-superpowers skill", "warning");
      return {};
    }

    // Mark this session as injected
    lastInjectedSession = sessionFile;

    return {
      systemPrompt: event.systemPrompt + "\n\n" + bootstrapContent,
    };
  });
}
