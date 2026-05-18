import type { PatternEntry } from "./types";

export function formatPatternsForContext(patterns: PatternEntry[]): string {
  if (patterns.length === 0) return "";

  const lines = [
    "",
    "## Learned Patterns (apply these proactively)",
    "⚠️ The following patterns have been learned from past corrections.",
    "Apply them proactively — do NOT wait for the harness to catch them.",
    "",
  ];

  for (const p of patterns) {
    const severityTag = p.severity === "high" ? "🔴 CRITICAL" :
                        p.severity === "medium" ? "🟡 Watch" : "🟢 Consider";
    lines.push(`### ${p.title} [${severityTag}]`);
    lines.push(`Check: ${p.check}`);
    if (p.fix) lines.push(`Fix: ${p.fix}`);
    lines.push(`Seen: ${p.frequency} times across ${p.projects.length} project${p.projects.length > 1 ? "s" : ""}.`);
    lines.push("");
  }

  return lines.join("\n");
}

export function formatPatternsForReview(patterns: PatternEntry[]): string {
  if (patterns.length === 0) return "";

  const lines = [
    "",
    "## Pattern Review Checklist",
    "Verify the implementation does NOT trigger any known error patterns:",
    "",
  ];

  for (const p of patterns) {
    lines.push(`- [ ] **${p.title}**: ${p.check}`);
  }

  lines.push("");
  return lines.join("\n");
}
