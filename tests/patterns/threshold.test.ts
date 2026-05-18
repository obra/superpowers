import { shouldCreatePattern } from '../../lib/patterns/threshold';
import type { PatternsConfig } from '../../lib/patterns/types';

describe('shouldCreatePattern', () => {
  const defaultConfig: PatternsConfig = {
    enabled: true,
    globalWiki: true,
    globalPath: '/tmp/wiki',
    bootstrapThreshold: 10,
    recurrenceThreshold: { minFrequency: 3, minProjects: 2 },
    staleness: { reviewDays: 30, archiveDays: 90 },
  };

  it('creates pattern in bootstrap mode when total < threshold', () => {
    const result = shouldCreatePattern(5, defaultConfig);
    expect(result.shouldCreate).toBe(true);
    expect(result.status).toBe('bootstrap');
  });

  it('creates pattern when frequency threshold met', () => {
    const result = shouldCreatePattern(15, defaultConfig, { frequency: 3, projects: 1 });
    expect(result.shouldCreate).toBe(true);
    expect(result.status).toBe('promoted');
  });

  it('creates pattern when project threshold met', () => {
    const result = shouldCreatePattern(15, defaultConfig, { frequency: 1, projects: 2 });
    expect(result.shouldCreate).toBe(true);
    expect(result.status).toBe('promoted');
  });

  it('returns pending when below thresholds but has some recurrence', () => {
    const result = shouldCreatePattern(15, defaultConfig, { frequency: 2, projects: 1 });
    expect(result.shouldCreate).toBe(true);
    expect(result.status).toBe('pending');
  });

  it('rejects one-off in normal mode with low counts', () => {
    const result = shouldCreatePattern(15, defaultConfig, { frequency: 1, projects: 1 });
    expect(result.shouldCreate).toBe(false);
  });
});
