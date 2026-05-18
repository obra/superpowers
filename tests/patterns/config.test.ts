import { loadPatternsConfig, resolveWikiPaths, defaultPatternsConfig } from '../../lib/patterns/config';
import * as fs from 'fs';
import * as path from 'path';

describe('loadPatternsConfig', () => {
  const tmpDir = path.join(__dirname, '..', 'tmp-config-test');

  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns defaults when no .harness.config.json exists', () => {
    const config = loadPatternsConfig(tmpDir);
    expect(config.enabled).toBe(true);
    expect(config.globalWiki).toBe(true);
    expect(config.bootstrapThreshold).toBe(10);
    expect(config.recurrenceThreshold.minFrequency).toBe(3);
    expect(config.recurrenceThreshold.minProjects).toBe(2);
    expect(config.staleness.reviewDays).toBe(30);
    expect(config.staleness.archiveDays).toBe(90);
  });

  it('merges patterns section from .harness.config.json', () => {
    const harnessConfig = {
      patterns: {
        enabled: false,
        globalWiki: false,
        bootstrapThreshold: 5,
      },
    };
    fs.writeFileSync(
      path.join(tmpDir, '.harness.config.json'),
      JSON.stringify(harnessConfig),
    );
    const config = loadPatternsConfig(tmpDir);
    expect(config.enabled).toBe(false);
    expect(config.globalWiki).toBe(false);
    expect(config.bootstrapThreshold).toBe(5);
    expect(config.recurrenceThreshold.minFrequency).toBe(3);
  });

  it('resolves globalPath with ~ expansion', () => {
    const config = loadPatternsConfig(tmpDir);
    expect(config.globalPath).toContain('.superpowers');
    expect(config.globalPath).not.toContain('~');
  });
});

describe('resolveWikiPaths', () => {
  const tmpDir = path.join(__dirname, '..', 'tmp-paths-test');

  afterEach(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns same path for global and project when globalWiki is false', () => {
    const config = defaultPatternsConfig();
    config.globalWiki = false;
    const paths = resolveWikiPaths(config, tmpDir);
    expect(paths.global).toBe(paths.project);
    expect(paths.project).toContain(tmpDir);
  });

  it('returns separate paths when globalWiki is true', () => {
    const config = defaultPatternsConfig();
    config.globalWiki = true;
    const paths = resolveWikiPaths(config, tmpDir);
    expect(paths.global).not.toBe(paths.project);
    expect(paths.global).toContain('.superpowers');
    expect(paths.project).toContain(tmpDir);
  });
});
