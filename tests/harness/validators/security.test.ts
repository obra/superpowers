import {
	loadSecOpsPrompt,
	parseSecOpsResponse,
	determineHarnessAction,
} from "../../../lib/harness/validators/security";
import type { SecOpsDecision } from "../../../lib/harness/types";

describe("loadSecOpsPrompt", () => {
	test("loads the SecOps prompt successfully", () => {
		const prompt = loadSecOpsPrompt();
		expect(prompt).toContain("SecOps Agent");
		expect(prompt).toContain("HARNESS_DECISION");
		expect(prompt).toContain("Triage");
	});
});

describe("parseSecOpsResponse", () => {
	test("parses response with decision markers", () => {
		const response = `Security analysis complete

<!-- HARNESS_DECISION -->
\`\`\`json
{
  "harness_action": "BLOCK",
  "summary": {
    "total_findings": 3,
    "true_positives": 1,
    "false_positives": 1,
    "needs_investigation": 1
  },
  "findings": [
    {
      "tool": "semgrep",
      "id": "sql-injection",
      "file": "src/db.ts",
      "line": 42,
      "classification": "TP",
      "real_severity": "Critical",
      "suppression_applied": false,
      "justification": "Raw SQL query without parameterization",
      "remediation": "Use parameterized queries"
    }
  ]
}
\`\`\`
<!-- /HARNESS_DECISION -->`;

		const result = parseSecOpsResponse(response);
		expect(result).not.toBeNull();
		expect(result!.harness_action).toBe("BLOCK");
		expect(result!.summary.total_findings).toBe(3);
		expect(result!.summary.true_positives).toBe(1);
		expect(result!.summary.false_positives).toBe(1);
		expect(result!.summary.needs_investigation).toBe(1);
		expect(result!.findings).toHaveLength(1);
		expect(result!.findings[0].tool).toBe("semgrep");
		expect(result!.findings[0].classification).toBe("TP");
	});

	test("parses response with bare JSON block (no markers)", () => {
		const response = `\`\`\`json
{
  "harness_action": "APPROVE",
  "summary": {
    "total_findings": 2,
    "true_positives": 0,
    "false_positives": 2,
    "needs_investigation": 0
  },
  "findings": []
}
\`\`\``;

		const result = parseSecOpsResponse(response);
		expect(result).not.toBeNull();
		expect(result!.harness_action).toBe("APPROVE");
	});

	test("parses APPROVE decision", () => {
		const response = `\`\`\`json
{
  "harness_action": "APPROVE",
  "summary": {
    "total_findings": 1,
    "true_positives": 0,
    "false_positives": 1,
    "needs_investigation": 0
  },
  "findings": [
    {
      "tool": "gitleaks",
      "id": "generic-api-key",
      "file": "config.json",
      "line": 5,
      "classification": "FP",
      "real_severity": "Info",
      "suppression_applied": true,
      "justification": "This is a test fixture, not a real key"
    }
  ]
}
\`\`\``;

		const result = parseSecOpsResponse(response);
		expect(result).not.toBeNull();
		expect(result!.harness_action).toBe("APPROVE");
		expect(result!.findings[0].classification).toBe("FP");
	});

	test("parses NEEDS_HUMAN_REVIEW decision", () => {
		const response = `\`\`\`json
{
  "harness_action": "NEEDS_HUMAN_REVIEW",
  "summary": {
    "total_findings": 1,
    "true_positives": 0,
    "false_positives": 0,
    "needs_investigation": 1
  },
  "findings": [
    {
      "tool": "npm_audit",
      "id": "CVE-2024-1234",
      "classification": "Needs Investigation",
      "real_severity": "Medium",
      "suppression_applied": false,
      "justification": "Unclear if vulnerability is exploitable in our context"
    }
  ]
}
\`\`\``;

		const result = parseSecOpsResponse(response);
		expect(result).not.toBeNull();
		expect(result!.harness_action).toBe("NEEDS_HUMAN_REVIEW");
		expect(result!.findings[0].classification).toBe("Needs Investigation");
	});

	test("returns null for invalid JSON", () => {
		const response = `<!-- HARNESS_DECISION -->
\`\`\`json
{ broken json
\`\`\`
<!-- /HARNESS_DECISION -->`;

		const result = parseSecOpsResponse(response);
		expect(result).toBeNull();
	});

	test("returns null for missing markers and no JSON", () => {
		const response = "Just some security analysis text";
		const result = parseSecOpsResponse(response);
		expect(result).toBeNull();
	});

	test("returns null for invalid harness_action", () => {
		const response = `\`\`\`json
{
  "harness_action": "INVALID",
  "summary": {
    "total_findings": 0,
    "true_positives": 0,
    "false_positives": 0,
    "needs_investigation": 0
  },
  "findings": []
}
\`\`\``;

		const result = parseSecOpsResponse(response);
		expect(result).toBeNull();
	});

	test("returns null for missing summary fields", () => {
		const response = `\`\`\`json
{
  "harness_action": "APPROVE",
  "summary": {
    "total_findings": 0
  },
  "findings": []
}
\`\`\``;

		const result = parseSecOpsResponse(response);
		expect(result).toBeNull();
	});

	test("returns null for non-array findings", () => {
		const response = `\`\`\`json
{
  "harness_action": "APPROVE",
  "summary": {
    "total_findings": 0,
    "true_positives": 0,
    "false_positives": 0,
    "needs_investigation": 0
  },
  "findings": "not an array"
}
\`\`\``;

		const result = parseSecOpsResponse(response);
		expect(result).toBeNull();
	});
});

describe("determineHarnessAction", () => {
	test("returns APPROVE when decision is null", () => {
		const result = determineHarnessAction(null, "error");
		expect(result.action).toBe("APPROVE");
		expect(result.blocked).toBe(false);
		expect(result.reason).toContain("defaulting");
	});

	test("returns BLOCK for BLOCK decision", () => {
		const decision: SecOpsDecision = {
			harness_action: "BLOCK",
			summary: {
				total_findings: 3,
				true_positives: 1,
				false_positives: 1,
				needs_investigation: 1,
			},
			findings: [],
		};
		const result = determineHarnessAction(decision, "error");
		expect(result.action).toBe("BLOCK");
		expect(result.blocked).toBe(true);
		expect(result.reason).toContain("true positive");
	});

	test("returns NEEDS_HUMAN_REVIEW with blocked=true for error failOn", () => {
		const decision: SecOpsDecision = {
			harness_action: "NEEDS_HUMAN_REVIEW",
			summary: {
				total_findings: 2,
				true_positives: 0,
				false_positives: 0,
				needs_investigation: 2,
			},
			findings: [],
		};
		const result = determineHarnessAction(decision, "error");
		expect(result.action).toBe("NEEDS_HUMAN_REVIEW");
		expect(result.blocked).toBe(true);
	});

	test("returns NEEDS_HUMAN_REVIEW with blocked=true for human_review failOn", () => {
		const decision: SecOpsDecision = {
			harness_action: "NEEDS_HUMAN_REVIEW",
			summary: {
				total_findings: 1,
				true_positives: 0,
				false_positives: 0,
				needs_investigation: 1,
			},
			findings: [],
		};
		const result = determineHarnessAction(decision, "human_review");
		expect(result.action).toBe("NEEDS_HUMAN_REVIEW");
		expect(result.blocked).toBe(true);
	});

	test("returns NEEDS_HUMAN_REVIEW with blocked=false for warning failOn", () => {
		const decision: SecOpsDecision = {
			harness_action: "NEEDS_HUMAN_REVIEW",
			summary: {
				total_findings: 1,
				true_positives: 0,
				false_positives: 0,
				needs_investigation: 1,
			},
			findings: [],
		};
		const result = determineHarnessAction(decision, "warning");
		expect(result.action).toBe("NEEDS_HUMAN_REVIEW");
		expect(result.blocked).toBe(false);
	});

	test("returns APPROVE for APPROVE decision", () => {
		const decision: SecOpsDecision = {
			harness_action: "APPROVE",
			summary: {
				total_findings: 2,
				true_positives: 0,
				false_positives: 2,
				needs_investigation: 0,
			},
			findings: [],
		};
		const result = determineHarnessAction(decision, "error");
		expect(result.action).toBe("APPROVE");
		expect(result.blocked).toBe(false);
		expect(result.reason).toContain("false positive");
	});
});
