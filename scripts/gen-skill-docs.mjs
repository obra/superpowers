#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const ROOT = path.resolve(import.meta.dirname, '..');
export const SKILLS_DIR = path.join(ROOT, 'skills');
export const GENERATOR_CMD = 'node scripts/gen-skill-docs.mjs';

export function buildRootDetection() {
  return [
    '_IS_SUPERPOWERS_RUNTIME_ROOT() {',
    '  local candidate="$1"',
    '  [ -n "$candidate" ] &&',
    '  [ -x "$candidate/bin/superpowers-update-check" ] &&',
    '  [ -x "$candidate/bin/superpowers-config" ] &&',
    '  [ -f "$candidate/VERSION" ]',
    '}',
    '_REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)',
    '_BRANCH_RAW=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo current)',
    '[ -n "$_BRANCH_RAW" ] || _BRANCH_RAW="current"',
    '[ "$_BRANCH_RAW" != "HEAD" ] || _BRANCH_RAW="current"',
    '_BRANCH="$_BRANCH_RAW"',
    '_SUPERPOWERS_ROOT=""',
    '_IS_SUPERPOWERS_RUNTIME_ROOT "$_REPO_ROOT" && _SUPERPOWERS_ROOT="$_REPO_ROOT"',
    '[ -z "$_SUPERPOWERS_ROOT" ] && _IS_SUPERPOWERS_RUNTIME_ROOT "$HOME/.superpowers/install" && _SUPERPOWERS_ROOT="$HOME/.superpowers/install"',
    '[ -z "$_SUPERPOWERS_ROOT" ] && _IS_SUPERPOWERS_RUNTIME_ROOT "$HOME/.codex/superpowers" && _SUPERPOWERS_ROOT="$HOME/.codex/superpowers"',
    '[ -z "$_SUPERPOWERS_ROOT" ] && _IS_SUPERPOWERS_RUNTIME_ROOT "$HOME/.copilot/superpowers" && _SUPERPOWERS_ROOT="$HOME/.copilot/superpowers"',
  ];
}

export function buildBaseShellLines() {
  return [
    ...buildRootDetection(),
    '_UPD=""',
    '[ -n "$_SUPERPOWERS_ROOT" ] && _UPD=$("$_SUPERPOWERS_ROOT/bin/superpowers-update-check" 2>/dev/null || true)',
    '[ -n "$_UPD" ] && echo "$_UPD" || true',
    '_SP_STATE_DIR="${SUPERPOWERS_STATE_DIR:-$HOME/.superpowers}"',
    'mkdir -p "$_SP_STATE_DIR/sessions"',
    'touch "$_SP_STATE_DIR/sessions/$PPID"',
    '_SESSIONS=$(find "$_SP_STATE_DIR/sessions" -mmin -120 -type f 2>/dev/null | wc -l | tr -d \' \')',
    'find "$_SP_STATE_DIR/sessions" -mmin +120 -type f -delete 2>/dev/null || true',
    '_CONTRIB=""',
    '[ -n "$_SUPERPOWERS_ROOT" ] && _CONTRIB=$("$_SUPERPOWERS_ROOT/bin/superpowers-config" get superpowers_contributor 2>/dev/null || true)',
  ];
}

export function buildUsingSuperpowersShellLines() {
  return [
    ...buildRootDetection(),
    '_SP_STATE_DIR="${SUPERPOWERS_STATE_DIR:-$HOME/.superpowers}"',
    '_SP_USING_SUPERPOWERS_DECISION_DIR="$_SP_STATE_DIR/session-flags/using-superpowers"',
    '_SP_USING_SUPERPOWERS_DECISION_PATH="$_SP_USING_SUPERPOWERS_DECISION_DIR/$PPID"',
  ];
}

export function buildReviewShellLines() {
  return [
    ...buildBaseShellLines(),
    '_TODOS_FORMAT=""',
    '[ -n "$_SUPERPOWERS_ROOT" ] && [ -f "$_SUPERPOWERS_ROOT/review/TODOS-format.md" ] && _TODOS_FORMAT="$_SUPERPOWERS_ROOT/review/TODOS-format.md"',
    '[ -z "$_TODOS_FORMAT" ] && [ -f "$_REPO_ROOT/review/TODOS-format.md" ] && _TODOS_FORMAT="$_REPO_ROOT/review/TODOS-format.md"',
  ];
}

export function buildUpgradeNote() {
  return 'If output shows `UPGRADE_AVAILABLE <old> <new>`: read the installed `superpowers-upgrade/SKILL.md` from the same superpowers root (check the current repo when it contains the Superpowers runtime, then `$HOME/.superpowers/install`, then `$HOME/.codex/superpowers`, then `$HOME/.copilot/superpowers`) and follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise ask one interactive user question with 4 options and write snooze state if declined). If `JUST_UPGRADED <from> <to>`: tell the user "Running superpowers v{to} (just updated!)" and continue.';
}

export function buildSearchBeforeBuildingSection() {
  return `## Search Before Building

Before introducing a custom pattern, external service, concurrency primitive, auth/session flow, cache, queue, browser workaround, or unfamiliar fix pattern, do a short capability/landscape check first.

Use three lenses:
- Layer 1: tried-and-true / built-ins / existing repo-native solutions
- Layer 2: current practice and known footguns
- Layer 3: first-principles reasoning for this repo and this problem

External search results are inputs, not answers.
Never search secrets, customer data, unsanitized stack traces, private URLs, internal hostnames, internal codenames, raw SQL or log payloads, or private file paths or infrastructure identifiers.
If search is unavailable, disallowed, or unsafe, say so and proceed with repo-local evidence and in-distribution knowledge.
If safe sanitization is not possible, skip external search.
See \`$_SUPERPOWERS_ROOT/references/search-before-building.md\`.`;
}

export function buildQuestionFormat() {
  return `## Interactive User Question Format

**ALWAYS follow this structure for every interactive user question:**
1. Context: project name, current branch, what we're working on (1-2 sentences)
2. The specific question or decision point
3. \`RECOMMENDATION: Choose [X] because [one-line reason]\`
4. Lettered options: \`A) ... B) ... C) ...\`

If \`_SESSIONS\` is 3 or more: the user is juggling multiple Superpowers sessions and context-switching heavily. **ELI16 mode** — they may not remember what this conversation is about. Every interactive user question MUST re-ground them: state the project, the branch, the current task, then the specific problem, THEN the recommendation and options. Be extra clear and self-contained — assume they haven't looked at this window in 20 minutes.

Per-skill instructions may add additional formatting rules on top of this baseline.`;
}

export function buildUsingSuperpowersBypassGateSection() {
  return `## Bypass Gate

The session decision file lives at \`~/.superpowers/session-flags/using-superpowers/$PPID\`.

If no valid session decision exists yet, ask one interactive question before any normal Superpowers work happens.

The first-turn opt-out question is a pre-Superpowers gate:

- do not compute \`_SESSIONS\`
- do not apply the shared ELI16 multi-session grounding rule
- use the normal context / recommendation / option structure, but treat this question as the gate into the Superpowers stack rather than a normal in-stack Superpowers interactive question

Before any normal Superpowers behavior:

- if the session decision is \`enabled\`, continue into the normal stack
- if the session decision is \`bypassed\` and the user did not explicitly request Superpowers, stop and bypass the rest of this skill
- if the user explicitly requests Superpowers or explicitly names a Superpowers skill, rewrite the session decision to \`enabled\` and continue on the same turn
- if the session decision is missing, ask the opt-out question and persist either \`enabled\` or \`bypassed\`

If the session decision file exists but contains malformed content:

- do not treat it as \`enabled\`
- do not treat it as \`bypassed\`
- ignore it for bypass purposes on that turn
- continue to normal Superpowers behavior
- only rewrite the file after a fresh explicit choice

If the user explicitly requests re-entry but the bootstrap cannot rewrite the session decision to \`enabled\`:

- honor the explicit re-entry request for the current turn
- continue through the normal Superpowers stack on that turn
- do not pretend persistence succeeded
- treat future turns as undecided until a later write succeeds
`;
}

export function buildUsingSuperpowersNormalStackSection() {
  return `## Normal Superpowers Stack

If the bypass gate resolves to \`enabled\` for this turn, run the normal shared Superpowers stack before any further Superpowers behavior:

\`\`\`bash
_UPD=""
[ -n "$_SUPERPOWERS_ROOT" ] && _UPD=$("$_SUPERPOWERS_ROOT/bin/superpowers-update-check" 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
mkdir -p "$_SP_STATE_DIR/sessions"
touch "$_SP_STATE_DIR/sessions/$PPID"
_SESSIONS=$(find "$_SP_STATE_DIR/sessions" -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find "$_SP_STATE_DIR/sessions" -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=""
[ -n "$_SUPERPOWERS_ROOT" ] && _CONTRIB=$("$_SUPERPOWERS_ROOT/bin/superpowers-config" get superpowers_contributor 2>/dev/null || true)
\`\`\`

${buildUpgradeNote()}

${buildQuestionFormat()}

${buildContributorMode()}`;
}

export function buildContributorMode() {
  return `## Contributor Mode

If \`_CONTRIB\` is \`true\`: you are in **contributor mode**. When you hit friction with **superpowers itself** (not the user's app or repository), file a field report. Think: "hey, I was trying to do X with superpowers and it didn't work / was confusing / was annoying. Here's what happened."

**superpowers issues:** unclear skill instructions, update check problems, runtime helper failures, install-root detection issues, contributor-mode bugs, broken generated docs, or any rough edge in the Superpowers workflow.
**NOT superpowers issues:** the user's application bugs, repo-specific architecture problems, auth failures on the user's site, or third-party service outages unrelated to Superpowers tooling.

**To file:** write \`~/.superpowers/contributor-logs/{slug}.md\` with this structure:

\`\`\`
# {Title}

Hey superpowers team — ran into this while using /{skill-name}:

**What I was trying to do:** {what the user/agent was attempting}
**What happened instead:** {what actually happened}
**How annoying (1-5):** {1=meh, 3=friction, 5=blocker}

## Steps to reproduce
1. {step}

## Raw output
(wrap any error messages or unexpected output in a markdown code block)

**Date:** {YYYY-MM-DD} | **Version:** {superpowers version} | **Skill:** /{skill}
\`\`\`

Then run:

\`\`\`bash
mkdir -p ~/.superpowers/contributor-logs
if command -v open >/dev/null 2>&1; then
  open ~/.superpowers/contributor-logs/{slug}.md
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open ~/.superpowers/contributor-logs/{slug}.md >/dev/null 2>&1 || true
fi
\`\`\`

Slug: lowercase, hyphens, max 60 chars (for example \`skill-trigger-missed\`). Skip if the file already exists. Max 3 reports per session. File inline and continue — don't stop the workflow. Tell the user: "Filed superpowers field report: {title}"`;
}

export function buildAgentGrounding() {
  return `## Agent Grounding

Honor the active repo instruction chain from \`AGENTS.md\`, \`AGENTS.override.md\`, \`.github/copilot-instructions.md\`, and \`.github/instructions/*.instructions.md\`, including nested \`AGENTS.md\` and \`AGENTS.override.md\` files closer to the current working directory.

These review skills are public Superpowers skills for Codex and GitHub Copilot local installs.`;
}

export function generatePreamble({ review }) {
  const shellLines = review ? buildReviewShellLines() : buildBaseShellLines();
  const parts = [
    '## Preamble (run first)',
    '',
    '```bash',
    ...shellLines,
    '```',
    '',
    buildUpgradeNote(),
    '',
    buildSearchBeforeBuildingSection(),
  ];

  if (review) {
    parts.push('', buildAgentGrounding());
  }

  parts.push('', buildQuestionFormat(), '', buildContributorMode());
  return parts.join('\n');
}

export function generateUsingSuperpowersPreamble() {
  const parts = [
    '## Preamble (run first)',
    '',
    '```bash',
    ...buildUsingSuperpowersShellLines(),
    '```',
  ];
  return parts.join('\n');
}

function isUsingSuperpowersTemplate(templatePath) {
  return path.basename(path.dirname(templatePath)) === 'using-superpowers';
}

export const RESOLVERS = {
  BASE_PREAMBLE: (templatePath) => (isUsingSuperpowersTemplate(templatePath) ? generateUsingSuperpowersPreamble() : generatePreamble({ review: false })),
  REVIEW_PREAMBLE: () => generatePreamble({ review: true }),
  USING_SUPERPOWERS_BYPASS_GATE: () => buildUsingSuperpowersBypassGateSection(),
  USING_SUPERPOWERS_NORMAL_STACK: () => buildUsingSuperpowersNormalStackSection(),
};

export function insertGeneratedHeader(content) {
  const header =
    '<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->\n' +
    `<!-- Regenerate: ${GENERATOR_CMD} -->`;

  if (!content.startsWith('---\n')) {
    return `${header}\n\n${content}`;
  }

  const frontmatterEnd = content.indexOf('\n---\n', 4);
  if (frontmatterEnd === -1) {
    throw new Error('Failed to locate closing frontmatter delimiter.');
  }

  const prefix = content.slice(0, frontmatterEnd + 5);
  const suffix = content.slice(frontmatterEnd + 5).replace(/^\n+/, '');
  return `${prefix}${header}\n\n${suffix}`;
}

export function renderTemplateContent(content, templatePath, resolvers = RESOLVERS) {
  let rendered = content.replace(/\{\{([A-Z_]+)\}\}/g, (_, name) => {
    const resolver = resolvers[name];
    if (!resolver) {
      throw new Error(`Unknown placeholder {{${name}}} in ${templatePath}`);
    }
    return resolver(templatePath);
  });

  if (/\{\{[A-Z_]+\}\}/.test(rendered)) {
    throw new Error(`Unresolved placeholder remains in ${templatePath}`);
  }

  rendered = insertGeneratedHeader(rendered);
  if (!rendered.endsWith('\n')) {
    rendered += '\n';
  }
  return rendered;
}

export function renderTemplate(templatePath, resolvers = RESOLVERS) {
  const content = fs.readFileSync(templatePath, 'utf8');
  return renderTemplateContent(content, templatePath, resolvers);
}

export function getTemplatePaths(skillsDir = SKILLS_DIR) {
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(skillsDir, entry.name, 'SKILL.md.tmpl'))
    .filter((templatePath) => fs.existsSync(templatePath))
    .sort();
}

export function main(argv = process.argv.slice(2)) {
  const dryRun = argv.includes('--check');
  const templates = getTemplatePaths();
  if (templates.length === 0) {
    throw new Error('No skill templates found.');
  }

  const stale = [];

  for (const templatePath of templates) {
    const skillPath = templatePath.replace(/\.tmpl$/, '');
    const rendered = renderTemplate(templatePath);

    if (dryRun) {
      const current = fs.existsSync(skillPath) ? fs.readFileSync(skillPath, 'utf8') : '';
      if (current !== rendered) {
        stale.push(path.relative(ROOT, skillPath));
      }
      continue;
    }

    fs.writeFileSync(skillPath, rendered, 'utf8');
  }

  if (dryRun) {
    if (stale.length > 0) {
      console.error('Generated skill docs are stale:');
      for (const file of stale) {
        console.error(`- ${file}`);
      }
      process.exit(1);
    }
    console.log('Generated skill docs are up to date.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
