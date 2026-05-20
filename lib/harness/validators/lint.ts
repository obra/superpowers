import type { ValidationResult } from "../types";
import { runCommand, parseLintErrors } from "../runner";

export async function validateLint(
	cwd: string,
	stack: string,
	timeout: number = 30000,
): Promise<ValidationResult> {
	const start = Date.now();
	const cmdMap: Record<string, string> = {
		"react-nextjs": "npx eslint . --format stylish 2>&1 || true",
		"node-express": "npx eslint . --format stylish 2>&1 || true",
		"node-fastify": "npx eslint . --format stylish 2>&1 || true",
		"node-elysia": "npx biome check . 2>&1 || npx eslint . --format stylish 2>&1 || true",
		"csharp-dotnet": "dotnet format --verify-no-changes 2>&1 || true",
		"csharp-aspnet": "dotnet format --verify-no-changes 2>&1 || true",
		"python-fastapi": "black --check . 2>&1 || true",
		"java-springboot": "mvn checkstyle:check 2>&1 || ./gradlew checkstyleMain 2>&1 || true",
		terraform: "terraform fmt -check -recursive 2>&1 || true",
		"go-std": "gofmt -l . 2>&1 || true",
	};
	const cmd = cmdMap[stack] || 'echo "No lint command configured for stack"';

	const result = await runCommand(cmd, cwd, timeout);
	const errors = parseLintErrors(result.stderr || result.stdout, cwd);
	const warnings = errors.filter((e) => e.severity === "warning");
	const hardErrors = errors.filter((e) => e.severity === "error");

	return {
		passed: hardErrors.length === 0,
		errors: hardErrors,
		warnings: warnings.map((w) => `${w.file}:${w.line} - ${w.message}`),
		duration: Date.now() - start,
	};
}
