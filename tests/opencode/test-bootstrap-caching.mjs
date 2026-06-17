#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const pluginPath = path.join(repoRoot, '.opencode/plugins/superpowers.js');

const loadPlugin = async (filePath, cacheKey = '') => {
  const moduleUrl = pathToFileURL(filePath).href + cacheKey;
  const { SuperpowersPlugin } = await import(moduleUrl);
  const plugin = await SuperpowersPlugin({ client: {}, directory: repoRoot });
  const transform = plugin['experimental.chat.messages.transform'];

  assert.equal(typeof transform, 'function');
  return transform;
};

const countBootstrapParts = (parts) => {
  return parts.filter((part) => {
    return part?.type === 'text' &&
      typeof part.text === 'string' &&
      part.text.includes('<EXTREMELY_IMPORTANT>');
  }).length;
};

const transform = await loadPlugin(pluginPath);

const originalParts = [
  { type: 'text', text: 'Build a title from this real user prompt.' },
  { type: 'file', name: 'notes.txt', url: 'file:///tmp/notes.txt' }
];
const originalFirstUser = { role: 'user', parts: originalParts };
const originalPartsSnapshot = structuredClone(originalParts);
const messages = [
  { role: 'assistant', parts: [{ type: 'text', text: 'Previous reply' }] },
  originalFirstUser
];

await transform({}, messages);

assert.deepEqual(originalParts, originalPartsSnapshot);
assert.equal(originalFirstUser.parts, originalParts);
assert.notEqual(messages[1], originalFirstUser);
assert.notEqual(messages[1].parts, originalParts);
assert.equal(messages[1].parts.length, originalParts.length + 1);
assert.equal(messages[1].parts[0].type, 'text');
assert.match(messages[1].parts[0].text, /<EXTREMELY_IMPORTANT>/);
assert.deepEqual(messages[1].parts.slice(1), originalPartsSnapshot);
assert.equal(countBootstrapParts(messages[1].parts), 1);

const transformedParts = messages[1].parts;
await transform({}, messages);

assert.equal(messages[1].parts, transformedParts);
assert.equal(messages[1].parts.length, originalParts.length + 1);
assert.equal(countBootstrapParts(messages[1].parts), 1);

await transform({}, []);
await transform({}, [{ role: 'assistant', parts: [{ type: 'text', text: 'No user message' }] }]);
await transform({}, [{ role: 'user', parts: [] }]);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-bootstrap-test-'));
try {
  const tempPluginDir = path.join(tempDir, '.opencode/plugins');
  fs.mkdirSync(tempPluginDir, { recursive: true });
  const tempPluginPath = path.join(tempPluginDir, 'superpowers.js');
  fs.copyFileSync(pluginPath, tempPluginPath);

  const missingBootstrapTransform = await loadPlugin(tempPluginPath, `?missing=${Date.now()}`);
  const missingBootstrapParts = [{ type: 'text', text: 'Hello without bootstrap file' }];
  const missingBootstrapMessages = [{ role: 'user', parts: missingBootstrapParts }];

  await missingBootstrapTransform({}, missingBootstrapMessages);

  assert.equal(missingBootstrapMessages[0].parts, missingBootstrapParts);
  assert.deepEqual(missingBootstrapMessages[0].parts, [{ type: 'text', text: 'Hello without bootstrap file' }]);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log('bootstrap caching tests passed');
