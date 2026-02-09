#!/usr/bin/env node
import { queryMemory } from '../lib/memory-ops.js';

const path = process.argv[2];

if (!path) {
    console.error('Usage: recall <path>');
    process.exit(1);
}

try {
    const result = queryMemory(path);
    if (result === undefined) {
        console.error(`Path "${path}" not found.`);
        process.exit(1);
    }
    console.log(JSON.stringify(result, null, 2));
} catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
}
