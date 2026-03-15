#!/usr/bin/env node
/**
 * index.js — Entry point for superpowers-mcp
 *
 * Run directly:  node index.js
 * Via npx:       npx superpowers-mcp
 * Global:        npm install -g superpowers-mcp && superpowers-mcp
 */

import { startServer } from './lib/server.js';

startServer().catch((err) => {
  process.stderr.write(`Fatal error: ${err.message}\n`);
  process.exit(1);
});
