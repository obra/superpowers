const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const watch = process.argv.includes('--watch');

// Copy skills directory into extension bundle
function copySkills() {
  const src = path.join(__dirname, '..', 'skills');
  const dest = path.join(__dirname, 'skills');
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true });
  }
  fs.cpSync(src, dest, { recursive: true });
  console.log('[skills] Copied skills/ -> .vscode-extension/skills/');
}

// Shared options
const commonOptions = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  sourcemap: false,
  minify: false,
  logLevel: 'info',
};

async function build() {
  copySkills();

  // Build 1: VS Code extension host
  // external: 'vscode' is required — VS Code provides this module at runtime
  await esbuild.build({
    ...commonOptions,
    entryPoints: ['src/extension.ts'],
    outfile: 'dist/extension.js',
    external: ['vscode'],
    format: 'cjs',
  });

  // Build 2: Standalone MCP server (no 'vscode' dependency)
  await esbuild.build({
    ...commonOptions,
    entryPoints: ['src/server.ts'],
    outfile: 'dist/server.js',
    format: 'esm',
  });

  console.log('[build] Done.');
}

if (watch) {
  Promise.all([
    esbuild.context({
      ...commonOptions,
      entryPoints: ['src/extension.ts'],
      outfile: 'dist/extension.js',
      external: ['vscode'],
      format: 'cjs',
    }).then(ctx => ctx.watch()),
    esbuild.context({
      ...commonOptions,
      entryPoints: ['src/server.ts'],
      outfile: 'dist/server.js',
      format: 'esm',
    }).then(ctx => ctx.watch()),
  ]).then(() => {
    copySkills();
    console.log('[watch] Watching for changes...');
  });
} else {
  build().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
