/**
 * Prompt Templates validation tests.
 *
 * Verifies all expected prompt template files exist and have valid frontmatter.
 *
 * RED  → fails because prompts/ is empty
 * GREEN → create all 6 prompt template files
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.resolve(__dirname, "../prompts");

// Expected: 3 English + 3 Chinese aliases
const EXPECTED_PROMPTS = [
  "brainstorm.md",
  "write-plan.md",
  "execute-plan.md",
  "头脑风暴.md",
  "写计划.md",
  "执行计划.md",
];

function parseFrontmatterDescription(filePath: string): string | null {
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const descMatch = match[1].match(/^description:\s*(.+)$/m);
  return descMatch ? descMatch[1].trim().replace(/^["']|["']$/g, "") : null;
}

describe("Prompts directory", () => {
  it("prompts/ directory exists", () => {
    expect(fs.existsSync(PROMPTS_DIR)).toBe(true);
  });

  it.each(EXPECTED_PROMPTS)("prompt file '%s' exists", (file) => {
    expect(fs.existsSync(path.join(PROMPTS_DIR, file))).toBe(true);
  });
});

describe("Prompt frontmatter", () => {
  it.each(EXPECTED_PROMPTS)("prompt '%s' has description in frontmatter", (file) => {
    const desc = parseFrontmatterDescription(path.join(PROMPTS_DIR, file));
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(5);
  });
});

describe("Prompt content invokes skills", () => {
  it("brainstorm.md invokes brainstorming skill", () => {
    const content = fs.readFileSync(path.join(PROMPTS_DIR, "brainstorm.md"), "utf8");
    expect(content).toMatch(/brainstorming/);
  });

  it("write-plan.md invokes writing-plans skill", () => {
    const content = fs.readFileSync(path.join(PROMPTS_DIR, "write-plan.md"), "utf8");
    expect(content).toMatch(/writing-plans/);
  });

  it("execute-plan.md invokes executing-plans skill", () => {
    const content = fs.readFileSync(path.join(PROMPTS_DIR, "execute-plan.md"), "utf8");
    expect(content).toMatch(/executing-plans/);
  });

  it("头脑风暴.md contains Chinese and invokes brainstorming", () => {
    const content = fs.readFileSync(path.join(PROMPTS_DIR, "头脑风暴.md"), "utf8");
    expect(content).toMatch(/[\u4e00-\u9fff]/);
    expect(content).toMatch(/brainstorming/);
  });

  it("写计划.md contains Chinese and invokes writing-plans", () => {
    const content = fs.readFileSync(path.join(PROMPTS_DIR, "写计划.md"), "utf8");
    expect(content).toMatch(/[\u4e00-\u9fff]/);
    expect(content).toMatch(/writing-plans/);
  });

  it("执行计划.md contains Chinese and invokes executing-plans", () => {
    const content = fs.readFileSync(path.join(PROMPTS_DIR, "执行计划.md"), "utf8");
    expect(content).toMatch(/[\u4e00-\u9fff]/);
    expect(content).toMatch(/executing-plans/);
  });
});
