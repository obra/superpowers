import type { PatternEntry } from "./types";

export function findRelevantPatterns(
  patterns: PatternEntry[],
  moduleType: string,
  maxResults: number = 5,
): PatternEntry[] {
  return patterns
    .filter(p => p.status !== "archived")
    .filter(p => {
      if (p.module === moduleType) return true;
      if (moduleType.includes(p.module) || p.module.includes(moduleType)) return true;
      return false;
    })
    .sort((a, b) => {
      const categoryWeight = (c: string) => c === "error_pattern" ? 2 : c === "good_practice" ? 1 : 0;
      const weightDiff = categoryWeight(b.category) - categoryWeight(a.category);
      if (weightDiff !== 0) return weightDiff;
      return b.frequency - a.frequency;
    })
    .slice(0, maxResults);
}

export function detectModuleType(files: string[]): string {
  const hasReact = files.some(f => /\.(tsx|jsx)$/.test(f));
  const hasApi = files.some(f => f.includes("route") || f.includes("controller") || f.includes("endpoint"));
  const hasTerraform = files.some(f => /\.tf$/.test(f));
  const hasPython = files.some(f => /\.py$/.test(f));
  const hasCsharp = files.some(f => /\.cs$/.test(f));
  const hasGo = files.some(f => /\.go$/.test(f));

  if (hasReact) return "react-components";
  if (hasApi) return "api-endpoints";
  if (hasTerraform) return "terraform";
  if (hasPython) return "python-fastapi";
  if (hasCsharp) return "csharp-aspnet";
  if (hasGo) return "go-std";
  return "generic";
}
