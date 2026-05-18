// tests/harness/integration/completeness-e2e.test.ts

import * as fs from 'fs';
import * as path from 'path';
import { verifyCompleteness } from '../../../lib/harness/completeness/verifier';

function makeDir(): string {
  const dir = path.join(__dirname, '..', '..', '..', `tmp-completeness-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanup(dir: string) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

describe('Completeness E2E', () => {
  test('detects missing ACs when only partial implementation exists', async () => {
    const TEST_DIR = makeDir();
    try {
      const spec = `# Auth Feature

AC-1: Return 401 for unauthenticated requests
AC-2: Validate JWT token format and expiry
AC-3: Support role-based access control
AC-4: Log authentication attempts
AC-5: Rate limit login attempts
`;
      fs.writeFileSync(path.join(TEST_DIR, 'spec.md'), spec);

      const srcDir = path.join(TEST_DIR, 'src');
      const testDir = path.join(TEST_DIR, 'tests');
      fs.mkdirSync(srcDir);
      fs.mkdirSync(testDir);

      fs.writeFileSync(path.join(srcDir, 'auth.ts'), `
export function return401ForUnauthenticatedRequests(req: any) { return 401; }
export function validateJwtTokenFormatAndExpiry(token: string) { return true; }
`);
      fs.writeFileSync(path.join(testDir, 'auth.test.ts'), `
test('AC-1: should return 401 for unauthenticated requests', () => {});
test('AC-2: should validate JWT token format and expiry', () => {});
`);

      const report = await verifyCompleteness({
        specPath: path.join(TEST_DIR, 'spec.md'),
        projectRoot: TEST_DIR,
      });

      expect(report.summary.total).toBe(5);
      expect(report.summary.missing).toBeGreaterThanOrEqual(2);
      expect(report.overallStatus).toBe('fail');
      expect(report.summary.score).toBeLessThan(100);
    } finally {
      cleanup(TEST_DIR);
    }
  });

  test('passes when all ACs are implemented', async () => {
    const TEST_DIR = makeDir();
    try {
      const spec = `# Simple Feature

AC-1: Create user with email
AC-2: Delete user by id
`;
      fs.writeFileSync(path.join(TEST_DIR, 'spec.md'), spec);

      const srcDir = path.join(TEST_DIR, 'src');
      const testDir = path.join(TEST_DIR, 'tests');
      fs.mkdirSync(srcDir);
      fs.mkdirSync(testDir);

      fs.writeFileSync(path.join(srcDir, 'users.ts'), `
export function createUserWithEmail(email: string) { /* create */ }
export function deleteUserById(id: string) { /* delete */ }
`);
      fs.writeFileSync(path.join(testDir, 'users.test.ts'), `
test('AC-1: should create user with email', () => {});
test('AC-2: should delete user by id', () => {});
`);

      const report = await verifyCompleteness({
        specPath: path.join(TEST_DIR, 'spec.md'),
        projectRoot: TEST_DIR,
      });

      expect(report.summary.total).toBe(2);
      expect(report.summary.implemented).toBe(2);
      expect(report.summary.missing).toBe(0);
      expect(report.overallStatus).toBe('pass');
      expect(report.summary.score).toBe(100);
    } finally {
      cleanup(TEST_DIR);
    }
  });
});
