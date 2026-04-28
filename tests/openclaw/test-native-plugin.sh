#!/usr/bin/env bash
# Test: OpenClaw native plugin package
# Verifies the Superpowers repo exposes a native OpenClaw plugin contract.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

echo "=== Test: OpenClaw native plugin package ==="

echo "Test 1: Checking OpenClaw manifest..."
node <<'NODE'
import fs from "node:fs";

const manifestPath = "openclaw.plugin.json";
if (!fs.existsSync(manifestPath)) {
  throw new Error(`${manifestPath} is missing`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (manifest.id !== "superpowers-openclaw") {
  throw new Error(`unexpected manifest id: ${manifest.id}`);
}
if (manifest.version !== pkg.version) {
  throw new Error(`manifest version ${manifest.version} must match package version ${pkg.version}`);
}
if (!Array.isArray(manifest.skills) || manifest.skills.length !== 1 || manifest.skills[0] !== "./skills") {
  throw new Error(`unexpected skills declaration: ${JSON.stringify(manifest.skills)}`);
}
if (
  !manifest.configSchema ||
  manifest.configSchema.type !== "object" ||
  manifest.configSchema.additionalProperties !== false ||
  manifest.configSchema.properties !== undefined
) {
  throw new Error(`manifest must declare an empty object configSchema: ${JSON.stringify(manifest.configSchema)}`);
}
if ("entrypoint" in manifest) {
  throw new Error("OpenClaw entrypoints belong in package.json openclaw.extensions, not openclaw.plugin.json");
}
if ("hooks" in manifest) {
  throw new Error("OpenClaw hook registration belongs in the runtime entrypoint, not openclaw.plugin.json");
}
NODE
echo "  [PASS] Manifest declares plugin skills correctly"

echo "Test 2: Checking package OpenClaw extension metadata..."
node <<'NODE'
import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (pkg.name !== "superpowers") {
  throw new Error(`package name changed unexpectedly: ${pkg.name}`);
}
if (pkg.type !== "module") {
  throw new Error("OpenClaw runtime should preserve the repo's ESM package mode");
}
const extensions = pkg.openclaw?.extensions;
if (!Array.isArray(extensions) || extensions.length !== 1 || extensions[0] !== "./.openclaw/index.js") {
  throw new Error(`unexpected openclaw.extensions: ${JSON.stringify(extensions)}`);
}
NODE
echo "  [PASS] package.json points OpenClaw at the runtime entrypoint"

echo "Test 3: Checking runtime entrypoint syntax and hook behavior..."
node --check .openclaw/index.js
node <<'NODE'
const module = await import(new URL("./.openclaw/index.js", import.meta.url));
const plugin = module.default;

if (!plugin || plugin.id !== "superpowers-openclaw" || typeof plugin.register !== "function") {
  throw new Error("OpenClaw runtime must default-export a plugin with register(api)");
}

const hooks = [];
const api = {
  pluginConfig: {},
  rootDir: process.cwd(),
  logger: { warn(message) { throw new Error(`unexpected warning: ${message}`); } },
  on(name, handler) {
    hooks.push({ name, handler });
  },
};

plugin.register(api);
if (hooks.length !== 1 || hooks[0].name !== "before_prompt_build") {
  throw new Error(`unexpected hooks: ${JSON.stringify(hooks.map((hook) => hook.name))}`);
}

const result = await hooks[0].handler();
if (!result?.prependSystemContext?.includes("Superpowers")) {
  throw new Error("before_prompt_build hook must inject Superpowers guidance");
}
if (result.prependSystemContext.includes("~/.openclaw/skills")) {
  throw new Error("native plugin guidance must not advertise managed skill symlinks");
}
NODE
echo "  [PASS] Runtime entrypoint registers the prompt hook"

echo "Test 4: Checking README install flow..."
if ! grep -q 'openclaw plugins install --link ~/.openclaw/vendor/superpowers' README.md; then
  echo "  [FAIL] README must document linked OpenClaw plugin install"
  exit 1
fi
if ! grep -q -- '--dangerously-force-unsafe-install' README.md; then
  echo "  [FAIL] README must document OpenClaw scanner override required by existing helper scripts"
  exit 1
fi
if ! grep -q 'skills/writing-skills/render-graphs.js' README.md; then
  echo "  [FAIL] README must explain the exact Superpowers helper that triggers OpenClaw's scanner"
  exit 1
fi
if ! grep -q 'not part of the OpenClaw runtime hook' README.md; then
  echo "  [FAIL] README must explain that the flagged helper is not part of the OpenClaw runtime hook"
  exit 1
fi
if ! grep -q 'openclaw plugins enable superpowers-openclaw' README.md; then
  echo "  [FAIL] README must document enabling the OpenClaw plugin"
  exit 1
fi
if ! grep -q 'openclaw gateway restart' README.md; then
  echo "  [FAIL] README must document restarting the gateway"
  exit 1
fi
if grep -q 'OPENCLAW_SKILLS_DIR\|ln -s\|AGENTS-snippet\|.openclaw/INSTALL.md' README.md; then
  echo "  [FAIL] README must not use the legacy symlink/snippet wrapper or extra install doc"
  exit 1
fi
echo "  [PASS] README documents native plugin commands"

echo ""
echo "=== OpenClaw native plugin tests passed ==="
