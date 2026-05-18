import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { PatternsConfig, WikiPaths } from "./types";

export function defaultPatternsConfig(): PatternsConfig {
  return {
    enabled: true,
    globalWiki: true,
    globalPath:
      process.env.SUPERPOWERS_PATTERNS_WIKI ||
      path.join(os.homedir(), ".superpowers", "patterns-wiki"),
    bootstrapThreshold: 10,
    recurrenceThreshold: { minFrequency: 3, minProjects: 2 },
    staleness: { reviewDays: 30, archiveDays: 90 },
  };
}

export function loadPatternsConfig(projectRoot: string): PatternsConfig {
  const configPath = path.join(projectRoot, ".harness.config.json");
  const defaults = defaultPatternsConfig();

  if (!fs.existsSync(configPath)) return defaults;

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const patternsSection = raw.patterns || {};
    return {
      ...defaults,
      ...patternsSection,
      recurrenceThreshold: {
        ...defaults.recurrenceThreshold,
        ...patternsSection.recurrenceThreshold,
      },
      staleness: {
        ...defaults.staleness,
        ...patternsSection.staleness,
      },
    };
  } catch {
    return defaults;
  }
}

export function resolveWikiPaths(config: PatternsConfig, projectRoot: string): WikiPaths {
  const projectWiki = path.join(projectRoot, ".superpowers", "patterns-wiki");

  if (!config.globalWiki) {
    return { global: projectWiki, project: projectWiki };
  }

  let globalPath = config.globalPath;
  if (globalPath.startsWith("~")) {
    globalPath = path.join(os.homedir(), globalPath.slice(1));
  }

  return { global: globalPath, project: projectWiki };
}
