// tests/harness/integration/deadcode-e2e.test.ts

import * as fs from "fs";
import * as path from "path";
import { detectDeadCode } from "../../../lib/harness/deadcode/detector";

function makeDir(): string {
	const dir = path.join(
		__dirname,
		"..",
		"..",
		"..",
		`tmp-deadcode-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
	);
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}

function cleanup(dir: string) {
	if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

describe("Dead Code E2E", () => {
	test("detects dead code when exported function is never imported", () => {
		const TEST_DIR = makeDir();
		try {
			const srcDir = path.join(TEST_DIR, "src");
			fs.mkdirSync(srcDir);

			fs.writeFileSync(
				path.join(srcDir, "auth.ts"),
				`
import { helper } from './utils';
export function authMiddleware(req: any) { return helper(req); }
export function unusedHelper() { return 'dead'; }
`,
			);
			fs.writeFileSync(
				path.join(srcDir, "utils.ts"),
				`
export function helper(req: any) { return req; }
`,
			);

			const report = detectDeadCode({
				taskFiles: [path.join(srcDir, "auth.ts")],
				projectRoot: TEST_DIR,
			});

			expect(report.symbolsAnalyzed).toBeGreaterThanOrEqual(1);
			const deadOrIsolated = report.results.filter(
				(r) =>
					r.symbol.name === "unusedHelper" &&
					(r.status === "dead" || r.status === "isolated"),
			);
			expect(deadOrIsolated.length).toBeGreaterThanOrEqual(1);
		} finally {
			cleanup(TEST_DIR);
		}
	});

	test("marks connected symbols as connected via entry point", () => {
		const TEST_DIR = makeDir();
		try {
			const pagesDir = path.join(TEST_DIR, "pages");
			fs.mkdirSync(pagesDir);

			fs.writeFileSync(
				path.join(pagesDir, "login.ts"),
				`
export function authMiddleware(req: any) { return req; }
export default function LoginPage() { return authMiddleware({}); }
`,
			);

			const report = detectDeadCode({
				taskFiles: [path.join(pagesDir, "login.ts")],
				projectRoot: TEST_DIR,
			});

			const connected = report.results.filter(
				(r) => r.symbol.name === "authMiddleware" && r.status === "connected",
			);
			expect(connected.length).toBeGreaterThanOrEqual(1);
		} finally {
			cleanup(TEST_DIR);
		}
	});
});
