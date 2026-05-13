#!/usr/bin/env node
import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileP = promisify(execFile);

const REPO_ROOT = new URL("..", import.meta.url).pathname;
const SCRIPT = path.join(REPO_ROOT, "templates/scripts-generate-spec-html.mjs");
const FIXTURE = path.join(REPO_ROOT, "templates/spec-html-fixture.md");
const EXPECTED = path.join(REPO_ROOT, "templates/spec-html-fixture.expected.html");

function normalize(html) {
  return html
    .replace(/Generated from <code>[^<]+<\/code>/, "Generated from <code>FIXTURE</code>")
    .replace(/<svg[\s\S]*?<\/svg>/g, "<svg>[NORMALIZED-SVG]</svg>");
}

test("generator output matches frozen snapshot baseline (svg-normalized)", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "gen-html-test-"));
  const tmpMd = path.join(tmp, "fixture.md");
  await fs.copyFile(FIXTURE, tmpMd);
  await execFileP("node", [SCRIPT, tmpMd]);
  const actual = await fs.readFile(tmpMd.replace(/\.md$/, ".html"), "utf-8");
  const expected = await fs.readFile(EXPECTED, "utf-8");
  assert.equal(
    normalize(actual),
    normalize(expected),
    "snapshot drift — review diff, then update expected.html if intentional",
  );
});

test("generator output contains no external resources", async () => {
  const html = await fs.readFile(EXPECTED, "utf-8");
  const externalPatterns = [
    /<script[^>]*src=/i,
    /<link[^>]*href=["'][^"']*\/\//i,
    /cdn\.[a-z]+\.[a-z]+/i,
  ];
  for (const p of externalPatterns) {
    assert.equal(p.test(html), false, `external resource matched ${p}`);
  }
});

test("generator output renders Mermaid to inline SVG (no source blocks)", async () => {
  const html = await fs.readFile(EXPECTED, "utf-8");
  const preBlocks = (html.match(/<pre class="mermaid">/g) ?? []).length;
  const svgBlocks = (html.match(/<div class="mermaid-rendered">/g) ?? []).length;
  assert.equal(preBlocks, 0, "no mermaid source blocks expected in committed output");
  assert.ok(svgBlocks >= 1, `expected ≥1 rendered mermaid block, got ${svgBlocks}`);
  assert.match(html, /<svg/, "rendered output must contain <svg> element");
});
