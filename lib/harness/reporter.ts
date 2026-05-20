import * as fs from "node:fs";
import * as path from "node:path";
import type { ValidationResult, VerifyReport, SecOpsDecision } from "./types";
export interface GenerateReportOptions {
	feature: string;
	mode: "verify-local" | "verify-all" | "verify-security";
	results: Record<string, ValidationResult>;
	coverageTarget: number;
	secOpsDecision?: SecOpsDecision | null;
}

export function extractFeatureName(cwd: string): string {
	try {
		const { execSync } = require("node:child_process");
		const branch = execSync("git branch --show-current", { cwd })
			.toString()
			.trim();
		if (branch) {
			const parts = branch.split("/");
			return parts[parts.length - 1] || branch;
		}
	} catch {
		/* ignore */
	}
	return `session-${Date.now()}`;
}

export function generateReport(options: GenerateReportOptions): VerifyReport {
	const { feature, mode, results, coverageTarget, secOpsDecision } = options;
	const lintResult = results.lint || {
		passed: true,
		errors: [],
		warnings: [],
		duration: 0,
	};
	const typecheckResult = results.typecheck || {
		passed: true,
		errors: [],
		warnings: [],
		duration: 0,
	};
	const testResult = results.test || {
		passed: true,
		errors: [],
		warnings: [],
		duration: 0,
	};
	const coverageResult = results.coverage || {
		passed: true,
		errors: [],
		warnings: [],
		duration: 0,
	};

	const totalDuration = Object.values(results).reduce(
		(sum, r) => sum + r.duration,
		0,
	);

	const allErrors = [
		...lintResult.errors,
		...typecheckResult.errors,
		...testResult.errors,
		...coverageResult.errors,
	];
	const allWarnings = [
		...lintResult.warnings,
		...typecheckResult.warnings,
		...testResult.warnings,
		...coverageResult.warnings,
	];

	const report: VerifyReport = {
		feature,
		mode,
		timestamp: new Date().toISOString(),
		duration: totalDuration,
		summary: {
			lint: {
				errors: lintResult.errors.length,
				warnings: lintResult.warnings.length,
				details: lintResult.warnings.join(", ") || "clean",
			},
			typecheck: { passed: typecheckResult.passed, files: 0 },
			tests: {
				passed: testResult.passed ? -1 : 0,
				total: -1,
				framework: "unknown",
			},
			coverage: {
				percentage: coverageResult.passed ? coverageTarget : 0,
				target: coverageTarget,
				filesBelow: coverageResult.errors.length,
			},
			security: secOpsDecision
				? {
						decision: secOpsDecision.harness_action,
						totalFindings: secOpsDecision.summary.total_findings,
						truePositives: secOpsDecision.summary.true_positives,
						falsePositives: secOpsDecision.summary.false_positives,
						needsInvestigation: secOpsDecision.summary.needs_investigation,
					}
				: {
						decision: "NOT_ANALYZED" as const,
						totalFindings: 0,
						truePositives: 0,
						falsePositives: 0,
						needsInvestigation: 0,
					},
		},
		issues: allErrors.map((e) => ({
			file: e.file,
			line: e.line,
			message: e.message,
			suggestion: `Review and fix: ${e.message}`,
		})),
		recommendations: allWarnings.map((w) => w),
	};

	return report;
}

export function formatReportMarkdown(report: VerifyReport): string {
	const lines: string[] = [];
	lines.push(`# Verify Report — ${report.feature}`);
	lines.push(
		`Date: ${report.timestamp} | Mode: ${report.mode} | Duration: ${(report.duration / 1000).toFixed(1)}s`,
	);
	lines.push("");
	lines.push("## Summary");

	const s = report.summary;
	lines.push(
		`${s.lint.errors === 0 ? "✅" : "❌"} Lint: ${s.lint.errors} errors, ${s.lint.warnings} warnings (${s.lint.details})`,
	);
	lines.push(
		`${s.typecheck.passed ? "✅" : "❌"} TypeCheck: ${s.typecheck.passed ? "passed" : "failed"} (${s.typecheck.files} files)`,
	);
	lines.push(
		`${s.tests.passed >= 0 ? (s.tests.passed === s.tests.total ? "✅" : "❌") : "✅"} Tests: ${s.tests.passed >= 0 ? `${s.tests.passed}/${s.tests.total} passing` : "passed"} (${s.tests.framework})`,
	);
	lines.push(
		`${s.coverage.percentage >= s.coverage.target ? "✅" : "⚠️"} Coverage: ${s.coverage.percentage.toFixed(1)}% (target: ${s.coverage.target}%) — ${s.coverage.filesBelow} files below threshold`,
	);

	if (s.security) {
		const secIcon =
			s.security.decision === "APPROVE"
				? "✅"
				: s.security.decision === "BLOCK"
					? "🚫"
					: s.security.decision === "NEEDS_HUMAN_REVIEW"
						? "⚠️"
						: "➖";
		lines.push(
			`${secIcon} Security: ${s.security.decision} — ${s.security.totalFindings} total, ${s.security.truePositives} TP, ${s.security.falsePositives} FP, ${s.security.needsInvestigation} needs review`,
		);
	}

	if (report.issues.length > 0) {
		lines.push("");
		lines.push("## Issues");
		report.issues.forEach((issue, i) => {
			lines.push(`${i + 1}. ${issue.file}:${issue.line} — ${issue.message}`);
			if (issue.suggestion) lines.push(`   Suggestion: ${issue.suggestion}`);
		});
	}

	if (report.recommendations.length > 0) {
		lines.push("");
		lines.push("## Recommendations");
		report.recommendations.forEach((r) => {
			lines.push(`- ${r}`);
		});
	}

	return lines.join("\n");
}

export function saveReport(report: VerifyReport, reportDir: string): string {
	const featureDir = path.join(reportDir, report.feature);
	fs.mkdirSync(featureDir, { recursive: true });

	const timestamp = report.timestamp.replace(/[:.]/g, "-");
	const mdPath = path.join(featureDir, `${timestamp}-verify-report.md`);
	const mdContent = formatReportMarkdown(report);
	fs.writeFileSync(mdPath, `${mdContent}\n`);

	const jsonPath = path.join(featureDir, `${timestamp}-verify-report.json`);
	fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);

	return mdPath;
}
