/**
 * Superpowers plugin for Cline (CLI / SDK / Kanban hosts)
 *
 * Cline loads in-process plugins (Shape B per docs/porting-to-a-new-harness.md):
 * a module exporting an `AgentPlugin` (a.k.a. `AgentExtension`), discovered via
 * the `cline.plugins` field in package.json.
 *
 * Two contributions, matching the harness's own mechanisms:
 *
 *   1. Skills — Cline auto-discovers the `skills/` directory shipped next to
 *      package.json when the plugin is installed (see Cline docs,
 *      /sdk/guides/writing-plugins "Bundling Skills"). Superpowers ships its
 *      skills in the conventional `skills/<name>/SKILL.md` layout, so no
 *      registration code is needed. Skills are invoked through Cline's native
 *      `skills` tool (invocation string: `<skill> [args]`).
 *
 *   2. Bootstrap — the non-negotiable part of every port: at the start of
 *      every top-level session, the full `using-superpowers` skill content
 *      (wrapped in <EXTREMELY_IMPORTANT>) plus the Cline tool mapping is
 *      injected in front of the model. We use the `beforeRun` lifecycle hook's
 *      `appendContext` return — Cline's typed, host-supported mechanism for
 *      hook context injection — and mirror the other in-process integrations
 *      (OpenCode, pi):
 *
 *        - cached after first read (the SKILL.md does not change mid-session)
 *        - skipped when the transcript already contains the bootstrap marker
 *          (follow-ups in the same session)
 *        - skipped for subagent sessions (snapshot.parentAgentId is set),
 *          because the bootstrap drives controller workflows; workers would
 *          restart design/approval cycles for work the parent already
 *          authorised. Skills stay available to workers either way.
 *
 * Zero dependencies: only node builtins and the host-provided @cline/sdk.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	AgentPlugin,
	AgentRuntimeStateSnapshot,
	Message,
} from "@cline/sdk";

const EXTREMELY_IMPORTANT_MARKER = "<EXTREMELY_IMPORTANT>";
const BOOTSTRAP_MARKER = "superpowers:using-superpowers bootstrap for Cline";

const pluginDir = dirname(fileURLToPath(import.meta.url));
// Plugin entry lives in .cline-plugin/ at the package root.
const packageRoot = resolve(pluginDir, "..");
const skillsDir = resolve(packageRoot, "skills");
const bootstrapSkillPath = resolve(skillsDir, "using-superpowers", "SKILL.md");

/**
 * Cline tool mapping, following the convention of the other harness
 * references (references/<harness>-tools.md + inline in the bootstrap):
 * translate Superpowers' action vocabulary into Cline's real tool names.
 */
const CLINE_TOOL_MAPPING = `## Cline tool mapping

Cline does not expose Claude Code's \`Skill\` or \`Task\` tools by those names. When a Superpowers instruction names one, use the Cline equivalent:

- Invoke a skill → Cline's native \`skills\` tool (invocation: \`<skill> [args]\`). Skills are also available as slash commands (\`/<skill>\`) when your human partner wants to force one.
- Read files → \`read_files\`
- Create, edit, or delete files → \`editor\` or \`apply_patch\`
- Run shell commands → \`run_commands\`
- Search file contents → \`search_codebase\` (regex, multiple parallel searches in one call)
- Ask your human partner a question with options → \`ask_question\`
- Dispatch a subagent (e.g. SDD implementer/reviewer, parallel agents) → \`spawn_agent\` (synchronous; give it a precise self-contained \`systemPrompt\` and \`task\`). If an agents-squad-style \`start_subagent\` tool is available (async background runs), prefer it for parallel work and poll with \`get_subagent\`.
- Create or update todos / task lists → Cline's plan-mode todo UI or the \`tasks\` tool when available; otherwise track the plan in a markdown file under the repo (Superpowers plan files are the fallback every skill already accepts).

When a Superpowers skill references \`TodoWrite\`, \`Task\`, or \`Skill\`, treat those as the actions above, not as literal tool names.`;

// ---------------------------------------------------------------------------
// Bootstrap assembly (cached — SKILL.md is static for the plugin's lifetime)
// ---------------------------------------------------------------------------

/**
 * Minimal frontmatter stripper (same approach as .pi and .opencode
 * integrations — no YAML dependency needed for one file).
 */
function stripFrontmatter(content: string): string {
	const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
	return (match ? match[1] : content).trim();
}

let cachedBootstrap: string | null | undefined;

/**
 * Test helper: reset the bootstrap cache so a fresh module instance can
 * re-derive it. Exported only for unit tests (tests/cline/).
 */
export function __resetBootstrapCache(): void {
	cachedBootstrap = undefined;
}

function getBootstrapContent(): string | null {
	if (cachedBootstrap !== undefined) return cachedBootstrap;

	try {
		const fullContent = readFileSync(bootstrapSkillPath, "utf8");
		const body = stripFrontmatter(fullContent);
		cachedBootstrap = `${EXTREMELY_IMPORTANT_MARKER}
${BOOTSTRAP_MARKER}

You have superpowers.

The using-superpowers skill content is included below and is already loaded for this Cline session. Follow it now. Do not try to load using-superpowers again.

${body}

${CLINE_TOOL_MAPPING}
</EXTREMELY_IMPORTANT>`;
		return cachedBootstrap;
	} catch {
		cachedBootstrap = null;
		return null;
	}
}

// ---------------------------------------------------------------------------
// Injection guards
// ---------------------------------------------------------------------------

function textOfMessage(message: Message): string {
	if (typeof message.content === "string") return message.content;
	return message.content
		.filter((part) => part.type === "text" && typeof part.text === "string")
		.map((part) => part.text as string)
		.join("\n");
}

function transcriptContainsBootstrap(messages: readonly Message[]): boolean {
	return messages.some((message) =>
		textOfMessage(message).includes(BOOTSTRAP_MARKER),
	);
}

function isSubagentSession(snapshot: AgentRuntimeStateSnapshot): boolean {
	// parentAgentId is null/undefined for top-level sessions; a set id means
	// this run belongs to a spawned child.
	return typeof snapshot.parentAgentId === "string" &&
		snapshot.parentAgentId.length > 0;
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

const plugin: AgentPlugin = {
	name: "superpowers",
	manifest: {
		capabilities: ["hooks", "skills"],
	},

	hooks: {
		/**
		 * Fires once per agent run (one user turn). Return
		 * `appendContext` and Cline appends it to the conversation as a
		 * `<hook_context>` user message before the run's first model request.
		 */
		beforeRun(context) {
			try {
				if (isSubagentSession(context.snapshot)) return;
				if (transcriptContainsBootstrap(context.snapshot.messages)) {
					return;
				}
				const bootstrap = getBootstrapContent();
				if (!bootstrap) return;
				return { appendContext: bootstrap };
			} catch (err) {
				// A failing bootstrap hook must never break the run.
				console.error("[superpowers] beforeRun bootstrap failed:", err);
				return;
			}
		},
	},
};

export { plugin };
export default plugin;

