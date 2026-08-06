import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ModApi } from "@commandcode/harness";

const EXTREMELY_IMPORTANT = "<EXTREMELY_IMPORTANT>";
const BOOTSTRAP_MARKER = "superpowers:using-superpowers bootstrap for commandcode";

let cachedBootstrap: string | null | undefined;

function stripFrontmatter(content: string): string {
  const m = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return (m ? m[1] : content).trim();
}

function commandcodeToolMapping(): string {
  return `## Command Code tool mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On Command Code these resolve to:

| Action skills request | Command Code equivalent |
|---|---|
| Read a file | \`read_file\` (single) or \`read_multiple_files\` |
| Read multiple files | \`read_multiple_files\` |
| Create a new file | \`write_file\` |
| Edit a file | \`edit_file\` |
| List files / directories | \`read_directory\`, \`glob\` |
| Run a shell command | \`shell_command\` |
| Search file contents | \`grep\` |
| Find files by name | \`glob\` |
| Fetch a URL | \`web_fetch\` |
| Search the web | \`web_search\` |
| Invoke a skill | Read the skill's \`SKILL.md\` with \`read_file\`, or invoke as \`/skill-name\` / \`/skill:name\` |
| Dispatch a subagent | \`agent\` with \`subagent_type: "general" | "explore" | "plan"\` |
| Task tracking | \`todo_write\` (session checklist) for simple flow; \`task_create\`/\`task_update\`/\`task_list\` for durable ledger |
| Ask the user a question | \`ask_user_question\` |
| Create / switch worktree | \`enter_worktree\` / \`exit_worktree\` (fallback: \`shell_command\` + \`git worktree\`) |

When a Superpowers skill says "create a todo", use \`todo_write\`. When it says "dispatch a subagent", use \`agent\`.`;
}

function resolveBootstrapCandidates(modDir: string, cwd: string): string[] {
  const candidates: string[] = [];
  // 1. Relative to mod file itself (package install: mods/superpowers.ts -> ../skills)
  candidates.push(resolve(modDir, "..", "skills", "using-superpowers", "SKILL.md"));
  candidates.push(resolve(modDir, "skills", "using-superpowers", "SKILL.md"));
  // 2. Project-local .commandcode/skills
  candidates.push(resolve(cwd, ".commandcode", "skills", "using-superpowers", "SKILL.md"));
  candidates.push(resolve(cwd, ".agents", "skills", "using-superpowers", "SKILL.md"));
  // 3. User-global ~/.commandcode/skills
  const home = process.env.HOME || process.env.USERPROFILE || "";
  if (home) {
    candidates.push(join(home, ".commandcode", "skills", "using-superpowers", "SKILL.md"));
    candidates.push(join(home, ".agents", "skills", "using-superpowers", "SKILL.md"));
  }
  // 4. Legacy fallback: sibling skills dir next to this file's package root
  candidates.push(resolve(modDir, "..", "..", "skills", "using-superpowers", "SKILL.md"));
  return candidates;
}

function getBootstrapContent(modDir: string, cwd: string): string | null {
  if (cachedBootstrap !== undefined) return cachedBootstrap;
  for (const p of resolveBootstrapCandidates(modDir, cwd)) {
    if (!existsSync(p)) continue;
    try {
      const raw = readFileSync(p, "utf8");
      const body = stripFrontmatter(raw);
      cachedBootstrap = `${EXTREMELY_IMPORTANT}
${BOOTSTRAP_MARKER}

You have superpowers.

The using-superpowers skill content is included below and is already loaded for this Command Code session. Follow it now. Do not try to load using-superpowers again.

${body}

${commandcodeToolMapping()}
</${EXTREMELY_IMPORTANT.slice(1)}`;
      return cachedBootstrap;
    } catch {}
  }
  // Fallback: try reading from the vendored copy next to this mod (for registry install)
  try {
    const fallback = resolve(modDir, "using-superpowers.md");
    if (existsSync(fallback)) {
      const raw = readFileSync(fallback, "utf8");
      const body = stripFrontmatter(raw);
      cachedBootstrap = `${EXTREMELY_IMPORTANT}
${BOOTSTRAP_MARKER}

You have superpowers.

${body}

${commandcodeToolMapping()}
</${EXTREMELY_IMPORTANT.slice(1)}`;
      return cachedBootstrap;
    }
  } catch {}
  cachedBootstrap = null;
  return null;
}

export default function (cmd: ModApi) {
  const modDir = dirname(fileURLToPath(import.meta.url));
  const cwd = (cmd as any).cwd || process.cwd();

  cmd.hooks({
    appendSystemPrompt: () => {
      const bootstrap = getBootstrapContent(modDir, cwd);
      return bootstrap || undefined;
    },
  });

  cmd.addCommand({
    name: "superpowers-status",
    description: "Check Superpowers bootstrap status",
    handler: () => {
      const b = getBootstrapContent(modDir, cwd);
      if (b) return { message: `Superpowers bootstrap loaded (${b.length} chars). Skills should auto-trigger. Try: Let's make a react todo list` };
      return { message: "Superpowers bootstrap NOT found. Skills not installed? Expected at .commandcode/skills/using-superpowers/SKILL.md" };
    },
  });
}
