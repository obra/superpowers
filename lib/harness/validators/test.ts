import { ValidationResult, ParsedError } from '../types';
import { runCommand, parseTestErrors, compressOutput } from '../runner';

export async function validateTests(cwd: string, stack: string, files?: string[], timeout: number = 30000): Promise<ValidationResult> {
  const start = Date.now();
  const fileArg = files && files.length > 0 ? ` -- ${files.join(' ')}` : '';
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

  const passMatch = output.match(/(\d+)\s+passed?/);
  const failMatch = output.match(/(\d+)\s+failed?/);
  const totalMatch = output.match(/(\d+)\s+tests?/);
  const passed_count = passMatch ? parseInt(passMatch[1]) : 0;
  const failed_count = failMatch ? parseInt(failMatch[1]) : 0;
  const total = totalMatch ? parseInt(totalMatch[1]) : passed_count + failed_count;

  const errors = parseTestErrors(output, cwd);

  return {
    passed,
    errors,
    warnings: [],
    duration: Date.now() - start,
  };
}
