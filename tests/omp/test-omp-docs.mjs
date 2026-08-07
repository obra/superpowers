import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");

async function readRepoFile(path) {
	return readFile(resolve(repoRoot, path), "utf8");
}

test("README Quickstart links to a neighboring native OMP install section", async () => {
	const readme = await readRepoFile("README.md");

	assert.match(readme, /\[Oh My Pi \(OMP\)\]\(#oh-my-pi-omp\)/);
	assert.match(readme, /^### Oh My Pi \(OMP\)$/m);
	assert.ok(
		readme.indexOf("### Oh My Pi (OMP)") > readme.indexOf("### Pi"),
		"OMP install guidance should follow the existing Pi section",
	);
	assert.match(readme, /omp plugin install github:obra\/superpowers/);
	assert.match(readme, /omp plugin link \/absolute\/path\/to\/superpowers/);
	assert.match(readme, /\[[^\]]+\]\(\.omp\/INSTALL\.md\)/);
	assert.match(readme, /native manifest/i);
	assert.match(readme, /built-in lowercase `task` subagents/i);
	assert.match(readme, /built-in lowercase `todo` tracking/i);
});

test("OMP install guide documents native install, verification, diagnostics, and removal", async () => {
	const installGuide = await readRepoFile(".omp/INSTALL.md");

	for (const required of [
		"omp plugin install github:obra/superpowers",
		"omp plugin link /absolute/path/to/superpowers",
		"omp plugin list --json",
		"omp plugin list",
		"omp plugin uninstall superpowers",
		"~/.omp/logs/",
		"> Let's make a react todo list",
	]) {
		assert.ok(
			installGuide.includes(required),
			`missing install contract: ${required}`,
		);
	}

	assert.match(installGuide, /prerequisite[\s\S]{0,120}OMP.*installed/i);
	assert.match(installGuide, /verified with OMP 16\.5\.2/i);
	assert.match(installGuide, /not a minimum version or compatibility\s+floor/i);
	assert.doesNotMatch(installGuide, /OMP\s*(?:>=|≥)\s*16\.5\.2/i);
	assert.doesNotMatch(installGuide, /OMP 16\.5\.2\+/i);
	assert.doesNotMatch(
		installGuide,
		/OMP 16\.5\.2\s+(?:or newer|or later|and above)/i,
	);
	assert.doesNotMatch(
		installGuide,
		/(?:requires?|minimum|at least)\s+(?:version\s+)?OMP\s*16\.5\.2/i,
	);
	assert.match(installGuide, /`omp plugin list`/);
	assert.match(installGuide, /restart|start a new session/i);
	assert.match(
		installGuide,
		/bootstrap[\s\S]{0,160}`brainstorming`[\s\S]{0,160}auto-trigger[\s\S]{0,160}before any code/i,
	);
});

test("OMP install guide rejects marketplace installation as the native path", async () => {
	const installGuide = await readRepoFile(".omp/INSTALL.md");

	assert.match(
		installGuide,
		/OMP marketplace installation[\s\S]{0,180}does not load `omp\.extensions` modules/i,
	);
	assert.match(
		installGuide,
		/marketplace[\s\S]{0,220}not the native installation path for this integration/i,
	);
});

test("porting guide distinguishes compatibility reuse from first-class native support", async () => {
	const portingGuide = await readRepoFile("docs/porting-to-a-new-harness.md");

	assert.match(
		portingGuide,
		/compatibility manifests? may be consumed by child or fork harnesses/i,
	);
	assert.match(
		portingGuide,
		/first-class support[\s\S]{0,240}native manifest or adapter contract/i,
	);
	assert.match(
		portingGuide,
		/behavior differs[\s\S]{0,160}use and verify[\s\S]{0,160}native (?:manifest or adapter contract|boundary)/i,
	);
});
