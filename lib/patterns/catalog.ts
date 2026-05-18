import * as fs from "node:fs";
import * as path from "node:path";
import type { PatternEntry, PatternQuery, PatternCategory } from "./types";

const CATEGORY_DIRS: Record<PatternCategory | string, string> = {
  error_pattern: "errors",
  good_practice: "practices",
  project_constraint: "constraints",
};

const STATUS_DIRS: Record<string, string> = {
  pending: "pending",
  archived: "archived",
};

export class PatternCatalog {
  constructor(
    private readonly globalPath: string,
    private readonly projectPath: string,
  ) {
    this.ensureDirectories(globalPath);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────────────────────────────

  create(entry: PatternEntry): void {
    const filePath = this.resolveWritePath(entry);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, this.serializeEntry(entry), "utf-8");
  }

  getById(id: string): PatternEntry | null {
    for (const base of [this.globalPath, this.projectPath]) {
      const result = this.searchInDir(base, id);
      if (result) return result;
    }
    return null;
  }

  update(id: string, updates: Partial<PatternEntry>): void {
    const existing = this.getById(id);
    if (!existing) throw new Error(`Pattern not found: ${id}`);
    const merged: PatternEntry = { ...existing, ...updates };

    // If status or category changed, we may need to move the file.
    const oldPath = this.findFilePath(id);
    if (!oldPath) throw new Error(`Pattern file not found: ${id}`);

    const newPath = this.resolveWritePath(merged);
    if (oldPath !== newPath) {
      fs.mkdirSync(path.dirname(newPath), { recursive: true });
      fs.unlinkSync(oldPath);
    }
    fs.writeFileSync(newPath, this.serializeEntry(merged), "utf-8");
  }

  incrementFrequency(id: string, projectName: string): void {
    const entry = this.getById(id);
    if (!entry) throw new Error(`Pattern not found: ${id}`);
    const updates: Partial<PatternEntry> = {
      frequency: entry.frequency + 1,
      lastSeen: new Date().toISOString().slice(0, 10),
      projects: entry.projects.includes(projectName)
        ? entry.projects
        : [...entry.projects, projectName],
    };
    this.update(id, updates);
  }

  archive(id: string): void {
    this.update(id, { status: "archived" });
  }

  supersede(oldId: string, newId: string): void {
    this.update(oldId, {
      status: "archived",
      supersededBy: newId,
      supersededAt: new Date().toISOString().slice(0, 10),
    });
  }

  query(q: PatternQuery): PatternEntry[] {
    const all = this.loadAll();
    let results = all;

    if (q.module) {
      results = results.filter((p) => p.module === q.module);
    }
    if (q.categories && q.categories.length > 0) {
      results = results.filter((p) => q.categories!.includes(p.category));
    }
    if (q.severity && q.severity.length > 0) {
      results = results.filter((p) => q.severity!.includes(p.severity));
    }
    if (q.excludeArchived) {
      results = results.filter((p) => p.status !== "archived");
    }

    results.sort((a, b) => {
      const weight = categoryWeight(b.category) - categoryWeight(a.category);
      if (weight !== 0) return weight;
      return b.frequency - a.frequency;
    });

    if (q.maxResults) {
      results = results.slice(0, q.maxResults);
    }
    return results;
  }

  countTotal(): number {
    return this.loadAll().filter((p) => p.status !== "archived").length;
  }

  /**
   * Writes an index.md at globalPath root listing all non-archived patterns.
   * Required by Task 9 integration test.
   */
  regenerateIndex(): void {
    const entries = this.loadAll().filter((p) => p.status !== "archived");

    const lines: string[] = [
      "# Patterns Index",
      "",
      `Total: ${entries.length}`,
      "",
      "| id | title | category |",
      "|----|-------|----------|",
    ];

    for (const e of entries) {
      lines.push(`| ${e.id} | ${e.title} | ${e.category} |`);
    }

    lines.push("");
    fs.writeFileSync(path.join(this.globalPath, "index.md"), lines.join("\n"), "utf-8");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────────────────────

  private ensureDirectories(base: string): void {
    const dirs = ["errors", "practices", "constraints", "pending", "archived"];
    for (const d of dirs) {
      fs.mkdirSync(path.join(base, d), { recursive: true });
    }
  }

  /**
   * Resolves the canonical write path for an entry based on its status and category.
   * - archived  → archived/
   * - pending   → pending/
   * - others    → category dir (errors/ practices/ constraints/)
   */
  private resolveWritePath(entry: PatternEntry): string {
    const dir =
      entry.status === "pending"
        ? "pending"
        : entry.status === "archived"
          ? "archived"
          : CATEGORY_DIRS[entry.category] ?? "errors"; // "promoted" and "bootstrap" go in the category directory
    return path.join(this.globalPath, dir, `${entry.id}.md`);
  }

  /**
   * Finds the actual file path of an entry by searching all subdirectories
   * under both globalPath and projectPath.
   */
  private findFilePath(id: string): string | null {
    for (const base of [this.globalPath, this.projectPath]) {
      for (const sub of ["errors", "practices", "constraints", "pending", "archived"]) {
        const candidate = path.join(base, sub, `${id}.md`);
        if (fs.existsSync(candidate)) return candidate;
      }
    }
    return null;
  }

  /**
   * Searches a single base directory for an entry with the given id.
   */
  private searchInDir(base: string, id: string): PatternEntry | null {
    for (const sub of ["errors", "practices", "constraints", "pending", "archived"]) {
      const candidate = path.join(base, sub, `${id}.md`);
      if (fs.existsSync(candidate)) {
        return this.parseEntry(fs.readFileSync(candidate, "utf-8"));
      }
    }
    return null;
  }

  /** Loads every pattern entry from globalPath and projectPath (deduplicated by id). */
  private loadAll(): PatternEntry[] {
    const seen = new Set<string>();
    const entries: PatternEntry[] = [];

    for (const base of [this.globalPath, this.projectPath]) {
      for (const sub of ["errors", "practices", "constraints", "pending", "archived"]) {
        const dir = path.join(base, sub);
        if (!fs.existsSync(dir)) continue;
        for (const file of fs.readdirSync(dir)) {
          if (!file.endsWith(".md")) continue;
          const id = file.slice(0, -3);
          if (seen.has(id)) continue;
          seen.add(id);
          try {
            const entry = this.parseEntry(fs.readFileSync(path.join(dir, file), "utf-8"));
            if (entry) entries.push(entry);
          } catch {
            // skip malformed files
          }
        }
      }
    }
    return entries;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Serialization
  // ──────────────────────────────────────────────────────────────────────────

  private serializeEntry(e: PatternEntry): string {
    const projectsList = e.projects.map((p) => `  - ${p}`).join("\n");
    const relatedList = e.related.map((r) => `  - ${r}`).join("\n");

    const frontmatter = [
      "---",
      `id: ${e.id}`,
      `category: ${e.category}`,
      `module: ${e.module}`,
      `severity: ${e.severity}`,
      `frequency: ${e.frequency}`,
      `firstSeen: ${e.firstSeen}`,
      `lastSeen: ${e.lastSeen}`,
      `status: ${e.status}`,
      `projects:`,
      projectsList || "  []",
      `related:`,
      relatedList || "  []",
      e.supersededBy ? `supersededBy: ${e.supersededBy}` : null,
      e.supersededAt ? `supersededAt: ${e.supersededAt}` : null,
      "---",
    ]
      .filter((l) => l !== null)
      .join("\n");

    const body = [
      `## ${e.title}`,
      "",
      `**Pattern:** ${e.pattern}`,
      "",
      `**Symptom:** ${e.symptom}`,
      "",
      `**Root cause:** ${e.rootCause}`,
      "",
      `**Fix:** ${e.fix}`,
      "",
      `**Check:** ${e.check}`,
      e.checkRegex ? `\n**CheckRegex:** ${e.checkRegex}` : null,
      "",
      `**Related:** ${e.related.map((r) => `[[${r}]]`).join(", ")}`,
    ]
      .filter((l) => l !== null)
      .join("\n");

    return `${frontmatter}\n\n${body}\n`;
  }

  private parseEntry(content: string): PatternEntry {
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) throw new Error("Missing frontmatter");

    const fm = parseFrontmatter(fmMatch[1]);
    const body = content.slice(fmMatch[0].length).trim();

    // Extract title from first ## heading
    const titleMatch = body.match(/^##\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : "";

    const fieldLine = (label: string) => {
      const re = new RegExp(`^\\*\\*${label}:\\*\\*\\s*(.*)$`, "m");
      const m = body.match(re);
      return m ? m[1].trim() : "";
    };

    const relatedRaw = fieldLine("Related");
    const related = relatedRaw
      ? relatedRaw
          .split(",")
          .map((r) => r.trim().replace(/\[\[|\]\]/g, ""))
          .filter(Boolean)
      : [];

    return {
      id: fm.id,
      category: fm.category as PatternEntry["category"],
      module: fm.module,
      severity: fm.severity as PatternEntry["severity"],
      frequency: Number(fm.frequency),
      firstSeen: fm.firstSeen,
      lastSeen: fm.lastSeen,
      projects: fm.projects ?? [],
      status: fm.status as PatternEntry["status"],
      title,
      pattern: fieldLine("Pattern"),
      symptom: fieldLine("Symptom"),
      rootCause: fieldLine("Root cause"),
      fix: fieldLine("Fix"),
      check: fieldLine("Check"),
      checkRegex: fieldLine("CheckRegex") || undefined,
      related,
      supersededBy: fm.supersededBy || undefined,
      supersededAt: fm.supersededAt || undefined,
    };
  }

  private appendToLog(entry: Partial<PatternEntry>, action: string): void {
    const logPath = path.join(this.globalPath, "patterns.log");
    const line = JSON.stringify({
      date: new Date().toISOString(),
      action,
      id: entry.id,
      category: entry.category,
    });
    fs.appendFileSync(logPath, line + "\n", "utf-8");
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────────────────────────────────

function categoryWeight(c: string): number {
  switch (c) {
    case "error_pattern":
      return 2;
    case "good_practice":
      return 1;
    default:
      return 0;
  }
}

/**
 * Minimal YAML-ish frontmatter parser.
 * Handles scalar values and simple list blocks (- item).
 */
function parseFrontmatter(raw: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = raw.split("\n");
  let currentKey: string | null = null;

  for (const line of lines) {
    // List item under a current key
    if (currentKey && /^\s{2}-\s+/.test(line)) {
      const value = line.replace(/^\s{2}-\s+/, "").trim();
      if (value !== "[]") {
        if (!Array.isArray(result[currentKey])) result[currentKey] = [];
        result[currentKey].push(value);
      }
      continue;
    }

    // Bare list marker (no inline value) — e.g. `projects:`
    const listKeyMatch = line.match(/^(\w+):\s*$/);
    if (listKeyMatch) {
      currentKey = listKeyMatch[1];
      result[currentKey] = [];
      continue;
    }

    // Scalar key: value
    const kvMatch = line.match(/^(\w+):\s+(.+)$/);
    if (kvMatch) {
      currentKey = null;
      result[kvMatch[1]] = kvMatch[2].trim();
      continue;
    }
  }

  return result;
}
