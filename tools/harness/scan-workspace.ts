#!/usr/bin/env node
import { scanWorkspace } from '../../lib/harness/discovery.js';
import * as path from 'path';

async function main() {
  const cwd = process.argv[2] || process.cwd();
  console.log(`Scanning workspace: ${cwd}`);
  const config = scanWorkspace(cwd);
  console.log(`\nFound ${config.projects.length} project(s):`);
  for (const project of config.projects) {
    console.log(`  - ${project.path} (${project.stack})`);
  }
  console.log(`\nWorkspace config saved to: ${path.join(cwd, '.harness-workspace.json')}`);
}

main();
