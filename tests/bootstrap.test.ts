/**
 * Tests for bootstrap extension utility functions.
 *
 * TDD order:
 *   RED  → these tests fail (functions don't exist yet)
 *   GREEN → implement minimal functions to pass
 *   REFACTOR → clean up if needed
 */

import { describe, it, expect } from "vitest";
import {
  stripFrontmatter,
  buildPiToolMapping,
  shouldInjectBootstrap,
  buildBootstrapContent,
} from "../extensions/bootstrap-utils.js";

// ─────────────────────────────────────────────────────────────────────────────
// stripFrontmatter
// ─────────────────────────────────────────────────────────────────────────────

describe("stripFrontmatter", () => {
  it("removes YAML frontmatter block and returns body", () => {
    const input = `---
name: my-skill
description: Use when doing X
---

# My Skill

Body content here.`;
    const result = stripFrontmatter(input);
    expect(result).not.toContain("---");
    expect(result).not.toContain("name: my-skill");
    expect(result).toContain("# My Skill");
    expect(result).toContain("Body content here.");
  });

  it("returns content unchanged when no frontmatter present", () => {
    const input = "# Just content\n\nNo frontmatter here.";
    expect(stripFrontmatter(input)).toBe(input);
  });

  it("strips leading blank lines after frontmatter", () => {
    const input = `---
name: x
---


# Content`;
    const result = stripFrontmatter(input);
    expect(result.startsWith("# Content")).toBe(true);
  });

  it("handles frontmatter with multi-line description using >", () => {
    const input = `---
name: skill
description: >
  Use when foo
  or bar
---
Body`;
    const result = stripFrontmatter(input);
    expect(result).toBe("Body");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildPiToolMapping
// ─────────────────────────────────────────────────────────────────────────────

describe("buildPiToolMapping", () => {
  const mapping = buildPiToolMapping("/path/to/skills");

  it("mentions Skill tool replacement", () => {
    expect(mapping).toMatch(/Skill/);
    expect(mapping).toMatch(/read/);
  });

  it("mentions TodoWrite replacement", () => {
    expect(mapping).toMatch(/TodoWrite/);
    expect(mapping).toMatch(/TODO\.md/);
  });

  it("mentions Task (subagent) replacement", () => {
    expect(mapping).toMatch(/Task/);
  });

  it("confirms Read/Write/Edit/Bash are same", () => {
    expect(mapping).toMatch(/Read/);
    expect(mapping).toMatch(/Write/);
    expect(mapping).toMatch(/Edit/);
    expect(mapping).toMatch(/Bash/);
  });

  it("includes the provided skills directory path", () => {
    const m = buildPiToolMapping("/custom/skills/path");
    expect(m).toContain("/custom/skills/path");
  });

  it("contains Chinese text for Chinese users", () => {
    // Must contain at least one Chinese character
    expect(mapping).toMatch(/[\u4e00-\u9fff]/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// shouldInjectBootstrap
// ─────────────────────────────────────────────────────────────────────────────

describe("shouldInjectBootstrap", () => {
  it("returns true for first turn (0 prior user messages)", () => {
    expect(shouldInjectBootstrap("session-abc", 0)).toBe(true);
  });

  it("returns false when there are prior user messages", () => {
    expect(shouldInjectBootstrap("session-abc", 1)).toBe(false);
    expect(shouldInjectBootstrap("session-abc", 5)).toBe(false);
  });

  it("returns true again for a different session ID", () => {
    // First session already injected
    expect(shouldInjectBootstrap("session-abc", 0)).toBe(true);
    // New session should also inject
    expect(shouldInjectBootstrap("session-xyz", 0)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildBootstrapContent
// ─────────────────────────────────────────────────────────────────────────────

describe("buildBootstrapContent", () => {
  const content = buildBootstrapContent("## Skill body\n\nFoo.", "## Tool mapping\n\nBar.");

  it("wraps content in EXTREMELY_IMPORTANT tags", () => {
    expect(content).toContain("<EXTREMELY_IMPORTANT>");
    expect(content).toContain("</EXTREMELY_IMPORTANT>");
  });

  it("includes the skill body", () => {
    expect(content).toContain("## Skill body");
    expect(content).toContain("Foo.");
  });

  it("includes the tool mapping", () => {
    expect(content).toContain("## Tool mapping");
    expect(content).toContain("Bar.");
  });

  it("contains Chinese text announcing superpowers", () => {
    expect(content).toMatch(/超级能力|superpowers/);
  });
});
