import type { ValidationResult } from "../types";
import { runCommand } from "../runner";

export async function validateCoverage(
	cwd: string,
	stack: string,
	minCoverage: number = 80,
	timeout: number = 30000,
): Promise<ValidationResult> {
	const start = Date.now();
	const cmdMap: Record<string, string> = {
		"react-nextjs":
			"npx jest --coverage --coverageReporters=text-summary 2>&1 || true",
		"node-express":
			"npx jest --coverage --coverageReporters=text-summary 2>&1 || true",
		"node-fastify":
			"npx jest --coverage --coverageReporters=text-summary 2>&1 || true",
		"node-elysia": "bun test --coverage 2>&1 || true",
		"csharp-dotnet": 'dotnet test --collect:"XPlat Code Coverage" 2>&1 || true',
		"csharp-aspnet": 'dotnet test --collect:"XPlat Code Coverage" 2>&1 || true',
		"python-fastapi": "pytest --cov=. --cov-report=term-missing 2>&1 || true",
		"java-springboot":
			"mvn jacoco:report 2>&1 || ./gradlew jacocoTestReport 2>&1 || true",
		"go-std":
			"go test -coverprofile=coverage.out && go tool cover -func=coverage.out 2>&1 || true",
		terraform: 'echo "N/A"',
	};
	const cmd = cmdMap[stack] || 'echo "No coverage command configured"';

	const result = await runCommand(cmd, cwd, timeout);
	const output = result.stderr || result.stdout;

	const pctMatch = output.match(/(?:Lines|All files|TOTAL)[:\s]+(\d+\.?\d*)%?/);
	const coverage = pctMatch ? parseFloat(pctMatch[1]) : 0;
	const passed = coverage >= minCoverage;

	return {
		passed,
		errors: passed
			? []
			: [
					{
						file: "",
						line: 0,
						column: 0,
						message: `Coverage ${coverage.toFixed(1)}% below threshold ${minCoverage}%`,
						rule: "coverage",
						severity: "error" as const,
					},
				],
		warnings: [],
		duration: Date.now() - start,
	};
}
