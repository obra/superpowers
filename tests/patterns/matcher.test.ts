import { findRelevantPatterns, detectModuleType } from '../../lib/patterns/matcher';
import type { PatternEntry } from '../../lib/patterns/types';

describe('findRelevantPatterns', () => {
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
      id: 'api-error-handling',
      category: 'error_pattern',
      module: 'api-endpoints',
      severity: 'high',
      frequency: 3,
      firstSeen: '2026-05-12',
      lastSeen: '2026-05-16',
      projects: ['proj-a'],
      status: 'promoted',
      title: 'API No Error Handling',
      pattern: 'Endpoints without try/catch',
      symptom: '500 errors on edge cases',
      rootCause: 'No error boundaries',
      fix: 'Add error handling middleware',
      check: 'route without try/catch',
      related: [],
    },
    {
      id: 'memo-overuse',
      category: 'good_practice',
      module: 'react-components',
      severity: 'low',
      frequency: 2,
      firstSeen: '2026-05-14',
      lastSeen: '2026-05-15',
      projects: ['proj-c'],
      status: 'pending',
      title: 'useMemo Overuse',
      pattern: 'Excessive useMemo',
      symptom: 'Code complexity',
      rootCause: 'Premature optimization',
      fix: 'Only memoize expensive computations',
      check: 'useMemo on simple values',
      related: [],
    },
  ];

  it('finds patterns matching module type', () => {
    const results = findRelevantPatterns(patterns, 'react-components');
    expect(results.length).toBe(2);
    expect(results.map(r => r.id)).toContain('react-form-validation');
    expect(results.map(r => r.id)).toContain('memo-overuse');
  });

  it('excludes archived patterns', () => {
    const withArchived = [...patterns, {
      ...patterns[0],
      id: 'archived-pattern',
      status: 'archived' as const,
    }];
    const results = findRelevantPatterns(withArchived, 'react-components');
    expect(results.find(r => r.id === 'archived-pattern')).toBeUndefined();
  });

  it('returns empty array when no match', () => {
    const results = findRelevantPatterns(patterns, 'terraform');
    expect(results.length).toBe(0);
  });

  it('limits results to maxResults', () => {
    const results = findRelevantPatterns(patterns, 'react-components', 1);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('react-form-validation');
  });
});

describe('detectModuleType', () => {
  it('detects react-components from tsx files', () => {
    expect(detectModuleType(['src/components/Button.tsx'])).toBe('react-components');
  });

  it('detects api-endpoints from route files', () => {
    expect(detectModuleType(['src/routes/users.ts'])).toBe('api-endpoints');
  });

  it('detects terraform from .tf files', () => {
    expect(detectModuleType(['main.tf', 'variables.tf'])).toBe('terraform');
  });

  it('returns generic for unknown types', () => {
    expect(detectModuleType(['README.md'])).toBe('generic');
  });
});
