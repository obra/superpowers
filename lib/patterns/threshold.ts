import type { PatternsConfig, PatternStatus } from "./types";

export interface ThresholdResult {
  shouldCreate: boolean;
  status: PatternStatus;
  reason: string;
}

export function shouldCreatePattern(
  totalPatternsInWiki: number,
  config: PatternsConfig,
  occurrence: { frequency: number; projects: number } = { frequency: 1, projects: 1 },
): ThresholdResult {
  if (totalPatternsInWiki < config.bootstrapThreshold) {
    return {
      shouldCreate: true,
      status: "bootstrap",
      reason: `Bootstrap mode (${totalPatternsInWiki}/${config.bootstrapThreshold} patterns)`,
    };
  }

  if (occurrence.frequency >= config.recurrenceThreshold.minFrequency) {
    return {
      shouldCreate: true,
      status: "promoted",
      reason: `Frequency threshold met (${occurrence.frequency} >= ${config.recurrenceThreshold.minFrequency})`,
    };
  }

  if (occurrence.projects >= config.recurrenceThreshold.minProjects) {
    return {
      shouldCreate: true,
      status: "promoted",
      reason: `Project threshold met (${occurrence.projects} >= ${config.recurrenceThreshold.minProjects})`,
    };
  }

  if (occurrence.frequency > 1 || occurrence.projects > 1) {
    return {
      shouldCreate: true,
      status: "pending",
      reason: `Below thresholds (freq: ${occurrence.frequency}, projects: ${occurrence.projects})`,
    };
  }

  return {
    shouldCreate: false,
    status: "pending",
    reason: "One-off in normal mode — not creating",
  };
}
