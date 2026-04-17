#!/usr/bin/env node
/**
 * Standalone CLI entry point for the Superpowers MCP server.
 * Usage: npx superpowers-mcp
 *        node ./bin/superpowers-mcp.js
 */
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// If SUPERPOWERS_SKILLS_DIR is not set, use the skills/ directory
// adjacent to this binary (set by the package install location)
if (!process.env.SUPERPOWERS_SKILLS_DIR) {
  process.env.SUPERPOWERS_SKILLS_DIR = path.join(__dirname, '..', 'skills');
}

// Import and run the bundled server
await import(pathToFileURL(path.join(__dirname, '..', 'dist', 'server.js')).href);
