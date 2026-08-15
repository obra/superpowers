import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CommandCodeAPI } from "@commandcode/harness";

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

let cachedBootstrap: string | null | undefined;

export default function superpowersCommandCodeMod(cmd: CommandCodeAPI) {
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

Skills live at ${skillsDir}. To invoke a skill, read its SKILL.md with read_file (or use /skill-name if already discovered). Reading SKILL.md is the blessed invoke path.

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
