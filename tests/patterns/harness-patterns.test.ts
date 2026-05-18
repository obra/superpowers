import { validatePatterns } from '../../lib/harness/validators/patterns';
import { PatternCatalog } from '../../lib/patterns/catalog';
import * as fs from 'fs';
import * as path from 'path';

describe('validatePatterns', () => {
  const tmpDir = path.join(__dirname, '..', 'tmp-harness-patterns');

  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('passes when no error patterns exist', async () => {
    const catalog = new PatternCatalog(tmpDir, tmpDir);
    const result = await validatePatterns(tmpDir, catalog);
    expect(result.passed).toBe(true);
    expect(result.violations.length).toBe(0);
    expect(result.blocking).toBe(false);
  });

  it('blocks when high severity pattern is violated', async () => {
    const catalog = new PatternCatalog(tmpDir, tmpDir);
    catalog.create({
      id: 'test-high-severity',
      category: 'error_pattern',
      module: 'react-components',
      severity: 'high',
      frequency: 5,
      firstSeen: '2026-05-10',
      lastSeen: '2026-05-18',
      projects: ['test-project'],
      status: 'promoted',
      title: 'Test High Severity',
      pattern: 'Test pattern',
      symptom: 'Test symptom',
      rootCause: 'Test cause',
      fix: 'Test fix',
      check: 'input without validation',
      checkRegex: 'input-without-validation-regex',
      related: [],
    });

    const result = await validatePatterns(tmpDir, catalog);
    expect(result.blocking).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBe(1);
    expect(result.violations[0].severity).toBe('high');
  });

  it('warns but does not block for medium severity', async () => {
    const catalog = new PatternCatalog(tmpDir, tmpDir);
    catalog.create({
      id: 'test-medium-severity',
      category: 'error_pattern',
      module: 'react-components',
      severity: 'medium',
      frequency: 2,
      firstSeen: '2026-05-12',
      lastSeen: '2026-05-18',
      projects: ['test-project'],
      status: 'promoted',
      title: 'Test Medium Severity',
      pattern: 'Test pattern',
      symptom: 'Test symptom',
      rootCause: 'Test cause',
      fix: 'Test fix',
      check: 'Test check',
      related: [],
    });

    const result = await validatePatterns(tmpDir, catalog);
    expect(result.blocking).toBe(false);
    expect(result.passed).toBe(true);
    expect(result.violations.length).toBe(1);
  });

  it('includes recurrence info in violation message', async () => {
    const catalog = new PatternCatalog(tmpDir, tmpDir);
    catalog.create({
      id: 'test-recurrence',
      category: 'error_pattern',
      module: 'react-components',
      severity: 'high',
      frequency: 7,
      firstSeen: '2026-05-01',
      lastSeen: '2026-05-18',
      projects: ['proj-a', 'proj-b', 'proj-c'],
      status: 'promoted',
      title: 'Test Recurrence',
      pattern: 'Test pattern',
      symptom: 'Test symptom',
      rootCause: 'Test cause',
      fix: 'Test fix',
      check: 'Test check',
      checkRegex: 'test-recurrence-regex',
      related: [],
    });

    const result = await validatePatterns(tmpDir, catalog);
    expect(result.violations[0].recurrence).toContain('7 times');
    expect(result.violations[0].recurrence).toContain('3 projects');
  });
});
