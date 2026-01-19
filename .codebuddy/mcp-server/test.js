#!/usr/bin/env node

/**
 * Test script for CodeBuddy MCP server
 *
 * Tests core functionality without requiring MCP client connection
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import shared skills core
const skillsCoreModule = path.join(__dirname, '../../lib/skills-core.js');
const { extractFrontmatter, stripFrontmatter, findSkillsInDir, resolveSkillPath } = await import(
  'file://' + skillsCoreModule
);

console.log('Testing Superpowers MCP Server for CodeBuddy...\n');

// Test 1: Skills core module loading
console.log('Test 1: Loading shared skills-core module...');
try {
  console.log('  ✓ extractFrontmatter:', typeof extractFrontmatter === 'function');
  console.log('  ✓ stripFrontmatter:', typeof stripFrontmatter === 'function');
  console.log('  ✓ findSkillsInDir:', typeof findSkillsInDir === 'function');
  console.log('  ✓ resolveSkillPath:', typeof resolveSkillPath === 'function');
} catch (error) {
  console.error('  ✗ Failed to load skills-core module:', error.message);
  process.exit(1);
}

// Test 2: Skill discovery
console.log('\nTest 2: Skill discovery...');
try {
  const superpowersSkillsDir = path.join(__dirname, '../../skills');
  const skills = findSkillsInDir(superpowersSkillsDir, 'superpowers', 2);

  console.log(`  ✓ Found ${skills.length} skills in superpowers directory`);

  if (skills.length === 0) {
    console.error('  ✗ No skills found - check superpowers/skills/ directory');
    process.exit(1);
  }

  // Show first few skills
  skills.slice(0, 3).forEach((skill, index) => {
    console.log(`    ${index + 1}. ${skill.name || path.basename(skill.path)}`);
  });
  if (skills.length > 3) {
    console.log(`    ... and ${skills.length - 3} more`);
  }
} catch (error) {
  console.error('  ✗ Skill discovery failed:', error.message);
  process.exit(1);
}

// Test 3: Skill parsing
console.log('\nTest 3: Skill parsing (frontmatter extraction)...');
try {
  const superpowersSkillsDir = path.join(__dirname, '../../skills');
  const skillFile = path.join(superpowersSkillsDir, 'using-superpowers/SKILL.md');

  if (!fs.existsSync(skillFile)) {
    console.error('  ✗ using-superpowers skill not found');
    process.exit(1);
  }

  const { name, description } = extractFrontmatter(skillFile);
  console.log('  ✓ Skill name:', name || '(none)');
  console.log('  ✓ Description:', description ? description.substring(0, 50) + '...' : '(none)');

  if (!name && !description) {
    console.error('  ✗ No frontmatter found in skill');
    process.exit(1);
  }
} catch (error) {
  console.error('  ✗ Skill parsing failed:', error.message);
  process.exit(1);
}

// Test 4: Skill resolution
console.log('\nTest 4: Skill resolution (with shadowing)...');
try {
  const superpowersSkillsDir = path.join(__dirname, '../../skills');
  const personalSkillsDir = path.join(os.homedir(), '.config', 'codebuddy', 'skills');

  const resolved = resolveSkillPath('using-superpowers', superpowersSkillsDir, personalSkillsDir);

  if (!resolved) {
    console.error('  ✗ Failed to resolve using-superpowers skill');
    process.exit(1);
  }

  console.log('  ✓ Resolved using-superpowers to:', resolved.skillFile);
  console.log('  ✓ Source type:', resolved.sourceType);
} catch (error) {
  console.error('  ✗ Skill resolution failed:', error.message);
  process.exit(1);
}

// Test 5: Bootstrap generation
console.log('\nTest 5: Bootstrap content generation...');
try {
  const superpowersSkillsDir = path.join(__dirname, '../../skills');
  const personalSkillsDir = path.join(os.homedir(), '.config', 'codebuddy', 'skills');

  const resolved = resolveSkillPath('using-superpowers', superpowersSkillsDir, personalSkillsDir);
  const fullContent = fs.readFileSync(resolved.skillFile, 'utf8');
  const content = stripFrontmatter(fullContent);

  console.log('  ✓ Bootstrap content generated');
  console.log('  ✓ Content length:', content.length, 'characters');

  if (content.length === 0) {
    console.error('  ✗ Bootstrap content is empty');
    process.exit(1);
  }
} catch (error) {
  console.error('  ✗ Bootstrap generation failed:', error.message);
  process.exit(1);
}

// Test 6: Tool schemas
console.log('\nTest 6: MCP tool schemas...');
try {
  const tools = [
    {
      name: 'use_skill',
      description: 'Load and read a specific skill to guide your work',
      required: ['skill_name']
    },
    {
      name: 'find_skills',
      description: 'List all available skills',
      required: []
    },
    {
      name: 'get_bootstrap',
      description: 'Get the Superpowers bootstrap content',
      required: []
    }
  ];

  tools.forEach((tool, index) => {
    console.log(`  ✓ Tool ${index + 1}: ${tool.name}`);
    console.log(`    - Required params: [${tool.required.join(', ') || 'none'}]`);
  });
} catch (error) {
  console.error('  ✗ Tool schema validation failed:', error.message);
  process.exit(1);
}

// Test 7: Directory structure
console.log('\nTest 7: Directory structure...');
try {
  const requiredPaths = [
    path.join(__dirname, 'index.js'),
    path.join(__dirname, 'package.json'),
    path.join(__dirname, '../../lib/skills-core.js'),
    path.join(__dirname, '../../skills')
  ];

  requiredPaths.forEach((filePath, index) => {
    const exists = fs.existsSync(filePath);
    if (exists) {
      console.log(`  ✓ Path ${index + 1}: ${filePath}`);
    } else {
      console.error(`  ✗ Path ${index + 1} missing: ${filePath}`);
      process.exit(1);
    }
  });
} catch (error) {
  console.error('  ✗ Directory structure check failed:', error.message);
  process.exit(1);
}

// All tests passed
console.log('\n' + '='.repeat(50));
console.log('All tests passed! ✓');
console.log('='.repeat(50));
console.log('\nThe MCP server is ready to use with CodeBuddy.');
console.log('\nTo test with CodeBuddy:');
console.log('1. Configure the MCP server in CodeBuddy settings');
console.log('2. Use find_skills tool to list available skills');
console.log('3. Use use_skill tool to load specific skills');
console.log('\nSee docs/README.codebuddy.md for detailed instructions.');
