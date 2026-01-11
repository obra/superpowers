#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LEARNINGS_DIR = 'docs/learnings';
const STALE_MONTHS = 6;

// Extract YAML frontmatter with better error handling
function extractFrontmatter(content) {
  try {
    // Normalize line endings to \n
    const normalized = content.replace(/\r\n/g, '\n');

    const match = normalized.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    const frontmatter = {};
    match[1].split('\n').forEach(line => {
      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith('#')) return;

      // Split on first colon to handle quoted values with colons
      const colonIndex = line.indexOf(': ');
      if (colonIndex === -1) return;

      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 2).trim();

      if (key && value) {
        // Handle arrays: tags: [a, b, c]
        if (value.startsWith('[')) {
          frontmatter[key] = value.slice(1, -1).split(',').map(t => t.trim());
        } else {
          frontmatter[key] = value;
        }
      }
    });

    return frontmatter;
  } catch (error) {
    console.error('Error parsing frontmatter:', error.message);
    return null;
  }
}

// Find all learning files (excluding .archive)
function findLearnings() {
  try {
    const result = execSync(
      `find ${LEARNINGS_DIR} -maxdepth 1 -name "*.md" -type f 2>/dev/null`,
      { encoding: 'utf8' }
    );
    return result.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

// Load and parse learnings
function loadLearnings() {
  return findLearnings().map(file => {
    const content = fs.readFileSync(file, 'utf8');
    const frontmatter = extractFrontmatter(content) || {};

    return {
      file,
      date: frontmatter.date || path.basename(file).split('-').slice(0, 3).join('-'),
      tags: frontmatter.tags || [],
      workflow: frontmatter.workflow || '',
      content: content.replace(/^---\n[\s\S]*?\n---\n/, '').trim()
    };
  });
}

// Identify stale learnings (6+ months old)
function findStaleLearnings(learnings) {
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - STALE_MONTHS);

  return learnings.filter(learning => {
    const learningDate = new Date(learning.date);
    return learningDate < sixMonthsAgo;
  });
}

// Detect patterns via tag clustering
function detectPatterns(learnings, threshold = 3) {
  const tagCounts = {};
  const tagLearnings = {};

  learnings.forEach(learning => {
    learning.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      if (!tagLearnings[tag]) tagLearnings[tag] = [];
      tagLearnings[tag].push(learning.file);
    });
  });

  const patterns = Object.entries(tagCounts)
    .filter(([tag, count]) => count >= threshold)
    .map(([tag, count]) => ({
      tag,
      count,
      learnings: tagLearnings[tag]
    }))
    .sort((a, b) => b.count - a.count);

  return patterns;
}

// Match patterns with existing skills
function matchSkills(patterns) {
  try {
    const skills = execSync('find skills -name "SKILL.md" -type f', { encoding: 'utf8' })
      .trim()
      .split('\n');

    return patterns.map(pattern => {
      const matchingSkill = skills.find(skillFile => {
        const content = fs.readFileSync(skillFile, 'utf8').toLowerCase();
        return content.includes(pattern.tag.toLowerCase());
      });

      return {
        pattern,
        matchingSkill: matchingSkill ? path.dirname(matchingSkill).split('/').pop() : null,
        suggestion: matchingSkill ? 'enhance' : 'create'
      };
    });
  } catch {
    return patterns.map(pattern => ({
      pattern,
      matchingSkill: null,
      suggestion: 'create'
    }));
  }
}

// Main commands
const command = process.argv[2];

if (command === 'analyze') {
  const learnings = loadLearnings();
  const stale = findStaleLearnings(learnings);
  const active = learnings.filter(l => !stale.includes(l));
  const patterns = detectPatterns(active);
  const matched = matchSkills(patterns);

  console.log(JSON.stringify({ learnings: active.length, stale: stale.length, patterns, matched }, null, 2));

} else if (command === 'patterns') {
  const learnings = loadLearnings();
  const patterns = detectPatterns(learnings);
  console.log(JSON.stringify(patterns, null, 2));

} else if (command === 'stale') {
  const learnings = loadLearnings();
  const stale = findStaleLearnings(learnings);
  console.log(JSON.stringify(stale, null, 2));

} else if (command === 'match-skills') {
  const learnings = loadLearnings();
  const patterns = detectPatterns(learnings);
  const matched = matchSkills(patterns);
  console.log(JSON.stringify(matched, null, 2));

} else {
  console.log('Usage: learning-analyzer.js [analyze|patterns|stale|match-skills]');
  process.exit(1);
}
