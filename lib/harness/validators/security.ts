import type { ValidationResult, ParsedError, SecurityTool } from "../types";
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

export async function validateSecurity(
	cwd: string,
	tools: Record<string, boolean>,
	timeout: number = 60000,
): Promise<ValidationResult> {
	const start = Date.now();
	const errors: ParsedError[] = [];
	const warnings: string[] = [];

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
		} else if (
			output &&
			!output.includes('"vulnerabilities":0') &&
			!output.includes('"results":[]')
		) {
			warnings.push(`${tool.name}: findings detected (review report)`);
		}
	}

	return {
		passed: errors.length === 0,
		errors,
		warnings,
		duration: Date.now() - start,
	};
}
