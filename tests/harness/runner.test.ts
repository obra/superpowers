import { parseLintErrors, parseTestErrors, compressOutput } from '../../lib/harness/runner';

describe('parseLintErrors', () => {
  test('parses ESLint-style errors', () => {
    const output = 'src/auth.ts:42:5 error Missing semicolon semi\nsrc/auth.ts:10:1 warning Unused import no-unused-vars';
    const errors = parseLintErrors(output, '/project');
    expect(errors).toHaveLength(2);
    expect(errors[0].file).toBe('/project/src/auth.ts');
    expect(errors[0].line).toBe(42);
    expect(errors[0].severity).toBe('error');
    expect(errors[1].severity).toBe('warning');
  });

  test('returns empty array for clean output', () => {
    expect(parseLintErrors('No errors found.', '/project')).toEqual([]);
  });
});

describe('compressOutput', () => {
  test('does not compress short output', () => {
    const output = 'line 1\nline 2\nline 3';
    expect(compressOutput(output)).toBe(output);
  });

  test('compresses long output', () => {
    const lines = Array.from({ length: 100 }, (_, i) => `line ${i}`);
    const output = lines.join('\n');
    const compressed = compressOutput(output);
    expect(compressed).toContain('compressed');
    expect(compressed.split('\n').length).toBeLessThan(output.split('\n').length);
  });
});
