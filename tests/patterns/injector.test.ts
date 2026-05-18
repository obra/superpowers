import { formatPatternsForContext, formatPatternsForReview } from '../../lib/patterns/injector';
import type { PatternEntry } from '../../lib/patterns/types';

describe('formatPatternsForContext', () => {
  const patterns: PatternEntry[] = [
    {
      id: 'react-form-validation',
      category: 'error_pattern',
      module: 'react-components',
      severity: 'high',
      frequency: 5,
      firstSeen: '2026-05-10',
      lastSeen: '2026-05-17',
      projects: ['proj-a', 'proj-b'],
      status: 'promoted',
      title: 'React Form Missing Validation',
      pattern: 'Forms without validation',
      symptom: 'User reports missing validation',
      rootCause: 'Happy path focus',
      fix: 'Add Zod validation',
      check: 'input without required',
      related: [],
    },
    {
      id: 'form-sanitization',
      category: 'good_practice',
      module: 'react-components',
      severity: 'medium',
      frequency: 3,
      firstSeen: '2026-05-12',
      lastSeen: '2026-05-16',
      projects: ['proj-a'],
      status: 'promoted',
      title: 'Form Input Sanitization',
      pattern: 'Sanitize all inputs',
      symptom: 'N/A',
      rootCause: 'N/A',
      fix: 'Use Zod transform',
      check: 'Use Zod schema',
      related: [],
    },
  ];

  it('formats patterns for subagent context', () => {
    const result = formatPatternsForContext(patterns);
    expect(result).toContain('Learned Patterns');
    expect(result).toContain('React Form Missing Validation');
    expect(result).toContain('apply these proactively');
    expect(result).toContain('5 times across 2 projects');
  });

  it('returns empty string when no patterns', () => {
    const result = formatPatternsForContext([]);
    expect(result).toBe('');
  });

  it('includes check information', () => {
    const result = formatPatternsForContext(patterns);
    expect(result).toContain('Add Zod validation');
  });
});

describe('formatPatternsForReview', () => {
  const patterns: PatternEntry[] = [
    {
      id: 'react-form-validation',
      category: 'error_pattern',
      module: 'react-components',
      severity: 'high',
      frequency: 5,
      firstSeen: '2026-05-10',
      lastSeen: '2026-05-17',
      projects: ['proj-a'],
      status: 'promoted',
      title: 'React Form Missing Validation',
      pattern: 'Forms without validation',
      symptom: 'Missing validation',
      rootCause: 'Happy path',
      fix: 'Add validation',
      check: 'input without required',
      related: [],
    },
  ];

  it('formats patterns as review checklist', () => {
    const result = formatPatternsForReview(patterns);
    expect(result).toContain('Pattern Review Checklist');
    expect(result).toContain('- [ ]');
    expect(result).toContain('React Form Missing Validation');
  });

  it('returns empty string when no patterns', () => {
    const result = formatPatternsForReview([]);
    expect(result).toBe('');
  });
});
