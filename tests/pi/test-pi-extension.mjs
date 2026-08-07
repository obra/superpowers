import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const packageJsonPath = resolve(repoRoot, "package.json");
const extensionPath = resolve(repoRoot, ".pi/extensions/superpowers.ts");
const sharedBootstrapPath = resolve(
	repoRoot,
	"integrations/shared/bootstrap.ts",
);
const piToolsPath = resolve(
	repoRoot,
	"skills/using-superpowers/references/pi-tools.md",
);

async function readPackageJson() {
	try {
		return JSON.parse(await readFile(packageJsonPath, "utf8"));
	} catch (error) {
		assert.fail(`package.json fixture must be valid JSON: ${String(error)}`);
	}
}

async function loadExtension(path = extensionPath) {
	const handlers = new Map();
	const pi = {
		on(event, handler) {
			if (!handlers.has(event)) handlers.set(event, []);
			handlers.get(event).push(handler);
		},
	};
	const mod = await import(
		pathToFileURL(path).href + `?cachebust=${Date.now()}-${Math.random()}`
	);
	mod.default(pi);
	return { handlers };
}

function firstHandler(handlers, event) {
	const eventHandlers = handlers.get(event) ?? [];
	assert.equal(eventHandlers.length, 1, `expected one ${event} handler`);
	return eventHandlers[0];
}

function textOf(message) {
	if (typeof message.content === "string") return message.content;
	return message.content
		.filter((part) => part.type === "text")
		.map((part) => part.text)
		.join("\n");
}

function hasWarningCode(args, expectedCode) {
	return args.some((value) => {
		if (value && typeof value === "object") return value.code === expectedCode;
		if (typeof value !== "string") return false;

		try {
			const parsed = JSON.parse(value);
			return (
				parsed !== null &&
				typeof parsed === "object" &&
				parsed.code === expectedCode
			);
		} catch {
			return false;
		}
	});
}

test("package.json declares a pi package with skills and extension resources", async () => {
	const pkg = await readPackageJson();

	assert.equal(pkg.name, "superpowers");
	assert.ok(pkg.keywords.includes("pi-package"));
	assert.deepEqual(pkg.pi, {
		extensions: ["./.pi/extensions/superpowers.ts"],
		skills: ["./skills"],
	});
});

test("pi adapter depends on shared core, never the OMP adapter", async () => {
	const source = await readFile(extensionPath, "utf8");

	assert.match(
		source,
		/import \{ createBootstrapController \} from "\.\.\/\.\.\/integrations\/shared\/bootstrap\.ts";/,
	);
	assert.doesNotMatch(source, /from\s+["'][^"']*\.omp\//);
});

test("extension registers lifecycle hooks without pre-compaction injection", async () => {
	const { handlers } = await loadExtension();

	for (const event of [
		"resources_discover",
		"session_start",
		"session_compact",
		"context",
		"agent_end",
	]) {
		assert.equal(
			(handlers.get(event) ?? []).length,
			1,
			`missing ${event} handler`,
		);
	}
	assert.equal((handlers.get("session_before_compact") ?? []).length, 0);
});

test("resources_discover contributes the bundled skills directory", async () => {
	const { handlers } = await loadExtension();
	const discover = firstHandler(handlers, "resources_discover");

	const result = await discover(
		{ type: "resources_discover", cwd: repoRoot, reason: "startup" },
		{},
	);

	assert.equal(result.skillPaths.length, 1);
	assert.equal(isAbsolute(result.skillPaths[0]), true);
	assert.equal(result.skillPaths[0], resolve(repoRoot, "skills"));
});

test("startup context injects the bootstrap as one user message until agent_end", async () => {
	const { handlers } = await loadExtension();
	const sessionStart = firstHandler(handlers, "session_start");
	const context = firstHandler(handlers, "context");
	const agentEnd = firstHandler(handlers, "agent_end");

	await sessionStart({ type: "session_start", reason: "startup" }, {});

	const originalMessages = [
		{
			role: "user",
			content: [{ type: "text", text: "Let us make a react todo list" }],
			timestamp: 1,
		},
	];
	const result = await context(
		{ type: "context", messages: originalMessages },
		{},
	);

	assert.equal(result.messages.length, 2);
	assert.equal(result.messages[0].role, "user");
	const bootstrapText = textOf(result.messages[0]);
	assert.match(bootstrapText, /You have superpowers/);
	assert.match(bootstrapText, /superpowers:using-superpowers bootstrap for pi/);
	assert.match(bootstrapText, /already loaded for this Pi session/);
	assert.match(bootstrapText, /## Pi tool mapping/);
	assert.match(bootstrapText, /pi-subagents/);
	assert.doesNotMatch(bootstrapText, /## OMP tool mapping/);
	assert.equal(result.messages[1], originalMessages[0]);

	const repeatedProviderRequest = await context(
		{ type: "context", messages: originalMessages },
		{},
	);
	assert.equal(repeatedProviderRequest.messages.length, 2);
	assert.match(
		textOf(repeatedProviderRequest.messages[0]),
		/You have superpowers/,
	);

	const alreadyInjected = await context(
		{ type: "context", messages: result.messages },
		{},
	);
	assert.equal(
		alreadyInjected,
		undefined,
		"bootstrap should not duplicate when already present",
	);

	const stringMarker = {
		role: "user",
		content: "superpowers:using-superpowers bootstrap for pi",
		timestamp: 2,
	};
	const alreadyInjectedAsString = await context(
		{ type: "context", messages: [stringMarker] },
		{},
	);
	assert.equal(
		alreadyInjectedAsString,
		undefined,
		"string marker should prevent duplicate injection",
	);

	const multipartMarker = {
		role: "user",
		content: [
			{ type: "image", data: "fixture" },
			{ type: "text", text: "superpowers:using-superpowers bootstrap for pi" },
		],
		timestamp: 3,
	};
	const alreadyInjectedAsMultipart = await context(
		{ type: "context", messages: [multipartMarker] },
		{},
	);
	assert.equal(
		alreadyInjectedAsMultipart,
		undefined,
		"multipart marker should prevent duplicate injection",
	);

	await agentEnd({ type: "agent_end", messages: [] }, {});
	const afterEnd = await context(
		{ type: "context", messages: originalMessages },
		{},
	);
	assert.equal(
		afterEnd,
		undefined,
		"startup bootstrap should clear after agent_end",
	);
});

test("session_compact injects bootstrap after compaction summaries, not before compaction", async () => {
	const { handlers } = await loadExtension();
	const sessionCompact = firstHandler(handlers, "session_compact");
	const context = firstHandler(handlers, "context");

	await sessionCompact(
		{ type: "session_compact", compactionEntry: {}, fromExtension: false },
		{},
	);

	const firstSummary = {
		role: "compactionSummary",
		summary: "Prior work summary",
		tokensBefore: 123,
		timestamp: 1,
	};
	const secondSummary = {
		role: "compactionSummary",
		summary: "Earlier work summary",
		tokensBefore: 456,
		timestamp: 2,
	};
	const user = {
		role: "user",
		content: [{ type: "text", text: "Continue" }],
		timestamp: 3,
	};
	const result = await context(
		{ type: "context", messages: [firstSummary, secondSummary, user] },
		{},
	);

	assert.equal(result.messages.length, 4);
	assert.equal(result.messages[0], firstSummary);
	assert.equal(result.messages[1], secondSummary);
	assert.equal(result.messages[2].role, "user");
	assert.match(textOf(result.messages[2]), /You have superpowers/);
	assert.equal(result.messages[3], user);
});

test("pi tools reference documents pi-specific mappings", async () => {
	assert.equal(existsSync(piToolsPath), true, "pi-tools.md should exist");
	const text = await readFile(piToolsPath, "utf8");

	const rows = text.split("\n").filter((line) => line.startsWith("|"));
	assert.ok(
		rows.some((row) => /subagent/i.test(row)),
		"mapping table documents subagent dispatch",
	);
	assert.ok(
		rows.some((row) => /todo|task/i.test(row)),
		"mapping table documents task tracking",
	);
});

test("missing bootstrap skips injection and reports one structured warning", async () => {
	assert.equal(
		hasWarningCode(
			[{ code: "bootstrap-read-failed" }],
			"bootstrap-read-failed",
		),
		true,
	);
	assert.equal(
		hasWarningCode(
			['{"code":"bootstrap-read-failed"}'],
			"bootstrap-read-failed",
		),
		true,
	);
	assert.equal(
		hasWarningCode(["bootstrap-read-failed"], "bootstrap-read-failed"),
		false,
	);

	const tempRoot = await mkdtemp(
		resolve(tmpdir(), "superpowers-pi-missing-bootstrap-"),
	);
	const isolatedExtensionPath = resolve(
		tempRoot,
		".pi/extensions/superpowers.ts",
	);
	const isolatedSharedBootstrapPath = resolve(
		tempRoot,
		"integrations/shared/bootstrap.ts",
	);
	const warnings = [];
	const originalWarn = console.warn;

	try {
		await mkdir(dirname(isolatedExtensionPath), { recursive: true });
		await mkdir(dirname(isolatedSharedBootstrapPath), { recursive: true });
		await copyFile(extensionPath, isolatedExtensionPath);
		await copyFile(sharedBootstrapPath, isolatedSharedBootstrapPath);
		console.warn = (...args) => warnings.push(args);

		const { handlers } = await loadExtension(isolatedExtensionPath);
		const sessionStart = firstHandler(handlers, "session_start");
		const context = firstHandler(handlers, "context");
		await sessionStart({ type: "session_start", reason: "startup" }, {});

		const messages = [{ role: "user", content: "Continue", timestamp: 1 }];
		const firstResult = await context({ type: "context", messages }, {});
		const secondResult = await context({ type: "context", messages }, {});

		assert.equal(
			firstResult,
			undefined,
			"missing bootstrap must not inject a message",
		);
		assert.equal(
			secondResult,
			undefined,
			"cached read failure must continue without injection",
		);
		assert.equal(
			warnings.length,
			1,
			"missing bootstrap should report exactly once",
		);
		assert.equal(hasWarningCode(warnings[0], "bootstrap-read-failed"), true);
	} finally {
		console.warn = originalWarn;
		await rm(tempRoot, { recursive: true, force: true });
	}
});
