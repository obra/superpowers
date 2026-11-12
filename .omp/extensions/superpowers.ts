import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ContextEvent, ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

type Bootstrap = ContextEvent["messages"][number] & { superpowersBootstrap: true };

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const skillsDir = resolve(packageRoot, "skills");
const bootstrapSkillPath = resolve(skillsDir, "using-superpowers", "SKILL.md");

// OMP discovers the bundled skills from the package root's skills/ directory.
// This extension only delivers the using-superpowers bootstrap.
export default function superpowersOmpExtension(omp: ExtensionAPI) {
	let bootstrap: Bootstrap | undefined;
	let generation = 0;
	// The warning is persisted in the session; report a lasting failure once per session.
	let warned = false;
	const reset = () => {
		generation++;
		bootstrap = undefined;
	};
	const resetSession = () => {
		reset();
		warned = false;
	};
	omp.on("session_start", resetSession);
	omp.on("session_switch", resetSession);
	omp.on("session_branch", resetSession);
	omp.on("session_tree", resetSession);
	omp.on("session_shutdown", resetSession);

	// Reload once per user run so an updated installation applies to the next run.
	omp.on("before_agent_start", async () => {
		reset();
		const current = generation;
		let text: string;
		try {
			text = bootstrapText(await readFile(bootstrapSkillPath, "utf8"));
		} catch (error) {
			if (current !== generation || warned) return;
			warned = true;
			return {
				message: {
					customType: "superpowers-bootstrap-error",
					content: `Superpowers bootstrap unavailable: ${error instanceof Error ? error.message : String(error)}`,
					display: true,
				},
			};
		}
		if (current !== generation) return;
		warned = false;
		bootstrap = {
			role: "user",
			content: [{ type: "text", text }],
			timestamp: Date.now(),
			superpowersBootstrap: true,
		};
	});

	// The bootstrap is added to every provider request at the same position, so
	// it is never persisted in the session, survives compaction and branch
	// summaries, and keeps the request prefix byte-stable for provider prompt
	// caching. Ownership is the message property, not its text, so quoting the
	// bootstrap cannot suppress it or remove a real user message.
	omp.on("context", (event) => {
		const messages = event.messages.filter(
			(message) => !("superpowersBootstrap" in message && message.superpowersBootstrap === true),
		);
		if (bootstrap) {
			let index = 0;
			while (messages[index]?.role === "compactionSummary" || messages[index]?.role === "branchSummary") index++;
			messages.splice(index, 0, bootstrap);
		}
		if (bootstrap || messages.length !== event.messages.length) return { messages };
	});
}

function bootstrapText(skill: string): string {
	const body = skill.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "").trim();
	if (!body) throw new Error(`${bootstrapSkillPath} has no content`);
	return `<EXTREMELY_IMPORTANT>
You have superpowers.

The using-superpowers skill content is included below and is already loaded for this Oh My Pi (OMP) session. Follow it now. Do not try to load using-superpowers again.

${body}

## OMP tool mapping

OMP loads Superpowers skills natively. When a Superpowers instruction says to invoke a skill, \`read\` \`skill://<name>\` instead of Claude Code's \`Skill\` tool.

- Subagents: use OMP's \`task\` tool wherever Superpowers says \`Task\` or asks you to dispatch a subagent.
- Task tracking: use OMP's \`todo\` tool wherever Superpowers says \`TodoWrite\` or asks for a todo list.
- Files and search: use \`read\`, \`write\`, \`edit\`, \`bash\`, \`grep\`, and \`glob\`.
</EXTREMELY_IMPORTANT>`;
}
