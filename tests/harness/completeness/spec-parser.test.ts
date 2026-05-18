// tests/harness/completeness/spec-parser.test.ts

import * as fs from 'fs';
import * as path from 'path';
import { parseSpec, detectSpecFormat } from '../../../lib/harness/completeness/spec-parser';

const TEST_DIR = path.join(__dirname, '..', '..', '..', 'tmp-test-harness');

function setup() {
  if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });
}

function teardown() {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

describe('parseSpec - numbered format', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('parses AC-1, AC-2 format', () => {
    const spec = `# Auth Middleware\n\nAC-1: Return 401 for unauthenticated requests\nAC-2: Validate JWT token format`;
    fs.writeFileSync(path.join(TEST_DIR, 'spec.md'), spec);
    const result = parseSpec(path.join(TEST_DIR, 'spec.md'));
    expect(result.criteria).toHaveLength(2);
    expect(result.criteria[0].id).toBe('AC-1');
    expect(result.criteria[1].id).toBe('AC-2');
  });

  test('parses numbered list format', () => {
    const spec = `# Feature\n\n1. User can login with email\n2. User can reset password`;
    fs.writeFileSync(path.join(TEST_DIR, 'spec.md'), spec);
    const result = parseSpec(path.join(TEST_DIR, 'spec.md'));
    expect(result.criteria).toHaveLength(2);
    expect(result.criteria[0].id).toBe('AC-1');
  });
});

describe('parseSpec - checklist format', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('parses checklist items', () => {
    const spec = `# Tasks\n\n- [ ] Implement login endpoint\n- [ ] Add password validation`;
    fs.writeFileSync(path.join(TEST_DIR, 'spec.md'), spec);
    const result = parseSpec(path.join(TEST_DIR, 'spec.md'));
    expect(result.criteria).toHaveLength(2);
    expect(result.criteria[0].description).toBe('Implement login endpoint');
  });
});

describe('detectSpecFormat', () => {
  test('detects numbered format', () => {
    expect(detectSpecFormat('AC-1: Do something')).toBe('numbered');
  });

  test('detects gherkin format', () => {
    expect(detectSpecFormat('Given user is logged in\nWhen they click save\nThen data is persisted')).toBe('gherkin');
  });

  test('detects checklist format', () => {
    expect(detectSpecFormat('- [ ] Task one\n- [ ] Task two')).toBe('checklist');
  });
});
