#!/usr/bin/env node
import { execSync } from 'child_process';

const REF = 'refs/notes/superpowers';

/**
 * Robustly sync git notes from origin.
 * Handles non-fast-forward updates by merging.
 */
async function syncContext() {
    console.log(`Syncing context from origin...`);
    try {
        // 1. Fetch the remote notes to a tracking ref
        execSync(`git fetch origin ${REF}:refs/notes/origin/superpowers`, { stdio: 'pipe' });
        
        // 2. Merge remote notes into local notes
        execSync(`git notes --ref ${REF} merge refs/notes/origin/superpowers -s manual`, { stdio: 'pipe' });
        
        console.log('✅ Successfully synced and merged context.');
    } catch (e) {
        const errorText = e.stderr ? e.stderr.toString() : e.message;
        
        // If it's just a "no remote ref" error, it's fine for first-time use
        if (errorText.includes("couldn't find remote ref") || errorText.includes("fatal: couldn't find remote ref")) {
            console.log("ℹ️ No remote context found on 'origin'. Initializing local context.");
            return;
        }
        
        console.error(`❌ Failed to sync context: ${errorText}`);
        console.log("Attempting fallback to remote state...");
        try {
            execSync(`git fetch origin ${REF}:${REF} --force`, { stdio: 'pipe' });
            console.log("✅ Fallback successful (force-synced).");
        } catch (err) {
            console.error("Critical failure during sync: " + (err.stderr ? err.stderr.toString() : err.message));
            process.exit(1);
        }
    }
}

syncContext();
