import { PatternLinter } from '../../lib/patterns/linter';
import { PatternCatalog } from '../../lib/patterns/catalog';
import type { PatternsConfig, WikiPaths } from '../../lib/patterns/types';
import * as fs from 'fs';
import * as path from 'path';

describe('PatternLinter', () => {
  const tmpDir = path.join(__dirname, '..', 'tmp-linter-test');
  let catalog: PatternCatalog;
  let paths: WikiPaths;
  let config: PatternsConfig;

  const sampleEntry = {
    id: 'test-pattern',
    category: 'error_pattern' as const,
    module: 'react-components',
    severity: 'high' as const,
    frequency: 1,
    firstSeen: '2026-05-18',
    lastSeen: '2026-05-18',
    projects: ['test-project'],
    status: 'promoted' as const,
    title: 'Test Pattern',
    pattern: 'Test',
    symptom: 'Test',
    rootCause: 'Test',
    fix: 'Test',
    check: 'Test',
    related: [],
  };

  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    catalog = new PatternCatalog(tmpDir, tmpDir);
    paths = { global: tmpDir, project: tmpDir };
    config = {
      enabled: true,
      globalWiki: true,
      globalPath: tmpDir,
      bootstrapThreshold: 10,
      recurrenceThreshold: { minFrequency: 3, minProjects: 2 },
      staleness: { reviewDays: 30, archiveDays: 90 },
    };
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reports no issues for healthy wiki', async () => {
    catalog.create(sampleEntry);
    const linter = new PatternLinter(catalog, paths, config);
    const report = await linter.run();
    expect(report.contradictions.length).toBe(0);
    expect(report.stale.length).toBe(0);
    expect(report.hasCritical).toBe(false);
  });

  it('detects stale patterns', async () => {
    const staleEntry = {
      ...sampleEntry,
      id: 'stale-pattern',
      lastSeen: '2025-01-01',
    };
    catalog.create(staleEntry);
    const linter = new PatternLinter(catalog, paths, config);
    const report = await linter.run();
    expect(report.stale.length).toBe(1);
    expect(report.stale[0].id).toBe('stale-pattern');
  });

  it('detects bootstrap patterns pending review', async () => {
    const bootstrapEntry = {
      ...sampleEntry,
      id: 'bootstrap-pattern',
      status: 'bootstrap' as const,
      firstSeen: '2026-04-01',
    };
    catalog.create(bootstrapEntry);
    const linter = new PatternLinter(catalog, paths, config);
    const report = await linter.run();
    expect(report.bootstrapReview.length).toBe(1);
  });
});
