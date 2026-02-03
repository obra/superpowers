#!/usr/bin/env node

/**
 * Render graphviz diagrams from a skill's SKILL.md to SVG files.
 *
 * Usage:
 *   ./render-graphs.js <skill-directory>           # Render each diagram separately
 *   ./render-graphs.js <skill-directory> --combine # Combine all into one diagram
 *
 * Extracts all ```dot blocks from SKILL.md and renders to SVG.
 * Useful for helping your human partner visualize the process flows.
 *
 * Requires: graphviz (dot) installed on system
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function extractDotBlocks(markdown) {
  const blocks = [];
  const regex = /```dot\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    const content = match[1].trim();

    // Extract digraph name
    const nameMatch = content.match(/digraph\s+(\w+)/);
    let name = nameMatch ? nameMatch[1] : `graph_${blocks.length + 1}`;
    
    // Validate graph name to prevent injection attacks
    // Only allow alphanumeric characters and underscores in graph names
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      console.warn(`Warning: Invalid graph name "${name}" - using fallback name`);
      name = `graph_${blocks.length + 1}`;
    }

    blocks.push({ name, content });
  }

  return blocks;
}

function extractGraphBody(dotContent) {
  // Extract just the body (nodes and edges) from a digraph
  const match = dotContent.match(/digraph\s+\w+\s*\{([\s\S]*)\}/);
  if (!match) return '';

  let body = match[1];

  // Remove rankdir (we'll set it once at the top level)
  body = body.replace(/^\s*rankdir\s*=\s*\w+\s*;?\s*$/gm, '');

  return body.trim();
}

function combineGraphs(blocks, skillName) {
  const bodies = blocks.map((block, i) => {
    const body = extractGraphBody(block.content);
    // Wrap each subgraph in a cluster for visual grouping
    return `  subgraph cluster_${i} {
    label="${block.name}";
    ${body.split('\n').map(line => '  ' + line).join('\n')}
  }`;
  });

  return `digraph ${skillName}_combined {
  rankdir=TB;
  compound=true;
  newrank=true;

${bodies.join('\n\n')}
}`;
}

function renderToSvg(dotContent) {
  try {
    return execSync('dot -Tsvg', {
      input: dotContent,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });
  } catch (err) {
    console.error('Error running dot:', err.message);
    if (err.stderr) console.error(err.stderr.toString());
    return null;
  }
}

function main() {
  // Safely extract and validate command-line arguments to prevent prototype pollution
  const args = process.argv.slice(2);
  
  // Validate all arguments to ensure they don't contain prototype pollution patterns
  for (const arg of args) {
    if (typeof arg !== 'string') {
      console.error('Error: Invalid argument type');
      process.exit(1);
    }
    // Prevent prototype pollution attacks via __proto__, constructor, or prototype
    if (arg.includes('__proto__') || arg.includes('constructor') || arg.includes('prototype')) {
      console.error('Error: Invalid argument detected');
      process.exit(1);
    }
  }
  
  const combine = args.includes('--combine');
  const skillDirArg = args.find(a => !a.startsWith('--'));

  if (!skillDirArg) {
    console.error('Usage: render-graphs.js <skill-directory> [--combine]');
    console.error('');
    console.error('Options:');
    console.error('  --combine    Combine all diagrams into one SVG');
    console.error('');
    console.error('Example:');
    console.error('  ./render-graphs.js ../subagent-driven-development');
    console.error('  ./render-graphs.js ../subagent-driven-development --combine');
    process.exit(1);
  }

  // Validate input to prevent command injection
  // Only allow safe characters: alphanumeric, dash, underscore, dot, forward slash
  if (!/^[a-zA-Z0-9\-_./]+$/.test(skillDirArg)) {
    console.error('Error: Invalid characters in skill directory path');
    console.error('Only alphanumeric characters, dashes, underscores, dots, and forward slashes are allowed');
    process.exit(1);
  }

  const skillDir = path.resolve(skillDirArg);
  
  // Prevent path traversal attacks by ensuring the resolved path is a real directory
  // and normalize it to prevent directory traversal
  const normalizedSkillDir = path.normalize(skillDir);
  if (!fs.existsSync(normalizedSkillDir) || !fs.statSync(normalizedSkillDir).isDirectory()) {
    console.error(`Error: ${skillDirArg} is not a valid directory`);
    process.exit(1);
  }
  
  const skillFile = path.join(normalizedSkillDir, 'SKILL.md');
  const skillName = path.basename(normalizedSkillDir).replace(/-/g, '_');

  // Validate skillName to ensure it only contains safe characters
  if (!/^[a-zA-Z0-9_]+$/.test(skillName)) {
    console.error('Error: Skill directory name contains invalid characters');
    console.error('Only alphanumeric characters, dashes, and underscores are allowed in directory names');
    process.exit(1);
  }

  // Verify that the SKILL.md file is actually within the specified directory (prevent path traversal)
  const normalizedSkillFile = path.normalize(skillFile);
  if (!normalizedSkillFile.startsWith(normalizedSkillDir + path.sep)) {
    console.error('Error: Path traversal detected');
    process.exit(1);
  }

  if (!fs.existsSync(normalizedSkillFile)) {
    console.error(`Error: ${normalizedSkillFile} not found`);
    process.exit(1);
  }

  // Check if dot is available
  try {
    execSync('which dot', { encoding: 'utf-8' });
  } catch {
    console.error('Error: graphviz (dot) not found. Install with:');
    console.error('  brew install graphviz    # macOS');
    console.error('  apt install graphviz     # Linux');
    process.exit(1);
  }

  const markdown = fs.readFileSync(normalizedSkillFile, 'utf-8');
  const blocks = extractDotBlocks(markdown);

  if (blocks.length === 0) {
    console.log('No ```dot blocks found in', normalizedSkillFile);
    process.exit(0);
  }

  console.log(`Found ${blocks.length} diagram(s) in ${path.basename(normalizedSkillDir)}/SKILL.md`);

  const outputDir = path.join(normalizedSkillDir, 'diagrams');
  const normalizedOutputDir = path.normalize(outputDir);
  
  // Validate that output directory is within the skill directory (prevent path traversal)
  if (!normalizedOutputDir.startsWith(normalizedSkillDir + path.sep)) {
    console.error('Error: Invalid output directory path');
    process.exit(1);
  }
  
  if (!fs.existsSync(normalizedOutputDir)) {
    fs.mkdirSync(normalizedOutputDir);
  }

  if (combine) {
    // Combine all graphs into one
    const combined = combineGraphs(blocks, skillName);
    const svg = renderToSvg(combined);
    if (svg) {
      const outputPath = path.normalize(path.join(normalizedOutputDir, `${skillName}_combined.svg`));
      // Validate output path is within the output directory
      if (!outputPath.startsWith(normalizedOutputDir + path.sep)) {
        console.error('Error: Invalid output file path');
        process.exit(1);
      }
      fs.writeFileSync(outputPath, svg);
      console.log(`  Rendered: ${skillName}_combined.svg`);

      // Also write the dot source for debugging
      const dotPath = path.normalize(path.join(normalizedOutputDir, `${skillName}_combined.dot`));
      // Validate output path is within the output directory
      if (!dotPath.startsWith(normalizedOutputDir + path.sep)) {
        console.error('Error: Invalid output file path');
        process.exit(1);
      }
      fs.writeFileSync(dotPath, combined);
      console.log(`  Source: ${skillName}_combined.dot`);
    } else {
      console.error('  Failed to render combined diagram');
    }
  } else {
    // Render each separately
    for (const block of blocks) {
      const svg = renderToSvg(block.content);
      if (svg) {
        const outputPath = path.normalize(path.join(normalizedOutputDir, `${block.name}.svg`));
        // Validate output path is within the output directory
        if (!outputPath.startsWith(normalizedOutputDir + path.sep)) {
          console.error('Error: Invalid output file path');
          process.exit(1);
        }
        fs.writeFileSync(outputPath, svg);
        console.log(`  Rendered: ${block.name}.svg`);
      } else {
        console.error(`  Failed: ${block.name}`);
      }
    }
  }

  console.log(`\nOutput: ${normalizedOutputDir}/`);
}

main();
