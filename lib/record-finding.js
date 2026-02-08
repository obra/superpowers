#!/usr/bin/env node
import { updateState } from './git-notes-state.js';

const args = process.argv.slice(2);
const params = {};

for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
        const key = args[i].replace(/^--/, '');
        const value = args[i + 1];
        params[key] = value;
        i++;
    }
}

const { role, key, value } = params;

if (!role || !key || !value) {
    console.error('Usage: node lib/record-finding.js --role <role> --key <key> --value <value>');
    process.exit(1);
}

let parsedValue;
try {
    // Try to parse as JSON if it looks like an object or array
    if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
        parsedValue = JSON.parse(value);
    } else {
        parsedValue = value;
    }
} catch (e) {
    parsedValue = value;
}

const update = {
    [role]: {
        [key]: parsedValue
    },
    metadata: {
        last_agent: process.env.AGENT_NAME || 'opencode',
        timestamp: new Date().toISOString()
    }
};

try {
    updateState(update);
    console.log(`Successfully recorded finding for role "${role}", key "${key}"`);
} catch (e) {
    console.error(`Error recording finding: ${e.message}`);
    process.exit(1);
}
