/**
 * server.js
 *
 * MCP server: registers all tools and resources, wires up the stdio transport.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { listSkills, loadSkill, readCapabilities, readBootstrap } from './skills.js';

const SERVER_NAME    = 'superpowers-mcp';
const SERVER_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wrap a tool handler so errors surface as MCP isError responses instead of
 * crashing the server.
 */
function safe(fn) {
  return async (args) => {
    try {
      return await fn(args);
    } catch (err) {
      return {
        content: [{ type: 'text', text: err.message }],
        isError: true,
      };
    }
  };
}

// ---------------------------------------------------------------------------
// Server factory
// ---------------------------------------------------------------------------

export function createServer() {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // -------------------------------------------------------------------------
  // Tool: list_skills
  // -------------------------------------------------------------------------
  server.tool(
    'list_skills',
    'Returns the name and description of every available Superpowers skill. ' +
    'Call this first to discover which skills exist before deciding which to load.',
    {},   // no input parameters
    safe(async () => {
      const skills = listSkills();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ skills }, null, 2),
        }],
      };
    }),
  );

  // -------------------------------------------------------------------------
  // Tool: load_skill
  // -------------------------------------------------------------------------
  server.tool(
    'load_skill',
    'Returns the full instruction content of a specific Superpowers skill. ' +
    'The content is the active skill text to follow — frontmatter is stripped.',
    { name: z.string().describe('Skill name, e.g. "brainstorming" or "test-driven-development"') },
    safe(async ({ name }) => {
      const skill = loadSkill(name);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            name: skill.name,
            description: skill.description,
            content: skill.content,
          }, null, 2),
        }],
      };
    }),
  );

  // -------------------------------------------------------------------------
  // Tool: list_capabilities
  // -------------------------------------------------------------------------
  server.tool(
    'list_capabilities',
    'Returns the CAPABILITIES.md document that maps abstract Superpowers capabilities ' +
    '(Task Tracker, Skill Loader, etc.) to their platform-native equivalents.',
    {},
    safe(async () => {
      const content = readCapabilities();
      return {
        content: [{ type: 'text', text: content }],
      };
    }),
  );

  // -------------------------------------------------------------------------
  // Tool: get_bootstrap
  // -------------------------------------------------------------------------
  server.tool(
    'get_bootstrap',
    'Returns the universal Superpowers bootstrap document that explains how to use ' +
    'the skill system. Call this when the user asks "do you have superpowers?" or ' +
    'whenever you need to understand the skill workflow.',
    {},
    safe(async () => {
      const content = readBootstrap();
      return {
        content: [{ type: 'text', text: content }],
      };
    }),
  );

  // -------------------------------------------------------------------------
  // Resources
  // -------------------------------------------------------------------------

  // skill://{name} — individual skill content
  server.resource(
    'skill',
    new URL('skill://placeholder'),   // template placeholder; SDK uses listChanged for dynamic
    { description: 'Superpowers skill content. Use skill://{name} to access a specific skill.' },
    async (uri) => {
      const name = uri.hostname || uri.pathname.replace(/^\//, '');
      try {
        const skill = loadSkill(name);
        return {
          contents: [{
            uri: uri.href,
            mimeType: 'text/markdown',
            text: skill.content,
          }],
        };
      } catch (err) {
        return {
          contents: [{
            uri: uri.href,
            mimeType: 'text/plain',
            text: err.message,
          }],
          isError: true,
        };
      }
    },
  );

  // superpowers://bootstrap
  server.resource(
    'bootstrap',
    new URL('superpowers://bootstrap'),
    { description: 'Universal Superpowers bootstrap document.' },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: 'text/markdown',
        text: readBootstrap(),
      }],
    }),
  );

  // superpowers://capabilities
  server.resource(
    'capabilities',
    new URL('superpowers://capabilities'),
    { description: 'CAPABILITIES.md — maps abstract capabilities to platform-native tools.' },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: 'text/markdown',
        text: readCapabilities(),
      }],
    }),
  );

  return server;
}

// ---------------------------------------------------------------------------
// Start (stdio transport)
// ---------------------------------------------------------------------------

export async function startServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server is now running — do NOT write to stdout (breaks MCP stdio protocol)
  process.stderr.write(`${SERVER_NAME} v${SERVER_VERSION} running on stdio\n`);
}
