const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const metadataPath = path.join(repoRoot, 'project-metadata.json');
const pluginPath = path.join(repoRoot, '.claude-plugin', 'plugin.json');
const framePath = path.join(repoRoot, 'skills', 'brainstorming', 'scripts', 'frame-template.html');
const readmePath = path.join(repoRoot, 'README.md');

const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
}

function syncPluginManifest() {
  const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
  plugin.name = metadata.name;
  plugin.author = metadata.author;
  plugin.homepage = metadata.homepage;
  plugin.repository = metadata.repository;
  writeJson(pluginPath, plugin);
}

function syncFrameTemplate() {
  const html = fs.readFileSync(framePath, 'utf8');
  const header = `<h1><a href="${metadata.homepage}" style="color: inherit; text-decoration: none;">Superpowers Brainstorming</a></h1>`;
  const next = html.replace(/<h1>.*Superpowers Brainstorming.*<\/h1>/, header);
  fs.writeFileSync(framePath, next);
}

function replaceBlock(text, name, content) {
  const start = `<!-- project-metadata:${name}:start -->`;
  const end = `<!-- project-metadata:${name}:end -->`;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  return text.replace(pattern, `${start}\n${content}\n${end}`);
}

function syncReadme() {
  const readme = fs.readFileSync(readmePath, 'utf8');
  const install = `Use the approved Claude plugin source: ${metadata.homepage}`;
  const support = [
    `- **Repository**: ${metadata.homepage}`,
    `- **Issues**: ${metadata.issues}`,
    `- **Support**: ${metadata.supportEmail}`
  ].join('\n');
  const next = replaceBlock(replaceBlock(readme, 'install', install), 'support', support);
  fs.writeFileSync(readmePath, next);
}

syncPluginManifest();
syncFrameTemplate();
syncReadme();

console.log(`Synced project metadata from ${path.relative(repoRoot, metadataPath)}`);