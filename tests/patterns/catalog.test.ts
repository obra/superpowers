import { PatternCatalog } from '../../lib/patterns/catalog';
import * as fs from 'fs';
import * as path from 'path';

describe('PatternCatalog', () => {
  const tmpDir = path.join(__dirname, '..', 'tmp-catalog-test');
  let catalog: PatternCatalog;

  const sampleEntry = {
    id: 'test-error-pattern',
    category: 'error_pattern' as const,
    module: 'react-components',
    severity: 'high' as const,
    frequency: 1,
    firstSeen: '2026-05-18',
    lastSeen: '2026-05-18',
    projects: ['test-project'],
    status: 'promoted' as const,
    title: 'Test Error Pattern',
    pattern: 'Test pattern description',
    symptom: 'Test symptom',
    rootCause: 'Test root cause',
    fix: 'Test fix',
    check: 'Test check',
    related: [],
  };

  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    catalog = new PatternCatalog(tmpDir, tmpDir);
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates a pattern entry', () => {
    catalog.create(sampleEntry);
    const entryPath = path.join(tmpDir, 'errors', 'test-error-pattern.md');
    expect(fs.existsSync(entryPath)).toBe(true);
  });

  it('reads a pattern entry back', () => {
    catalog.create(sampleEntry);
    const entry = catalog.getById('test-error-pattern');
    expect(entry).not.toBeNull();
    expect(entry!.title).toBe('Test Error Pattern');
    expect(entry!.severity).toBe('high');
  });

  it('updates an existing pattern', () => {
    catalog.create(sampleEntry);
    catalog.update('test-error-pattern', { frequency: 5, lastSeen: '2026-05-20' });
    const entry = catalog.getById('test-error-pattern');
    expect(entry!.frequency).toBe(5);
    expect(entry!.lastSeen).toBe('2026-05-20');
  });

  it('increments frequency and updates projects', () => {
    catalog.create(sampleEntry);
    catalog.incrementFrequency('test-error-pattern', 'another-project');
    const entry = catalog.getById('test-error-pattern');
    expect(entry!.frequency).toBe(2);
    expect(entry!.projects).toContain('another-project');
  });

  it('queries patterns by module', () => {
    const entry2 = { ...sampleEntry, id: 'another-pattern', module: 'api-endpoints' };
    catalog.create(sampleEntry);
    catalog.create(entry2);
    const results = catalog.query({ module: 'react-components' });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('test-error-pattern');
  });

  it('queries patterns by category', () => {
    const practiceEntry = {
      ...sampleEntry,
      id: 'test-practice',
      category: 'good_practice' as const,
    };
    catalog.create(sampleEntry);
    catalog.create(practiceEntry);
    const results = catalog.query({ categories: ['good_practice'] });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('test-practice');
  });

  it('excludes archived patterns by default', () => {
    const archivedEntry = { ...sampleEntry, id: 'archived-pattern', status: 'archived' as const };
    catalog.create(sampleEntry);
    catalog.create(archivedEntry);
    const results = catalog.query({ excludeArchived: true });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('test-error-pattern');
  });

  it('counts total non-archived patterns', () => {
    catalog.create(sampleEntry);
    catalog.create({ ...sampleEntry, id: 'second-pattern' });
    catalog.create({ ...sampleEntry, id: 'archived', status: 'archived' as const });
    expect(catalog.countTotal()).toBe(2);
  });

  it('regenerates index with correct counts', () => {
    catalog.create(sampleEntry);
    catalog.create({ ...sampleEntry, id: 'second-pattern' });
    catalog.regenerateIndex();
    const indexPath = path.join(tmpDir, 'index.md');
    expect(fs.existsSync(indexPath)).toBe(true);
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    expect(indexContent).toContain('test-error-pattern');
    expect(indexContent).toContain('Total: 2');
  });

  it('supersedes old pattern with new one', () => {
    catalog.create(sampleEntry);
    catalog.create({ ...sampleEntry, id: 'new-pattern', title: 'New Pattern' });
    catalog.supersede('test-error-pattern', 'new-pattern');
    const old = catalog.getById('test-error-pattern');
    expect(old!.status).toBe('archived');
    expect(old!.supersededBy).toBe('new-pattern');
  });
});
