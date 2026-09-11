import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	ContextEvent,
	ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import { createBootstrapController } from "../../integrations/shared/bootstrap.ts";

const BOOTSTRAP_MARKER = "superpowers:using-superpowers bootstrap for pi";
const LOADED_MESSAGE =
	"The using-superpowers skill content is included below and is already loaded for this Pi session. Follow it now. Do not try to load using-superpowers again.";

const extensionDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(extensionDir, "../..");
const skillsDir = resolve(packageRoot, "skills");
const bootstrapSkillPath = resolve(skillsDir, "using-superpowers", "SKILL.md");

export default function superpowersPiExtension(pi: ExtensionAPI) {
	const logger = (
		pi as ExtensionAPI & {
			logger?: { warn?: (...args: unknown[]) => void };
		}
	).logger;
	const controller = createBootstrapController<
		ContextEvent["messages"][number]
	>({
		harness: "pi",
		bootstrapSkillPath,
		bootstrapMarker: BOOTSTRAP_MARKER,
		loadedMessage: LOADED_MESSAGE,
		toolMapping: piToolMapping(),
		reportDiagnostic(diagnostic) {
			if (logger?.warn) {
				logger.warn("Superpowers bootstrap unavailable", diagnostic);
			} else {
				console.warn("Superpowers bootstrap unavailable", diagnostic);
			}
		},
	});

	pi.on("resources_discover", async () => ({
		skillPaths: [skillsDir],
	}));

	pi.on("session_start", async () => {
		controller.arm();
	});

	pi.on("session_compact", async () => {
		controller.arm();
	});

	pi.on("agent_end", async () => {
		controller.disarm();
	});

	pi.on("context", async (event: ContextEvent) =>
		controller.inject(event.messages),
	);
}

function piToolMapping(): string {
	return `## Pi tool mapping

Pi has native skills but does not expose Claude Code's \`Skill\` tool. When a Superpowers instruction says to invoke a skill, use Pi's native skill system instead: load the relevant \`SKILL.md\` with \`read\` when the skill applies, or let a human invoke \`/skill:name\` explicitly.

Pi's built-in coding tools are lowercase: \`read\`, \`write\`, \`edit\`, \`bash\`, plus optional \`grep\`, \`find\`, and \`ls\`. Use those for the corresponding actions: read a file, create or edit files, run shell commands, search file contents, find files by name, and list directories.

Pi does not ship a standard subagent tool. If a subagent tool such as \`subagent\` from \`pi-subagents\` is available, use it for Superpowers subagent workflows. If no subagent tool is available, do the work in this session or explain the missing capability instead of inventing \`Task\` calls.

Pi does not ship a standard task-list tool. If an installed todo/task tool is available, use it. Otherwise track work in plan files or a repo-local \`TODO.md\` when task tracking is needed. Treat older \`TodoWrite\` references as this task-tracking action.`;
}
