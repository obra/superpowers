#!/usr/bin/env node

/**
 * Render graphviz diagrams from a skill's SKILL.md to SVG files.
 *
 * Usage:
 *   node render-graphs.js <skill-directory>                    # Render each diagram separately
 *   node render-graphs.js <skill-directory> --combine          # Combine all into one diagram
 *   node render-graphs.js <skill-directory> --out-dir <dir>    # Write output to <dir>
 *
 * Extracts all ```dot blocks from SKILL.md and renders to SVG.
 * Useful for helping your human partner visualize the process flows.
 *
 * Requires: graphviz (dot) installed on system
 */

import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';

function extractDotBlocks(markdown) {
  const blocks = [];
  const regex = /```dot[ \t]*\r?\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    const content = match[1].replace(/\r\n/g, '\n').trim();

    // Extract digraph name
    const nameMatch = content.match(/digraph\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : `graph_${blocks.length + 1}`;

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
    return execFileSync('dot', ['-Tsvg'], {
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

function printUsage() {
  console.error('Usage: node render-graphs.js <skill-directory> [--combine] [--out-dir <dir>]');
  console.error('');
  console.error('Options:');
  console.error('  --combine        Combine all diagrams into one SVG');
  console.error('  --out-dir <dir>  Write output files to <dir> (default: <skill-directory>/diagrams)');
  console.error('');
  console.error('Example:');
  console.error('  node render-graphs.js ../subagent-driven-development');
  console.error('  node render-graphs.js ../subagent-driven-development --combine');
}

function parseArgs(args) {
  let combine = false;
  let outDirArg = null;
  let skillDirArg = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--combine') {
      combine = true;
    } else if (arg === '--out-dir' || arg.startsWith('--out-dir=')) {
      const value = arg === '--out-dir' ? args[++i] : arg.slice('--out-dir='.length);
      if (!value || value.startsWith('--')) {
        console.error('Error: --out-dir requires a directory path');
        process.exit(1);
      }
      outDirArg = value;
    } else if (!arg.startsWith('--') && !skillDirArg) {
      skillDirArg = arg;
    }
  }

  return { combine, outDirArg, skillDirArg };
}

function main() {
  const { combine, outDirArg, skillDirArg } = parseArgs(process.argv.slice(2));

  if (!skillDirArg) {
    printUsage();
    process.exit(1);
  }

  const skillDir = path.resolve(skillDirArg);
  const skillFile = path.join(skillDir, 'SKILL.md');
  const skillName = path.basename(skillDir).replace(/-/g, '_');

  if (!fs.existsSync(skillFile)) {
    console.error(`Error: ${skillFile} not found`);
    process.exit(1);
  }

  // Check if dot is available. Run the binary directly rather than probing
  // with `which`, which is not a command on Windows.
  try {
    execFileSync('dot', ['-V'], { stdio: 'ignore' });
  } catch {
    console.error('Error: graphviz (dot) not found. Install with:');
    console.error('  brew install graphviz    # macOS');
    console.error('  apt install graphviz     # Linux');
    process.exit(1);
  }

  const markdown = fs.readFileSync(skillFile, 'utf-8');
  const blocks = extractDotBlocks(markdown);

  if (blocks.length === 0) {
    console.log('No ```dot blocks found in', skillFile);
    process.exit(0);
  }

  console.log(`Found ${blocks.length} diagram(s) in ${path.basename(skillDir)}/SKILL.md`);

  const outputDir = outDirArg ? path.resolve(outDirArg) : path.join(skillDir, 'diagrams');
  fs.mkdirSync(outputDir, { recursive: true });

  let hadFailure = false;

  if (combine) {
    // Combine all graphs into one
    const combined = combineGraphs(blocks, skillName);
    const svg = renderToSvg(combined);
    if (svg) {
      const outputPath = path.join(outputDir, `${skillName}_combined.svg`);
      fs.writeFileSync(outputPath, svg);
      console.log(`  Rendered: ${skillName}_combined.svg`);

      // Also write the dot source for debugging
      const dotPath = path.join(outputDir, `${skillName}_combined.dot`);
      fs.writeFileSync(dotPath, combined);
      console.log(`  Source: ${skillName}_combined.dot`);
    } else {
      console.error('  Failed to render combined diagram');
      hadFailure = true;
    }
  } else {
    // Render each separately
    for (const block of blocks) {
      const svg = renderToSvg(block.content);
      if (svg) {
        const outputPath = path.join(outputDir, `${block.name}.svg`);
        fs.writeFileSync(outputPath, svg);
        console.log(`  Rendered: ${block.name}.svg`);
      } else {
        console.error(`  Failed: ${block.name}`);
        hadFailure = true;
      }
    }
  }

  console.log(`\nOutput: ${outputDir}/`);

  if (hadFailure) {
    process.exit(1);
  }
}

main();
