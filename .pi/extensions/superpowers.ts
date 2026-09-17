import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const EXTREMELY_IMPORTANT_MARKER = "<EXTREMELY_IMPORTANT>";
const BOOTSTRAP_MARKER = "superpowers:using-superpowers bootstrap for pi";
const BOOTSTRAP_CUSTOM_TYPE = "superpowers-bootstrap";

const extensionDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(extensionDir, "../..");
const skillsDir = resolve(packageRoot, "skills");
const bootstrapSkillPath = resolve(skillsDir, "using-superpowers", "SKILL.md");

let cachedBootstrap: string | null | undefined;

export default function superpowersPiExtension(pi: ExtensionAPI) {
	let bootstrapPendingInRun = false;

	pi.on("resources_discover", async () => ({
		skillPaths: [skillsDir],
	}));

	pi.on("session_start", async () => {
		bootstrapPendingInRun = false;
	});

	pi.on("session_compact", async (_event, ctx) => {
		if (activeContextHasBootstrap(ctx.sessionManager)) {
			bootstrapPendingInRun = false;
			return;
		}
		if (bootstrapPendingInRun) return;

		const message = createBootstrapMessage();
		if (!message) return;

		pi.sendMessage(message, { deliverAs: "steer" });
		bootstrapPendingInRun = !ctx.isIdle();
	});

	pi.on("before_agent_start", async (_event, ctx) => {
		if (activeContextHasBootstrap(ctx.sessionManager)) return;

		const message = createBootstrapMessage();
		if (!message) return;

		bootstrapPendingInRun = true;
		return { message };
	});

	pi.on("agent_start", async () => {
		bootstrapPendingInRun = false;
	});

	pi.on("message_end", async event => {
		if (event.message.role === "custom" && event.message.customType === BOOTSTRAP_CUSTOM_TYPE) {
			bootstrapPendingInRun = false;
		}
	});

	pi.on("agent_end", async () => {
		bootstrapPendingInRun = false;
	});
}

function createBootstrapMessage() {
	const content = getBootstrapContent();
	if (!content) return null;
	return {
		customType: BOOTSTRAP_CUSTOM_TYPE,
		content,
		display: false,
	};
}

function activeContextHasBootstrap(sessionManager: {
	buildContextEntries?: () => ReadonlyArray<{ type?: unknown; customType?: unknown }>;
	buildSessionContext?: () => {
		messages?: ReadonlyArray<{ role?: unknown; customType?: unknown }>;
	};
}): boolean {
	const entries = sessionManager.buildContextEntries?.();
	if (entries) {
		return entries.some(
			entry => entry.type === "custom_message" && entry.customType === BOOTSTRAP_CUSTOM_TYPE,
		);
	}

	const messages = sessionManager.buildSessionContext?.().messages;
	return (
		messages?.some(message => message.role === "custom" && message.customType === BOOTSTRAP_CUSTOM_TYPE) ?? false
	);
}

function getBootstrapContent(): string | null {
	if (cachedBootstrap !== undefined) return cachedBootstrap;

	try {
		const skillContent = readFileSync(bootstrapSkillPath, "utf8");
		const body = stripFrontmatter(skillContent);
		cachedBootstrap = `${EXTREMELY_IMPORTANT_MARKER}
${BOOTSTRAP_MARKER}

You have superpowers.

The using-superpowers skill content is included below and is already loaded for this Pi session. Follow it now. Do not try to load using-superpowers again.

${body}

${piToolMapping()}
</EXTREMELY_IMPORTANT>`;
		return cachedBootstrap;
	} catch {
		cachedBootstrap = null;
		return null;
	}
}

function stripFrontmatter(content: string): string {
	const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
	return (match ? match[1] : content).trim();
}

function piToolMapping(): string {
	return `## Pi tool mapping

Pi has native skills but does not expose Claude Code's \`Skill\` tool. When a Superpowers instruction says to invoke a skill, use Pi's native skill system instead: load the relevant \`SKILL.md\` with \`read\` when the skill applies, or let a human invoke \`/skill:name\` explicitly.

Pi's built-in coding tools are lowercase: \`read\`, \`write\`, \`edit\`, \`bash\`, plus optional \`grep\`, \`find\`, and \`ls\`. Use those for the corresponding actions: read a file, create or edit files, run shell commands, search file contents, find files by name, and list directories.

Pi does not ship a standard subagent tool. If a subagent tool such as \`subagent\` from \`pi-subagents\` is available, use it for Superpowers subagent workflows. If no subagent tool is available, do the work in this session or explain the missing capability instead of inventing \`Task\` calls.

Pi does not ship a standard task-list tool. If an installed todo/task tool is available, use it. Otherwise track work in plan files or a repo-local \`TODO.md\` when task tracking is needed. Treat older \`TodoWrite\` references as this task-tracking action.`;
}
