import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as path from 'path';
import * as url from 'url';
import { SkillLoader } from './mcp/skillLoader.js';
import { registerTools } from './mcp/tools.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// SUPERPOWERS_SKILLS_DIR is set by the VS Code extension host.
// Fall back to adjacent skills/ directory for standalone/testing use.
const skillsDir = process.env['SUPERPOWERS_SKILLS_DIR'] ??
  path.join(__dirname, '..', 'skills');

const loader = new SkillLoader(skillsDir);

const server = new McpServer({
  name: 'superpowers',
  version: '5.0.7',
});

registerTools(server, loader);

// Resources (Phase 4) and Prompts (Phase 5) will be added next.

const transport = new StdioServerTransport();
await server.connect(transport);
