import {
	parseReviewerResponse,
	determineReviewerAction,
	formatReviewerDecisionMarkdown,
} from "../../../lib/harness/reviewers/parser";
import type { ReviewerDecision } from "../../../lib/harness/types";

describe("parseReviewerResponse", () => {
	test("parses response with decision markers", () => {
		const response = `Some analysis text

<!-- REVIEWER_DECISION -->
\`\`\`json
{
  "harness_action": "BLOCK",
  "metrics": {
    "total_findings": 2,
    "critical_high_count": 1
  },
  "asi_target": {
    "file": "src/auth.ts",
    "line": 42,
    "issue_summary": "Missing input validation",
    "fix_instruction": "Add zod validation schema"
  },
  "findings": [
    {
      "severity": "High",
      "file": "src/auth.ts",
      "line": 42,
      "issue": "Missing input validation",
      "suggestion": "Add zod schema validation"
    }
  ]
}
\`\`\`
<!-- /REVIEWER_DECISION -->`;

		const result = parseReviewerResponse(response);
		expect(result).not.toBeNull();
		expect(result!.harness_action).toBe("BLOCK");
		expect(result!.metrics.total_findings).toBe(2);
		expect(result!.metrics.critical_high_count).toBe(1);
		expect(result!.asi_target).not.toBeNull();
		expect(result!.asi_target!.file).toBe("src/auth.ts");
		expect(result!.findings).toHaveLength(1);
	});

	test("parses response with bare JSON block (no markers)", () => {
		const response = `\`\`\`json
{
  "harness_action": "APPROVE",
  "metrics": {
    "total_findings": 0,
    "critical_high_count": 0
  },
  "asi_target": null,
  "findings": []
}
\`\`\``;

		const result = parseReviewerResponse(response);
		expect(result).not.toBeNull();
		expect(result!.harness_action).toBe("APPROVE");
	});

	test("returns null for invalid JSON", () => {
		const response = `<!-- REVIEWER_DECISION -->
\`\`\`json
{ invalid json }
\`\`\`
<!-- /REVIEWER_DECISION -->`;

		const result = parseReviewerResponse(response);
		expect(result).toBeNull();
	});

	test("returns null for missing markers and no JSON", () => {
		const response = "Just some plain text analysis";
		const result = parseReviewerResponse(response);
		expect(result).toBeNull();
	});

	test("returns null for invalid harness_action", () => {
		const response = `\`\`\`json
{
  "harness_action": "INVALID_ACTION",
  "metrics": {
    "total_findings": 0,
    "critical_high_count": 0
  },
  "asi_target": null,
  "findings": []
}
\`\`\``;

		const result = parseReviewerResponse(response);
		expect(result).toBeNull();
	});

	test("returns null for missing metrics", () => {
		const response = `\`\`\`json
{
  "harness_action": "APPROVE",
  "asi_target": null,
  "findings": []
}
\`\`\``;

		const result = parseReviewerResponse(response);
		expect(result).toBeNull();
	});

	test("parses NEEDS_HUMAN_REVIEW action", () => {
		const response = `\`\`\`json
{
  "harness_action": "NEEDS_HUMAN_REVIEW",
  "metrics": {
    "total_findings": 3,
    "critical_high_count": 0
  },
  "asi_target": null,
  "findings": [
    {
      "severity": "Medium",
      "file": "src/config.ts",
      "line": 10,
      "issue": "Configuration needs review",
      "suggestion": "Verify settings"
    }
  ]
}
\`\`\``;

		const result = parseReviewerResponse(response);
		expect(result).not.toBeNull();
		expect(result!.harness_action).toBe("NEEDS_HUMAN_REVIEW");
	});

	test("ignores invalid findings", () => {
		const response = `\`\`\`json
{
  "harness_action": "BLOCK",
  "metrics": {
    "total_findings": 1,
    "critical_high_count": 1
  },
  "asi_target": null,
  "findings": [
    {
      "severity": "Invalid",
      "file": "src/test.ts",
      "line": 1,
      "issue": "Bad finding",
      "suggestion": "Fix it"
    },
    {
      "severity": "Critical",
      "file": "src/auth.ts",
      "line": 5,
      "issue": "SQL injection",
      "suggestion": "Use parameterized queries"
    }
  ]
}
\`\`\``;

		const result = parseReviewerResponse(response);
		expect(result).not.toBeNull();
		expect(result!.findings).toHaveLength(1);
		expect(result!.findings[0].severity).toBe("Critical");
	});
});

describe("determineReviewerAction", () => {
	test("returns APPROVE when decision is null", () => {
		const result = determineReviewerAction(null, "error");
		expect(result.action).toBe("APPROVE");
		expect(result.blocked).toBe(false);
	});

	test("returns BLOCK for BLOCK decision", () => {
		const decision: ReviewerDecision = {
			harness_action: "BLOCK",
			metrics: { total_findings: 2, critical_high_count: 1 },
			asi_target: null,
			findings: [],
		};
		const result = determineReviewerAction(decision, "error");
		expect(result.action).toBe("BLOCK");
		expect(result.blocked).toBe(true);
		expect(result.reason).toContain("critical/high");
	});

	test("returns NEEDS_HUMAN_REVIEW with blocked=true for error failOn", () => {
		const decision: ReviewerDecision = {
			harness_action: "NEEDS_HUMAN_REVIEW",
			metrics: { total_findings: 3, critical_high_count: 0 },
			asi_target: null,
			findings: [],
		};
		const result = determineReviewerAction(decision, "error");
		expect(result.action).toBe("NEEDS_HUMAN_REVIEW");
		expect(result.blocked).toBe(true);
	});

	test("returns NEEDS_HUMAN_REVIEW with blocked=true for human_review failOn", () => {
		const decision: ReviewerDecision = {
			harness_action: "NEEDS_HUMAN_REVIEW",
			metrics: { total_findings: 1, critical_high_count: 0 },
			asi_target: null,
			findings: [],
		};
		const result = determineReviewerAction(decision, "human_review");
		expect(result.action).toBe("NEEDS_HUMAN_REVIEW");
		expect(result.blocked).toBe(true);
	});

	test("returns NEEDS_HUMAN_REVIEW with blocked=false for warning failOn", () => {
		const decision: ReviewerDecision = {
			harness_action: "NEEDS_HUMAN_REVIEW",
			metrics: { total_findings: 2, critical_high_count: 0 },
			asi_target: null,
			findings: [],
		};
		const result = determineReviewerAction(decision, "warning");
		expect(result.action).toBe("NEEDS_HUMAN_REVIEW");
		expect(result.blocked).toBe(false);
	});

	test("returns APPROVE for APPROVE decision", () => {
		const decision: ReviewerDecision = {
			harness_action: "APPROVE",
			metrics: { total_findings: 1, critical_high_count: 0 },
			asi_target: null,
			findings: [],
		};
		const result = determineReviewerAction(decision, "error");
		expect(result.action).toBe("APPROVE");
		expect(result.blocked).toBe(false);
		expect(result.reason).toContain("approved");
	});
});

describe("formatReviewerDecisionMarkdown", () => {
	test("formats APPROVE decision", () => {
		const decision: ReviewerDecision = {
			harness_action: "APPROVE",
			metrics: { total_findings: 0, critical_high_count: 0 },
			asi_target: null,
			findings: [],
		};
		const markdown = formatReviewerDecisionMarkdown(decision);
		expect(markdown).toContain("Code Review Decision");
		expect(markdown).toContain("APPROVE");
		expect(markdown).toContain("**Total findings:** 0");
	});

	test("formats BLOCK decision with findings", () => {
		const decision: ReviewerDecision = {
			harness_action: "BLOCK",
			metrics: { total_findings: 2, critical_high_count: 1 },
			asi_target: {
				file: "src/auth.ts",
				line: 42,
				issue_summary: "SQL injection",
				fix_instruction: "Use parameterized queries",
			},
			findings: [
				{
					severity: "Critical",
					file: "src/auth.ts",
					line: 42,
					issue: "SQL injection vulnerability",
					suggestion: "Use parameterized queries",
				},
				{
					severity: "Medium",
					file: "src/config.ts",
					line: 10,
					issue: "Missing error handling",
					suggestion: "Add try-catch",
				},
			],
		};
		const markdown = formatReviewerDecisionMarkdown(decision);
		expect(markdown).toContain("BLOCK");
		expect(markdown).toContain("**Total findings:** 2");
		expect(markdown).toContain("**Critical/High:** 1");
		expect(markdown).toContain("ASI (Auto-Fix Entry Point)");
		expect(markdown).toContain("src/auth.ts:42");
		expect(markdown).toContain("SQL injection");
		expect(markdown).toContain("Findings");
		expect(markdown).toContain("[Critical]");
		expect(markdown).toContain("[Medium]");
	});

	test("formats NEEDS_HUMAN_REVIEW decision", () => {
		const decision: ReviewerDecision = {
			harness_action: "NEEDS_HUMAN_REVIEW",
			metrics: { total_findings: 1, critical_high_count: 0 },
			asi_target: null,
			findings: [],
		};
		const markdown = formatReviewerDecisionMarkdown(decision);
		expect(markdown).toContain("NEEDS_HUMAN_REVIEW");
	});
});
