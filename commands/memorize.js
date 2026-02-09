#!/usr/bin/env node
import { appendToMemory } from '../lib/memory-ops.js';

const args = process.argv.slice(2);
let section;
let value;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--value') {
        value = args[i + 1];
        i++;
    } else if (args[i] === '--section') {
        section = args[i + 1];
        i++;
    } else if (!section && !args[i].startsWith('--')) {
        section = args[i];
    }
}

if (!section) {
    console.error('Usage: memorize <section> --value <value>');
    process.exit(1);
}

if (value === undefined) {
    console.error('Error: --value argument is required.');
    process.exit(1);
}

// Parse value
let parsedValue = value;
try {
    const trimmed = value.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        parsedValue = JSON.parse(value);
    }
} catch (e) {
    // Keep as string
}

try {
    appendToMemory(section, parsedValue);
    console.log(`Successfully updated memory at "${section}"`);
} catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
}
