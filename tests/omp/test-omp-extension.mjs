import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const packageJsonPath = resolve(repoRoot, "package.json");
const extensionPath = resolve(repoRoot, ".omp/extensions/superpowers.ts");
const sharedBootstrapPath = resolve(
	repoRoot,
	"integrations/shared/bootstrap.ts",
);
const marker = "superpowers:using-superpowers bootstrap for omp";
const registeredEvents = [
	"session_start",
	"session_compact",
	"context",
	"agent_end",
];

async function loadExtension(
	path = extensionPath,
	exposedMessages = undefined,
) {
	const handlers = new Map();
	const registrations = [];
	const warnings = [];
	const activity = { handlerExecutions: 0 };
	const omp = {
		messages: exposedMessages,
		on(event, handler) {
			const recordedHandler = (...args) => {
				activity.handlerExecutions += 1;
				return handler(...args);
			};
			registrations.push({ event, handler: recordedHandler });
			if (!handlers.has(event)) handlers.set(event, []);
			handlers.get(event).push(recordedHandler);
		},
		logger: {
			warn(message, metadata) {
				warnings.push([message, metadata]);
			},
		},
	};
	const mod = await import(
		pathToFileURL(path).href + `?cachebust=${Date.now()}-${Math.random()}`
	);
	mod.default(omp);
	return { activity, handlers, registrations, warnings };
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

test("package.json declares only the native OMP extension and preserves Pi", async () => {
	let pkg;
	try {
		pkg = JSON.parse(await readFile(packageJsonPath, "utf8"));
	} catch (error) {
		assert.fail(`package.json must be valid JSON: ${String(error)}`);
	}

	assert.deepEqual(pkg.omp, {
		extensions: ["./.omp/extensions/superpowers.ts"],
	});
	assert.equal(Object.hasOwn(pkg.omp, "skills"), false);
	assert.deepEqual(pkg.pi, {
		extensions: ["./.pi/extensions/superpowers.ts"],
		skills: ["./skills"],
	});
});

test("OMP adapter has native host types and the intended dependency direction", async () => {
	const source = await readFile(extensionPath, "utf8");

	assert.match(
		source,
		/import type \{[\s\S]*ContextEvent[\s\S]*ExtensionAPI[\s\S]*\} from "@oh-my-pi\/pi-coding-agent";/,
	);
	assert.match(
		source,
		/import \{ createBootstrapController \} from "\.\.\/\.\.\/integrations\/shared\/bootstrap\.ts";/,
	);
	assert.match(
		source,
		/createBootstrapController<\s*ContextEvent\["messages"\]\[number\]\s*>/,
	);
	assert.doesNotMatch(
		source,
		/from\s+["'][^"']*\.pi\/extensions\/superpowers\.ts["']/,
	);
	assert.doesNotMatch(source, /console\.warn/);
});

test("initialization only registers exactly the native OMP handlers", async () => {
	const sentinelMessages = [
		{ role: "user", content: "unchanged", timestamp: 1 },
	];
	const before = structuredClone(sentinelMessages);
	const { activity, handlers, registrations, warnings } = await loadExtension(
		extensionPath,
		sentinelMessages,
	);

	assert.deepEqual(
		registrations.map(({ event }) => event),
		registeredEvents,
	);
	for (const event of registeredEvents) {
		assert.equal((handlers.get(event) ?? []).length, 1);
	}
	assert.equal((handlers.get("session_before_compact") ?? []).length, 0);
	assert.equal(
		registrations.every(({ handler }) => typeof handler === "function"),
		true,
	);
	assert.equal(activity.handlerExecutions, 0);
	assert.deepEqual(sentinelMessages, before);
	assert.deepEqual(warnings, []);
});

test("native package root exposes conventional skills without a dormant resource hook", async () => {
	const { handlers } = await loadExtension();
	const bootstrapSkill = await readFile(
		resolve(repoRoot, "skills/using-superpowers/SKILL.md"),
		"utf8",
	);

	assert.equal(handlers.has("resources_discover"), false);
	assert.match(bootstrapSkill, /^---\nname: using-superpowers\n/m);
});

test("startup injects OMP-only guidance, deduplicates markers, and agent_end disarms", async () => {
	const { handlers, warnings } = await loadExtension();
	const sessionStart = firstHandler(handlers, "session_start");
	const context = firstHandler(handlers, "context");
	const agentEnd = firstHandler(handlers, "agent_end");
	const originalMessages = [
		{ role: "user", content: "Build it", timestamp: 1 },
	];
	const before = structuredClone(originalMessages);

	assert.equal(
		await context({ type: "context", messages: originalMessages }, {}),
		undefined,
		"context must be disarmed before startup",
	);
	await sessionStart({ type: "session_start", reason: "startup" }, {});
	const result = await context(
		{ type: "context", messages: originalMessages },
		{},
	);

	assert.deepEqual(originalMessages, before);
	assert.equal(result.messages.length, 2);
	assert.equal(result.messages[0].role, "user");
	assert.equal(result.messages[1], originalMessages[0]);
	const text = textOf(result.messages[0]);
	assert.match(text, new RegExp(marker));
	assert.match(text, /already loaded for this OMP session/);
	assert.match(
		text,
		/Do not (?:try to )?reload using-superpowers|Do not try to load using-superpowers again/,
	);
	assert.match(text, /## OMP tool mapping/);
	assert.match(text, /native skill discovery/);
	assert.match(text, /skill:\/\/<name>\/SKILL\.md/);
	assert.match(text, /\/skill:<name>/);
	for (const tool of ["read", "write", "edit", "bash", "grep", "glob"]) {
		assert.match(
			text,
			new RegExp("lowercase built-ins[\\s\\S]*`" + tool + "`"),
		);
	}
	assert.match(text, /built-in lowercase `task`/);
	assert.match(text, /built-in lowercase `todo`/);
	assert.match(text, /legacy `TodoWrite` task tracking/);
	assert.match(
		text,
		/never invent capitalized `Skill`, `Task`, or `TodoWrite` calls/i,
	);
	assert.doesNotMatch(text, /Pi tool mapping/);
	assert.doesNotMatch(text, /pi-subagents/);
	assert.doesNotMatch(
		text,
		/subagents? (?:are|is) optional|optional subagents?/i,
	);

	const stringMarker = {
		role: "user",
		content: `prefix ${marker} suffix`,
		timestamp: 2,
	};
	assert.equal(
		await context({ type: "context", messages: [stringMarker] }, {}),
		undefined,
	);
	const multipartMarker = {
		role: "user",
		content: [
			{ type: "image", data: "fixture" },
			{ type: "text", text: marker },
		],
		timestamp: 3,
	};
	assert.equal(
		await context({ type: "context", messages: [multipartMarker] }, {}),
		undefined,
	);

	await agentEnd({ type: "agent_end", messages: [] }, {});
	assert.equal(
		await context({ type: "context", messages: originalMessages }, {}),
		undefined,
	);
	assert.deepEqual(warnings, []);
});

test("post-compaction injection follows every leading summary", async () => {
	const { handlers } = await loadExtension();
	const sessionCompact = firstHandler(handlers, "session_compact");
	const context = firstHandler(handlers, "context");
	const summaries = [
		{ role: "compactionSummary", summary: "first", timestamp: 1 },
		{ role: "compactionSummary", summary: "second", timestamp: 2 },
	];
	const ordinary = { role: "user", content: "Continue", timestamp: 3 };

	await sessionCompact(
		{
			type: "session_compact",
			compactionEntry: {},
			fromExtension: false,
		},
		{},
	);
	const result = await context(
		{ type: "context", messages: [...summaries, ordinary] },
		{},
	);

	assert.equal(result.messages.length, 4);
	assert.equal(result.messages[0], summaries[0]);
	assert.equal(result.messages[1], summaries[1]);
	assert.match(textOf(result.messages[2]), new RegExp(marker));
	assert.equal(result.messages[3], ordinary);
});

test("missing bootstrap fails soft and warns exactly once through omp.logger", async () => {
	const tempRoot = await mkdtemp(
		resolve(tmpdir(), "superpowers-omp-missing-bootstrap-"),
	);
	const isolatedExtensionPath = resolve(
		tempRoot,
		".omp/extensions/superpowers.ts",
	);
	const isolatedSharedBootstrapPath = resolve(
		tempRoot,
		"integrations/shared/bootstrap.ts",
	);

	try {
		await mkdir(dirname(isolatedExtensionPath), { recursive: true });
		await mkdir(dirname(isolatedSharedBootstrapPath), { recursive: true });
		await copyFile(extensionPath, isolatedExtensionPath);
		await copyFile(sharedBootstrapPath, isolatedSharedBootstrapPath);

		const { handlers, warnings } = await loadExtension(isolatedExtensionPath);
		const sessionStart = firstHandler(handlers, "session_start");
		const context = firstHandler(handlers, "context");
		const messages = [{ role: "user", content: "Continue", timestamp: 1 }];
		await sessionStart({ type: "session_start", reason: "startup" }, {});

		assert.equal(await context({ type: "context", messages }, {}), undefined);
		assert.equal(await context({ type: "context", messages }, {}), undefined);
		assert.equal(warnings.length, 1);
		assert.equal(warnings[0][0], "Superpowers bootstrap unavailable");
		assert.deepEqual(
			{
				level: warnings[0][1].level,
				code: warnings[0][1].code,
				harness: warnings[0][1].harness,
				path: warnings[0][1].path,
			},
			{
				level: "warning",
				code: "bootstrap-read-failed",
				harness: "omp",
				path: resolve(tempRoot, "skills/using-superpowers/SKILL.md"),
			},
		);
		assert.equal(typeof warnings[0][1].error, "string");
		assert.ok(warnings[0][1].error.length > 0);
	} finally {
		await rm(tempRoot, { recursive: true, force: true });
	}
});
