#!/usr/bin/env node
import { PatternCatalog } from "../../lib/patterns/catalog";
import { loadPatternsConfig, resolveWikiPaths } from "../../lib/patterns/config";
import * as fs from "node:fs";
import * as path from "node:path";

const args = process.argv.slice(2);
const command = args[0] || "help";
const projectRoot = process.cwd();

function getCatalog(): PatternCatalog {
  try {
    const config = loadPatternsConfig(projectRoot);
    if (!config.enabled) {
      console.error("Patterns feature is disabled in .harness.config.json");
      process.exit(1);
    }
    const paths = resolveWikiPaths(config, projectRoot);
    return new PatternCatalog(paths.global, paths.project);
  } catch (e) {
    console.error("Failed to initialize pattern catalog:", e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

async function main() {
  switch (command) {
    case "lint": {
      try {
        const { PatternLinter } = await import("../../lib/patterns/linter");
        const catalog = getCatalog();
        const config = loadPatternsConfig(projectRoot);
        const paths = resolveWikiPaths(config, projectRoot);
        const linter = new PatternLinter(catalog, paths, config);
        const report = await linter.run();
        const lines: string[] = ["## Wiki Lint Report\n"];
        if (report.contradictions.length > 0) {
          lines.push(`Contradictions (${report.contradictions.length}):`);
          for (const c of report.contradictions) lines.push(`   ${c.ids[0]} vs ${c.ids[1]} — ${c.reason}`);
        }
        if (report.stale.length > 0) {
          lines.push(`Stale patterns (${report.stale.length}):`);
          for (const s of report.stale) lines.push(`   ${s.id} (not seen in ${s.daysSinceLastSeen} days)`);
        }
        if (report.orphans.length > 0) {
          lines.push(`Orphan patterns (${report.orphans.length}):`);
          for (const o of report.orphans) lines.push(`   ${o}`);
        }
        if (report.bootstrapReview.length > 0) {
          lines.push(`Bootstrap review (${report.bootstrapReview.length}):`);
          for (const b of report.bootstrapReview) lines.push(`   ${b}`);
        }
        if (report.duplicates.length > 0) {
          lines.push(`Possible duplicates (${report.duplicates.length}):`);
          for (const d of report.duplicates) lines.push(`   ${d.ids[0]} vs ${d.ids[1]} (${Math.round(d.similarity * 100)}% similar)`);
        }
        if (lines.length <= 1) lines.push("No issues found. Wiki is healthy.");
        console.log(lines.join("\n"));
        process.exit(report.hasCritical ? 1 : 0);
      } catch (e) {
        console.error("Linter not available:", e);
        process.exit(1);
      }
      break;
    }

    case "query": {
      const term = args[1];
      if (!term) { console.error("Usage: patterns query <search-term>"); process.exit(1); }
      const catalog = getCatalog();
      const allPatterns = catalog.query({ excludeArchived: true });
      const matches = allPatterns.filter(
        p => p.title.toLowerCase().includes(term.toLowerCase()) ||
             p.id.toLowerCase().includes(term.toLowerCase()) ||
             p.pattern.toLowerCase().includes(term.toLowerCase()) ||
             p.module.toLowerCase().includes(term.toLowerCase()),
      );
      if (matches.length === 0) {
        console.log(`No patterns found matching "${term}"`);
      } else {
        console.log(`Found ${matches.length} pattern(s) matching "${term}":\n`);
        for (const p of matches) {
          console.log(`- ${p.id} (${p.category}, ${p.severity}) — ${p.title}`);
          console.log(`  Frequency: ${p.frequency} | Projects: ${p.projects.join(", ")}`);
        }
      }
      break;
    }

    case "show": {
      const id = args[1];
      if (!id) { console.error("Usage: patterns show <pattern-id>"); process.exit(1); }
      const catalog = getCatalog();
      const entry = catalog.getById(id);
      if (!entry) { console.error(`Pattern "${id}" not found`); process.exit(1); }
      console.log(`## ${entry.title}`);
      console.log(`ID: ${entry.id}`);
      console.log(`Category: ${entry.category}`);
      console.log(`Module: ${entry.module}`);
      console.log(`Severity: ${entry.severity}`);
      console.log(`Frequency: ${entry.frequency} (${entry.projects.join(", ")})`);
      console.log(`Status: ${entry.status}`);
      console.log(`\nPattern: ${entry.pattern}`);
      console.log(`Symptom: ${entry.symptom}`);
      console.log(`Fix: ${entry.fix}`);
      console.log(`Check: ${entry.check}`);
      if (entry.related.length > 0) console.log(`Related: ${entry.related.join(", ")}`);
      break;
    }

    case "stats": {
      const catalog = getCatalog();
      const all = catalog.query({ excludeArchived: false });
      const promoted = all.filter(p => p.status === "promoted");
      const pending = all.filter(p => p.status === "pending");
      const bootstrap = all.filter(p => p.status === "bootstrap");
      const archived = all.filter(p => p.status === "archived");
      console.log("## Patterns Statistics");
      console.log(`Total: ${all.length}`);
      console.log(`Promoted: ${promoted.length}`);
      console.log(`Pending: ${pending.length}`);
      console.log(`Bootstrap: ${bootstrap.length}`);
      console.log(`Archived: ${archived.length}`);
      console.log(`\nBy Category:`);
      console.log(`  Error patterns: ${promoted.filter(p => p.category === "error_pattern").length}`);
      console.log(`  Good practices: ${promoted.filter(p => p.category === "good_practice").length}`);
      console.log(`  Project constraints: ${promoted.filter(p => p.category === "project_constraint").length}`);
      console.log(`\nTop Recurrents:`);
      const topRecurrents = promoted.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
      for (const p of topRecurrents) {
        console.log(`  ${p.id}: ${p.frequency}x across ${p.projects.length} project(s)`);
      }
      break;
    }

    case "promote": {
      const id = args[1];
      if (!id) { console.error("Usage: patterns promote <pattern-id>"); process.exit(1); }
      const catalog = getCatalog();
      const entry = catalog.getById(id);
      if (!entry) { console.error(`Pattern "${id}" not found`); process.exit(1); }
      catalog.update(id, { status: "promoted" });
      console.log(`Promoted "${id}" to promoted status`);
      break;
    }

    case "archive": {
      const id = args[1];
      if (!id) { console.error("Usage: patterns archive <pattern-id>"); process.exit(1); }
      const catalog = getCatalog();
      catalog.archive(id);
      console.log(`Archived "${id}"`);
      break;
    }

    case "export": {
      const catalog = getCatalog();
      const all = catalog.query({ excludeArchived: false });
      console.log(JSON.stringify(all, null, 2));
      break;
    }

    case "import": {
      const filePath = args[1];
      if (!filePath) { console.error("Usage: patterns import <json-file>"); process.exit(1); }
      if (!fs.existsSync(filePath)) { console.error(`File not found: ${filePath}`); process.exit(1); }
      const entries = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const catalog = getCatalog();
      let imported = 0;
      for (const raw of entries) {
        if (catalog.getById(raw.id)) { console.log(`Skipping existing: ${raw.id}`); continue; }
        catalog.create(raw);
        imported++;
      }
      console.log(`Imported ${imported} pattern(s)`);
      break;
    }

    case "help":
    default:
      console.log(`
Patterns CLI — Learning Harness Knowledge Base

Usage: npx ts-node tools/patterns/cli.ts <command> [args]

Commands:
  lint              Run wiki health check
  query <term>      Search patterns
  show <id>         Show full pattern details
  stats             Display summary statistics
  promote <id>      Promote pending pattern
  archive <id>      Archive stale pattern
  export            Export all patterns as JSON
  import <file>     Import patterns from JSON
  help              Show this help
`);
      break;
  }
}

main();
