import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const packageJsonPath = resolve(repoRoot, "package.json");
const pluginPath = resolve(repoRoot, ".cline-plugin/superpowers.ts");
const skillsDir = resolve(repoRoot, "skills");
const usingSuperpowersPath = resolve(
	skillsDir,
	"using-superpowers",
	"SKILL.md",
);

const BOOTSTRAP_MARKER = "superpowers:using-superpowers bootstrap for Cline";

async function readPackageJson() {
	return JSON.parse(await readFile(packageJsonPath, "utf8"));
}

async function loadPlugin() {
	const mod = await import(
		pathToFileURL(pluginPath).href + `?cachebust=${Date.now()}-${Math.random()}`
	);
	// The module exports the AgentPlugin as BOTH `default` and named `plugin`
	// (same object), so `mod.default` IS the plugin.
	const plugin = mod.default ?? mod.plugin;
	assert.ok(plugin, "plugin module must export an AgentPlugin");
	assert.equal(typeof plugin.hooks?.beforeRun, "function");
	return plugin;
}

/**
 * Load a plugin instance with a fresh bootstrap cache. Uses the
 * `__resetBootstrapCache` export to clear the module-level cache so each
 * test starts clean.
 */
async function loadFreshPlugin() {
	const mod = await import(pathToFileURL(pluginPath).href);
	const plugin = mod.default ?? mod.plugin;
	assert.ok(plugin, "plugin module must export an AgentPlugin");
	mod.__resetBootstrapCache?.();
	return plugin;
}

function snapshotOf({ messages = [], parentAgentId = null } = {}) {
	return {
		agentId: "test-agent",
		parentAgentId,
		conversationId: "test-conversation",
		status: "running",
		iteration: 0,
		messages,
		pendingToolCalls: [],
		usage: { inputTokens: 0, outputTokens: 0 },
	};
}

function beforeRun(plugin, snapshot) {
	// The beforeRun hook receives { snapshot } as its context argument.
	return plugin.hooks?.beforeRun?.({ snapshot });
}

test("package.json declares the cline plugin manifest", async () => {
	const pkg = await readPackageJson();
	const cline = pkg.cline;
	assert.ok(cline, "package.json must have a cline field");
	assert.ok(Array.isArray(cline.plugins), "cline.plugins must be an array");
	const entry = cline.plugins[0];
	assert.deepEqual(entry.paths, ["./.cline-plugin/superpowers.ts"]);
	assert.ok(entry.capabilities.includes("hooks"));
	assert.ok(entry.capabilities.includes("skills"));
	// @cline/sdk is host-provided: declared as optional peer, never a dependency.
	assert.ok(pkg.peerDependencies?.["@cline/sdk"], "@cline/sdk peer dep");
	assert.ok(pkg.peerDependenciesMeta?.["@cline/sdk"]?.optional);
	assert.equal(pkg.dependencies, undefined, "must stay zero-runtime-dependency");
});

test("plugin module exists with required skills", async () => {
	assert.ok(existsSync(pluginPath), "plugin entry file exists");
	assert.ok(existsSync(usingSuperpowersPath), "using-superpowers SKILL.md exists");
	// Cline auto-discovers skills/ next to package.json; every shipped skill
	// must keep the conventional directory layout.
	const brainstorm = resolve(skillsDir, "brainstorming", "SKILL.md");
	assert.ok(existsSync(brainstorm), "brainstorming SKILL.md exists");
});

test("plugin shape matches AgentPlugin", async () => {
	const plugin = await loadPlugin();
	assert.equal(plugin.name, "superpowers");
	assert.ok(Array.isArray(plugin.manifest.capabilities));
	assert.equal(typeof plugin.hooks?.beforeRun, "function");
});

test("bootstrap injects on a fresh top-level session", async () => {
	const plugin = await loadFreshPlugin();
	// Simulate a completely fresh session: no bootstrap in the transcript yet.
	const result = await beforeRun(plugin, snapshotOf({
		messages: [{ role: "user", content: "Let's make a react todo list" }],
	}));
	assert.ok(result, "beforeRun must return a result on first run");
	assert.ok(
		typeof result.appendContext === "string" && result.appendContext.length > 0,
	);

	const ctx = result.appendContext;
	assert.ok(ctx.includes("<EXTREMELY_IMPORTANT>"));
	assert.ok(ctx.includes("</EXTREMELY_IMPORTANT>"));
	assert.ok(ctx.includes(BOOTSTRAP_MARKER));
	assert.ok(ctx.includes("You have superpowers"));

	// The full using-superpowers body is inlined (frontmatter stripped).
	const raw = await readFile(usingSuperpowersPath, "utf8");
	assert.ok(raw.startsWith("---\n"));
	const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
	assert.ok(ctx.includes(body.slice(0, 200)), "skill body inlined");
	assert.ok(!ctx.includes("name: using-superpowers"), "frontmatter stripped");

	// The Cline tool mapping is appended.
	assert.ok(ctx.includes("## Cline tool mapping"));
	for (const tool of [
		"skills",
		"read_files",
		"editor",
		"apply_patch",
		"run_commands",
		"search_codebase",
		"ask_question",
		"spawn_agent",
	]) {
		assert.ok(ctx.includes(tool), `tool mapping names ${tool}`);
	}
});

test("bootstrap is not re-injected once present in the transcript", async () => {
	const plugin = await loadFreshPlugin();
	const first = await beforeRun(plugin, snapshotOf({
		messages: [{ role: "user", content: "hello" }],
	}));
	assert.ok(first?.appendContext);

	const second = await beforeRun(plugin, snapshotOf({
		messages: [
			{ role: "user", content: "hello" },
			{
				role: "user",
				content: `<hook_context>\n${first.appendContext}`,
			},
			{ role: "assistant", content: "On it." },
			{ role: "user", content: "next thing" },
		],
	}));
	assert.equal(second, undefined, "no re-injection within the session");
});

test("bootstrap is skipped for subagent sessions", async () => {
	const plugin = await loadFreshPlugin();
	const result = await beforeRun(plugin, snapshotOf({
		messages: [{ role: "user", content: "implement task 3" }],
		parentAgentId: "parent-agent-1",
	}));
	assert.equal(result, undefined, "subagents must not receive the bootstrap");
});

test("bootstrap survives an empty transcript (no crash)", async () => {
	const plugin = await loadFreshPlugin();
	const result = await beforeRun(plugin, snapshotOf({ messages: [] }));
	assert.ok(result?.appendContext, "empty transcript still bootstraps");
});

test("bootstrap content is cached (stable across sessions)", async () => {
	// Fresh module instance with fresh cache.
	const plugin = await loadFreshPlugin();

	const r1 = await beforeRun(plugin, snapshotOf({
		messages: [{ role: "user", content: "session one" }],
	}));
	assert.ok(r1?.appendContext, "first session gets bootstrap");

	// Same plugin instance, different session: the cache must serve the
	// identical string without re-reading SKILL.md.
	const r2 = await beforeRun(plugin, snapshotOf({
		messages: [{ role: "user", content: "session two, same plugin" }],
	}));
	assert.ok(r2?.appendContext, "second session also gets bootstrap");
	assert.equal(r1.appendContext, r2.appendContext, "cache yields identical string");
});

