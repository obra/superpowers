import * as fs from 'fs';
import * as path from 'path';
import { loadProjectConfig, loadWorkspaceConfig, isWorkspaceMode, getProjects } from '../../lib/harness/config';

const TEST_DIR = path.join(__dirname, '..', '..', 'tmp-test-harness');

function setup() {
  if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });
}

function teardown() {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

describe('loadProjectConfig', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('returns default config when no file exists', () => {
    const config = loadProjectConfig(TEST_DIR);
    expect(config.coverageMin).toBe(80);
    expect(config.securityScan.enabled).toBe(true);
  });

  test('merges user config with defaults', () => {
    fs.writeFileSync(
      path.join(TEST_DIR, '.harness.config.json'),
      JSON.stringify({ coverageMin: 90 })
    );
    const config = loadProjectConfig(TEST_DIR);
    expect(config.coverageMin).toBe(90);
    expect(config.securityScan.enabled).toBe(true);
  });
});

describe('loadWorkspaceConfig', () => {
  beforeEach(setup);
  afterEach(teardown);

  test('returns null when no file exists', () => {
    expect(loadWorkspaceConfig(TEST_DIR)).toBeNull();
  });

  test('parses workspace mode config', () => {
    const wsConfig = {
      version: '1', generated: '2026-05-17', lastScan: '2026-05-17',
      projects: [{ path: 'frontend', stack: 'react-nextjs' }],
      workspaceConfig: { autoRescan: true, reportPath: '.harness/reports' },
    };
    fs.writeFileSync(path.join(TEST_DIR, '.harness-workspace.json'), JSON.stringify(wsConfig));
    const loaded = loadWorkspaceConfig(TEST_DIR);
    expect(isWorkspaceMode(loaded!)).toBe(true);
    expect(getProjects(loaded!)).toHaveLength(1);
  });

  test('parses project mode config', () => {
    const projConfig = {
      version: '1', generated: '2026-05-17',
      projectRoot: '.', stack: 'react-nextjs', config: './.harness.config.json',
    };
    fs.writeFileSync(path.join(TEST_DIR, '.harness-workspace.json'), JSON.stringify(projConfig));
    const loaded = loadWorkspaceConfig(TEST_DIR);
    expect(isWorkspaceMode(loaded!)).toBe(false);
    expect(getProjects(loaded!)).toHaveLength(1);
    expect(getProjects(loaded!)[0].stack).toBe('react-nextjs');
  });
});
