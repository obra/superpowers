import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const EXTREMELY_IMPORTANT_MARKER = "<EXTREMELY_IMPORTANT>";
const BOOTSTRAP_MARKER = "superpowers:using-superpowers bootstrap for pi";

const extensionDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(extensionDir, "../..");
const skillsDir = resolve(packageRoot, "skills");
const bootstrapSkillPath = resolve(skillsDir, "using-superpowers", "SKILL.md");

type Harness = "pi" | "prime-agent";

let cachedBootstrap: string | null | undefined;

export default function superpowersPiExtension(pi: ExtensionAPI) {
	let injectBootstrap = true;
	const harness = detectHarness();

	pi.on("resources_discover", async () => ({
		skillPaths: [skillsDir],
	}));

	pi.on("session_start", async () => {
		injectBootstrap = true;
	});

	pi.on("session_compact", async () => {
		injectBootstrap = true;
	});

	pi.on("agent_end", async () => {
		injectBootstrap = false;
	});

	pi.on("context", async (event) => {
		if (!injectBootstrap) return;
		if (event.messages.some(messageContainsBootstrap)) return;

		const bootstrap = getBootstrapContent(harness);
		if (!bootstrap) return;

		const bootstrapMessage = {
			role: "user" as const,
			content: [{ type: "text" as const, text: bootstrap }],
			timestamp: Date.now(),
		};

		const insertAt = firstNonCompactionSummaryIndex(event.messages);
		return {
			messages: [
				...event.messages.slice(0, insertAt),
				bootstrapMessage,
				...event.messages.slice(insertAt),
			],
		};
	});
}

function detectHarness(): Harness {
	return process.title === "prime-agent" ? "prime-agent" : "pi";
}

function getBootstrapContent(harness: Harness): string | null {
	if (cachedBootstrap !== undefined) return cachedBootstrap;

	try {
		const skillContent = readFileSync(bootstrapSkillPath, "utf8");
		const body = stripFrontmatter(skillContent);
		const harnessName = harness === "prime-agent" ? "Prime Agent" : "Pi";
		const toolMapping = harness === "prime-agent" ? primeAgentToolMapping() : piToolMapping();
		const bootstrap = `${EXTREMELY_IMPORTANT_MARKER}
${BOOTSTRAP_MARKER}

You have superpowers.

The using-superpowers skill content is included below and is already loaded for this ${harnessName} session. Follow it now. Do not try to load using-superpowers again.

${body}

${toolMapping}
</EXTREMELY_IMPORTANT>`;
		cachedBootstrap = bootstrap;
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

function primeAgentToolMapping(): string {
	return `## Prime Agent tool mapping

Prime Agent exposes machine work through the persistent Python REPL in \`ipython\`. Use Python and \`pathlib\` for file discovery, reads, searches, and new files; use the preloaded \`await edit(...)\` skill for targeted edits; and run project commands with the preloaded \`bash(...)\` helper. Do not invent direct \`read\`, \`write\`, \`Task\`, or \`TodoWrite\` tool calls.

Prime Agent lists each skill's name, description, and \`SKILL.md\` location in the system prompt. When a Superpowers instruction says to invoke a skill, inspect that skill's current \`SKILL.md\` through \`ipython\` and follow it. A human can invoke it explicitly as \`/skill:name\`. For Python-backed skills, call the documented pre-imported module API.

Prime Agent provides recursive subagents through \`await rlm(...)\`. That call returns immediately with an admission handle, never the child's answer. Tell every child whose result you need to reply with \`await agent_message.send(message, receiver_role="parent")\` or to write a named result file. Use \`agent_message\` for follow-ups and \`agent_observe\` for bounded inspection. Start independent children without waiting between admissions, then continue useful work or end the turn; never poll with \`sleep\` or a long blocking await. Use only exact model selectors returned by \`await rlm.find_models(...)\`, or omit \`model\` to inherit the parent model.

Prime Agent does not expose a built-in todo tool. Track plan state in the plan, the Superpowers SDD ledger, or a repo-local \`TODO.md\`; do not use the \`goal\` skill as a todo substitute unless the human explicitly requested a persistent goal.`;
}

function messageContainsBootstrap(message: unknown): boolean {
	const content = (message as { content?: unknown }).content;
	if (typeof content === "string") return content.includes(BOOTSTRAP_MARKER);
	if (!Array.isArray(content)) return false;
	return content.some((part) => {
		return (
			part &&
			typeof part === "object" &&
			(part as { type?: unknown }).type === "text" &&
			typeof (part as { text?: unknown }).text === "string" &&
			(part as { text: string }).text.includes(BOOTSTRAP_MARKER)
		);
	});
}

function firstNonCompactionSummaryIndex(messages: unknown[]): number {
	let index = 0;
	while ((messages[index] as { role?: unknown } | undefined)?.role === "compactionSummary") {
		index += 1;
	}
	return index;
}
