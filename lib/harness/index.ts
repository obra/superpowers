import type {
	ValidationResult,
	VerifyReport,
	SecOpsDecision,
	HarnessAction,
	ReviewerDecision,
} from "./types";
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
import {
	validateSecurity,
	loadSecOpsPrompt,
	parseSecOpsResponse,
	determineHarnessAction,
} from "./validators/security";
import { validateDomainSpecific } from "./validators/domain-specific";
import { validateMigrations } from "./validators/migration";
import { validateIntegration } from "./validators/integration";
import {
	generateReport,
	saveReport,
	extractFeatureName,
	GenerateReportOptions,
} from "./reporter";
import {
	loadReviewerPrompt,
	buildReviewerPrompt,
	resolveStacksForFiles,
	getAvailableStacks,
} from "./reviewers/loader";
import {
	parseReviewerResponse,
	determineReviewerAction,
	formatReviewerDecisionMarkdown,
} from "./reviewers/parser";
import * as path from "node:path";

export interface VerifyOptions {
	mode: "verify-local" | "verify-all" | "verify-security";
	cwd?: string;
	feature?: string;
	secOpsResponse?: string;
}

export async function verify(
	options: VerifyOptions = { mode: "verify-local" },
): Promise<VerifyReport & { secOpsDecision?: SecOpsDecision | null; harnessAction?: HarnessAction | "APPROVE" }> {
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
	const results: Record<string, ValidationResult & { rawFindings?: any[] }> = {};
	let secOpsDecision: SecOpsDecision | null = null;
	let harnessAction: HarnessAction | "APPROVE" = "APPROVE";

	if (options.mode === "verify-security") {
		const secResult = await validateSecurity(
			cwd,
			config.securityScan.tools,
			config.timeout.verifyAll,
		);
		results.security = secResult;

		if (secResult.rawFindings && secResult.rawFindings.length > 0) {
			if (options.secOpsResponse) {
				secOpsDecision = parseSecOpsResponse(options.secOpsResponse);
			}

			const actionResult = determineHarnessAction(
				secOpsDecision,
				config.failOn.security,
			);
			harnessAction = actionResult.action;

			if (actionResult.blocked) {
				const report = buildReport({
					feature,
					mode: options.mode,
					results,
					coverageTarget: config.coverageMin,
					secOpsDecision,
					harnessAction,
				});
				saveReport(report, path.join(cwd, ".harness", "reports"));
				return { ...report, secOpsDecision, harnessAction };
			}
		}
	} else {
		results.lint = await validateLint(
			cwd,
			stack,
			config.timeout.verifyLocal,
		);
		if (!results.lint.passed && config.failOn.lint === "error") {
			const report = buildReport({
				feature,
				mode: options.mode,
				results,
				coverageTarget: config.coverageMin,
				harnessAction,
			});
			saveReport(report, path.join(cwd, ".harness", "reports"));
			return { ...report, secOpsDecision, harnessAction };
		}

		results.typecheck = await validateTypeCheck(
			cwd,
			stack,
			config.timeout.verifyLocal,
		);
		if (!results.typecheck.passed) {
			const report = buildReport({
				feature,
				mode: options.mode,
				results,
				coverageTarget: config.coverageMin,
				harnessAction,
			});
			saveReport(report, path.join(cwd, ".harness", "reports"));
			return { ...report, secOpsDecision, harnessAction };
		}

		results.test = await validateTests(cwd, stack);
		if (!results.test.passed) {
			const report = buildReport({
				feature,
				mode: options.mode,
				results,
				coverageTarget: config.coverageMin,
				harnessAction,
			});
			saveReport(report, path.join(cwd, ".harness", "reports"));
			return { ...report, secOpsDecision, harnessAction };
		}

		results.coverage = await validateCoverage(
			cwd,
			stack,
			config.coverageMin,
			config.timeout.verifyLocal,
		);

		if (options.mode === "verify-all") {
			const secResult = await validateSecurity(
				cwd,
				config.securityScan.tools,
				config.timeout.verifyAll,
			);
			results.security = secResult;

			if (secResult.rawFindings && secResult.rawFindings.length > 0) {
				if (options.secOpsResponse) {
					secOpsDecision = parseSecOpsResponse(options.secOpsResponse);
				}

				const actionResult = determineHarnessAction(
					secOpsDecision,
					config.failOn.security,
				);
				harnessAction = actionResult.action;

				if (actionResult.blocked) {
					const report = buildReport({
						feature,
						mode: options.mode,
						results,
						coverageTarget: config.coverageMin,
						secOpsDecision,
						harnessAction,
					});
					saveReport(report, path.join(cwd, ".harness", "reports"));
					return { ...report, secOpsDecision, harnessAction };
				}
			}

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

	const report = buildReport({
		feature,
		mode: options.mode,
		results,
		coverageTarget: config.coverageMin,
		secOpsDecision,
		harnessAction,
	});
	saveReport(report, path.join(cwd, ".harness", "reports"));
	return { ...report, secOpsDecision, harnessAction };
}

function buildReport(options: {
	feature: string;
	mode: "verify-local" | "verify-all" | "verify-security";
	results: Record<string, ValidationResult>;
	coverageTarget: number;
	secOpsDecision?: SecOpsDecision | null;
	harnessAction?: HarnessAction | "APPROVE";
}): VerifyReport {
	const report = generateReport({
		feature: options.feature,
		mode: options.mode,
		results: options.results,
		coverageTarget: options.coverageTarget,
		secOpsDecision: options.secOpsDecision,
	});
	report.harnessAction = options.harnessAction;
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
export { loadSecOpsPrompt, parseSecOpsResponse, determineHarnessAction } from "./validators/security";

export interface ReviewCodeOptions {
	changedFiles: string[];
	gitDiff: string;
	stacks?: string[];
}

export function prepareReviewerPrompt(options: ReviewCodeOptions): string {
	return buildReviewerPrompt(options.changedFiles, options.gitDiff, options.stacks);
}

export function evaluateReviewResponse(
	response: string,
	failOn: "error" | "warning" | "human_review" = "error",
): { decision: ReviewerDecision | null; action: ReturnType<typeof determineReviewerAction>; markdown: string } {
	const decision = parseReviewerResponse(response);
	const action = determineReviewerAction(decision, failOn);
	const markdown = decision ? formatReviewerDecisionMarkdown(decision) : "## Review: No parseable decision found in response.";
	return { decision, action, markdown };
}

export {
	loadReviewerPrompt,
	buildReviewerPrompt,
	resolveStacksForFiles,
	detectOrmFromDiff,
	getAvailableStacks,
} from "./reviewers/loader";
export {
	parseReviewerResponse,
	determineReviewerAction,
	formatReviewerDecisionMarkdown,
} from "./reviewers/parser";

// Completeness verification
export {
	verifyCompleteness,
	formatCompletenessMarkdown,
} from "./completeness/verifier";
export { parseSpec, detectSpecFormat } from "./completeness/spec-parser";
export { matchAC } from "./completeness/implementation-matcher";
export type { CompletenessOptions } from "./completeness/verifier";
export type { AcceptanceCriterion, ACEvidence, CompletenessReport } from "./completeness/types";

// Dead code detection
export { detectDeadCode, formatDeadCodeMarkdown } from "./deadcode/detector";
export { buildImportGraph, getImporters } from "./deadcode/import-graph";
export { analyzeReachability } from "./deadcode/reachability";
export { extractSymbols, extractSymbolsFromFiles } from "./deadcode/symbol-extractor";
export type { DeadCodeOptions } from "./deadcode/detector";
export type { SymbolInfo, ReachabilityResult, DeadCodeReport } from "./deadcode/types";

// Drift analysis
export { analyzeDrift, formatDriftMarkdown } from "./drift/analyzer";
export { readSpecRequirements } from "./drift/spec-reader";
export { computeSemanticDiff } from "./drift/semantic-diff";
export { classifyGaps } from "./drift/gap-classifier";
export type { DriftOptions } from "./drift/analyzer";
export type { DriftItem, DriftReport } from "./drift/types";
