// tests/harness/integration/drift-e2e.test.ts

import * as fs from 'fs';
import * as path from 'path';
import { analyzeDrift } from '../../../lib/harness/drift/analyzer';

function makeDir(): string {
  const dir = path.join(__dirname, '..', '..', '..', `tmp-drift-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanup(dir: string) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

describe('Drift E2E', () => {
  test('detects critical drift when most ACs are missing', () => {
    const TEST_DIR = makeDir();
    try {
      const spec = `# Auth Feature

AC-1: Return 401 for unauthenticated requests
AC-2: Validate JWT token signature and expiry
AC-3: Support role-based access control
AC-4: Log authentication attempts with user context
`;
      fs.writeFileSync(path.join(TEST_DIR, 'spec.md'), spec);

      const srcDir = path.join(TEST_DIR, 'src');
      fs.mkdirSync(srcDir);
      fs.writeFileSync(path.join(srcDir, 'auth.ts'), `
export function return401ForUnauthenticatedRequests(req: any) { return 401; }
`);

      const report = analyzeDrift({
        specPath: path.join(TEST_DIR, 'spec.md'),
        projectRoot: TEST_DIR,
      });

      expect(report.summary.missing).toBeGreaterThanOrEqual(2);
      expect(report.summary.healthScore).toBeLessThan(50);
      expect(report.overallStatus).toBe('critical-drift');
    } finally {
      cleanup(TEST_DIR);
    }
  });

  test('reports aligned when implementation matches spec', () => {
    const TEST_DIR = makeDir();
    try {
      const spec = `# Simple Feature

AC-1: Create user with email and password
AC-2: Validate email format before creation
`;
      fs.writeFileSync(path.join(TEST_DIR, 'spec.md'), spec);

      const srcDir = path.join(TEST_DIR, 'src');
      fs.mkdirSync(srcDir);
      fs.writeFileSync(path.join(srcDir, 'users.ts'), `
export function createUserWithEmailAndPassword(email: string, password: string) { /* create user */ }
export function validateEmailFormatBeforeCreation(email: string) { /* validate */ }
`);

      const report = analyzeDrift({
        specPath: path.join(TEST_DIR, 'spec.md'),
        projectRoot: TEST_DIR,
      });

      expect(report.summary.aligned).toBeGreaterThanOrEqual(1);
      expect(report.summary.missing).toBe(0);
    } finally {
      cleanup(TEST_DIR);
    }
  });
});
