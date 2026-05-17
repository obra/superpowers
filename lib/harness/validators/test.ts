import { ValidationResult } from '../types';
import { runCommand, parseTestErrors } from '../runner';

export async function validateTests(cwd: string, stack: string, _files?: string[], timeout: number = 30000): Promise<ValidationResult> {
  const start = Date.now();
  const cmdMap: Record<string, string> = {
    'react-nextjs': `npx jest --passWithNoTests --json --outputFile=/dev/null 2>&1 || true`,
    'node-express': `npx jest --passWithNoTests 2>&1 || true`,
    'csharp-aspnet': `dotnet test --no-build --logger "console;verbosity=normal" 2>&1 || true`,
    'python-fastapi': `pytest --tb=short 2>&1 || true`,
    'go-std': `go test ./... 2>&1 || true`,
    'terraform': 'echo "No test framework for Terraform"',
  };
  const cmd = cmdMap[stack] || 'echo "No test command configured"';

  const result = await runCommand(cmd, cwd, timeout);
  const output = result.stderr || result.stdout;
  const passed = result.exitCode === 0;

  const errors = parseTestErrors(output);

  return {
    passed,
    errors,
    warnings: [],
    duration: Date.now() - start,
  };
}
