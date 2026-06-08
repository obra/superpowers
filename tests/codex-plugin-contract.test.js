import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readText = (path) => readFileSync(join(root, path), "utf8");
const readJson = (path) => JSON.parse(readText(path));

const manifest = readJson(".codex-plugin/plugin.json");

assert.equal(manifest.name, "ultipowers");
assert.equal(manifest.interface.displayName, "Ultipowers MCP Augment");
assert.match(manifest.description, /Superpowers/i);
assert.match(manifest.description, /MCP/i);
assert.match(manifest.interface.longDescription, /mem0/i);
assert.match(manifest.interface.longDescription, /Serena/i);
assert.equal(manifest.skills, "./skills/");

const requiredSkills = [
  "brainstorming",
  "writing-plans",
  "test-driven-development",
  "systematic-debugging",
  "requesting-code-review",
  "finishing-a-development-branch",
  "mcp-routing",
  "mcp-session-sync",
  "mcp-trace",
];

for (const skill of requiredSkills) {
  assert.ok(
    existsSync(join(root, "skills", skill, "SKILL.md")),
    `missing required skill: ${skill}`,
  );
}

const usingSuperpowers = readText("skills/using-superpowers/SKILL.md");
assert.match(usingSuperpowers, /mcp-session-sync/);
assert.match(usingSuperpowers, /mcp-routing/);
assert.match(usingSuperpowers, /mem0/i);
assert.match(usingSuperpowers, /Serena/);

const routing = readText("skills/mcp-routing/SKILL.md");
assert.match(routing, /mem0/i);
assert.match(routing, /architecture/i);
assert.match(routing, /graph/i);
assert.match(routing, /Serena/);
assert.match(routing, /symbol/i);

const implementerPrompt = readText("skills/subagent-driven-development/implementer-prompt.md");
assert.match(implementerPrompt, /mem0/i);
assert.match(implementerPrompt, /Serena/);

console.log("Codex plugin contract OK");
