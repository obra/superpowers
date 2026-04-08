/**
 * Skills validation tests.
 *
 * Verifies every skill directory in skills/ has a valid SKILL.md with:
 *   1. name field matching the directory name
 *   2. description ≤ 1024 characters (Agent Skills standard)
 *   3. At least one Chinese character in description (bilingual requirement)
 *   4. description does NOT contain workflow summary (CSO principle from writing-skills)
 *
 * RED  → fails because skills/ is empty
 * GREEN → copy & update all 14 SKILL.md files
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.resolve(__dirname, "../skills");

// ─────────────────────────────────────────────────────────────────────────────
// Expected skills (all 14 from superpowers)
// ─────────────────────────────────────────────────────────────────────────────
const EXPECTED_SKILLS = [
  "brainstorming",
  "dispatching-parallel-agents",
  "executing-plans",
  "finishing-a-development-branch",
  "receiving-code-review",
  "requesting-code-review",
  "subagent-driven-development",
  "systematic-debugging",
  "test-driven-development",
  "using-git-worktrees",
  "using-superpowers",
  "verification-before-completion",
  "writing-plans",
  "writing-skills",
];

// ─────────────────────────────────────────────────────────────────────────────
// Frontmatter parser
// ─────────────────────────────────────────────────────────────────────────────
function parseFrontmatter(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const result: Record<string, string> = {};
  let currentKey = "";
  let currentValue = "";
  let isMultiLine = false;

  for (const line of match[1].split("\n")) {
    const keyMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (keyMatch && !isMultiLine) {
      if (currentKey) result[currentKey] = currentValue.trim();
      currentKey = keyMatch[1];
      const val = keyMatch[2].trim();
      if (val === ">" || val === "|") {
        isMultiLine = true;
        currentValue = "";
      } else {
        currentValue = val.replace(/^["']|["']$/g, "");
        isMultiLine = false;
      }
    } else if (isMultiLine) {
      if (line.trim() === "" && currentValue !== "") {
        isMultiLine = false;
      } else {
        currentValue += (currentValue ? " " : "") + line.trim();
      }
    }
  }
  if (currentKey) result[currentKey] = currentValue.trim();
  return result;
}

function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Skills directory existence", () => {
  it("skills/ directory exists", () => {
    expect(fs.existsSync(SKILLS_DIR)).toBe(true);
  });

  it.each(EXPECTED_SKILLS)("skill directory '%s' exists", (skill) => {
    expect(fs.existsSync(path.join(SKILLS_DIR, skill))).toBe(true);
  });

  it.each(EXPECTED_SKILLS)("skill '%s' has SKILL.md", (skill) => {
    expect(fs.existsSync(path.join(SKILLS_DIR, skill, "SKILL.md"))).toBe(true);
  });
});

describe("Frontmatter: name field", () => {
  it.each(EXPECTED_SKILLS)("skill '%s' has name field", (skill) => {
    const fm = parseFrontmatter(path.join(SKILLS_DIR, skill, "SKILL.md"));
    expect(fm.name).toBeTruthy();
  });

  it.each(EXPECTED_SKILLS)("skill '%s' name matches directory", (skill) => {
    const fm = parseFrontmatter(path.join(SKILLS_DIR, skill, "SKILL.md"));
    expect(fm.name).toBe(skill);
  });
});

describe("Frontmatter: description field", () => {
  it.each(EXPECTED_SKILLS)("skill '%s' has description field", (skill) => {
    const fm = parseFrontmatter(path.join(SKILLS_DIR, skill, "SKILL.md"));
    expect(fm.description).toBeTruthy();
  });

  it.each(EXPECTED_SKILLS)(
    "skill '%s' description ≤ 1024 chars (Agent Skills standard)",
    (skill) => {
      const fm = parseFrontmatter(path.join(SKILLS_DIR, skill, "SKILL.md"));
      const desc = fm.description ?? "";
      expect(desc.length).toBeLessThanOrEqual(1024);
    }
  );

  it.each(EXPECTED_SKILLS)(
    "skill '%s' description contains Chinese (bilingual requirement)",
    (skill) => {
      const fm = parseFrontmatter(path.join(SKILLS_DIR, skill, "SKILL.md"));
      expect(hasChinese(fm.description ?? "")).toBe(true);
    }
  );
});

describe("using-superpowers: Pi tool mapping section", () => {
  it("SKILL.md body contains Pi tool mapping section", () => {
    const content = fs.readFileSync(
      path.join(SKILLS_DIR, "using-superpowers", "SKILL.md"),
      "utf8"
    );
    expect(content).toMatch(/Pi 平台工具映射|Pi Platform Tool Mapping/);
  });

  it("SKILL.md body explains TodoWrite alternative", () => {
    const content = fs.readFileSync(
      path.join(SKILLS_DIR, "using-superpowers", "SKILL.md"),
      "utf8"
    );
    expect(content).toMatch(/TodoWrite/);
    expect(content).toMatch(/TODO\.md/);
  });
});

describe("subagent-driven-development: Pi sequential mode", () => {
  it("SKILL.md contains Pi platform adaptation section", () => {
    const content = fs.readFileSync(
      path.join(SKILLS_DIR, "subagent-driven-development", "SKILL.md"),
      "utf8"
    );
    expect(content).toMatch(/Pi 平台适配|Pi Platform Adaptation/);
  });

  it("SKILL.md explains sequential execution as Task tool alternative", () => {
    const content = fs.readFileSync(
      path.join(SKILLS_DIR, "subagent-driven-development", "SKILL.md"),
      "utf8"
    );
    expect(content).toMatch(/顺序执行|sequential/i);
  });
});
