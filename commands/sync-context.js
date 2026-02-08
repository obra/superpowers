#!/usr/bin/env node
import { execSync } from 'child_process';

const REF = 'refs/notes/superpowers';
const cmd = `git fetch origin ${REF}:${REF}`;

console.log(`Syncing context from origin...`);
try {
    execSync(cmd, { stdio: 'inherit' });
    console.log('Successfully synced context.');
} catch (e) {
    console.error(`Failed to sync context: ${e.message}`);
    process.exit(1);
}
