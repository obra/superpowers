import type { ValidationResult } from "../types";
import { runCommand, compressOutput } from "../runner";

export async function validateDomainSpecific(
	cwd: string,
	stack: string,
	domain: "frontend" | "backend" | "infra",
	config: Record<string, any>,
	timeout: number = 120000,
): Promise<ValidationResult> {
	const start = Date.now();
	const errors: string[] = [];
	const warnings: string[] = [];

	if (
		domain === "frontend" &&
		(stack === "react-nextjs" || stack === "node-express")
	) {
		if (config.lighthouse?.enabled) {
			const budget = config.lighthouse.budget?.performance || 90;
			const cmd = `npx lhci autorun --collect.url=http://localhost:3000 2>&1 || true`;
			const result = await runCommand(cmd, cwd, timeout);
			if (result.exitCode !== 0)
				warnings.push(
					`Lighthouse: review output for performance score (target: ${budget})`,
				);
		}
	}

	if (domain === "infra" && stack === "terraform") {
		if (config.tflint) {
			const cmd = "tflint --format=json 2>&1 || true";
			const result = await runCommand(cmd, cwd, timeout);
			if (result.exitCode !== 0)
				errors.push(
					`TFLint: ${compressOutput(result.stderr || result.stdout, 20)}`,
				);
		}
	}

	return {
		passed: errors.length === 0,
		errors: errors.map((e) => ({
			file: "",
			line: 0,
			column: 0,
			message: e,
			rule: "domain-specific",
			severity: "error" as const,
		})),
		warnings,
		duration: Date.now() - start,
	};
}
