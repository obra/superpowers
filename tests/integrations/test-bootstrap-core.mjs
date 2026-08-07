import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { createBootstrapController } from "../../integrations/shared/bootstrap.ts";

const marker = "superpowers:using-superpowers bootstrap for test-harness";

async function fixture(t, overrides = {}) {
	const directory = await mkdtemp(
		join(tmpdir(), "superpowers-bootstrap-core-"),
	);
	const bootstrapSkillPath = join(directory, "SKILL.md");
	await writeFile(
		bootstrapSkillPath,
		"---\nname: using-superpowers\ndescription: fixture\n---\n# Bootstrap body\n\nFollow the fixture skill.\n",
	);
	t.after(() => rm(directory, { recursive: true, force: true }));

	return {
		bootstrapSkillPath,
		controller: createBootstrapController({
			harness: "Test Harness",
			bootstrapSkillPath,
			bootstrapMarker: marker,
			loadedMessage:
				"The bootstrap is already loaded for this Test Harness session. Follow it now.",
			toolMapping: "## Test Harness tool mapping\n\nUse native test tools.",
			...overrides,
		}),
	};
}

function injectedMessage(result) {
	assert.ok(result);
	return result.messages.find((message) => {
		return (
			message &&
			typeof message === "object" &&
			message.role === "user" &&
			Array.isArray(message.content) &&
			message.content.some(
				(part) =>
					part?.type === "text" &&
					typeof part.text === "string" &&
					part.text.includes(marker),
			)
		);
	});
}

test("arm injects one wrapped user message, strips frontmatter, and caches successful content", async (t) => {
	const { bootstrapSkillPath, controller } = await fixture(t);
	const original = { role: "user", content: "Build something", timestamp: 1 };
	const messages = [original];

	assert.equal(
		controller.inject(messages),
		undefined,
		"controller starts disarmed",
	);
	controller.arm();
	const before = Date.now();
	const first = controller.inject(messages);
	const after = Date.now();
	const bootstrap = injectedMessage(first);

	assert.ok(bootstrap);
	assert.equal(first.messages.length, 2);
	assert.notEqual(first.messages, messages);
	assert.deepEqual(messages, [original], "input array is not mutated");
	assert.equal(
		first.messages[1],
		original,
		"existing message identity is preserved",
	);
	assert.equal(bootstrap.role, "user");
	assert.equal(bootstrap.content.length, 1);
	assert.equal(bootstrap.content[0].type, "text");
	assert.equal(typeof bootstrap.timestamp, "number");
	assert.ok(bootstrap.timestamp >= before && bootstrap.timestamp <= after);

	const text = bootstrap.content[0].text;
	assert.match(text, /^<EXTREMELY_IMPORTANT>\n/);
	assert.match(text, new RegExp(marker));
	assert.match(text, /You have superpowers\./);
	assert.match(text, /already loaded for this Test Harness session/);
	assert.match(text, /# Bootstrap body/);
	assert.match(text, /Follow the fixture skill\./);
	assert.match(text, /## Test Harness tool mapping/);
	assert.match(text, /<\/EXTREMELY_IMPORTANT>$/);
	assert.doesNotMatch(text, /name: using-superpowers|description: fixture/);

	const repeated = controller.inject(messages);
	assert.equal(injectedMessage(repeated).content[0].text, text);
	assert.equal(repeated.messages[1], original);

	await rm(bootstrapSkillPath);
	controller.disarm();
	assert.equal(controller.inject(messages), undefined);
	controller.arm();
	const cached = controller.inject(messages);
	assert.equal(injectedMessage(cached).content[0].text, text);
});

test("existing markers in string or multipart text content suppress injection", async (t) => {
	const { controller } = await fixture(t);
	controller.arm();

	assert.equal(
		controller.inject([
			{ role: "assistant", content: `prefix ${marker} suffix` },
		]),
		undefined,
	);
	assert.equal(
		controller.inject([
			{
				role: "user",
				content: [
					{ type: "image", data: marker },
					{ type: "text", text: `prefix ${marker} suffix` },
				],
			},
		]),
		undefined,
	);
});

test("injection follows all leading compaction summaries and preserves message order and identity", async (t) => {
	const { controller } = await fixture(t);
	const firstSummary = { role: "compactionSummary", summary: "first" };
	const secondSummary = { role: "compactionSummary", summary: "second" };
	const user = { role: "user", content: "Continue" };
	const trailingSummary = { role: "compactionSummary", summary: "not leading" };
	const messages = [firstSummary, secondSummary, user, trailingSummary];
	controller.arm();

	const result = controller.inject(messages);

	assert.ok(result);
	assert.equal(result.messages.length, 5);
	assert.equal(result.messages[0], firstSummary);
	assert.equal(result.messages[1], secondSummary);
	assert.ok(injectedMessage(result));
	assert.equal(result.messages[3], user);
	assert.equal(result.messages[4], trailingSummary);
	assert.deepEqual(messages, [
		firstSummary,
		secondSummary,
		user,
		trailingSummary,
	]);
});

test("read failure fails soft and reports one structured diagnostic without retrying", async (t) => {
	const directory = await mkdtemp(
		join(tmpdir(), "superpowers-bootstrap-core-"),
	);
	t.after(() => rm(directory, { recursive: true, force: true }));
	const configuredPath = join(directory, "nested", "..", "missing-SKILL.md");
	const diagnostics = [];
	const controller = createBootstrapController({
		harness: "Test Harness",
		bootstrapSkillPath: configuredPath,
		bootstrapMarker: marker,
		loadedMessage: "Loaded guidance",
		toolMapping: "Tool guidance",
		reportDiagnostic(diagnostic) {
			diagnostics.push(diagnostic);
		},
	});
	controller.arm();

	assert.equal(controller.inject([]), undefined);
	assert.equal(diagnostics.length, 1);
	assert.deepEqual(
		{
			level: diagnostics[0].level,
			code: diagnostics[0].code,
			harness: diagnostics[0].harness,
			path: diagnostics[0].path,
		},
		{
			level: "warning",
			code: "bootstrap-read-failed",
			harness: "Test Harness",
			path: resolve(configuredPath),
		},
	);
	assert.equal(typeof diagnostics[0].error, "string");
	assert.match(diagnostics[0].error, /ENOENT/);

	await mkdir(join(directory, "nested"), { recursive: true });
	await writeFile(resolve(configuredPath), "# Late bootstrap");
	assert.equal(
		controller.inject([]),
		undefined,
		"failed reads are not retried",
	);
	controller.disarm();
	controller.arm();
	assert.equal(
		controller.inject([]),
		undefined,
		"re-arming does not retry a failed read",
	);
	assert.equal(diagnostics.length, 1, "diagnostic is reported exactly once");
});

test("throwing diagnostic callback does not escape injection or cause a retry", async (t) => {
	let reportCount = 0;
	const { bootstrapSkillPath, controller } = await fixture(t, {
		reportDiagnostic() {
			reportCount += 1;
			throw new Error("reporter failed");
		},
	});
	await rm(bootstrapSkillPath);
	controller.arm();

	assert.equal(controller.inject([]), undefined);
	assert.equal(controller.inject([]), undefined);
	assert.equal(reportCount, 1, "diagnostic callback is invoked exactly once");
});
