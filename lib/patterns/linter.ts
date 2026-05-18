import { PatternCatalog } from "./catalog";
import type { PatternsConfig, WikiPaths } from "./types";

export interface LintReport {
  contradictions: Array<{ ids: [string, string]; reason: string }>;
  stale: Array<{ id: string; daysSinceLastSeen: number }>;
  orphans: string[];
  bootstrapReview: string[];
  duplicates: Array<{ ids: [string, string]; similarity: number }>;
  hasCritical: boolean;
}

export class PatternLinter {
  constructor(
    private catalog: PatternCatalog,
    private paths: WikiPaths,
    private config: PatternsConfig,
  ) {}

  async run(): Promise<LintReport> {
    const allPatterns = this.catalog.query({ excludeArchived: false });
    const activePatterns = allPatterns.filter(p => p.status !== "archived");

    const contradictions = this.findContradictions(activePatterns);
    const stale = this.findStalePatterns(activePatterns);
    const orphans = this.findOrphans(activePatterns);
    const bootstrapReview = this.findBootstrapReview(activePatterns);
    const duplicates = this.findDuplicates(activePatterns);

    return {
      contradictions,
      stale,
      orphans,
      bootstrapReview,
      duplicates,
      hasCritical: contradictions.length > 0,
    };
  }

  private findContradictions(patterns: Array<{ id: string; check: string; category: string; module: string }>): LintReport["contradictions"] {
    const contradictions: LintReport["contradictions"] = [];
    const byModule = new Map<string, typeof patterns>();

    for (const p of patterns) {
      if (!byModule.has(p.module)) byModule.set(p.module, []);
      byModule.get(p.module)!.push(p);
    }

    for (const [, modulePatterns] of byModule) {
      for (let i = 0; i < modulePatterns.length; i++) {
        for (let j = i + 1; j < modulePatterns.length; j++) {
          const a = modulePatterns[i];
          const b = modulePatterns[j];
          if (this.areContradictory(a.check, b.check)) {
            contradictions.push({
              ids: [a.id, b.id],
              reason: `Opposing checks in module ${a.module}`,
            });
          }
        }
      }
    }

    return contradictions;
  }

  private areContradictory(checkA: string, checkB: string): boolean {
    const lowerA = checkA.toLowerCase();
    const lowerB = checkB.toLowerCase();
    const mustA = lowerA.includes("must") || lowerA.includes("required") || lowerA.includes("always");
    const mustNotB = lowerB.includes("must not") || lowerB.includes("never") || lowerB.includes("avoid");
    const mustB = lowerB.includes("must") || lowerB.includes("required") || lowerB.includes("always");
    const mustNotA = lowerA.includes("must not") || lowerA.includes("never") || lowerA.includes("avoid");

    return (mustA && mustNotB) || (mustB && mustNotA);
  }

  private findStalePatterns(patterns: Array<{ id: string; lastSeen: string; status: string }>): LintReport["stale"] {
    const stale: LintReport["stale"] = [];
    const now = new Date();

    for (const p of patterns) {
      if (p.status === "archived") continue;
      const lastSeen = new Date(p.lastSeen);
      const daysSince = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > this.config.staleness.reviewDays) {
        stale.push({ id: p.id, daysSinceLastSeen: daysSince });
      }
    }

    return stale;
  }

  private findOrphans(patterns: Array<{ id: string; related: string[] }>): LintReport["orphans"] {
    const orphans: string[] = [];

    for (const p of patterns) {
      const hasInbound = patterns.some(other =>
        other.id !== p.id && other.related.includes(p.id)
      );
      if (!hasInbound && p.related.length === 0) {
        orphans.push(p.id);
      }
    }

    return orphans;
  }

  private findBootstrapReview(patterns: Array<{ id: string; status: string; firstSeen: string }>): LintReport["bootstrapReview"] {
    const review: string[] = [];
    const now = new Date();

    for (const p of patterns) {
      if (p.status !== "bootstrap") continue;
      const firstSeen = new Date(p.firstSeen);
      const daysSince = Math.floor((now.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > this.config.staleness.reviewDays) {
        review.push(p.id);
      }
    }

    return review;
  }

  private findDuplicates(patterns: Array<{ id: string; title: string }>): LintReport["duplicates"] {
    const duplicates: LintReport["duplicates"] = [];

    for (let i = 0; i < patterns.length; i++) {
      for (let j = i + 1; j < patterns.length; j++) {
        const similarity = this.titleSimilarity(patterns[i].title, patterns[j].title);
        if (similarity > 0.8) {
          duplicates.push({
            ids: [patterns[i].id, patterns[j].id],
            similarity,
          });
        }
      }
    }

    return duplicates;
  }

  private titleSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }
}
