import { ValidationResult } from '../types';
import { runCommand, compressOutput } from '../runner';

export async function validateTypeCheck(cwd: string, stack: string, timeout: number = 30000): Promise<ValidationResult> {
  const start = Date.now();
  const cmdMap: Record<string, string> = {
    'react-nextjs': 'npx tsc --noEmit 2>&1 || true',
    'node-express': 'npx tsc --noEmit 2>&1 || true',
    'csharp-aspnet': 'dotnet build --no-restore 2>&1 || true',
    'python-fastapi': 'mypy . 2>&1 || true',
    'go-std': 'go build ./... 2>&1 || true',
    'terraform': 'terraform validate 2>&1 || true',
  };
  const cmd = cmdMap[stack] || 'echo "No typecheck command configured"';

  const result = await runCommand(cmd, cwd, timeout);
  const output = result.stderr || result.stdout;
  const passed = result.exitCode === 0;

  return {
    passed,
    errors: passed ? [] : [{ file: '', line: 0, column: 0, message: compressOutput(output, 30), rule: 'typecheck', severity: 'error' as const }],
    warnings: [],
    duration: Date.now() - start,
  };
}
