#!/usr/bin/env node
/**
 * Unit tests — hooks/stop-reminders.js (Claude Stop hook path)
 *
 * Validates the Stop output shape expected by Claude Code and guard behavior.
 * Run: node tests/codex/test-stop-reminders.js
 */

"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const HOOK_MODULE_PATH = path.join(__dirname, "../../hooks/stop-reminders.js");

let passed = 0;
let failed = 0;

function test(label, fn) {
	try {
		fn();
		console.log(`  ✓ ${label}`);
		passed++;
	} catch (err) {
		console.error(`  ✗ ${label}`);
		console.error(`    ${err.message}`);
		failed++;
	}
}

function makeTempDirs() {
	const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "sp-stop-home-"));
	const cwdDir = fs.mkdtempSync(path.join(os.tmpdir(), "sp-stop-cwd-"));
	const logDir = path.join(homeDir, ".claude", "hooks-logs");
	fs.mkdirSync(logDir, { recursive: true });
	return { homeDir, cwdDir, logDir };
}

function cleanup(...dirs) {
	for (const dir of dirs) {
		try {
			fs.rmSync(dir, { recursive: true, force: true });
		} catch {
			// Best-effort cleanup for temp test dirs
		}
	}
}

function loadHookWithHome(homeDir) {
	const prevHome = process.env.HOME;
	const prevUserProfile = process.env.USERPROFILE;

	process.env.HOME = homeDir;
	process.env.USERPROFILE = homeDir;
	delete require.cache[require.resolve(HOOK_MODULE_PATH)];
	const hook = require(HOOK_MODULE_PATH);

	if (prevHome === undefined) delete process.env.HOME;
	else process.env.HOME = prevHome;

	if (prevUserProfile === undefined) delete process.env.USERPROFILE;
	else process.env.USERPROFILE = prevUserProfile;

	return hook;
}

const TEST_SESSION_ID = "test-session-abc123";

function writeRecentEdit(logDir, filePath) {
	const line = `${new Date().toISOString()} | ${TEST_SESSION_ID} | Edit | ${filePath}\n`;
	fs.writeFileSync(path.join(logDir, "edit-log.txt"), line, "utf8");
}

console.log("\nStop reminders output contract (Claude)");

test("Test-file detection recognizes tests/codex/test-*.js naming", () => {
	const { homeDir } = makeTempDirs();
	try {
		const { isTestFile } = loadHookWithHome(homeDir);
		assert.strictEqual(
			isTestFile("tests/codex/test-stop-reminders.js"),
			true,
			"Expected test-*.js under tests/ to be classified as a test file",
		);
	} finally {
		cleanup(homeDir);
	}
});

test("When reminders exist: emits decision+reason, not Stop hookSpecificOutput", () => {
	const { homeDir, cwdDir, logDir } = makeTempDirs();
	try {
		writeRecentEdit(logDir, "src/index.js");
		const { evaluatePayload } = loadHookWithHome(homeDir);

		const result = evaluatePayload({
			cwd: cwdDir,
			session_id: TEST_SESSION_ID,
		});

		assert.strictEqual(
			result.decision,
			"block",
			`Expected decision=block, got: ${JSON.stringify(result)}`,
		);
		assert.strictEqual(
			typeof result.reason,
			"string",
			`Expected reason string, got: ${JSON.stringify(result)}`,
		);
		assert.ok(
			result.reason.includes("<stop-hook-reminders>"),
			`Expected stop reminders tag in reason: ${result.reason}`,
		);
		assert.ok(
			!result.hookSpecificOutput,
			`Stop output must not include hookSpecificOutput: ${JSON.stringify(result)}`,
		);
	} finally {
		cleanup(homeDir, cwdDir);
	}
});

test("Active guard suppresses reminder output", () => {
	const { homeDir, cwdDir, logDir } = makeTempDirs();
	try {
		writeRecentEdit(logDir, "src/index.js");
		fs.writeFileSync(
			path.join(logDir, "stop-hook-fired.lock"),
			new Date().toISOString(),
			"utf8",
		);
		const { evaluatePayload } = loadHookWithHome(homeDir);

		const result = evaluatePayload({
			cwd: cwdDir,
			session_id: TEST_SESSION_ID,
		});
		assert.deepStrictEqual(
			result,
			{},
			`Expected empty output while guard is active, got: ${JSON.stringify(result)}`,
		);
	} finally {
		cleanup(homeDir, cwdDir);
	}
});

test("No reminders available emits {}", () => {
	const { homeDir, cwdDir } = makeTempDirs();
	try {
		const { evaluatePayload } = loadHookWithHome(homeDir);
		const result = evaluatePayload({
			cwd: cwdDir,
			session_id: TEST_SESSION_ID,
		});
		assert.deepStrictEqual(
			result,
			{},
			`Expected empty output without reminders, got: ${JSON.stringify(result)}`,
		);
	} finally {
		cleanup(homeDir, cwdDir);
	}
});

test("Stats-only session (skill invocations but no edits) emits {} — does not block", () => {
	// Regression test for v6.5.1 bug: stats summary alone must NOT trigger decision:block.
	// The user reported "Stop hook error: <stop-hook-reminders> Session summary: 6min,
	// 1 skill invocations [executing-plans (1x)]" after every stop — caused by the stop
	// hook blocking even when the only reminder was the informational stats summary.
	const { homeDir, cwdDir, logDir } = makeTempDirs();
	try {
		// Write a session-stats.json simulating a session with 1 skill call, no edits
		const statsFile = path.join(logDir, "session-stats.json");
		fs.writeFileSync(
			statsFile,
			JSON.stringify({
				startedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(), // 6 min ago
				skillInvocations: { "superpowers-prepared:executing-plans": 1 },
				totalSkillCalls: 1,
				hookBlocks: 0,
				filesEdited: 0,
				verificationsRun: 0,
			}),
			"utf8",
		);
		// No edit-log entries for this session (no edits made)

		const { evaluatePayload } = loadHookWithHome(homeDir);
		const result = evaluatePayload({
			cwd: cwdDir,
			session_id: TEST_SESSION_ID,
		});

		assert.deepStrictEqual(
			result,
			{},
			`Stats-only session must emit {}, got: ${JSON.stringify(result)}`,
		);
	} finally {
		cleanup(homeDir, cwdDir);
	}
});

test("Commit reminder suppressed when all session edits are committed (git clean)", () => {
	// Regression test for post-v6.5.2 fix: commit reminder must check actual git status,
	// not session edit count. A session that edited 5+ files but committed them all
	// must NOT emit a commit reminder.
	const { homeDir, cwdDir, logDir } = makeTempDirs();
	try {
		// Simulate 6 session edits so the edit-count threshold (>=5) is crossed
		const editLog = path.join(logDir, "edit-log.txt");
		const lines = ["a.js", "b.js", "c.js", "d.js", "e.js", "f.js"]
			.map(
				(f) =>
					`${new Date().toISOString()} | ${TEST_SESSION_ID} | Edit | /project/${f}\n`,
			)
			.join("");
		fs.writeFileSync(editLog, lines, "utf8");

		const { evaluatePayload } = loadHookWithHome(homeDir);
		// cwdDir is a temp dir with no git repo → getUncommittedCount returns 0 → no commit reminder
		const result = evaluatePayload({
			cwd: cwdDir,
			session_id: TEST_SESSION_ID,
		});

		// May block for TDD reminder (source files, no tests), but must NOT mention "Commit reminder"
		const reason = result.reason || "";
		assert.ok(
			!reason.includes("Commit reminder"),
			`Commit reminder must not fire when git reports no uncommitted changes, got: ${reason}`,
		);
	} finally {
		cleanup(homeDir, cwdDir);
	}
});

// ── isSignificantSession pattern coverage ────────────────────────────────────

console.log("\nisSignificantSession pattern coverage");

test("Detects SKILL.md edits", () => {
	const { homeDir, cwdDir, logDir } = makeTempDirs();
	try {
		writeRecentEdit(logDir, "skills/debugging/SKILL.md");
		const { evaluatePayload } = loadHookWithHome(homeDir);
		const result = evaluatePayload({
			cwd: cwdDir,
			session_id: TEST_SESSION_ID,
		});
		const reason = result.reason || "";
		assert.ok(
			reason.includes("Decision log"),
			`SKILL.md edit should trigger decision log: ${reason}`,
		);
	} finally {
		cleanup(homeDir, cwdDir);
	}
});

test("Detects hooks/*.js edits", () => {
	const { homeDir, cwdDir, logDir } = makeTempDirs();
	try {
		writeRecentEdit(logDir, "/project/hooks/context-engine.js");
		const { evaluatePayload } = loadHookWithHome(homeDir);
		const result = evaluatePayload({
			cwd: cwdDir,
			session_id: TEST_SESSION_ID,
		});
		const reason = result.reason || "";
		assert.ok(
			reason.includes("Decision log"),
			`hooks/*.js edit should trigger decision log: ${reason}`,
		);
	} finally {
		cleanup(homeDir, cwdDir);
	}
});

test("Detects specs/*.md edits (new pattern)", () => {
	const { homeDir, cwdDir, logDir } = makeTempDirs();
	try {
		writeRecentEdit(logDir, "docs/superpowers-prepared/specs/test-spec.md");
		const { evaluatePayload } = loadHookWithHome(homeDir);
		const result = evaluatePayload({
			cwd: cwdDir,
			session_id: TEST_SESSION_ID,
		});
		const reason = result.reason || "";
		assert.ok(
			reason.includes("Decision log"),
			`specs/*.md edit should trigger decision log: ${reason}`,
		);
	} finally {
		cleanup(homeDir, cwdDir);
	}
});

test("Detects plans/*.md edits (new pattern)", () => {
	const { homeDir, cwdDir, logDir } = makeTempDirs();
	try {
		writeRecentEdit(logDir, "docs/superpowers-prepared/plans/test-plan.md");
		const { evaluatePayload } = loadHookWithHome(homeDir);
		const result = evaluatePayload({
			cwd: cwdDir,
			session_id: TEST_SESSION_ID,
		});
		const reason = result.reason || "";
		assert.ok(
			reason.includes("Decision log"),
			`plans/*.md edit should trigger decision log: ${reason}`,
		);
	} finally {
		cleanup(homeDir, cwdDir);
	}
});

test("Detects plugin.universal.yaml edits (new pattern)", () => {
	const { homeDir, cwdDir, logDir } = makeTempDirs();
	try {
		writeRecentEdit(logDir, "plugin.universal.yaml");
		const { evaluatePayload } = loadHookWithHome(homeDir);
		const result = evaluatePayload({
			cwd: cwdDir,
			session_id: TEST_SESSION_ID,
		});
		const reason = result.reason || "";
		assert.ok(
			reason.includes("Decision log"),
			`plugin.universal.yaml edit should trigger decision log: ${reason}`,
		);
	} finally {
		cleanup(homeDir, cwdDir);
	}
});

test("Does NOT trigger for regular source file edits", () => {
	const { homeDir, cwdDir, logDir } = makeTempDirs();
	try {
		writeRecentEdit(logDir, "src/app.js");
		const { evaluatePayload } = loadHookWithHome(homeDir);
		const result = evaluatePayload({
			cwd: cwdDir,
			session_id: TEST_SESSION_ID,
		});
		const reason = result.reason || "";
		assert.ok(
			!reason.includes("Decision log"),
			`Regular source file should NOT trigger decision log: ${reason}`,
		);
	} finally {
		cleanup(homeDir, cwdDir);
	}
});

// ── checkSessionLogSize hard cap ─────────────────────────────────────────────

console.log("\ncheckSessionLogSize hard cap");

test("Entry at 1200 chars does NOT trigger warning (cap is 1500)", () => {
	const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-cap-home-"));
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-cap-"));
	try {
		// ~1200 chars: under old cap (1000) this would trigger, under new cap (1500) it should not
		const content =
			"## 2026-04-15 [saved]\nGoal: Test\n" +
			"Decisions:\n- " +
			"x".repeat(1100) +
			"\n";
		fs.writeFileSync(path.join(tmpDir, "session-log.md"), content);
		const hook = loadHookWithHome(homeDir);
		const result = hook.checkSessionLogSize(tmpDir);
		assert.strictEqual(
			result,
			null,
			`1200-char entry should NOT trigger at 1500 cap, got: ${result}`,
		);
	} finally {
		cleanup(homeDir, tmpDir);
	}
});

test("Entry at 1600 chars DOES trigger warning", () => {
	const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-cap-home-"));
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-cap-"));
	try {
		const content =
			"## 2026-04-15 [saved]\nGoal: Test\n" + "x".repeat(1600) + "\n";
		fs.writeFileSync(path.join(tmpDir, "session-log.md"), content);
		const hook = loadHookWithHome(homeDir);
		const result = hook.checkSessionLogSize(tmpDir);
		assert.ok(result !== null, "Expected warning for 1600-char entry");
		assert.ok(
			result.includes("375 tokens"),
			`Warning should reference 375 token cap, got: ${result}`,
		);
	} finally {
		cleanup(homeDir, tmpDir);
	}
});

console.log(`\n${"─".repeat(50)}`);
console.log(`stop-reminders: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
