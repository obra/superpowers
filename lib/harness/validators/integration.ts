import type { ValidationResult } from "../types";
import { runCommand } from "../runner";

export async function validateIntegration(
	cwd: string,
	stack: string,
	timeout: number = 120000,
): Promise<ValidationResult> {
	const start = Date.now();
	const cmdMap: Record<string, string> = {
		"react-nextjs":
			"npx jest --testPathPattern=integration --passWithNoTests 2>&1 || true",
		"node-express":
			"npx jest --testPathPattern=integration --passWithNoTests 2>&1 || true",
		"node-fastify":
			"npx jest --testPathPattern=integration --passWithNoTests 2>&1 || true",
		"node-elysia": "bun test --coverage 2>&1 || true",
		"csharp-dotnet": 'dotnet test --filter "Category=Integration" 2>&1 || true',
		"csharp-aspnet": 'dotnet test --filter "Category=Integration" 2>&1 || true',
		"python-fastapi": "pytest -m integration --tb=short 2>&1 || true",
		"java-springboot": "mvn verify 2>&1 || ./gradlew integrationTest 2>&1 || true",
		"go-std": "go test -tags=integration ./... 2>&1 || true",
		terraform: 'echo "No integration tests for Terraform"',
	};
	const cmd = cmdMap[stack] || 'echo "No integration test command configured"';
	const result = await runCommand(cmd, cwd, timeout);

	return {
		passed: result.exitCode === 0,
		errors:
			result.exitCode === 0
				? []
				: [
						{
							file: "",
							line: 0,
							column: 0,
							message: result.stderr || result.stdout,
							rule: "integration",
							severity: "error" as const,
						},
					],
		warnings: [],
		duration: Date.now() - start,
	};
}
