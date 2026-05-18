import type { PatternsValidationResult } from "../../patterns/types";
import { PatternCatalog } from "../../patterns/catalog";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function validatePatterns(
  cwd: string,
  catalog: PatternCatalog,
): Promise<PatternsValidationResult> {
  const patterns = catalog.query({
    categories: ["error_pattern"],
    excludeArchived: true,
  });

  if (patterns.length === 0) {
    return { passed: true, violations: [], blocking: false };
  }

  const violations: PatternsValidationResult["violations"] = [];

  for (const pattern of patterns) {
    let matchFile = "";
    let matchLine = 0;

    if (pattern.checkRegex) {
      const result = await grepSourceFiles(pattern.checkRegex, cwd);
      if (result.matches.length > 0) {
        matchFile = result.matches[0].file;
        matchLine = result.matches[0].line;
      }
    }

    // Report ALL active error patterns as violations (the pattern has occurred historically)
    violations.push({
      pattern: pattern.id,
      message: `Known error pattern: ${pattern.title}`,
      severity: pattern.severity,
      fix: pattern.fix,
      file: matchFile || undefined,
      line: matchLine || undefined,
      recurrence: `Seen ${pattern.frequency} times across ${pattern.projects.length} project${pattern.projects.length > 1 ? "s" : ""}.`,
    });
  }

  const hasBlocking = violations.some(v => v.severity === "high");

  return {
    passed: !hasBlocking,
    violations,
    blocking: hasBlocking,
  };
}

async function grepSourceFiles(regex: string, cwd: string): Promise<{
  matches: Array<{ file: string; line: number }>;
}> {
  const matches: Array<{ file: string; line: number }> = [];
  const extensions = ["ts", "tsx", "js", "jsx", "py", "cs", "go"];

  try {
    const { stdout } = await execAsync(
      `grep -rn "${regex}" --include="*.${extensions.join('" --include="*.')}" src/ lib/ app/ components/ 2>/dev/null || true`,
      { cwd, timeout: 10000 },
    );

    if (!stdout.trim()) return { matches };

    for (const line of stdout.trim().split("\n")) {
      const match = line.match(/^(.+?):(\d+):/);
      if (match) {
        matches.push({
          file: match[1],
          line: parseInt(match[2], 10),
        });
      }
    }
  } catch {
    // grep not available or error — fail open
  }

  return { matches };
}
