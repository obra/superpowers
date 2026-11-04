import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ModApi } from "@commandcode/harness";

const EXTREMELY_IMPORTANT_MARKER = "<EXTREMELY_IMPORTANT>";
const BOOTSTRAP_MARKER = "superpowers:using-superpowers bootstrap for commandcode";

const modDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(modDir, "../..");
const skillsDir = resolve(packageRoot, "skills");
const bootstrapSkillPath = resolve(skillsDir, "using-superpowers", "SKILL.md");
const toolMappingPath = resolve(
	skillsDir,
	"using-superpowers",
	"references",
	"commandcode-tools.md",
);

// Load-bearing for appendSystemPrompt, not a read optimization. The hook runs
// every round, and the provider prompt-prefix cache keys off the system
// prompt bytes. A turn-to-turn change busts that cache. Module scope stays
// stable for the process and re-reads disk on the next process start.
let cachedBootstrap: string | null | undefined;

export default function superpowersCommandCodeMod(cmd: ModApi) {
	// Absolute path: Command Code resolves relative addSkillsPath arguments
	// against the mod file, and this checkout is what `cmd mods update`
	// refreshes. package.json commandcode.skills declares the same directory.
	cmd.addSkillsPath(skillsDir);
	cmd.hooks({
		appendSystemPrompt: () => getBootstrapContent() ?? "",
	});
}

function getBootstrapContent(): string | null {
	if (cachedBootstrap !== undefined) return cachedBootstrap;

	try {
		const skillContent = readFileSync(bootstrapSkillPath, "utf8");
		const mappingContent = readFileSync(toolMappingPath, "utf8");
		const body = stripFrontmatter(skillContent);
		cachedBootstrap = `${EXTREMELY_IMPORTANT_MARKER}
${BOOTSTRAP_MARKER}

You have superpowers.

The using-superpowers skill content is included below and is already loaded for this Command Code session. Follow it now. Do not try to load using-superpowers again.

Superpowers skills from this package are registered on Command Code's skill path (${skillsDir}). Invoke a skill with activate_skill and the skill's name. Tool names for other actions are in the mapping below.

${body}

${mappingContent.trim()}
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
