/**
 * Bootstrap extension integration tests.
 *
 * Tests the full bootstrap assembly pipeline:
 *   1. Reads using-superpowers/SKILL.md from the skills directory
 *   2. Strips frontmatter
 *   3. Builds tool mapping
 *   4. Assembles final bootstrap content
 *
 * RED  → fails because bootstrap.ts doesn't exist yet
 * GREEN → implement bootstrap.ts using bootstrap-utils
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assembleBootstrap } from "../extensions/bootstrap.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.resolve(__dirname, "../skills");

describe("assembleBootstrap", () => {
  it("returns null when using-superpowers skill is missing", () => {
    const result = assembleBootstrap("/nonexistent/skills");
    expect(result).toBeNull();
  });

  it("returns a non-empty string for valid skills directory", () => {
    const result = assembleBootstrap(SKILLS_DIR);
    expect(result).not.toBeNull();
    expect(typeof result).toBe("string");
    expect((result as string).length).toBeGreaterThan(100);
  });

  it("output contains EXTREMELY_IMPORTANT wrapper", () => {
    const result = assembleBootstrap(SKILLS_DIR) as string;
    expect(result).toContain("<EXTREMELY_IMPORTANT>");
    expect(result).toContain("</EXTREMELY_IMPORTANT>");
  });

  it("output contains Pi tool mapping section", () => {
    const result = assembleBootstrap(SKILLS_DIR) as string;
    expect(result).toMatch(/Pi 平台工具映射|Pi Platform Tool Mapping/);
  });

  it("output does NOT contain frontmatter markers", () => {
    const result = assembleBootstrap(SKILLS_DIR) as string;
    // frontmatter should be stripped
    expect(result).not.toMatch(/^---\nname:/m);
  });

  it("output contains skill body content (How to Access Skills)", () => {
    const result = assembleBootstrap(SKILLS_DIR) as string;
    expect(result).toMatch(/How to Access Skills|Using Skills/);
  });

  it("output contains Chinese characters", () => {
    const result = assembleBootstrap(SKILLS_DIR) as string;
    expect(result).toMatch(/[\u4e00-\u9fff]/);
  });
});
