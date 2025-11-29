#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const skillsCore = require('../lib/skills-core');

// Paths
const homeDir = os.homedir();
const superpowersSkillsDir = path.join(homeDir, '.codex', 'superpowers', 'skills');
const personalSkillsDir = path.join(homeDir, '.codex', 'skills');
const bootstrapFile = path.join(homeDir, '.codex', 'superpowers', '.codex', 'superpowers-bootstrap.md');
const superpowersRepoDir = path.join(homeDir, '.codex', 'superpowers');

// Utility functions
function printSkill(skillPath, sourceType) {
    const skillFile = path.join(skillPath, 'SKILL.md');
    const relPath = sourceType === 'personal'
        ? path.relative(personalSkillsDir, skillPath)
        : path.relative(superpowersSkillsDir, skillPath);

    // Print skill name with namespace
    if (sourceType === 'personal') {
        console.log(relPath.replace(/\\/g, '/')); // Personal skills are not namespaced
    } else {
        console.log(`superpowers:${relPath.replace(/\\/g, '/')}`); // Superpowers skills get superpowers namespace
    }

    // Extract and print metadata
    const { name, description } = skillsCore.extractFrontmatter(skillFile);

    if (description) console.log(`  ${description}`);
    console.log('');
}

// Commands
function runFindSkills() {
    console.log('Available skills:');
    console.log('==================');
    console.log('');

    const foundSkills = new Set();

    // Find personal skills first (these take precedence)
    const personalSkills = skillsCore.findSkillsInDir(personalSkillsDir, 'personal', 2);
    for (const skill of personalSkills) {
        const relPath = path.relative(personalSkillsDir, skill.path);
        foundSkills.add(relPath);
        printSkill(skill.path, 'personal');
    }

    // Find superpowers skills (only if not already found in personal)
    const superpowersSkills = skillsCore.findSkillsInDir(superpowersSkillsDir, 'superpowers', 1);
    for (const skill of superpowersSkills) {
        const relPath = path.relative(superpowersSkillsDir, skill.path);
        if (!foundSkills.has(relPath)) {
            printSkill(skill.path, 'superpowers');
        }
    }

    console.log('Usage:');
    console.log('  superpowers-codex use-skill <skill-name>   # Load a specific skill');
    console.log('');
    console.log('Skill naming:');
    console.log('  Superpowers skills: superpowers:skill-name (from ~/.codex/superpowers/skills/)');
    console.log('  Personal skills: skill-name (from ~/.codex/skills/)');
    console.log('  Personal skills override superpowers skills when names match.');
    console.log('');
    console.log('Note: All skills are disclosed at session start via bootstrap.');
}

function runBootstrap() {
    console.log('# Superpowers Bootstrap for Codex');
    console.log('# ================================');
    console.log('');

    // Check for updates (with timeout protection)
    if (skillsCore.checkForUpdates(superpowersRepoDir)) {
        console.log('## Update Available');
        console.log('');
        console.log('⚠️  Your superpowers installation is behind the latest version.');
        console.log('To update, run: `cd ~/.codex/superpowers && git pull`');
        console.log('');
        console.log('---');
        console.log('');
    }

    // Show the bootstrap instructions
    if (fs.existsSync(bootstrapFile)) {
        console.log('## Bootstrap Instructions:');
        console.log('');
        try {
            const content = fs.readFileSync(bootstrapFile, 'utf8');
            console.log(content);
        } catch (error) {
            console.log(`Error reading bootstrap file: ${error.message}`);
        }
        console.log('');
        console.log('---');
        console.log('');
    }

    // Run find-skills to show available skills
    console.log('## Available Skills:');
    console.log('');
    runFindSkills();

    console.log('');
    console.log('---');
    console.log('');

    // Load the using-superpowers skill automatically
    console.log('## Auto-loading superpowers:using-superpowers skill:');
    console.log('');
    runUseSkill('superpowers:using-superpowers');

    console.log('');
    console.log('---');
    console.log('');
    console.log('# Bootstrap Complete!');
    console.log('# You now have access to all superpowers skills.');
    console.log('# Use "superpowers-codex use-skill <skill>" to load and apply skills.');
    console.log('# Remember: If a skill applies to your task, you MUST use it!');
}

function runUseSkill(skillName) {
    if (!skillName) {
        console.log('Usage: superpowers-codex use-skill <skill-name>');
        console.log('Examples:');
        console.log('  superpowers-codex use-skill superpowers:brainstorming  # Load superpowers skill');
        console.log('  superpowers-codex use-skill brainstorming              # Load personal skill (or superpowers if not found)');
        console.log('  superpowers-codex use-skill my-custom-skill            # Load personal skill');
        return;
    }

    // Handle namespaced skill names
    let actualSkillPath;
    let forceSuperpowers = false;

    if (skillName.startsWith('superpowers:')) {
        // Remove the superpowers: namespace prefix
        actualSkillPath = skillName.substring('superpowers:'.length);
        forceSuperpowers = true;
    } else {
        actualSkillPath = skillName;
    }

    // Remove "skills/" prefix if present
    if (actualSkillPath.startsWith('skills/')) {
        actualSkillPath = actualSkillPath.substring('skills/'.length);
    }

    // Function to find skill file
    function findSkillFile(searchPath) {
        // Check for exact match with SKILL.md
        const skillMdPath = path.join(searchPath, 'SKILL.md');
        if (fs.existsSync(skillMdPath)) {
            return skillMdPath;
        }

        // Check for direct SKILL.md file
        if (searchPath.endsWith('SKILL.md') && fs.existsSync(searchPath)) {
            return searchPath;
        }

        return null;
    }

    let skillFile = null;

    // If superpowers: namespace was used, only check superpowers skills
    if (forceSuperpowers) {
        if (fs.existsSync(superpowersSkillsDir)) {
            const superpowersPath = path.join(superpowersSkillsDir, actualSkillPath);
            skillFile = findSkillFile(superpowersPath);
        }
    } else {
        // First check personal skills directory (takes precedence)
        if (fs.existsSync(personalSkillsDir)) {
            const personalPath = path.join(personalSkillsDir, actualSkillPath);
            skillFile = findSkillFile(personalPath);
            if (skillFile) {
                console.log(`# Loading personal skill: ${actualSkillPath}`);
                console.log(`# Source: ${skillFile}`);
                console.log('');
            }
        }

        // If not found in personal, check superpowers skills
        if (!skillFile && fs.existsSync(superpowersSkillsDir)) {
            const superpowersPath = path.join(superpowersSkillsDir, actualSkillPath);
            skillFile = findSkillFile(superpowersPath);
            if (skillFile) {
                console.log(`# Loading superpowers skill: superpowers:${actualSkillPath}`);
                console.log(`# Source: ${skillFile}`);
                console.log('');
            }
        }
    }

    // If still not found, error
    if (!skillFile) {
        console.log(`Error: Skill not found: ${actualSkillPath}`);
        console.log('');
        console.log('Available skills:');
        runFindSkills();
        return;
    }

    // Extract frontmatter and content using shared core functions
    let content, frontmatter;
    try {
        const fullContent = fs.readFileSync(skillFile, 'utf8');
        const { name, description } = skillsCore.extractFrontmatter(skillFile);
        content = skillsCore.stripFrontmatter(fullContent);
        frontmatter = { name, description };
    } catch (error) {
        console.log(`Error reading skill file: ${error.message}`);
        return;
    }

    // Display skill header with clean info
    const displayName = forceSuperpowers ? `superpowers:${actualSkillPath}` :
                       (skillFile.includes(personalSkillsDir) ? actualSkillPath : `superpowers:${actualSkillPath}`);

    const skillDirectory = path.dirname(skillFile);

    console.log(`# ${frontmatter.name || displayName}`);
    if (frontmatter.description) {
        console.log(`# ${frontmatter.description}`);
    }
    console.log(`# Skill-specific tools and reference files live in ${skillDirectory}`);
    console.log('# ============================================');
    console.log('');

    // Display the skill content (without frontmatter)
    console.log(content);

}

// Main CLI
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
    case 'bootstrap':
        runBootstrap();
        break;
    case 'use-skill':
        runUseSkill(arg);
        break;
    case 'find-skills':
        runFindSkills();
        break;
    default:
        console.log('Superpowers for Codex');
        console.log('Usage:');
        console.log('  superpowers-codex bootstrap              # Run complete bootstrap with all skills');
        console.log('  superpowers-codex use-skill <skill-name> # Load a specific skill');
        console.log('  superpowers-codex find-skills            # List all available skills');
        console.log('');
        console.log('Examples:');
        console.log('  superpowers-codex bootstrap');
        console.log('  superpowers-codex use-skill superpowers:brainstorming');
        console.log('  superpowers-codex use-skill my-custom-skill');
        break;
}
