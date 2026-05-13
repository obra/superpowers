#!/usr/bin/env node
// generate-spec-html.mjs — render a L2 spec.md to spec.html (dual-artifact).
//
// Output guarantees (spec §4.4 + §11.2 #2):
//   - inline CSS, runtime 0 external deps (no CDN, no <script src=>)
//   - Mermaid blocks pre-rendered via `mmdc` (mermaid-cli) into inline <svg>
//     → spec.html is self-contained and offline-viewable
//   - sha256(spec.md) embedded in footer; spec-sync.yml CI verifies
//
// Mermaid rendering REQUIRES `mmdc` in PATH (build-time dep; not runtime).
// Failure to render → script exits non-zero (caller must install mmdc).
// Override (debug only, do not commit): pass --no-render-mermaid to keep
// <pre> source blocks instead.
//
// Usage:
//   node scripts/generate-spec-html.mjs docs/superpowers/specs/<slug>.md
//   node scripts/generate-spec-html.mjs <spec.md> --no-render-mermaid  # debug

import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileP = promisify(execFile);

const SECTION_COLOR = {
  "§1": "#2563eb", "§2": "#9333ea", "§3": "#059669",
  "§4": "#64748b", "§5": "#dc2626", "§6": "#0891b2",
  "§7": "#ca8a04", "§K": "#7c3aed",
};
const STATUS_COLOR = {
  draft: "#f59e0b", ratified: "#10b981", implementing: "#3b82f6",
  merged: "#8b5cf6", archived: "#6b7280", rejected: "#ef4444",
};
const TIER_COLOR = { Micro: "#10b981", Normal: "#3b82f6", Large: "#dc2626" };

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { fm: {}, body: md };
  const fm = {};
  const lines = m[1].split("\n");
  let key = null;
  for (const line of lines) {
    const top = line.match(/^([a-z_]+):\s*(.*)$/);
    if (top) {
      key = top[1];
      const v = top[2].trim();
      if (v === "") fm[key] = {};
      else if (v.startsWith("[") && v.endsWith("]"))
        fm[key] = v.slice(1, -1).split(",").map((x) => x.trim()).filter(Boolean);
      else fm[key] = v.replace(/^["']|["']$/g, "");
    } else if (line.match(/^  ([a-z_]+):\s*(.*)$/)) {
      const sub = line.match(/^  ([a-z_]+):\s*(.*)$/);
      if (typeof fm[key] === "object" && !Array.isArray(fm[key]))
        fm[key][sub[1]] = sub[2].replace(/^["']|["']$/g, "");
    } else if (line.match(/^  - /)) {
      if (!Array.isArray(fm[key])) fm[key] = [];
      fm[key].push(line.replace(/^  - /, "").trim());
    }
  }
  return { fm, body: m[2] };
}

function renderInline(s) {
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  return s;
}

function renderBody(body) {
  const lines = body.split("\n");
  const out = [];
  let i = 0;
  let currentSectionTag = null;
  let currentH3 = "";
  let inCollapsible = false;

  function closeCollapsible() {
    if (inCollapsible) {
      out.push("</div></details>");
      inCollapsible = false;
    }
  }

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("# ") && i < 5) { i++; continue; }

    const h2 = line.match(/^## (§[1-9K])\s*(.*)$/);
    if (h2) {
      closeCollapsible();
      const tag = h2[1];
      const rest = h2[2];
      currentSectionTag = tag;
      const color = SECTION_COLOR[tag] ?? "#475569";
      const collapsible = tag === "§4" || tag === "§7";
      if (collapsible) {
        out.push(`<details class="section" data-tag="${tag}" open><summary style="border-left:6px solid ${color}"><span class="tag" style="background:${color}">${tag}</span> ${escapeHtml(rest)}</summary><div class="section-body">`);
        inCollapsible = true;
      } else {
        out.push(`<section class="section" data-tag="${tag}"><h2 style="border-left:6px solid ${color}"><span class="tag" style="background:${color}">${tag}</span> ${escapeHtml(rest)}</h2>`);
      }
      i++; continue;
    }

    const h3 = line.match(/^### (.+)$/);
    if (h3) { currentH3 = h3[1]; out.push(`<h3>${escapeHtml(h3[1])}</h3>`); i++; continue; }

    if (line.startsWith("```mermaid")) {
      const buf = []; i++;
      while (i < lines.length && !lines[i].startsWith("```")) { buf.push(lines[i]); i++; }
      i++;
      out.push(`<pre class="mermaid"><code>${escapeHtml(buf.join("\n"))}</code></pre>`);
      continue;
    }

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf = []; i++;
      while (i < lines.length && !lines[i].startsWith("```")) { buf.push(lines[i]); i++; }
      i++;
      out.push(`<pre class="code lang-${escapeHtml(lang)}"><code>${escapeHtml(buf.join("\n"))}</code></pre>`);
      continue;
    }

    if (line.startsWith("> ")) {
      const buf = [line.slice(2)]; i++;
      while (i < lines.length && lines[i].startsWith("> ")) { buf.push(lines[i].slice(2)); i++; }
      out.push(`<blockquote>${renderInline(escapeHtml(buf.join(" ")))}</blockquote>`);
      continue;
    }

    if (currentSectionTag === "§5") {
      const bullet = line.match(/^- (.+)$/);
      if (bullet) {
        let cls = "diff-neutral";
        if (/ADDED/i.test(currentH3)) cls = "diff-added";
        else if (/MODIFIED/i.test(currentH3)) cls = "diff-modified";
        else if (/REMOVED/i.test(currentH3)) cls = "diff-removed";
        out.push(`<div class="${cls}">${renderInline(escapeHtml(bullet[1]))}</div>`);
        i++; continue;
      }
    }

    if (currentSectionTag === "§1") {
      const acMatch = line.match(/^- \[([ xX])\]\s*(AC-\S+)[：:]\s*(.+)$/);
      if (acMatch) {
        const checked = acMatch[1].trim().toLowerCase() === "x";
        out.push(`<label class="ac-card"><input type="checkbox" disabled${checked ? " checked" : ""}><span class="ac-id">${escapeHtml(acMatch[2])}</span> ${renderInline(escapeHtml(acMatch[3]))}</label>`);
        i++; continue;
      }
    }

    if (line.startsWith("- ")) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        buf.push(`<li>${renderInline(escapeHtml(lines[i].slice(2)))}</li>`);
        i++;
      }
      out.push(`<ul>${buf.join("")}</ul>`);
      continue;
    }

    if (line.trim() === "") { i++; continue; }
    out.push(`<p>${renderInline(escapeHtml(line))}</p>`);
    i++;
  }
  closeCollapsible();
  out.push("</section>");
  return out.join("\n");
}

function extractKReferences(body) {
  const m = body.match(/## §K[^\n]*\n([\s\S]*)$/);
  if (!m) return [];
  const refs = [];
  for (const line of m[1].split("\n")) {
    const r = line.match(/^- \*\*([^*]+)\*\* \(\[([^\]]+)\]\(([^)]+)\)\)\s*[—-]\s*(.+)$/);
    if (r) refs.push({ title: r[1], id: r[2], href: r[3], note: r[4] });
  }
  return refs;
}

const CSS = `
  :root { --bg:#fafaf9; --fg:#1c1917; --muted:#78716c; --border:#e7e5e4; --code-bg:#f5f5f4; }
  body { font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 920px; margin: 2rem auto; padding: 0 1.5rem; background: var(--bg); color: var(--fg); }
  h1 { font-size: 2rem; margin-bottom: .25rem; }
  .meta { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1.5rem; }
  .badge { display: inline-block; padding: .2rem .6rem; border-radius: 9999px; font-size: .85rem; color: white; font-weight: 600; }
  .section, details.section { margin: 2rem 0; padding: 1rem 1.25rem; background: white; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
  .section h2, details.section summary { font-size: 1.4rem; padding-left: .75rem; cursor: pointer; }
  details.section summary { list-style: none; }
  details.section[open] summary { margin-bottom: .75rem; }
  .tag { color: white; font-size: .8em; padding: .15em .5em; border-radius: 4px; margin-right: .5em; }
  h3 { font-size: 1.1rem; margin-top: 1.25rem; color: var(--muted); }
  blockquote { border-left: 4px solid #d6d3d1; padding-left: 1rem; color: var(--muted); margin: 1rem 0; }
  pre.code, pre.mermaid { background: var(--code-bg); padding: 1rem; border-radius: 6px; overflow-x: auto; font-size: .9em; }
  pre.mermaid { border-left: 3px solid #059669; }
  pre.mermaid::before { content: "mermaid diagram (source preserved; render with mmdc if needed)"; display: block; font-size: .7em; color: #059669; margin-bottom: .5em; }
  .mermaid-rendered { background: white; padding: 1rem; border-radius: 6px; border: 1px solid var(--border); }
  code { background: var(--code-bg); padding: .1em .3em; border-radius: 3px; font-size: .9em; }
  ul { padding-left: 1.5rem; }
  .ac-card { display: flex; align-items: flex-start; gap: .5rem; padding: .5rem .75rem; margin: .25rem 0; background: #f0f9ff; border-left: 3px solid #0284c7; border-radius: 4px; cursor: default; }
  .ac-id { font-weight: 600; color: #0369a1; }
  .diff-added { padding: .25rem .75rem; margin: .15rem 0; background: #ecfdf5; border-left: 3px solid #10b981; }
  .diff-modified { padding: .25rem .75rem; margin: .15rem 0; background: #fef9c3; border-left: 3px solid #ca8a04; }
  .diff-removed { padding: .25rem .75rem; margin: .15rem 0; background: #fee2e2; border-left: 3px solid #ef4444; text-decoration: line-through; }
  .diff-neutral { padding: .25rem .75rem; }
  .knowledge-footer { margin-top: 3rem; padding: 1.5rem; background: #f5f3ff; border-radius: 8px; }
  .knowledge-footer h2 { color: #6d28d9; margin-bottom: 1rem; }
  .knowledge-ref { padding: .75rem; margin: .5rem 0; background: white; border-left: 3px solid #7c3aed; border-radius: 4px; }
  .knowledge-ref .ref-id { font-family: monospace; font-size: .8em; color: var(--muted); }
  footer.spec-meta { margin-top: 3rem; padding: 1rem 0; border-top: 1px solid var(--border); font-size: .8rem; color: var(--muted); }
`;

async function renderMermaid(source) {
  const tmpIn = path.join(process.cwd(), `.mermaid-${process.pid}-${Date.now()}.mmd`);
  const tmpOut = tmpIn.replace(/\.mmd$/, ".svg");
  try {
    await fs.writeFile(tmpIn, source, "utf-8");
    await execFileP("mmdc", ["-i", tmpIn, "-o", tmpOut, "-b", "transparent", "--quiet"]);
    const svg = await fs.readFile(tmpOut, "utf-8");
    return svg
      .replace(/(id|aria-roledescription)="[^"]*"/g, "")
      .replace(/<style[\s\S]*?<\/style>/g, '<style class="mermaid-inline-css"></style>')
      .replace(/\s+/g, " ").trim();
  } finally {
    await fs.unlink(tmpIn).catch(() => {});
    await fs.unlink(tmpOut).catch(() => {});
  }
}

async function postProcessMermaid(html, render) {
  const re = /<pre class="mermaid"><code>([\s\S]*?)<\/code><\/pre>/g;
  const matches = [...html.matchAll(re)];
  if (matches.length === 0) return html;
  if (!render) {
    process.stderr.write(
      `⚠️  --no-render-mermaid: ${matches.length} mermaid block(s) left as source.\n` +
        `   DO NOT COMMIT this output — spec §11.2 #2 requires rendered diagrams.\n`,
    );
    return html;
  }
  let result = html;
  for (const m of matches) {
    const source = m[1]
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    let svg;
    try {
      svg = await renderMermaid(source);
    } catch (e) {
      process.stderr.write(
        `✗ mmdc render failed for mermaid block.\n` +
          `   Ensure mmdc is installed: npm install -g @mermaid-js/mermaid-cli\n` +
          `   error: ${e.message}\n`,
      );
      process.exit(2);
    }
    result = result.replace(m[0], `<div class="mermaid-rendered">${svg}</div>`);
  }
  return result;
}

async function main() {
  const inFile = process.argv[2];
  const render = !process.argv.includes("--no-render-mermaid");
  if (!inFile || inFile.startsWith("--")) {
    console.error("usage: generate-spec-html.mjs <spec.md> [--no-render-mermaid (debug only)]");
    process.exit(1);
  }
  const absIn = path.resolve(inFile);
  const md = await fs.readFile(absIn, "utf-8");
  const { fm, body } = parseFrontmatter(md);

  const title = (body.match(/^# (.+)$/m) ?? [, "Untitled Spec"])[1];
  const statusColor = STATUS_COLOR[fm.status] ?? "#64748b";
  const tierColor = TIER_COLOR[fm.tier] ?? "#64748b";

  const ownerBadges = fm.owners
    ? Object.entries(fm.owners)
        .map(([role, who]) => `<span class="badge" style="background:#475569">${role}: ${escapeHtml(who)}</span>`)
        .join("")
    : "";

  const refs = extractKReferences(body);
  const footerRefs = refs.length
    ? `<aside class="knowledge-footer"><h2>§K · Knowledge References</h2>${refs
        .map((r) => `<div class="knowledge-ref"><a href="${escapeHtml(r.href)}"><strong>${escapeHtml(r.title)}</strong></a> <span class="ref-id">${escapeHtml(r.id)}</span><div>${renderInline(escapeHtml(r.note))}</div></div>`)
        .join("")}</aside>`
    : "";

  const renderedBody = renderBody(body);
  const sha = crypto.createHash("sha256").update(md, "utf-8").digest("hex");

  let html = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>${CSS}</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<div class="meta">
  <span class="badge" style="background:${statusColor}">status: ${escapeHtml(fm.status ?? "—")}</span>
  <span class="badge" style="background:${tierColor}">tier: ${escapeHtml(fm.tier ?? "—")}</span>
  <span class="badge" style="background:#475569">change_id: ${escapeHtml(fm.change_id ?? "—")}</span>
  <span class="badge" style="background:#475569">role: ${escapeHtml(fm.role ?? "—")}</span>
  ${ownerBadges}
</div>
${renderedBody}
${footerRefs}
<footer class="spec-meta">
  Generated from <code>${escapeHtml(path.basename(absIn))}</code> · sha256: <code>${sha}</code>
</footer>
</body>
</html>
`;

  html = await postProcessMermaid(html, render);

  const outFile = absIn.replace(/\.md$/, ".html");
  await fs.writeFile(outFile, html, "utf-8");
  console.log(`✓ wrote ${outFile}`);
  console.log(`  sha256(${path.basename(absIn)}) = ${sha}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
