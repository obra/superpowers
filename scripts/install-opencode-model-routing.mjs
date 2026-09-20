import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const profileNames = [
  'superpowers-expert.md',
  'superpowers-main.md',
  'superpowers-economic.md',
  'superpowers-economic-fast.md',
];

const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--config-dir' || !args[1] || args[1].startsWith('-')) {
  console.error('Usage: node scripts/install-opencode-model-routing.mjs --config-dir <path>');
  process.exit(1);
}

const configDir = path.resolve(args[1]);
const agentsDir = path.join(configDir, 'agents');
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.resolve(scriptDir, '..', 'opencode', 'model-routing', 'agents');

try {
  fs.mkdirSync(configDir, { recursive: true });
  fs.mkdirSync(agentsDir, { recursive: true });
  ensureDirectory(configDir);
  ensureDirectory(agentsDir);

  const copies = profileNames.map((name) => ({
    source: path.join(sourceDir, name),
    destination: path.join(agentsDir, name),
  }));

  for (const { source } of copies) ensureFile(source);

  const collisions = copies.filter(({ destination }) => destinationExists(destination));
  if (collisions.length > 0) {
    for (const { destination } of collisions) console.error(`Collision: ${destination}`);
    process.exit(1);
  }

  for (const { source, destination } of copies) {
    fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
    console.log(destination);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

function ensureDirectory(target) {
  if (!fs.statSync(target).isDirectory()) throw new Error(`Expected directory: ${target}`);
}

function ensureFile(target) {
  if (!fs.statSync(target).isFile()) throw new Error(`Expected profile file: ${target}`);
}

function destinationExists(target) {
  try {
    fs.lstatSync(target);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}
