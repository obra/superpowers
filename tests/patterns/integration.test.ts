import { PatternCatalog } from '../../lib/patterns/catalog';
import { loadPatternsConfig, resolveWikiPaths, defaultPatternsConfig } from '../../lib/patterns/config';
import { shouldCreatePattern } from '../../lib/patterns/threshold';
import { findRelevantPatterns, detectModuleType } from '../../lib/patterns/matcher';
import { formatPatternsForContext, formatPatternsForReview } from '../../lib/patterns/injector';
import { validatePatterns } from '../../lib/harness/validators/patterns';
import * as fs from 'fs';
import * as path from 'path';

describe('Learning Harness Integration', () => {
  const tmpDir = path.join(__dirname, '..', 'tmp-integration-test');

  beforeEach(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('full flow: create pattern → detect module → inject context → validate', async () => {
    // 1. Config
    const config = defaultPatternsConfig();
    const paths = resolveWikiPaths(config, tmpDir);

    // 2. Catalog
    const catalog = new PatternCatalog(paths.global, paths.project);

    // 3. Create a pattern (simulating capture hook output)
    const thresholdResult = shouldCreatePattern(5, config);
    expect(thresholdResult.shouldCreate).toBe(true);
    expect(thresholdResult.status).toBe('bootstrap');

    catalog.create({
      id: 'react-form-validation',
      category: 'error_pattern',
      module: 'react-components',
      severity: 'high',
      frequency: 1,
      firstSeen: '2026-05-18',
      lastSeen: '2026-05-18',
      projects: ['test-project'],
      status: thresholdResult.status,
      title: 'React Form Missing Validation',
      pattern: 'Forms without validation',
      symptom: 'Missing validation',
      rootCause: 'Happy path focus',
      fix: 'Add Zod validation',
      check: 'input without required',
      checkRegex: '<input(?![^>]*(?:required|pattern))',
      related: [],
    });

    // 4. Detect module type from files
    const files = ['src/components/ContactForm.tsx', 'src/components/Button.tsx'];
    const moduleType = detectModuleType(files);
    expect(moduleType).toBe('react-components');

    // 5. Query relevant patterns
    const allPatterns = catalog.query({ excludeArchived: true });
    const relevant = findRelevantPatterns(allPatterns, moduleType);
    expect(relevant.length).toBe(1);
    expect(relevant[0].id).toBe('react-form-validation');

    // 6. Format for ContextEnvelope
    const contextSection = formatPatternsForContext(relevant);
    expect(contextSection).toContain('Learned Patterns');
    expect(contextSection).toContain('React Form Missing Validation');

    // 7. Format for review checklist
    const reviewChecklist = formatPatternsForReview(relevant);
    expect(reviewChecklist).toContain('Pattern Review Checklist');
    expect(reviewChecklist).toContain('- [ ]');

    // 8. Validate (should pass since no actual source files to grep)
    const validationResult = await validatePatterns(tmpDir, catalog);
    expect(validationResult.violations.length).toBe(0);
    expect(validationResult.passed).toBe(true);
  });

  it('globalWiki false uses project-only paths', () => {
    const config = defaultPatternsConfig();
    config.globalWiki = false;
    const paths = resolveWikiPaths(config, tmpDir);
    expect(paths.global).toBe(paths.project);
  });

  it('wiki index is regenerated with correct counts', () => {
    const config = defaultPatternsConfig();
    const paths = resolveWikiPaths(config, tmpDir);
    const catalog = new PatternCatalog(paths.global, paths.project);

    catalog.create({
      id: 'pattern-a',
      category: 'error_pattern',
      module: 'react-components',
      severity: 'high',
      frequency: 3,
      firstSeen: '2026-05-18',
      lastSeen: '2026-05-18',
      projects: ['proj-a'],
      status: 'promoted',
      title: 'Pattern A',
      pattern: 'A',
      symptom: 'A',
      rootCause: 'A',
      fix: 'A',
      check: 'A',
      related: [],
    });

    catalog.create({
      id: 'pattern-b',
      category: 'good_practice',
      module: 'api-endpoints',
      severity: 'medium',
      frequency: 2,
      firstSeen: '2026-05-18',
      lastSeen: '2026-05-18',
      projects: ['proj-b'],
      status: 'promoted',
      title: 'Pattern B',
      pattern: 'B',
      symptom: 'B',
      rootCause: 'B',
      fix: 'B',
      check: 'B',
      related: [],
    });

    catalog.regenerateIndex();

    const indexPath = path.join(paths.global, 'index.md');
    expect(fs.existsSync(indexPath)).toBe(true);
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    expect(indexContent).toContain('Pattern A');
    expect(indexContent).toContain('Pattern B');
    expect(indexContent).toContain('Total: 2');
  });
});
