import type { ValidationResult, VerifyReport } from "./types";
import {
	loadProjectConfig,
	loadWorkspaceConfig,
	isWorkspaceMode,
} from "./config";
import { detectStack, scanWorkspace, shouldRescan } from "./discovery";
import { validateLint } from "./validators/lint";
import { validateTypeCheck } from "./validators/typecheck";
import { validateTests } from "./validators/test";
import { validateCoverage } from "./validators/coverage";
import { validateSecurity } from "./validators/security";
import { validateDomainSpecific } from "./validators/domain-specific";
import { validateMigrations } from "./validators/migration";
import { validateIntegration } from "./validators/integration";
import { generateReport, saveReport, extractFeatureName } from "./reporter";
import * as path from "node:path";

export interface VerifyOptions {
	mode: "verify-local" | "verify-all" | "verify-security";
	cwd?: string;
	feature?: string;
}

export async function verify(
	options: VerifyOptions = { mode: "verify-local" },
): Promise<VerifyReport> {
	const cwd = options.cwd || process.cwd();
	const config = loadProjectConfig(cwd);
	const stack = detectStack(cwd);

	if (!stack) {
		const wsConfig = loadWorkspaceConfig(cwd);
		if (wsConfig && isWorkspaceMode(wsConfig)) {
			if (shouldRescan(cwd)) scanWorkspace(cwd);
		}
		throw new Error(`Could not detect stack for project at ${cwd}`);
	}

	const feature = options.feature || extractFeatureName(cwd);
	const results: Record<string, ValidationResult> = {};

	if (options.mode === "verify-security") {
		results.security = await validateSecurity(
			cwd,
			config.securityScan.tools,
			config.timeout.verifyAll,
		);
	} else {
		results.lint = await validateLint(cwd, stack, config.timeout.verifyLocal);
		if (!results.lint.passed && config.failOn.lint === "error") {
			const report = generateReport(
				feature,
				options.mode,
				results,
				config.coverageMin,
			);
			saveReport(report, path.join(cwd, ".harness", "reports"));
			return report;
		}

		results.typecheck = await validateTypeCheck(
			cwd,
			stack,
			config.timeout.verifyLocal,
		);
		if (!results.typecheck.passed) {
			const report = generateReport(
				feature,
				options.mode,
				results,
				config.coverageMin,
			);
			saveReport(report, path.join(cwd, ".harness", "reports"));
			return report;
		}

		results.test = await validateTests(cwd, stack);
		if (!results.test.passed) {
			const report = generateReport(
				feature,
				options.mode,
				results,
				config.coverageMin,
			);
			saveReport(report, path.join(cwd, ".harness", "reports"));
			return report;
		}

		results.coverage = await validateCoverage(
			cwd,
			stack,
			config.coverageMin,
			config.timeout.verifyLocal,
		);

		if (options.mode === "verify-all") {
			results.security = await validateSecurity(
				cwd,
				config.securityScan.tools,
				config.timeout.verifyAll,
			);
			results.integration = await validateIntegration(
				cwd,
				stack,
				config.timeout.verifyAll,
			);
			results.domainSpecific = await validateDomainSpecific(
				cwd,
				stack,
				"frontend",
				config.domainSpecific,
				config.timeout.verifyAll,
			);
			results.migration = await validateMigrations(cwd, stack);
		}
	}

	const report = generateReport(
		feature,
		options.mode,
		results,
		config.coverageMin,
	);
	saveReport(report, path.join(cwd, ".harness", "reports"));
	return report;
}

export { loadProjectConfig, loadWorkspaceConfig } from "./config";
export { extractFeatureName, formatReportMarkdown } from "./reporter";
export { detectStack, scanWorkspace } from "./discovery";
export { validateLint } from "./validators/lint";
export { validateTypeCheck } from "./validators/typecheck";
export { validateTests } from "./validators/test";
export { validateCoverage } from "./validators/coverage";
export { validateSecurity } from "./validators/security";
