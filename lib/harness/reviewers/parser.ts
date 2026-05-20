import type {
	ReviewerDecision,
	ReviewerFinding,
	AsiTarget,
	HarnessAction,
} from "../types";
const REVIEWER_DECISION_START = "<!-- REVIEWER_DECISION -->";
const REVIEWER_DECISION_END = "<!-- /REVIEWER_DECISION -->";
const VALID_ACTIONS: (HarnessAction | "APPROVE")[] = [
	"APPROVE",
	"BLOCK",
	"NEEDS_HUMAN_REVIEW",
];
const VALID_SEVERITIES = ["Critical", "High", "Medium", "Low"];
export function parseReviewerResponse(
	response: string,
): ReviewerDecision | null {
	const startIdx = response.indexOf(REVIEWER_DECISION_START);
	const endIdx = response.indexOf(REVIEWER_DECISION_END);
	if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
		const jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n\s*```/);
		if (jsonMatch) {
			try {
				const parsed = JSON.parse(jsonMatch[1]);
				return validateReviewerDecision(parsed);
			} catch {
				return null;
			}
		}
		return null;
	}
	const jsonBlock = response
		.substring(startIdx + REVIEWER_DECISION_START.length, endIdx)
		.trim();
	const codeMatch = jsonBlock.match(/```json\s*\n?([\s\S]*?)\n?\s*```/);
	const jsonStr = codeMatch ? codeMatch[1] : jsonBlock;
	try {
		const parsed = JSON.parse(jsonStr);
		return validateReviewerDecision(parsed);
	} catch {
		return null;
	}
}
function validateReviewerDecision(obj: unknown): ReviewerDecision | null {
	if (typeof obj !== "object" || obj === null) return null;
	const decision = obj as Record<string, unknown>;
	if (!("harness_action" in decision)) return null;
	const action = decision.harness_action as string;
	if (!VALID_ACTIONS.includes(action as HarnessAction | "APPROVE")) return null;
	if (
		!("metrics" in decision) ||
		typeof decision.metrics !== "object" ||
		decision.metrics === null
	) {
		return null;
	}
	const metrics = decision.metrics as Record<string, unknown>;
	if (
		typeof metrics.total_findings !== "number" ||
		typeof metrics.critical_high_count !== "number"
	) {
		return null;
	}
	let asiTarget: AsiTarget | null = null;
	if (
		"asi_target" in decision &&
		decision.asi_target !== null &&
		typeof decision.asi_target === "object"
	) {
		const asi = decision.asi_target as Record<string, unknown>;
		if (
			typeof asi.file === "string" &&
			typeof asi.line === "number" &&
			typeof asi.issue_summary === "string" &&
			typeof asi.fix_instruction === "string"
		) {
			asiTarget = {
				file: asi.file,
				line: asi.line,
				issue_summary: asi.issue_summary,
				fix_instruction: asi.fix_instruction,
			};
		}
	}
	const findings: ReviewerFinding[] = [];
	if ("findings" in decision && Array.isArray(decision.findings)) {
		for (const f of decision.findings) {
			const finding = f as Record<string, unknown>;
			if (
				typeof finding.severity === "string" &&
				VALID_SEVERITIES.includes(finding.severity) &&
				typeof finding.file === "string" &&
				typeof finding.line === "number" &&
				typeof finding.issue === "string" &&
				typeof finding.suggestion === "string"
			) {
				findings.push({
					severity: finding.severity as ReviewerFinding["severity"],
					file: finding.file,
					line: finding.line,
					issue: finding.issue,
					suggestion: finding.suggestion,
				});
			}
		}
	}
	return {
		harness_action: action as HarnessAction | "APPROVE",
		metrics: {
			total_findings: metrics.total_findings as number,
			critical_high_count: metrics.critical_high_count as number,
		},
		asi_target: asiTarget,
		findings,
	};
}
export function determineReviewerAction(
	decision: ReviewerDecision | null,
	failOn: "error" | "warning" | "human_review",
): { action: HarnessAction | "APPROVE"; blocked: boolean; reason: string } {
	if (!decision) {
		return {
			action: "APPROVE",
			blocked: false,
			reason: "No reviewer analysis available — defaulting to approve",
		};
	}
	if (decision.harness_action === "BLOCK") {
		return {
			action: "BLOCK",
			blocked: true,
			reason: `Reviewer blocked: ${decision.metrics.critical_high_count} critical/high finding(s) detected`,
		};
	}
	if (decision.harness_action === "NEEDS_HUMAN_REVIEW") {
		const shouldBlock = failOn === "human_review" || failOn === "error";
		return {
			action: "NEEDS_HUMAN_REVIEW",
			blocked: shouldBlock,
			reason: `Reviewer requires human review: ${decision.metrics.total_findings} finding(s) need investigation`,
		};
	}
	return {
		action: "APPROVE",
		blocked: false,
		reason: `Reviewer approved: ${decision.metrics.total_findings} finding(s), ${decision.metrics.critical_high_count} critical/high`,
	};
}
export function formatReviewerDecisionMarkdown(
	decision: ReviewerDecision,
): string {
	const lines: string[] = [];
	const icon =
		decision.harness_action === "APPROVE"
			? "✅"
			: decision.harness_action === "BLOCK"
				? "🚫"
				: "⚠️";
	lines.push(`## Code Review Decision: ${icon} ${decision.harness_action}`);
	lines.push("");
	lines.push(`**Total findings:** ${decision.metrics.total_findings}`);
	lines.push(`**Critical/High:** ${decision.metrics.critical_high_count}`);
	lines.push("");
	if (decision.asi_target) {
		lines.push("### ASI (Auto-Fix Entry Point)");
		lines.push(
			`- **File:** \`${decision.asi_target.file}:${decision.asi_target.line}\``,
		);
		lines.push(`- **Issue:** ${decision.asi_target.issue_summary}`);
		lines.push(`- **Fix instruction:** ${decision.asi_target.fix_instruction}`);
		lines.push("");
	}
	if (decision.findings.length > 0) {
		lines.push("### Findings");
		lines.push("");
		for (const f of decision.findings) {
			const sevIcon =
				f.severity === "Critical"
					? "🔴"
					: f.severity === "High"
						? "🟠"
						: f.severity === "Medium"
							? "🟡"
							: "🔵";
			lines.push(
				`${sevIcon} **[${f.severity}]** \`${f.file}:${f.line}\` — ${f.issue}`,
			);
			lines.push(`   Fix: ${f.suggestion}`);
			lines.push("");
		}
	}
	return lines.join("\n");
}
