import * as fs from "node:fs";
import * as path from "node:path";
import type {
	ValidationResult,
	ParsedError,
	SecurityTool,
	SecurityRawFinding,
	SecOpsDecision,
	HarnessAction,
} from "../types";
import { runCommand, compressOutput } from "../runner";
const SECURITY_TOOLS: SecurityTool[] = [
	{
		name: "semgrep",
		npmPackage: "semgrep",
		cmd: "npx semgrep --config=auto --json --quiet . 2>&1 || true",
		outputFormat: "json",
	},
	{
		name: "gitleaks",
		npmPackage: "gitleaks",
		cmd: "npx gitleaks detect --report-format json --report-path /dev/null 2>&1 || true",
		outputFormat: "json",
	},
	{
		name: "npmAudit",
		npmPackage: "",
		cmd: "npm audit --json 2>&1 || true",
		outputFormat: "json",
	},
];
const DECISION_START = "<!-- HARNESS_DECISION -->";
const DECISION_END = "<!-- /HARNESS_DECISION -->";
export async function validateSecurity(
	cwd: string,
	tools: Record<string, boolean>,
	timeout: number = 60000,
): Promise<ValidationResult & { rawFindings: SecurityRawFinding[] }> {
	const start = Date.now();
	const errors: ParsedError[] = [];
	const warnings: string[] = [];
	const rawFindings: SecurityRawFinding[] = [];
	for (const tool of SECURITY_TOOLS) {
		if (!tools[tool.name]) continue;
		const result = await runCommand(tool.cmd, cwd, timeout);
		const output = result.stderr || result.stdout;
		if (result.exitCode !== 0 && result.exitCode !== 124) {
			errors.push({
				file: "",
				line: 0,
				column: 0,
				message: `${tool.name}: ${compressOutput(output, 20)}`,
				rule: tool.name,
				severity: "error",
			});
			continue;
		}
		const parsed = parseToolOutput(tool.name, output);
		rawFindings.push(...parsed);
		if (parsed.length > 0) {
			warnings.push(
				`${tool.name}: ${parsed.length} finding(s) detected — requires SecOps analysis`,
			);
		}
	}
	return {
		passed: errors.length === 0 && rawFindings.length === 0,
		errors,
		warnings,
		duration: Date.now() - start,
		rawFindings,
	};
}
function parseToolOutput(
	toolName: string,
	output: string,
): SecurityRawFinding[] {
	const findings: SecurityRawFinding[] = [];
	try {
		const parsed = JSON.parse(output);
		if (toolName === "semgrep" && parsed.results) {
			for (const result of parsed.results) {
				findings.push({
					tool: "semgrep",
					id: result.check_id || result.rule_id || "unknown",
					file: result.path || "",
					line: result.start?.line || 0,
					severity: mapSemgrepSeverity(result.extra?.severity),
					message: result.extra?.message || result.extra?.lines || "",
					raw: result,
				});
			}
		} else if (toolName === "gitleaks" && Array.isArray(parsed)) {
			for (const result of parsed) {
				findings.push({
					tool: "gitleaks",
					id: result.RuleID || result.rule || "unknown",
					file: result.File || "",
					line: result.StartLine || 0,
					severity: "High",
					message: `Potential secret detected: ${result.Secret || result.Match || "unknown"}`,
					raw: result,
				});
			}
		} else if (toolName === "npmAudit" && parsed.vulnerabilities) {
			for (const [id, vuln] of Object.entries(
				parsed.vulnerabilities as Record<string, any>,
			)) {
				findings.push({
					tool: "npm_audit",
					id,
					severity: vuln.severity || "Medium",
					message: `${id}: ${vuln.title || vuln.url || "vulnerability found"}`,
					raw: vuln,
				});
			}
		}
	} catch {
		if (
			output &&
			!output.includes('"vulnerabilities":0') &&
			!output.includes('"results":[]') &&
			!output.includes('"count":0')
		) {
			findings.push({
				tool: toolName,
				id: "parse-error",
				severity: "Medium",
				message: `Tool output could not be parsed as JSON: ${compressOutput(output, 5)}`,
				raw: { output },
			});
		}
	}
	return findings;
}
function mapSemgrepSeverity(raw?: string): string {
	switch (raw) {
		case "ERROR":
			return "High";
		case "WARNING":
			return "Medium";
		case "INFO":
			return "Low";
		default:
			return "Medium";
	}
}
export function loadSecOpsPrompt(): string {
	const promptPath = path.join(
		path.dirname(__dirname),
		"reviewers",
		"secops-prompt.md",
	);
	if (!fs.existsSync(promptPath)) {
		throw new Error(`SecOps prompt not found at ${promptPath}`);
	}
	return fs.readFileSync(promptPath, "utf-8");
}
export function parseSecOpsResponse(response: string): SecOpsDecision | null {
	const startIdx = response.indexOf(DECISION_START);
	const endIdx = response.indexOf(DECISION_END);
	if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
		const jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n\s*```/);
		if (jsonMatch) {
			try {
				const parsed = JSON.parse(jsonMatch[1]);
				return validateSecOpsDecision(parsed);
			} catch {
				return null;
			}
		}
		return null;
	}
	const jsonBlock = response
		.substring(startIdx + DECISION_START.length, endIdx)
		.trim();
	const codeMatch = jsonBlock.match(/```json\s*\n?([\s\S]*?)\n?\s*```/);
	const jsonStr = codeMatch ? codeMatch[1] : jsonBlock;
	try {
		const parsed = JSON.parse(jsonStr);
		return validateSecOpsDecision(parsed);
	} catch {
		return null;
	}
}
function validateSecOpsDecision(obj: unknown): SecOpsDecision | null {
	if (
		typeof obj !== "object" ||
		obj === null ||
		!("harness_action" in obj) ||
		!("summary" in obj) ||
		!("findings" in obj)
	) {
		return null;
	}
	const decision = obj as SecOpsDecision;
	const validActions: HarnessAction[] = [
		"APPROVE",
		"BLOCK",
		"NEEDS_HUMAN_REVIEW",
	];
	if (!validActions.includes(decision.harness_action)) {
		return null;
	}
	if (
		typeof decision.summary !== "object" ||
		decision.summary === null ||
		!("total_findings" in decision.summary) ||
		!("true_positives" in decision.summary) ||
		!("false_positives" in decision.summary) ||
		!("needs_investigation" in decision.summary)
	) {
		return null;
	}
	if (!Array.isArray(decision.findings)) {
		return null;
	}
	return decision;
}
export function determineHarnessAction(
	decision: SecOpsDecision | null,
	failOn: "error" | "warning" | "human_review",
): { action: HarnessAction | "APPROVE"; blocked: boolean; reason: string } {
	if (!decision) {
		return {
			action: "APPROVE",
			blocked: false,
			reason: "No SecOps analysis available — defaulting to approve",
		};
	}
	if (decision.harness_action === "BLOCK") {
		return {
			action: "BLOCK",
			blocked: true,
			reason: `SecOps blocked: ${decision.summary.true_positives} true positive(s) found, ${decision.summary.needs_investigation} need(s) investigation`,
		};
	}
	if (decision.harness_action === "NEEDS_HUMAN_REVIEW") {
		const shouldBlock = failOn === "human_review" || failOn === "error";
		return {
			action: "NEEDS_HUMAN_REVIEW",
			blocked: shouldBlock,
			reason: `SecOps requires human review: ${decision.summary.needs_investigation} finding(s) need investigation`,
		};
	}
	return {
		action: "APPROVE",
		blocked: false,
		reason: `SecOps approved: ${decision.summary.false_positives} false positive(s), no critical/high true positives`,
	};
}
