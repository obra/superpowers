#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { getState } from '../lib/git-notes-state.js';

// Get the full memory state
const state = getState();
const kb = state.knowledge_base || {};

// Initialize markdown content
let content = '# Agent Memory Snapshot\n\n';
content += `Generated on: ${new Date().toISOString()}\n\n`;

// 1. Decisions (ADR style)
content += '## Decisions\n\n';
if (Array.isArray(kb.decisions) && kb.decisions.length > 0) {
    kb.decisions.forEach((decision, index) => {
        if (typeof decision === 'string') {
            content += `### Decision ${index + 1}\n\n`;
            content += `${decision}\n\n`;
        } else if (typeof decision === 'object' && decision !== null) {
            const title = decision.title || `Decision ${index + 1}`;
            // Use provided ID or generate one
            const id = decision.id || `ADR-${String(index + 1).padStart(3, '0')}`;
            content += `### ${id}: ${title}\n\n`;
            
            if (decision.status) content += `**Status:** ${decision.status}\n\n`;
            if (decision.context) content += `**Context:**\n${decision.context}\n\n`;
            if (decision.decision) content += `**Decision:**\n${decision.decision}\n\n`;
            if (decision.consequences) content += `**Consequences:**\n${decision.consequences}\n\n`;
            
            // Handle other fields generically if needed, or stick to ADR structure
            const standardFields = ['title', 'id', 'status', 'context', 'decision', 'consequences'];
            const otherKeys = Object.keys(decision).filter(k => !standardFields.includes(k));
            if (otherKeys.length > 0) {
                otherKeys.forEach(key => {
                    content += `**${key.charAt(0).toUpperCase() + key.slice(1)}:**\n${JSON.stringify(decision[key], null, 2)}\n\n`;
                });
            }
        }
    });
} else {
    content += '*No decisions recorded.*\n\n';
}

// 2. Patterns (Code blocks)
content += '## Patterns\n\n';
if (Array.isArray(kb.patterns) && kb.patterns.length > 0) {
    kb.patterns.forEach((pattern, index) => {
        if (typeof pattern === 'string') {
            content += `### Pattern ${index + 1}\n\n`;
            content += '```\n' + pattern + '\n```\n\n';
        } else if (typeof pattern === 'object' && pattern !== null) {
             const title = pattern.title || `Pattern ${index + 1}`;
             content += `### ${title}\n\n`;
             
             if (pattern.description) content += `${pattern.description}\n\n`;
             
             const code = pattern.code || pattern.pattern || JSON.stringify(pattern, null, 2);
             const lang = pattern.language || '';
             content += '```' + lang + '\n' + code + '\n```\n\n';
        }
    });
} else {
    content += '*No patterns recorded.*\n\n';
}

// 3. Glossary (Definition list)
content += '## Glossary\n\n';
if (kb.glossary && typeof kb.glossary === 'object' && Object.keys(kb.glossary).length > 0) {
    // Sort keys alphabetically
    const sortedKeys = Object.keys(kb.glossary).sort();
    sortedKeys.forEach((term) => {
        const definition = kb.glossary[term];
        content += `**${term}**:\n${definition}\n\n`;
    });
} else {
    content += '*No glossary terms recorded.*\n\n';
}

// Ensure directory exists
const outputDir = path.resolve(process.cwd(), 'docs/memory');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Write file
const outputPath = path.join(outputDir, 'SNAPSHOT.md');
fs.writeFileSync(outputPath, content);

console.log(`Snapshot written to ${outputPath}`);
