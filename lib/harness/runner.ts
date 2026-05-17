import { exec } from 'child_process';
import { promisify } from 'util';
import { ValidationResult, ParsedError } from './types';

const execAsync = promisify(exec);

export async function runCommand(cmd: string, cwd: string, timeout: number = 30000): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd, timeout, maxBuffer: 10 * 1024 * 1024 });
    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.code === 'ETIMEDOUT' ? 124 : (error.status || 1),
    };
  }
}

export function parseLintErrors(output: string, cwd: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const lines = output.split('\n');
  const errorRegex = /(.+?):(\d+):(\d+)\s+(error|warning)\s+(.+)/;

  for (const line of lines) {
    const match = line.match(errorRegex);
    if (match) {
      errors.push({
        file: match[1].startsWith('/') ? match[1] : `${cwd}/${match[1]}`,
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        message: match[5].trim(),
        rule: '',
        severity: match[4] as 'error' | 'warning',
      });
    }
  }
  return errors;
}

export function parseTestErrors(output: string, cwd: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    if (line.includes('FAIL') || line.includes('✗') || line.includes('×')) {
      const fileMatch = line.match(/(.+?):(\d+)/);
      if (fileMatch) {
        errors.push({
          file: fileMatch[1],
          line: parseInt(fileMatch[2]),
          column: 0,
          message: line.trim(),
          rule: 'test-failure',
          severity: 'error',
        });
      }
    }
  }
  return errors;
}

export function compressOutput(output: string, maxLines: number = 50): string {
  const lines = output.split('\n');
  if (lines.length <= maxLines) return output;
  const header = lines.slice(0, 10).join('\n');
  const footer = lines.slice(-10).join('\n');
  const skipped = lines.length - 20;
  return `${header}\n\n[... ${skipped} lines compressed ...]\n\n${footer}`;
}
