#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, '../lib/record-finding.js');

const result = spawnSync('node', [scriptPath, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(result.status);
