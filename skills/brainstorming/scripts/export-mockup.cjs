#!/usr/bin/env node
/**
 * Export a locked mockup fragment as a self-contained standalone HTML file.
 *
 * Wraps a content fragment with the frame template's CSS — no branding link
 * or remote logo, no connection status, no helper script, no WebSocket code.
 * The output is a static design artifact suitable for committing next to a
 * spec (the "design lock").
 *
 * Full documents (starting with <!DOCTYPE or <html) are copied through
 * unchanged.
 *
 * Usage: export-mockup.sh <fragment-file> <output-file> [--title "Screen name"]
 */

const fs = require('fs');
const path = require('path');

function isFullDocument(html) {
  const trimmed = html.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

// Duplicated from server.cjs: requiring server.cjs would start the server.
function escapeHtmlText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function exportMockup(fragmentHtml, { title = 'Locked design' } = {}) {
  if (isFullDocument(fragmentHtml)) {
    return fragmentHtml;
  }
  const frameTemplate = fs.readFileSync(
    path.join(__dirname, 'frame-template.html'),
    'utf-8'
  );
  const brand =
    '<div class="brand"><span class="brand-copy">' +
    escapeHtmlText(title) +
    ' — locked design</span></div>';
  return frameTemplate
    .split('<!-- BRANDING -->').join(brand)
    .replace('<div class="status">Connecting…</div>', '')
    .replace('<!-- CONTENT -->', fragmentHtml);
}

function main() {
  const args = process.argv.slice(2);
  const positional = [];
  let title;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title') {
      i += 1;
      title = args[i];
      if (title === undefined) {
        process.stderr.write('error: --title requires a value\n');
        process.exit(1);
      }
    } else {
      positional.push(args[i]);
    }
  }
  const fragmentFile = positional[0];
  const outputFile = positional[1];
  if (!fragmentFile || !outputFile || positional.length > 2) {
    process.stderr.write(
      'usage: export-mockup.sh <fragment-file> <output-file> [--title "Screen name"]\n'
    );
    process.exit(1);
  }
  if (!fs.existsSync(fragmentFile)) {
    process.stderr.write('error: fragment file not found: ' + fragmentFile + '\n');
    process.exit(1);
  }
  if (title === undefined) {
    title = path.basename(outputFile).replace(/\.[^.]*$/, '');
  }
  const fragment = fs.readFileSync(fragmentFile, 'utf-8');
  const resolvedOutput = path.resolve(outputFile);
  fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });
  fs.writeFileSync(resolvedOutput, exportMockup(fragment, { title }));
  process.stdout.write(
    JSON.stringify({ type: 'mockup-exported', output: resolvedOutput }) + '\n'
  );
}

module.exports = { isFullDocument, escapeHtmlText, exportMockup };

if (require.main === module) {
  main();
}
