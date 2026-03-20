#!/usr/bin/env node

/**
 * Superpowers Documentation Site Generator
 *
 * Zero-dependency static site generator that converts skill files
 * into a browsable, offline-capable documentation site.
 *
 * Usage: node scripts/generate-docs.js
 * Output: site/
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const OUTPUT_DIR = path.join(ROOT, 'site');

// ========== Markdown Parser ==========

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Apply inline formatting: bold, italic, code, links */
function inlineFmt(text) {
  // Inline code first (protect from other formatting)
  const codes = [];
  text = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `\x00CODE${codes.length - 1}\x00`;
  });

  // Links: [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Bold + italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // Restore inline code
  text = text.replace(/\x00CODE(\d+)\x00/g, (_, i) => `<code>${escapeHtml(codes[i])}</code>`);

  return text;
}

/** Convert markdown string to HTML */
function markdownToHtml(md) {
  // Strip frontmatter
  md = md.replace(/^---\n[\s\S]*?\n---\n?/, '');

  const lines = md.split('\n');
  const out = [];
  let i = 0;

  function closeBlock(tag) {
    if (out.length && out[out.length - 1] === '') out.pop();
    out.push(`</${tag}>`);
  }

  let inCode = false, codeLang = '', codeLines = [], codeFence = '```';
  let inList = null; // 'ul' or 'ol'
  let inTable = false;
  let inBlockquote = false;
  let paragraph = [];

  function flushParagraph() {
    if (paragraph.length) {
      const text = paragraph.join(' ').trim();
      if (text) out.push(`<p>${inlineFmt(text)}</p>`);
      paragraph = [];
    }
  }

  function closeList() {
    if (inList) { closeBlock(inList); inList = null; }
  }

  function closeTable() {
    if (inTable) { out.push('</tbody></table>'); inTable = false; }
  }

  function closeBlockquote() {
    if (inBlockquote) { closeBlock('blockquote'); inBlockquote = false; }
  }

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks (``` or ````)
    const fenceMatch = line.match(/^(`{3,})(.*)/);
    if (fenceMatch) {
      if (!inCode) {
        flushParagraph(); closeList(); closeTable(); closeBlockquote();
        inCode = true;
        codeFence = fenceMatch[1];
        codeLang = fenceMatch[2].trim();
        codeLines = [];
        i++; continue;
      } else if (line.startsWith(codeFence)) {
        const cls = codeLang ? ` class="language-${escapeHtml(codeLang)}"` : '';
        const label = codeLang === 'dot' ? '<div class="code-label">Graphviz DOT (process flow)</div>' : '';
        out.push(`${label}<pre><code${cls}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        inCode = false; codeLang = ''; codeLines = [];
        i++; continue;
      }
    }
    if (inCode) { codeLines.push(line); i++; continue; }

    // Empty line
    if (line.trim() === '') {
      flushParagraph(); closeList(); closeTable(); closeBlockquote();
      i++; continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushParagraph(); closeList(); closeTable();
      out.push('<hr>');
      i++; continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      flushParagraph(); closeList(); closeTable(); closeBlockquote();
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      out.push(`<h${level} id="${id}">${inlineFmt(text)}</h${level}>`);
      i++; continue;
    }

    // Table
    const tableMatch = line.match(/^\|(.+)\|$/);
    if (tableMatch) {
      flushParagraph(); closeList(); closeBlockquote();
      const cells = tableMatch[1].split('|').map(c => c.trim());
      // Separator row
      if (cells.every(c => /^[-:]+$/.test(c))) { i++; continue; }
      if (!inTable) {
        out.push('<table><thead><tr>');
        cells.forEach(c => out.push(`<th>${inlineFmt(c)}</th>`));
        out.push('</tr></thead><tbody>');
        inTable = true;
      } else {
        out.push('<tr>');
        cells.forEach(c => out.push(`<td>${inlineFmt(c)}</td>`));
        out.push('</tr>');
      }
      i++; continue;
    }

    // Blockquote
    const bqMatch = line.match(/^>\s?(.*)/);
    if (bqMatch) {
      flushParagraph(); closeList(); closeTable();
      if (!inBlockquote) { out.push('<blockquote>'); inBlockquote = true; }
      out.push(`<p>${inlineFmt(bqMatch[1])}</p>`);
      i++; continue;
    }

    // Task list items (- [ ] or - [x])
    const taskMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.*)/);
    if (taskMatch) {
      flushParagraph(); closeTable(); closeBlockquote();
      if (inList !== 'ul') { closeList(); out.push('<ul class="task-list">'); inList = 'ul'; }
      const checked = taskMatch[1] !== ' ' ? ' checked disabled' : ' disabled';
      out.push(`<li><input type="checkbox"${checked}> ${inlineFmt(taskMatch[2])}</li>`);
      i++; continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*]\s+(.*)/);
    if (ulMatch) {
      flushParagraph(); closeTable(); closeBlockquote();
      if (inList !== 'ul') { closeList(); out.push('<ul>'); inList = 'ul'; }
      out.push(`<li>${inlineFmt(ulMatch[1])}</li>`);
      i++; continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.*)/);
    if (olMatch) {
      flushParagraph(); closeTable(); closeBlockquote();
      if (inList !== 'ol') { closeList(); out.push('<ol>'); inList = 'ol'; }
      out.push(`<li>${inlineFmt(olMatch[1])}</li>`);
      i++; continue;
    }

    // HTML pass-through (custom tags like <HARD-GATE>, <Good>, etc.)
    if (line.match(/^<\/?[A-Z]/)) {
      flushParagraph();
      const tag = line.match(/<\/?([A-Z][A-Z_-]*)/)?.[1];
      if (tag) {
        if (line.startsWith('</')) {
          out.push('</div>');
        } else {
          out.push(`<div class="custom-block custom-block-${tag.toLowerCase()}">`);
          const inner = line.replace(/<[^>]+>/, '').replace(/<\/[^>]+>$/, '').trim();
          if (inner) out.push(`<p class="block-label">${escapeHtml(tag)}</p><p>${inlineFmt(inner)}</p>`);
          else out.push(`<p class="block-label">${escapeHtml(tag)}</p>`);
          // If self-closing on same line
          if (line.includes('</')) out.push('</div>');
        }
      }
      i++; continue;
    }

    // Regular text → paragraph
    paragraph.push(line);
    i++;
  }

  // Close unclosed code block
  if (inCode) {
    out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  }
  flushParagraph(); closeList(); closeTable(); closeBlockquote();

  return out.join('\n');
}

// ========== Frontmatter Parser ==========

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      meta[key] = val;
    }
  }
  return { meta, body: match[2] };
}

// ========== Skill Discovery ==========

function discoverSkills() {
  const skills = [];
  const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  for (const dir of dirs) {
    const skillFile = path.join(SKILLS_DIR, dir, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;

    const raw = fs.readFileSync(skillFile, 'utf-8');
    const { meta, body } = parseFrontmatter(raw);

    // Find supporting files
    const supportFiles = [];
    const allFiles = walkDir(path.join(SKILLS_DIR, dir));
    for (const f of allFiles) {
      const rel = path.relative(path.join(SKILLS_DIR, dir), f);
      if (rel === 'SKILL.md') continue;
      if (rel.endsWith('.md')) {
        const content = fs.readFileSync(f, 'utf-8');
        const { meta: fMeta } = parseFrontmatter(content);
        supportFiles.push({
          path: rel,
          name: fMeta.name || path.basename(rel, '.md'),
          content
        });
      }
    }

    skills.push({
      slug: dir,
      name: meta.name || dir,
      description: meta.description || '',
      body,
      supportFiles,
      category: categorize(dir)
    });
  }
  return skills;
}

function walkDir(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip scripts, node_modules, etc.
      if (['scripts', 'node_modules', '.git'].includes(entry.name)) continue;
      results.push(...walkDir(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function categorize(slug) {
  const categories = {
    'Workflow': ['brainstorming', 'writing-plans', 'executing-plans', 'subagent-driven-development', 'finishing-a-development-branch', 'using-git-worktrees'],
    'Quality': ['test-driven-development', 'systematic-debugging', 'verification-before-completion'],
    'Collaboration': ['requesting-code-review', 'receiving-code-review', 'dispatching-parallel-agents'],
    'Meta': ['using-superpowers', 'writing-skills']
  };
  for (const [cat, slugs] of Object.entries(categories)) {
    if (slugs.includes(slug)) return cat;
  }
  return 'Other';
}

// ========== CSS Theme ==========

const CSS = `
:root {
  --bg-primary: #f8f9fa;
  --bg-secondary: #ffffff;
  --bg-tertiary: #e9ecef;
  --bg-code: #f1f3f5;
  --border: #dee2e6;
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --text-tertiary: #adb5bd;
  --accent: #0071e3;
  --accent-hover: #005bb5;
  --accent-light: #e8f4fd;
  --success: #2d9c3c;
  --warning: #e67700;
  --error: #d63031;
  --sidebar-width: 280px;
  --header-height: 56px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1a1a2e;
    --bg-secondary: #16213e;
    --bg-tertiary: #0f3460;
    --bg-code: #1c2541;
    --border: #2d3a5c;
    --text-primary: #e6e6e6;
    --text-secondary: #a0a0b0;
    --text-tertiary: #6c6c80;
    --accent: #4da6ff;
    --accent-hover: #80bfff;
    --accent-light: rgba(77, 166, 255, 0.12);
    --success: #4caf50;
    --warning: #ffa726;
    --error: #ef5350;
  }
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.7;
  font-size: 15px;
}

a { color: var(--accent); text-decoration: none; }
a:hover { color: var(--accent-hover); text-decoration: underline; }

/* ===== LAYOUT ===== */
.page-header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  height: var(--header-height);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; padding: 0 1.5rem;
  gap: 1rem;
}
.page-header .logo {
  font-weight: 700; font-size: 1.1rem;
  color: var(--text-primary);
}
.page-header .logo span { color: var(--accent); }
.page-header .version {
  font-size: 0.75rem; color: var(--text-secondary);
  background: var(--bg-tertiary); padding: 2px 8px; border-radius: 10px;
}
.menu-toggle {
  display: none; background: none; border: none; cursor: pointer;
  color: var(--text-primary); font-size: 1.4rem; padding: 0.25rem;
}

.sidebar {
  position: fixed; top: var(--header-height); left: 0; bottom: 0;
  width: var(--sidebar-width);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  overflow-y: auto;
  padding: 1rem 0;
}
.sidebar-section { margin-bottom: 0.5rem; }
.sidebar-section h3 {
  font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--text-tertiary); padding: 0.5rem 1.25rem; font-weight: 600;
}
.sidebar a {
  display: block; padding: 0.35rem 1.25rem; font-size: 0.88rem;
  color: var(--text-secondary); border-left: 3px solid transparent;
  transition: all 0.15s;
}
.sidebar a:hover { color: var(--text-primary); background: var(--accent-light); text-decoration: none; }
.sidebar a.active {
  color: var(--accent); border-left-color: var(--accent);
  background: var(--accent-light); font-weight: 500;
}

.main {
  margin-left: var(--sidebar-width);
  margin-top: var(--header-height);
  padding: 2rem 3rem 4rem;
  max-width: 900px;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .menu-toggle { display: block; }
  .sidebar { transform: translateX(-100%); transition: transform 0.2s; z-index: 99; }
  .sidebar.open { transform: translateX(0); }
  .main { margin-left: 0; padding: 1.5rem 1rem 3rem; }
}

/* ===== CONTENT ===== */
.main h1 { font-size: 2rem; margin-bottom: 0.5rem; font-weight: 700; }
.main h2 { font-size: 1.5rem; margin: 2rem 0 0.75rem; padding-top: 1rem; border-top: 1px solid var(--border); font-weight: 600; }
.main h3 { font-size: 1.15rem; margin: 1.5rem 0 0.5rem; font-weight: 600; }
.main h4 { font-size: 1rem; margin: 1.25rem 0 0.4rem; font-weight: 600; }
.main h2:first-of-type { border-top: none; padding-top: 0; }

.main p { margin-bottom: 0.8rem; }
.main ul, .main ol { margin: 0.5rem 0 0.8rem 1.5rem; }
.main li { margin-bottom: 0.3rem; }
.main li > ul, .main li > ol { margin-top: 0.2rem; margin-bottom: 0.2rem; }
.main hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
.main blockquote {
  border-left: 4px solid var(--accent);
  padding: 0.5rem 1rem; margin: 0.8rem 0;
  background: var(--accent-light);
  border-radius: 0 6px 6px 0;
}
.main blockquote p { margin-bottom: 0.3rem; }

.main code {
  font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', 'Cascadia Code', Consolas, monospace;
  font-size: 0.88em; background: var(--bg-code); padding: 2px 6px; border-radius: 4px;
}
.main pre {
  background: var(--bg-code); border: 1px solid var(--border);
  border-radius: 8px; padding: 1rem 1.25rem;
  overflow-x: auto; margin: 0.8rem 0; line-height: 1.5;
}
.main pre code { background: none; padding: 0; font-size: 0.85em; }

.code-label {
  font-size: 0.75rem; color: var(--text-tertiary);
  margin-bottom: 0.25rem; font-style: italic;
}

.main table {
  border-collapse: collapse; width: 100%;
  margin: 0.8rem 0; font-size: 0.9rem;
}
.main th, .main td {
  padding: 0.5rem 0.75rem; text-align: left;
  border: 1px solid var(--border);
}
.main th { background: var(--bg-tertiary); font-weight: 600; }
.main tr:nth-child(even) { background: var(--bg-code); }

.main .task-list { list-style: none; margin-left: 0; }
.main .task-list li { display: flex; align-items: baseline; gap: 0.4rem; }
.main .task-list input { margin-right: 0.25rem; }

/* Custom blocks */
.custom-block {
  border-left: 4px solid var(--warning);
  background: rgba(230, 119, 0, 0.08);
  padding: 0.75rem 1rem; margin: 0.8rem 0;
  border-radius: 0 6px 6px 0;
}
.custom-block .block-label {
  font-weight: 700; font-size: 0.8rem; text-transform: uppercase;
  letter-spacing: 0.05em; color: var(--warning); margin-bottom: 0.25rem;
}
.custom-block-hard-gate { border-left-color: var(--error); background: rgba(214, 48, 49, 0.06); }
.custom-block-hard-gate .block-label { color: var(--error); }

/* ===== SKILL DESCRIPTION ===== */
.skill-meta {
  background: var(--accent-light); border: 1px solid var(--border);
  border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.5rem;
  font-size: 0.9rem;
}
.skill-meta strong { color: var(--accent); }

/* ===== SUPPORT FILES ===== */
.support-files {
  background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: 8px; padding: 1rem 1.25rem; margin-top: 2rem;
}
.support-files h3 { margin-top: 0; font-size: 1rem; }
.support-files ul { margin-bottom: 0; }

/* ===== INDEX PAGE ===== */
.hero {
  text-align: center; padding: 2rem 0 2.5rem;
}
.hero h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
.hero p { color: var(--text-secondary); font-size: 1.1rem; max-width: 600px; margin: 0 auto; }

.skill-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem; margin: 1rem 0 2rem;
}
.skill-card {
  background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: 10px; padding: 1.25rem;
  transition: all 0.15s; display: block; color: inherit;
}
.skill-card:hover {
  border-color: var(--accent); transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08); text-decoration: none;
}
.skill-card h3 { font-size: 1rem; margin-bottom: 0.35rem; color: var(--accent); }
.skill-card p { font-size: 0.85rem; color: var(--text-secondary); margin: 0; }
.skill-card .badge {
  display: inline-block; font-size: 0.7rem; padding: 1px 8px;
  border-radius: 8px; background: var(--bg-tertiary);
  color: var(--text-secondary); margin-bottom: 0.5rem;
}

.workflow-steps {
  counter-reset: step;
  list-style: none; margin-left: 0; padding: 0;
}
.workflow-steps li {
  counter-increment: step;
  position: relative;
  padding: 1rem 1rem 1rem 3.5rem;
  margin-bottom: 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.workflow-steps li::before {
  content: counter(step);
  position: absolute; left: 1rem; top: 1rem;
  width: 1.75rem; height: 1.75rem;
  background: var(--accent); color: white;
  border-radius: 50%; display: flex;
  align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.85rem;
}
.workflow-steps li strong { color: var(--accent); }

.philosophy {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem; margin: 1rem 0;
}
.philosophy-item {
  background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: 8px; padding: 1rem; text-align: center;
}
.philosophy-item .icon { font-size: 1.5rem; margin-bottom: 0.4rem; }
.philosophy-item h4 { font-size: 0.9rem; margin-bottom: 0.25rem; }
.philosophy-item p { font-size: 0.8rem; color: var(--text-secondary); margin: 0; }
`;

// ========== HTML Templates ==========

function htmlShell(title, content, activeSlug, skills) {
  const categories = {};
  for (const s of skills) {
    (categories[s.category] = categories[s.category] || []).push(s);
  }
  const categoryOrder = ['Workflow', 'Quality', 'Collaboration', 'Meta'];

  const sidebarHtml = categoryOrder.map(cat => {
    const items = categories[cat] || [];
    return `
      <div class="sidebar-section">
        <h3>${escapeHtml(cat)}</h3>
        ${items.map(s =>
          `<a href="skills/${s.slug}.html"${s.slug === activeSlug ? ' class="active"' : ''}>${escapeHtml(s.name)}</a>`
        ).join('\n        ')}
      </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} - Superpowers Docs</title>
  <style>${CSS}</style>
</head>
<body>
  <header class="page-header">
    <button class="menu-toggle" onclick="document.querySelector('.sidebar').classList.toggle('open')" aria-label="Toggle menu">&#9776;</button>
    <a href="index.html" class="logo"><span>&#9889;</span> Superpowers</a>
    <span class="version">v5.0.5</span>
  </header>

  <nav class="sidebar">
    <div class="sidebar-section">
      <a href="index.html"${activeSlug === '_index' ? ' class="active"' : ''}>Overview</a>
    </div>
${sidebarHtml}
  </nav>

  <div class="main">
${content}
  </div>

  <script>
    // Close sidebar on navigation (mobile)
    document.querySelectorAll('.sidebar a').forEach(a => {
      a.addEventListener('click', () => document.querySelector('.sidebar').classList.remove('open'));
    });
  </script>
</body>
</html>`;
}

function generateIndexPage(skills) {
  const categories = {};
  for (const s of skills) {
    (categories[s.category] = categories[s.category] || []).push(s);
  }
  const categoryOrder = ['Workflow', 'Quality', 'Collaboration', 'Meta'];

  let cardsHtml = '';
  for (const cat of categoryOrder) {
    const items = categories[cat] || [];
    cardsHtml += `<h3>${cat}</h3>\n<div class="skill-grid">\n`;
    for (const s of items) {
      cardsHtml += `  <a href="skills/${s.slug}.html" class="skill-card">
    <span class="badge">${escapeHtml(s.category)}</span>
    <h3>${escapeHtml(s.name)}</h3>
    <p>${escapeHtml(s.description.replace(/^["']|["']$/g, ''))}</p>
  </a>\n`;
    }
    cardsHtml += '</div>\n';
  }

  const content = `
    <div class="hero">
      <h1>Superpowers</h1>
      <p>A complete software development workflow for coding agents, built on composable skills.</p>
    </div>

    <h2 id="workflow">The Workflow</h2>
    <ol class="workflow-steps">
      <li><strong>brainstorming</strong> &mdash; Refines ideas through questions, explores alternatives, presents design in sections for validation.</li>
      <li><strong>using-git-worktrees</strong> &mdash; Creates isolated workspace on new branch, runs project setup, verifies clean test baseline.</li>
      <li><strong>writing-plans</strong> &mdash; Breaks work into bite-sized tasks (2&ndash;5 minutes each). Every task has exact file paths, code, verification steps.</li>
      <li><strong>subagent-driven-development</strong> &mdash; Dispatches fresh subagent per task with two-stage review (spec compliance, then code quality).</li>
      <li><strong>test-driven-development</strong> &mdash; Enforces RED-GREEN-REFACTOR: write failing test, minimal code, commit.</li>
      <li><strong>requesting-code-review</strong> &mdash; Reviews against plan, reports issues by severity. Critical issues block progress.</li>
      <li><strong>finishing-a-development-branch</strong> &mdash; Verifies tests, presents options (merge/PR/keep/discard), cleans up worktree.</li>
    </ol>

    <h2 id="skills">Skills Library</h2>
    ${cardsHtml}

    <h2 id="philosophy">Philosophy</h2>
    <div class="philosophy">
      <div class="philosophy-item">
        <div class="icon">&#128300;</div>
        <h4>Test-Driven</h4>
        <p>Write tests first, always</p>
      </div>
      <div class="philosophy-item">
        <div class="icon">&#9881;</div>
        <h4>Systematic</h4>
        <p>Process over guessing</p>
      </div>
      <div class="philosophy-item">
        <div class="icon">&#10024;</div>
        <h4>Simplicity</h4>
        <p>Complexity reduction as primary goal</p>
      </div>
      <div class="philosophy-item">
        <div class="icon">&#9989;</div>
        <h4>Evidence</h4>
        <p>Verify before declaring success</p>
      </div>
    </div>

    <h2 id="platforms">Supported Platforms</h2>
    <table>
      <thead><tr><th>Platform</th><th>Install Method</th></tr></thead>
      <tbody>
        <tr><td>Claude Code</td><td><code>/plugin install superpowers@claude-plugins-official</code></td></tr>
        <tr><td>Cursor</td><td><code>/add-plugin superpowers</code></td></tr>
        <tr><td>OpenCode</td><td>Plugin module (see docs)</td></tr>
        <tr><td>Codex</td><td>Manual install (see docs)</td></tr>
        <tr><td>Gemini CLI</td><td><code>gemini extensions install</code></td></tr>
      </tbody>
    </table>
  `;

  return htmlShell('Overview', content, '_index', skills);
}

function generateSkillPage(skill, allSkills) {
  const bodyHtml = markdownToHtml(skill.body);

  let supportHtml = '';
  if (skill.supportFiles.length > 0) {
    const items = skill.supportFiles.map(f =>
      `<li><strong>${escapeHtml(f.path)}</strong> &mdash; ${escapeHtml(f.name)}</li>`
    ).join('\n');
    supportHtml = `
    <div class="support-files">
      <h3>Supporting Files</h3>
      <ul>${items}</ul>
    </div>`;
  }

  const content = `
    <div class="skill-meta">
      <strong>Skill:</strong> ${escapeHtml(skill.name)} &nbsp;|&nbsp;
      <strong>Category:</strong> ${escapeHtml(skill.category)} &nbsp;|&nbsp;
      <strong>Trigger:</strong> ${escapeHtml(skill.description.replace(/^["']|["']$/g, ''))}
    </div>
    ${bodyHtml}
    ${supportHtml}
  `;

  // Skill pages are in site/skills/, so adjust paths
  return htmlShell(skill.name, content, skill.slug, allSkills)
    .replace(/href="index\.html"/g, 'href="../index.html"')
    .replace(/href="skills\//g, 'href="');
}

// ========== Site Generator ==========

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function generate() {
  console.log('Discovering skills...');
  const skills = discoverSkills();
  console.log(`Found ${skills.length} skills.`);

  // Clean and create output dirs
  if (fs.existsSync(OUTPUT_DIR)) fs.rmSync(OUTPUT_DIR, { recursive: true });
  ensureDir(OUTPUT_DIR);
  ensureDir(path.join(OUTPUT_DIR, 'skills'));

  // Generate index
  console.log('Generating index page...');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), generateIndexPage(skills));

  // Generate skill pages
  for (const skill of skills) {
    console.log(`  Generating: ${skill.name}`);
    const html = generateSkillPage(skill, skills);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'skills', `${skill.slug}.html`), html);
  }

  console.log(`\nDone! Site generated at: ${OUTPUT_DIR}/`);
  console.log(`Open ${path.join(OUTPUT_DIR, 'index.html')} in a browser to view.`);
}

generate();
