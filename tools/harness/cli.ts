#!/usr/bin/env node
import { verify } from "../../lib/harness/index.js";
import {
	verifyCompleteness,
	formatCompletenessMarkdown,
} from "../../lib/harness/completeness/verifier.js";
import {
	detectDeadCode,
	formatDeadCodeMarkdown,
} from "../../lib/harness/deadcode/detector.js";
import {
	analyzeDrift,
	formatDriftMarkdown,
} from "../../lib/harness/drift/analyzer.js";

const args = process.argv.slice(2);
const command = args[0] || "local";

const modeMap: Record<
	string,
	"verify-local" | "verify-all" | "verify-security"
> = {
	local: "verify-local",
	all: "verify-all",
	security: "verify-security",
};

function findSpecPath(): string | null {
	const specFlag = args.indexOf("--spec");
	if (specFlag !== -1 && args[specFlag + 1]) return args[specFlag + 1];

	const candidates = [
		"docs/specs/latest.md",
		"docs/spec.md",
		"SPEC.md",
		"spec.md",
	];
	for (const c of candidates) {
		try {
			require("node:fs").accessSync(c);
			return c;
		} catch {
			/* skip */
		}
	}
	return null;
}

function getProjectRoot(): string {
	const rootFlag = args.indexOf("--root");
	if (rootFlag !== -1 && args[rootFlag + 1]) return args[rootFlag + 1];
	return process.cwd();
}

async function main() {
	if (command === "explain-drift") {
		const specPath = findSpecPath();
		if (!specPath) {
			console.error("No spec found. Use --spec to specify path.");
			process.exit(1);
		}
		const report = analyzeDrift({ specPath, projectRoot: getProjectRoot() });
		console.log(formatDriftMarkdown(report));
		process.exit(report.overallStatus === "aligned" ? 0 : 1);
	}

	if (command === "completeness") {
		const specPath = findSpecPath();
		if (!specPath) {
			console.error("No spec found. Use --spec to specify path.");
			process.exit(1);
		}
		const report = await verifyCompleteness({
			specPath,
			projectRoot: getProjectRoot(),
		});
		console.log(formatCompletenessMarkdown(report));
		process.exit(report.overallStatus === "pass" ? 0 : 1);
	}

	if (command === "deadcode") {
		const filesFlag = args.indexOf("--files");
		const taskFiles =
			filesFlag !== -1 && args[filesFlag + 1]
				? args[filesFlag + 1].split(",")
				: [];
		if (taskFiles.length === 0) {
			console.error("No files specified. Use --files=file1.ts,file2.ts");
			process.exit(1);
		}
		const report = detectDeadCode({ taskFiles, projectRoot: getProjectRoot() });
		console.log(formatDeadCodeMarkdown(report));
		process.exit(report.summary.dead === 0 ? 0 : 1);
	}

	const verifyMode = modeMap[command] || "verify-local";

	const secOpsResponseFlag = args.indexOf("--secops-response");
	const secOpsResponse =
		secOpsResponseFlag !== -1 ? args[secOpsResponseFlag + 1] : undefined;

	console.log(`Running ${verifyMode}...`);
	try {
		const report = await verify({
			mode: verifyMode,
			secOpsResponse,
		});

		console.log(`\nReport saved to: .harness/reports/${report.feature}/`);
		console.log(`Duration: ${(report.duration / 1000).toFixed(1)}s`);

		if (report.summary.security) {
			const sec = report.summary.security;
			console.log(`\nSecurity: ${sec.decision}`);
			console.log(
				`  Total: ${sec.totalFindings} | TP: ${sec.truePositives} | FP: ${sec.falsePositives} | Needs Review: ${sec.needsInvestigation}`,
			);
		}

		if (report.harnessAction && report.harnessAction !== "APPROVE") {
			console.log(`\nHarness Action: ${report.harnessAction}`);
			if (report.harnessAction === "BLOCK") {
				console.log(
					"Build blocked by SecOps — true positives require remediation",
				);
				process.exit(2);
			}
			if (report.harnessAction === "NEEDS_HUMAN_REVIEW") {
				console.log(
					"SecOps requires human review — findings need engineering judgment",
				);
				process.exit(3);
			}
		}

		const allPassed = report.issues.length === 0;
		if (allPassed) {
			console.log("All checks passed");
			process.exit(0);
		} else {
			console.log(`\n${report.issues.length} issue(s) found:`);
			report.issues.forEach((issue, i) => {
				console.log(
					`  ${i + 1}. ${issue.file}:${issue.line} - ${issue.message}`,
				);
			});
			process.exit(1);
		}
	} catch (error: any) {
		console.error(`Error: ${error.message}`);
		process.exit(1);
	}
}

main();
