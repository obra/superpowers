// tests/harness/completeness/implementation-matcher.test.ts

import * as fs from 'fs';
import * as path from 'path';
import { matchAC } from '../../../lib/harness/completeness/implementation-matcher';
import { AcceptanceCriterion } from '../../../lib/harness/completeness/types';

const TEST_DIR = path.join(__dirname, '..', '..', '..', 'tmp-test-harness');

function setup() {
  if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });
}

function teardown() {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

describe('matchAC', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('finds implemented AC when code and test exist', () => {
    const srcDir = path.join(TEST_DIR, 'src');
    const testDir = path.join(TEST_DIR, 'tests');
    fs.mkdirSync(srcDir);
    fs.mkdirSync(testDir);

    fs.writeFileSync(path.join(srcDir, 'auth.ts'), `export function authenticateUser(token: string) { /* validate JWT token */ }`);
    fs.writeFileSync(path.join(testDir, 'auth.test.ts'), `test('AC-1: should authenticate user with valid JWT token', () => {});`);

    const criteria: AcceptanceCriterion[] = [
      { id: 'AC-1', description: 'Authenticate user with valid JWT token', keywords: ['authenticate', 'user', 'jwt', 'token'], type: 'functional' },
    ];

    const results = matchAC(criteria, { projectRoot: TEST_DIR, sourceDirs: ['src'], testDirs: ['tests'], fileExtensions: ['.ts'] });
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('implemented');
    expect(results[0].codeEvidence.found).toBe(true);
    expect(results[0].testEvidence.found).toBe(true);
  });

  test('marks AC as partial when only code exists', () => {
    const srcDir = path.join(TEST_DIR, 'src');
    fs.mkdirSync(srcDir);
    fs.writeFileSync(path.join(srcDir, 'auth.ts'), `export function validateToken(token: string) { }`);

    const criteria: AcceptanceCriterion[] = [
      { id: 'AC-2', description: 'Validate token format and expiry', keywords: ['validate', 'token', 'format', 'expiry'], type: 'functional' },
    ];

    const results = matchAC(criteria, { projectRoot: TEST_DIR, sourceDirs: ['src'], testDirs: ['tests'], fileExtensions: ['.ts'] });
    expect(results[0].status).toBe('partial');
    expect(results[0].gapDescription).toContain('no matching test');
  });

  test('marks AC as missing when no evidence found', () => {
    const srcDir = path.join(TEST_DIR, 'src');
    fs.mkdirSync(srcDir);
    fs.writeFileSync(path.join(srcDir, 'other.ts'), `export function unrelated() { }`);

    const criteria: AcceptanceCriterion[] = [
      { id: 'AC-3', description: 'Implement role-based access control', keywords: ['role', 'access', 'control', 'rbac'], type: 'functional' },
    ];

    const results = matchAC(criteria, { projectRoot: TEST_DIR, sourceDirs: ['src'], testDirs: ['tests'], fileExtensions: ['.ts'] });
    expect(results[0].status).toBe('missing');
  });
});
