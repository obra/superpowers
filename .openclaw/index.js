import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const skillPath = fileURLToPath(new URL('../skills/using-superpowers/SKILL.md', import.meta.url));
const mappingPath = fileURLToPath(new URL('../skills/using-superpowers/references/openclaw-tools.md', import.meta.url));

function stripFrontmatter(content) {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
}

function bootstrapContent() {
  const skill = stripFrontmatter(readFileSync(skillPath, 'utf8'));
  const mapping = readFileSync(mappingPath, 'utf8').trim();
  return `<EXTREMELY_IMPORTANT>
You have superpowers.

The using-superpowers skill is included below and is already loaded for this session. Follow it now; do not load using-superpowers a second time.

${skill}

${mapping}
</EXTREMELY_IMPORTANT>`;
}

export default {
  id: 'superpowers',
  name: 'Superpowers',
  register(api) {
    const content = bootstrapContent();

    api.registerHook('agent:bootstrap', (event) => {
      const files = event.context.bootstrapFiles;
      if (!Array.isArray(files) || files.some((file) => file.path === skillPath)) return;

      // OpenClaw includes bootstrap files in the agent context before the
      // first model call. Use an allowed filename so subagents receive it too.
      files.unshift({ name: 'AGENTS.md', path: skillPath, content, missing: false });
    }, { name: 'superpowers-bootstrap', description: 'Load Superpowers at agent startup' });
  },
};
