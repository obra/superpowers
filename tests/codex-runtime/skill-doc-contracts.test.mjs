import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  REPO_ROOT,
  SKILLS_DIR,
  listGeneratedSkills,
  readUtf8,
  parseFrontmatter,
  extractBashBlockUnderHeading,
  extractSection,
  normalizeWhitespace,
  countOccurrences,
} from './helpers/markdown-test-helpers.mjs';

function getTemplatePath(skill) {
  return path.join(SKILLS_DIR, skill, 'SKILL.md.tmpl');
}

function getSkillPath(skill) {
  return path.join(SKILLS_DIR, skill, 'SKILL.md');
}

function getSkillDescription(skill) {
  const frontmatter = parseFrontmatter(readUtf8(getSkillPath(skill)));
  assert.ok(frontmatter, `${skill} should have frontmatter`);
  return frontmatter.description;
}

function retiredProductName() {
  const readme = readUtf8(path.join(REPO_ROOT, 'README.md'));
  const provenanceLine = readme
    .split('\n')
    .find((line) => line.startsWith('FeatureForge began from upstream '));
  assert.ok(provenanceLine, 'README.md should keep the provenance attribution line');
  const match = provenanceLine.match(/upstream ([A-Za-z]+):/);
  assert.ok(match, 'README.md provenance line should expose the retired product name');
  return match[1].toLowerCase();
}

const RETIRED_PRODUCT = retiredProductName();

function repoSafetyCliWriteTargets() {
  const cliSurface = readUtf8(path.join(REPO_ROOT, 'src/cli/repo_safety.rs'));
  return new Set(Array.from(cliSurface.matchAll(/#\[value\(name = "([^"]+)"\)\]/g), ([, target]) => target));
}

const HELPER_COMMAND_PATTERN = /\bfeatureforge-(plan-contract|plan-execution|workflow-status|workflow|repo-safety|session-entry|config|slug|update-check|migrate-install)\b/;

// Intentional invariant: skill installs package the runtime binary on purpose.
// Runtime-root resolution is only for locating companion files from that same
// install. It must NEVER be used to switch runtime command execution to
// $_FEATUREFORGE_ROOT/bin/featureforge, $INSTALL_DIR/bin/featureforge, PATH, or
// any other discovered binary unless product direction changes explicitly.
const FORBIDDEN_RUNTIME_FALLBACK_EXECUTION_PATTERNS = [
  [/\$_REPO_ROOT\/bin\/featureforge/, 'should not probe repo-local binaries from generated runtime docs'],
  [/(?:^|\n)\s*"\$_FEATUREFORGE_ROOT\/bin\/featureforge"/, 'should not execute runtime commands through a root-selected launcher'],
  [/(?:^|\n)\s*"\$INSTALL_DIR\/bin\/featureforge"/, 'should not execute runtime commands through an install-root-selected launcher'],
  [/(?:^|\n)\s*"\$_FEATUREFORGE_ROOT\/bin\/featureforge\.exe"/, 'should not execute runtime commands through a root-selected Windows launcher'],
  [/(?:^|\n)\s*"\$INSTALL_DIR\/bin\/featureforge\.exe"/, 'should not execute runtime commands through an install-root-selected Windows launcher'],
  [/(?:^|\n)\s*FEATUREFORGE_RUNTIME_BIN="\$_FEATUREFORGE_ROOT\/bin\/featureforge"/, 'should not assign the runtime command path from $_FEATUREFORGE_ROOT'],
  [/(?:^|\n)\s*FEATUREFORGE_RUNTIME_BIN="\$INSTALL_DIR\/bin\/featureforge"/, 'should not assign the runtime command path from INSTALL_DIR'],
  [/(?:^|\n)\s*FEATUREFORGE_RUNTIME_BIN="\$_FEATUREFORGE_ROOT\/bin\/featureforge\.exe"/, 'should not assign the runtime command path from a root-selected Windows launcher'],
  [/(?:^|\n)\s*FEATUREFORGE_RUNTIME_BIN="\$INSTALL_DIR\/bin\/featureforge\.exe"/, 'should not assign the runtime command path from an install-root-selected Windows launcher'],
  [/\$\{_FEATUREFORGE_BIN:-featureforge\}/, 'should not fall back to PATH-selected featureforge binaries'],
  [/command -v featureforge/, 'should not rediscover featureforge through PATH lookups'],
];

function assertNoRuntimeFallbackExecution(content, label) {
  for (const [pattern, message] of FORBIDDEN_RUNTIME_FALLBACK_EXECUTION_PATTERNS) {
    assert.doesNotMatch(content, pattern, `${label} ${message}`);
  }
}

function assertForbidsDirectHelperCommandMutation(content, command, label) {
  const quoted = `\`${command}\``;
  const lines = content.split('\n');
  const windows = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].includes(quoted)) continue;
    const start = Math.max(0, i - 3);
    const end = Math.min(lines.length - 1, i + 3);
    windows.push(lines.slice(start, end + 1).join(' '));
  }
  assert.ok(windows.length > 0, `${label} should explicitly mention ${quoted} in helper-boundary guidance`);
  const hasBoundary = windows.some((window) => {
    const hasProhibition = /(must not|do not|never|should not|cannot|can't)/i.test(window);
    const hasDirectAction = /(invoke|call|run|execute|direct(?:ly)?)/i.test(window);
    const hasOwnerActor = /(coordinator|controller|helper|runtime|harness|gate)/i.test(window);
    const hasOwnerVerb = /(owns?|owned|authoritative|handles?|appl(?:y|ies)|executes?|invokes?|calls?|runs?|governs?)/i.test(window);
    return (hasProhibition && hasDirectAction) || (hasOwnerActor && hasOwnerVerb);
  });
  assert.ok(
    hasBoundary,
    `${label} should keep ${quoted} inside coordinator/helper-owned authoritative mutation boundaries`,
  );
}

function assertSeparatesCandidateArtifactsFromAuthoritativeMutations(content, label) {
  const hasCandidateSurface = /(candidate|task packet|task-packet|packet context|handoff|coverage matrix)/i.test(content);
  const hasAuthoritativeSurface = /(authoritative|helper-owned|coordinator-owned|execution state|execution evidence|review gate|finish-gate|gate-review)/i.test(content);
  const hasBoundaryLanguage = /(must not|do not|never|may not|only|owns?|owned|instead of|fail closed)/i.test(content);
  assert.ok(
    hasCandidateSurface && hasAuthoritativeSurface && hasBoundaryLanguage,
    `${label} should distinguish candidate/planning artifacts from authoritative runtime mutations`,
  );
}

function assertDownstreamMaterialStaysGateAndHarnessAware(content, label) {
  const hasGateAwareness = /(gate-review|review gate|finish-gate|gate-finish|fail closed)/i.test(content);
  const hasHarnessAwareness = /(execution evidence|task-packet|coverage matrix|source plan|source test plan|workflow-routed|artifact)/i.test(content);
  assert.ok(
    hasGateAwareness && hasHarnessAwareness,
    `${label} should stay downstream-gate-aware and harness-aware for review/QA handoffs`,
  );
}

test('templates declare exactly one base or review preamble placeholder', () => {
  for (const skill of listGeneratedSkills()) {
    const template = readUtf8(getTemplatePath(skill));
    const hasBase = template.includes('{{BASE_PREAMBLE}}');
    const hasReview = template.includes('{{REVIEW_PREAMBLE}}');
    assert.notEqual(hasBase, hasReview, `${skill} should declare exactly one preamble placeholder`);
  }
});

test('generated preamble bash block includes shared runtime-root, session, and contributor state', () => {
  for (const skill of listGeneratedSkills()) {
    if (skill === 'using-featureforge') continue;
    const content = readUtf8(getSkillPath(skill));
    const bashBlock = extractBashBlockUnderHeading(content, 'Preamble (run first)');
    assert.ok(bashBlock, `${skill} should include a preamble bash block`);
    assert.match(bashBlock, /repo runtime-root --path/, `${skill} should resolve runtime roots through the helper contract`);
    assert.match(bashBlock, /\$HOME\/\.featureforge\/install/, `${skill} should pin runtime commands to the canonical install root`);
    assert.match(bashBlock, /featureforge\.exe/, `${skill} should keep the Windows packaged launcher path in the install-root contract`);
    assert.match(bashBlock, /"\$_FEATUREFORGE_BIN" update-check/, `${skill} should run update checks through the packaged install binary`);
    assert.match(bashBlock, /"\$_FEATUREFORGE_BIN" config get featureforge_contributor/, `${skill} should load contributor mode through the packaged install binary`);
    assert.doesNotMatch(bashBlock, /_IS_FEATUREFORGE_RUNTIME_ROOT\(\)/, `${skill} should not embed its own runtime-root detector`);
    assertNoRuntimeFallbackExecution(bashBlock, `${skill} preamble`);
    assert.doesNotMatch(bashBlock, /sed -n/, `${skill} should not parse runtime-root JSON in shell`);
    assert.match(bashBlock, /_SESSIONS=/, `${skill} should track session count`);
    assert.match(bashBlock, /_CONTRIB=/, `${skill} should load contributor state`);
  }
});

test('install docs describe the path-based runtime-root helper contract', () => {
  for (const relativePath of ['.codex/INSTALL.md', '.copilot/INSTALL.md']) {
    const content = readUtf8(path.join(REPO_ROOT, relativePath));
    assert.match(content, /featureforge repo runtime-root --path/, `${relativePath} should describe the path-based helper contract`);
    assert.match(content, /~\/\.featureforge\/install\/bin\/featureforge/, `${relativePath} should describe the packaged install binary contract`);
    assert.match(content, /featureforge\.exe/, `${relativePath} should mention the Windows packaged binary contract`);
    assert.doesNotMatch(content, /featureforge repo runtime-root --json/, `${relativePath} should not describe the retired JSON shell contract`);
  }
});

test('generated non-router skill docs include the shared Search Before Building section', () => {
  for (const skill of listGeneratedSkills()) {
    const content = readUtf8(getSkillPath(skill));

    if (skill === 'using-featureforge') {
      assert.doesNotMatch(content, /## Search Before Building/, 'using-featureforge should stay exempt from the shared section');
      continue;
    }

    const section = extractSection(content, 'Search Before Building');
    assert.ok(section, `${skill} should include the Search Before Building section`);
    const normalized = normalizeWhitespace(section);
    assert.match(normalized, /Layer 1: tried-and-true \/ built-ins \/ existing repo-native solutions/, `${skill} should describe Layer 1`);
    assert.match(normalized, /Layer 2: current practice and known footguns/, `${skill} should describe Layer 2`);
    assert.match(normalized, /Layer 3: first-principles reasoning for this repo and this problem/, `${skill} should describe Layer 3`);
    assert.match(normalized, /External search results are inputs, not answers\./, `${skill} should keep Layer 2 non-authoritative`);
    assert.match(normalized, /Never search secrets, customer data, unsanitized stack traces, private URLs, internal hostnames, internal codenames, raw SQL or log payloads, or private file paths or infrastructure identifiers\./, `${skill} should include privacy rules`);
    assert.match(normalized, /If search is unavailable, disallowed, or unsafe, say so and proceed with repo-local evidence and in-distribution knowledge\./, `${skill} should include explicit fallback language`);
    assert.match(normalized, /If safe sanitization is not possible, skip external search\./, `${skill} should require skipping unsafe external search`);
    assert.match(normalized, /See `\$_FEATUREFORGE_ROOT\/references\/search-before-building\.md`\./, `${skill} should link to the shared reference`);
  }
});

test('using-featureforge gets a dedicated bootstrap preamble contract', () => {
  const content = readUtf8(getSkillPath('using-featureforge'));
  const bootstrapBlock = extractBashBlockUnderHeading(content, 'Preamble (run first)');
  const normalStackBlock = extractBashBlockUnderHeading(content, 'Normal FeatureForge Stack');
  assert.match(bootstrapBlock, /session-entry\/using-featureforge/, 'using-featureforge should derive the decision-file path');
  assert.doesNotMatch(bootstrapBlock, /touch "\$_SP_STATE_DIR\/sessions\/\$PPID"/, 'using-featureforge should not write session markers before the bypass decision');
  assert.doesNotMatch(bootstrapBlock, /_CONTRIB=/, 'using-featureforge should not load contributor mode before the bypass decision');
  assert.ok(normalStackBlock, 'using-featureforge should define the post-gate normal stack');
  assert.match(normalStackBlock, /"\$_FEATUREFORGE_BIN" update-check/, 'using-featureforge should restore update checks after the bypass gate through the packaged install binary');
  assert.match(normalStackBlock, /touch "\$_SP_STATE_DIR\/sessions\/\$PPID"/, 'using-featureforge should restore session markers after the bypass gate');
  assert.match(normalStackBlock, /_CONTRIB=/, 'using-featureforge should restore contributor mode after the bypass gate');
  assertNoRuntimeFallbackExecution(normalStackBlock, 'using-featureforge normal stack');
  assert.match(content, /ask one interactive question before any normal FeatureForge work happens/, 'using-featureforge should ask before the normal stack');
  assert.match(content, /do not compute `_SESSIONS`/, 'using-featureforge should exempt the opt-out gate from _SESSIONS handling');
  assert.match(content, /session-entry bootstrap ownership is runtime-owned/, 'using-featureforge should name runtime ownership for the bootstrap boundary');
  assert.match(content, /missing or malformed decision state fails closed/, 'using-featureforge should document fail-closed missing or malformed state');
  assert.match(content, /If the bypass gate resolves to `enabled` for this turn, run the normal shared FeatureForge stack before any further FeatureForge behavior:/, 'using-featureforge should explicitly restore the normal stack after an enabled decision');
  assert.match(content, /If the session decision file exists but contains malformed content:/, 'using-featureforge should document malformed-state handling');
  assert.match(content, /if the user explicitly requests FeatureForge or explicitly names a FeatureForge skill, rewrite the session decision to `enabled` and continue on the same turn/, 'using-featureforge should treat explicit skill naming as re-entry');
  assert.match(content, /If the user explicitly requests re-entry but the bootstrap cannot rewrite the session decision to `enabled`:/, 'using-featureforge should document re-entry write-failure handling');
  assert.match(content, /featureforge session-entry resolve --message-file <path>/, 'using-featureforge should reference the canonical session-entry command');
  assert.doesNotMatch(content, /featureforge-session-entry/, 'using-featureforge should not keep helper-style session-entry commands');
});

test('generated skill docs never execute runtime commands through root-selected launchers', () => {
  for (const skill of listGeneratedSkills()) {
    const content = readUtf8(getSkillPath(skill));
    assertNoRuntimeFallbackExecution(content, `${skill} generated skill doc`);
  }
});

test('all shipped runtime docs keep execution pinned to the packaged binary contract', () => {
  // This is intentionally redundant with the narrower checks above. We want a
  // broad sweep over shipped docs so fallback resolution cannot quietly return
  // through a different surface later. Do not relax this without an explicit
  // product decision to stop shipping and trusting the packaged install binary.
  const runtimeDocs = [
    ['featureforge-upgrade/SKILL.md', readUtf8(path.join(REPO_ROOT, 'featureforge-upgrade', 'SKILL.md'))],
    ...listGeneratedSkills().map((skill) => [path.join('skills', skill, 'SKILL.md'), readUtf8(getSkillPath(skill))]),
  ];

  for (const [label, content] of runtimeDocs) {
    assertNoRuntimeFallbackExecution(content, label);
  }
});

test('upgrade instructions keep runtime command execution separate from companion-file lookup', () => {
  const upgradeSkill = readUtf8(path.join(REPO_ROOT, 'featureforge-upgrade', 'SKILL.md'));
  const installRuntimeExecPattern = /(?:^|\n)\s*(?:if|while|until)?\s*!?\s*"\$INSTALL_RUNTIME_BIN"\s|\$\("\$INSTALL_RUNTIME_BIN"\s/;

  // Intentional invariant: INSTALL_RUNTIME_BIN is only for locating the
  // packaged binary inside the resolved install root for file-oriented steps.
  // Runtime commands must continue to flow through FEATUREFORGE_RUNTIME_BIN so
  // a future refactor cannot silently reintroduce root-selected execution.
  assert.match(upgradeSkill, /INSTALL_RUNTIME_BIN=/);
  assert.doesNotMatch(upgradeSkill, installRuntimeExecPattern, 'upgrade flow should not execute runtime commands through INSTALL_RUNTIME_BIN');
  assert.doesNotMatch(upgradeSkill, /FEATUREFORGE_RUNTIME_BIN="\$INSTALL_RUNTIME_BIN"/, 'upgrade flow should not rebind FEATUREFORGE_RUNTIME_BIN from INSTALL_RUNTIME_BIN');
});

test('generated preambles capture _BRANCH exactly once and keep helper BRANCH out of grounding', () => {
  const branchAssignmentPattern = /(?:^|\n)_BRANCH=/g;

  for (const skill of listGeneratedSkills()) {
    const content = readUtf8(getSkillPath(skill));
    const bashBlock = extractBashBlockUnderHeading(content, 'Preamble (run first)');
    const totalAssignments = content.match(branchAssignmentPattern) ?? [];
    const preambleAssignments = bashBlock.match(branchAssignmentPattern) ?? [];
    assert.equal(totalAssignments.length, 1, `${skill} should include one _BRANCH assignment in the full doc`);
    assert.equal(preambleAssignments.length, 1, `${skill} should capture _BRANCH in the preamble`);
    assert.doesNotMatch(bashBlock, /\bBRANCH=/, `${skill} should not define helper BRANCH in the preamble`);
  }
});

test('generated branch-aware helper loads are guarded through _SLUG_ENV and eval the captured output only', () => {
  for (const skill of ['qa-only', 'plan-eng-review', 'finishing-a-development-branch']) {
    const content = readUtf8(getSkillPath(skill));
    assert.match(content, /_SLUG_ENV=\$\("\$_FEATUREFORGE_BIN" repo slug 2>\/dev\/null \|\| true\)/, `${skill} should capture canonical command output into _SLUG_ENV`);
    assert.match(content, /if \[ -n "\$_SLUG_ENV" \]; then\n\s+eval "\$_SLUG_ENV"\nfi/, `${skill} should only eval guarded helper output`);
    assert.doesNotMatch(content, /eval "\$\("\$_FEATUREFORGE_BIN" repo slug\)/, `${skill} should not unguardedly eval command substitution`);
  }
});

test('branch-aware skill docs consume the slug helper instead of inline sanitization fragments', () => {
  for (const skill of ['qa-only', 'plan-eng-review', 'finishing-a-development-branch']) {
    const content = readUtf8(getSkillPath(skill));
    assert.match(content, /"\$_FEATUREFORGE_BIN" repo slug/, `${skill} should use the canonical repo slug command through the packaged install binary`);
    assert.doesNotMatch(content, /SAFE_BRANCH=\$\(/, `${skill} should not inline branch sanitization`);
    assert.doesNotMatch(content, /(?:^|[^_])BRANCH=\$\(git rev-parse --abbrev-ref HEAD/, `${skill} should not inline raw branch capture`);
    assert.doesNotMatch(content, /SLUG=\$\(printf '%s\\n' "\$REMOTE_URL"/, `${skill} should not inline repo slug derivation`);
  }
});

test('helper BRANCH stays artifact-only in the branch-aware skill consumers', () => {
  for (const skill of ['qa-only', 'finishing-a-development-branch']) {
    const content = readUtf8(getSkillPath(skill));
    const bashBlock = extractBashBlockUnderHeading(content, 'Preamble (run first)');
    assert.match(content, /\$BRANCH/, `${skill} should use helper BRANCH in artifact selection`);
    assert.doesNotMatch(bashBlock, /\$BRANCH/, `${skill} should not use helper BRANCH in the grounding preamble`);
  }
});

test('review skills include review-only preamble contract', () => {
  for (const skill of listGeneratedSkills()) {
    const template = readUtf8(getTemplatePath(skill));
    if (!template.includes('{{REVIEW_PREAMBLE}}')) continue;

    const content = readUtf8(getSkillPath(skill));
    const bashBlock = extractBashBlockUnderHeading(content, 'Preamble (run first)');
    assert.match(bashBlock, /_TODOS_FORMAT=/, `${skill} should load TODO format state`);
    assert.match(content, /## Agent Grounding/, `${skill} should include Agent Grounding`);
  }
});

test('interactive question contract appears once per generated skill in normalized form', () => {
  const expectedBits = [
    '1. Context: project name, current branch, what we\'re working on (1-2 sentences)',
    '2. The specific question or decision point',
    '3. `RECOMMENDATION: Choose [X] because [one-line reason]`',
    '4. Lettered options: `A) ... B) ... C) ...`',
  ];

  for (const skill of listGeneratedSkills()) {
    const content = readUtf8(getSkillPath(skill));
    assert.equal(countOccurrences(content, '## Interactive User Question Format'), 1, `${skill} should define the interactive question format once`);
    const section = extractSection(content, 'Interactive User Question Format');
    assert.ok(section, `${skill} should include the interactive question format section`);
    const normalized = normalizeWhitespace(section);
    for (const bit of expectedBits) {
      assert.match(normalized, new RegExp(bit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${skill} should include ${bit}`);
    }
  }
});

test('workflow fixture coverage uses local fixtures instead of historical docs paths', () => {
  const content = readUtf8(path.join(REPO_ROOT, 'tests/runtime_instruction_contracts.rs'));
  assert.match(content, /tests\/codex-runtime\/fixtures\/workflow-artifacts/);
  assert.doesNotMatch(content, /docs\/featureforge\/specs\/2026-/);
  assert.doesNotMatch(content, /docs\/featureforge\/plans\/2026-/);
});

test('broad-safe skill descriptions expand discovery language without taking over workflow authority', () => {
  const expected = {
    'using-featureforge': [/which skill/i, /workflow stage applies/i],
    'brainstorming': [/feature idea/i, /architecture direction/i],
    'systematic-debugging': [/regression/i],
    'document-release': [/release notes/i, /handoff documentation/i],
    'qa-only': [/repro steps/i, /screenshots/i],
  };

  for (const [skill, patterns] of Object.entries(expected)) {
    const description = getSkillDescription(skill);
    for (const pattern of patterns) {
      assert.match(description, pattern, `${skill} description should broaden discovery with ${pattern}`);
    }
  }
});

test('workflow-critical skill descriptions encode approval-stage prerequisites', () => {
  const expected = {
    'plan-ceo-review': [/written FeatureForge design or architecture spec/i, /before implementation planning/i],
    'writing-plans': [/CEO-approved FeatureForge spec/i, /write the implementation plan/i],
    'plan-eng-review': [/written FeatureForge implementation plan/i, /CEO-approved spec/i],
    'subagent-driven-development': [/engineering-approved FeatureForge implementation plan/i, /mostly independent tasks/i],
    'executing-plans': [/engineering-approved FeatureForge implementation plan/i, /separate session/i],
    'requesting-code-review': [/after implementation work/i, /intentional review checkpoint/i],
    'finishing-a-development-branch': [/implementation is complete/i, /verification passes/i],
  };

  for (const [skill, patternOrPatterns] of Object.entries(expected)) {
    const description = getSkillDescription(skill);
    const patterns = Array.isArray(patternOrPatterns) ? patternOrPatterns : [patternOrPatterns];
    for (const pattern of patterns) {
      assert.match(description, pattern, `${skill} description should encode the required workflow gate`);
    }
  }
});

test('execution and review skill docs keep candidate artifacts and downstream gates explicit', () => {
  const executingPlans = readUtf8(getSkillPath('executing-plans'));
  const subagentSkill = readUtf8(getSkillPath('subagent-driven-development'));
  const implementerPrompt = readUtf8(path.join(REPO_ROOT, 'skills/subagent-driven-development/implementer-prompt.md'));
  const reviewSkill = readUtf8(getSkillPath('requesting-code-review'));
  const qaSkill = readUtf8(getSkillPath('qa-only'));

  for (const [content, label] of [
    [executingPlans, 'skills/executing-plans/SKILL.md'],
    [subagentSkill, 'skills/subagent-driven-development/SKILL.md'],
    [implementerPrompt, 'skills/subagent-driven-development/implementer-prompt.md'],
  ]) {
    for (const command of ['record-contract', 'record-evaluation', 'record-handoff', 'begin', 'note', 'complete', 'reopen', 'transfer']) {
      assertForbidsDirectHelperCommandMutation(content, command, label);
    }
  }

  assertSeparatesCandidateArtifactsFromAuthoritativeMutations(executingPlans, 'skills/executing-plans/SKILL.md');
  assertSeparatesCandidateArtifactsFromAuthoritativeMutations(subagentSkill, 'skills/subagent-driven-development/SKILL.md');
  assertSeparatesCandidateArtifactsFromAuthoritativeMutations(implementerPrompt, 'skills/subagent-driven-development/implementer-prompt.md');
  assertDownstreamMaterialStaysGateAndHarnessAware(reviewSkill, 'skills/requesting-code-review/SKILL.md');
  assertDownstreamMaterialStaysGateAndHarnessAware(qaSkill, 'skills/qa-only/SKILL.md');
});

test('late-stage skill descriptions reject generic skip-ahead trigger phrases', () => {
  const lateStageSkills = [
    'plan-ceo-review',
    'writing-plans',
    'plan-eng-review',
    'executing-plans',
    'subagent-driven-development',
    'requesting-code-review',
    'finishing-a-development-branch',
  ];
  const forbiddenPatterns = [
    /implement this/i,
    /start coding/i,
    /build this/i,
    /plan this feature/i,
    /implementing major features/i,
  ];

  for (const skill of lateStageSkills) {
    const description = getSkillDescription(skill);
    for (const pattern of forbiddenPatterns) {
      assert.doesNotMatch(description, pattern, `${skill} description should not match ${pattern}`);
    }
  }
});

test('execution workflow skills reference the plan-execution helper contract', () => {
  const planEngReview = readUtf8(getSkillPath('plan-eng-review'));
  assert.match(planEngReview, /featureforge plan execution recommend --plan <approved-plan-path>/);
  assert.match(planEngReview, /Present the helper-recommended execution skill as the default path with the approved plan path\./);
  assert.match(planEngReview, /If isolated-agent workflows are unavailable, do not present `featureforge:subagent-driven-development` as an available override\./);

  const writingPlans = readUtf8(getSkillPath('writing-plans'));
  assert.match(writingPlans, /\*\*Plan Revision:\*\* 1/);
  assert.match(writingPlans, /\*\*Execution Mode:\*\* none/);

  for (const skill of ['subagent-driven-development', 'executing-plans']) {
    const content = readUtf8(getSkillPath(skill));
    assert.match(content, /calls `status --plan \.\.\.` during preflight/);
    assert.match(content, /Provides the approved plan and the execution preflight handoff/);
    assert.match(content, /calls `begin` before starting work on a plan step/);
    assert.match(content, /calls `complete` after each completed step/);
    assert.match(content, /calls `note` when work is interrupted or blocked/);
    assert.match(content, /The approved plan checklist is the execution progress record; do not create or maintain a separate authoritative task tracker\./);
  }
  assert.doesNotMatch(readUtf8(getSkillPath('executing-plans')), /track the work in your platform's task checklist/);
  assert.doesNotMatch(readUtf8(getSkillPath('subagent-driven-development')), /task-tracker checklist/);
  assert.doesNotMatch(readUtf8(getSkillPath('subagent-driven-development')), /Mark task complete in task tracker/);

  const reviewSkill = readUtf8(getSkillPath('requesting-code-review'));
  assert.match(reviewSkill, /rejects final review if the plan has invalid execution state or required unfinished work not truthfully represented/);
  assert.match(reviewSkill, /must fail closed when it detects a missed reopen or stale evidence, but must not call `reopen` itself/);
  assert.match(reviewSkill, /For plan-routed final review, require the exact approved plan path and exact approved spec path from the current execution preflight handoff or session context\./);
  assert.match(reviewSkill, /Run `featureforge plan contract analyze-plan --spec <approved-spec-path> --plan <approved-plan-path> --format json` before dispatching the reviewer\./);
  assert.match(reviewSkill, /Run `featureforge plan execution status --plan <approved-plan-path>` before dispatching the reviewer\./);
  assert.match(reviewSkill, /If helper status fails, stop and return to the current execution flow; do not dispatch review against guessed plan state\./);
  assert.match(reviewSkill, /Parse `active_task`, `blocking_task`, and `resume_task` from the status JSON\./);
  assert.match(reviewSkill, /If any of `active_task`, `blocking_task`, or `resume_task` is non-null, stop and return to the current execution flow; final review is only valid when all three are `null`\./);
  assert.match(reviewSkill, /Pass the exact approved plan path and helper-reported execution evidence path into the reviewer context\./);
  assert.match(reviewSkill, /Do not use PR metadata or repo default-branch APIs as a fallback; keep the review base aligned with `featureforge:document-release` and `gate-finish`\./);
  assert.match(reviewSkill, /project-scoped code-review artifact/);
  assert.match(reviewSkill, /\{user\}-\{safe-branch\}-code-review-\{datetime\}\.md/);
  assert.match(reviewSkill, /dedicated fresh-context reviewer independent of the implementation context/);
  assert.match(reviewSkill, /\*\*Review Stage:\*\* featureforge:requesting-code-review/);
  assert.match(reviewSkill, /\*\*Reviewer Provenance:\*\* dedicated-independent/);
  assert.match(reviewSkill, /\*\*Reviewer Source:\*\* fresh-context-subagent/);
  assert.match(reviewSkill, /\*\*Reviewer ID:\*\* 019d3550-c932-7bb2-9903-33f68d7c30ca/);
  assert.match(reviewSkill, /\*\*Reviewer Artifact Path:\*\* `\$_SP_STATE_DIR\/projects\/\$SLUG\/\{user\}-\{safe-branch\}-independent-review-\{datetime\}\.md`/);
  assert.match(reviewSkill, /\*\*Reviewer Artifact Fingerprint:\*\*/);
  assert.match(reviewSkill, /\*\*Distinct From Stages:\*\* featureforge:executing-plans, featureforge:subagent-driven-development/);
  assert.match(reviewSkill, /\*\*Recorded Execution Deviations:\*\* none/);
  assert.match(reviewSkill, /\*\*Deviation Review Verdict:\*\* not_required/);
  assert.match(reviewSkill, /\*\*Branch:\*\* feature\/foo/);
  assert.match(reviewSkill, /\*\*Repo:\*\* featureforge/);
  assert.match(reviewSkill, /Recorded Execution Deviations: present/);
  assert.match(reviewSkill, /Deviation Review Verdict: pass/);
  assert.match(reviewSkill, /\*\*Generated By:\*\* featureforge:requesting-code-review/);
  assert.match(reviewSkill, /structured finish-gate input for final review freshness/);
  assert.doesNotMatch(reviewSkill, /git log --oneline \| grep "Task 1"/);
  assert.match(reviewSkill, /git rev-parse HEAD~1/);
  assert.match(reviewSkill, /CONTRACT_STATE=\$\(printf '%s\\n' "\$ANALYZE_JSON" \| node -e 'const fs = require\("fs"\); const parsed = JSON\.parse\(fs\.readFileSync\(0, "utf8"\)\); process\.stdout\.write\(parsed\.contract_state \|\| ""\)'/);
  assert.match(reviewSkill, /if \[ "\$CONTRACT_STATE" != "valid" \] \|\| \[ "\$PACKET_BUILDABLE_TASKS" != "\$TASK_COUNT" \]; then/);
  assert.match(reviewSkill, /if \[ -n "\$ACTIVE_TASK\$BLOCKING_TASK\$RESUME_TASK" \]; then/);
  assert.match(reviewSkill, /REVIEW_GATE_JSON=\$\("\$_FEATUREFORGE_BIN" plan execution gate-review --plan "\$APPROVED_PLAN_PATH"\)/);
  assert.match(reviewSkill, /if \[ "\$REVIEW_ALLOWED" != "true" \]; then/);

  const finishSkill = readUtf8(getSkillPath('finishing-a-development-branch'));
  assert.match(finishSkill, /rejects branch-completion handoff if the approved plan is execution-dirty or malformed/);
  assert.match(finishSkill, /must not allow branch completion while any checked-off plan step still lacks semantic implementation evidence/);
  assert.match(finishSkill, /If the current work was executed from an approved FeatureForge plan, require the exact approved plan path from the current execution workflow context before presenting completion options\./);
  assert.match(finishSkill, /Run `featureforge plan execution status --plan <approved-plan-path>` and read the returned `evidence_path` before presenting completion options\./);
  assert.match(finishSkill, /If the exact approved plan path is unavailable or helper status fails, stop and return to the current execution flow instead of guessing\./);
  assert.match(finishSkill, /Parse `active_task`, `blocking_task`, and `resume_task` from the status JSON\./);
  assert.match(finishSkill, /If any of `active_task`, `blocking_task`, or `resume_task` is non-null, stop and return to the current execution flow; branch completion is only valid when all three are `null`\./);
  assert.match(finishSkill, /Treat the current-branch test-plan artifact as authoritative only when its `Source Plan`, `Source Plan Revision`, and `Head SHA` match the exact approved plan path, revision, and current branch HEAD from the workflow context\./);
  assert.match(finishSkill, /Match current-branch artifacts by their `\*\*Branch:\*\*` header, not by a filename substring glob, so `my-feature` cannot masquerade as `feature`\./);
  assert.doesNotMatch(finishSkill, /\*-"?\$BRANCH"?-test-plan-\*/);
  assert.match(finishSkill, /For plan-routed completion, use the exact `Base Branch` from the fresh release-readiness artifact instead of redetecting the target branch\./);
  assert.match(finishSkill, /The Step 2 `<base-branch>` value stays authoritative for Options A, B, and D\./);
  assert.match(finishSkill, /Use the exact `<base-branch>` resolved in Step 2\. Do not redetect it during PR creation\./);
  assert.match(finishSkill, /If `gate-finish` fails with `test_plan_artifact_missing` or `test_plan_artifact_stale`, hand control back to `featureforge:plan-eng-review` to regenerate the current-branch test-plan artifact before QA or branch completion\./);
  assert.match(finishSkill, /gh pr create --base "<base-branch>"/);

  const reviewPrompt = readUtf8(path.join(REPO_ROOT, 'skills/requesting-code-review/code-reviewer.md'));
  assert.match(reviewPrompt, /^# Code Review Briefing Template/m);
  assert.match(reviewPrompt, /This file is the skill-local reviewer briefing template, not the generated agent system prompt\./);
  assert.match(reviewPrompt, /\*\*Approved plan path:\*\* \{APPROVED_PLAN_PATH\}/);
  assert.match(reviewPrompt, /\*\*Execution evidence path:\*\* \{EXECUTION_EVIDENCE_PATH\}/);
  assert.match(reviewPrompt, /dedicated independent reviewer for the terminal whole-diff gate/);
  assert.match(reviewPrompt, /Dedicated Reviewer Receipt Contract/);
  assert.match(reviewPrompt, /include structured receipt-ready metadata in your response/);
  assert.match(reviewPrompt, /`Source Plan`, `Source Plan Revision`, `Strategy Checkpoint Fingerprint`, `Branch`, `Repo`, `Base Branch`, `Head SHA`/);
  assert.match(reviewPrompt, /When approved plan and execution evidence paths are provided, read both artifacts and verify that checked-off plan steps are semantically satisfied by the implementation and explicitly evidenced\./);
  assert.match(reviewPrompt, /When execution evidence documents recorded topology downgrades or other execution deviations, explicitly inspect them and state whether those deviations pass final review\./);
  assert.match(reviewPrompt, /same locally derivable base-branch contract as `document-release` and `gate-finish`/);
  assert.doesNotMatch(reviewPrompt, /gh pr view --json baseRefName/);

  const subagentReviewPrompt = readUtf8(path.join(REPO_ROOT, 'skills/subagent-driven-development/code-quality-reviewer-prompt.md'));
  assert.match(subagentReviewPrompt, /APPROVED_PLAN_PATH: \[exact approved plan path for plan-routed final review, otherwise blank\]/);
  assert.match(subagentReviewPrompt, /EXECUTION_EVIDENCE_PATH: \[helper-reported evidence path for plan-routed final review, otherwise blank\]/);
});

test('task-fidelity workflow docs and prompts require packet-backed plan contracts', () => {
  const writingPlans = readUtf8(getSkillPath('writing-plans'));
  assert.match(writingPlans, /Requirement Coverage Matrix/);
  assert.match(writingPlans, /## Execution Strategy/);
  assert.match(writingPlans, /## Dependency Diagram/);
  assert.match(writingPlans, /\*\*Spec Coverage:\*\*/);
  assert.match(writingPlans, /\*\*Task Outcome:\*\*/);
  assert.match(writingPlans, /\*\*Plan Constraints:\*\*/);
  assert.match(writingPlans, /\*\*Open Questions:\*\* none/);
  assert.match(writingPlans, /"\$_FEATUREFORGE_BIN" plan contract lint/);
  assert.match(writingPlans, /create .* worktrees? and run Tasks .* in parallel/i);
  assert.match(writingPlans, /Task \d+ owns /);
  assert.match(writingPlans, /Execute Task \d+ serially/i);

  const planEngReview = readUtf8(getSkillPath('plan-eng-review'));
  assert.match(planEngReview, /"\$_FEATUREFORGE_BIN" plan contract analyze-plan/);
  assert.match(planEngReview, /contract_state == valid/);
  assert.match(planEngReview, /packet_buildable_tasks == task_count/);
  assert.match(planEngReview, /execution_strategy_present/);
  assert.match(planEngReview, /dependency_diagram_present/);
  assert.match(planEngReview, /execution_topology_valid/);
  assert.match(planEngReview, /serial_hazards_resolved/);
  assert.match(planEngReview, /parallel_lane_ownership_valid/);
  assert.match(planEngReview, /parallel_workspace_isolation_valid/);
  assert.match(planEngReview, /missing, stale, or non-buildable for the approved plan revision/);
  assert.match(planEngReview, /Requirement Index/);
  assert.match(planEngReview, /Requirement Coverage Matrix/);
  assert.match(planEngReview, /Execution Strategy/);
  assert.match(planEngReview, /Dependency Diagram/);
  assert.match(planEngReview, /tasks with `Open Questions` not equal to `none`/);
  assert.match(planEngReview, /invalid `Files:` block structure/);
  assert.match(planEngReview, /fake-parallel hotspot files/i);
  assert.match(planEngReview, /exact isolated workspace truth/i);
  assert.match(planEngReview, /Does the `Requirement Coverage Matrix` cover every approved requirement without orphaned or over-broad tasks\?/);
  assert.match(planEngReview, /Do `Files:` blocks stay within the minimum file scope needed for the covered requirements, or do they signal file-scope drift that should be split or reapproved\?/);

  const executingPlans = readUtf8(getSkillPath('executing-plans'));
  assert.match(executingPlans, /build the canonical task packet/);
  assert.match(executingPlans, /treat it as the exact task contract for that execution segment/);
  assert.match(executingPlans, /mandatory task-boundary closure loop/i);
  assert.match(executingPlans, /only then begin Task `N\+1`/);
  assert.match(executingPlans, /does not require per-dispatch user-consent prompts/);
  assert.match(executingPlans, /Non-execution ad-hoc delegation still follows normal user-consent policy/);

  const subagentSkill = readUtf8(getSkillPath('subagent-driven-development'));
  assert.match(subagentSkill, /pass the packet verbatim to implementer and reviewers/);
  assert.match(subagentSkill, /If the packet does not answer it, the task is ambiguous and execution must stop or route back to review\./);
  assert.match(subagentSkill, /The coordinator owns every `git commit`, `git merge`, and `git push` for this workflow/);
  assert.match(subagentSkill, /run `verification-before-completion` and persist the task verification receipt/i);
  assert.match(subagentSkill, /does not require per-dispatch user-consent prompts/);
  assert.match(subagentSkill, /Non-execution ad-hoc delegation still follows normal user-consent policy/);
  assert.doesNotMatch(subagentSkill, /controller provides full text/);
  assert.doesNotMatch(subagentSkill, /provide full text instead/);
  assert.doesNotMatch(subagentSkill, /Skip scene-setting context/);

  const implementerPrompt = readUtf8(path.join(REPO_ROOT, 'skills/subagent-driven-development/implementer-prompt.md'));
  assert.match(implementerPrompt, /## Task Packet/);
  assert.match(implementerPrompt, /the packet is the authoritative task contract for that execution slice/);
  assert.match(implementerPrompt, /do not reinterpret or weaken requirement statements/);
  assert.match(implementerPrompt, /if the packet says `Open Questions: none` and ambiguity remains, stop and escalate/);
  assert.match(implementerPrompt, /Prepare the change for coordinator-owned git actions; do not create commits, merges, or pushes yourself/);
  assert.doesNotMatch(implementerPrompt, /Commit your work/);

  const specReviewerPrompt = readUtf8(path.join(REPO_ROOT, 'skills/subagent-driven-development/spec-reviewer-prompt.md'));
  assert.match(specReviewerPrompt, /the exact task packet/);
  assert.match(specReviewerPrompt, /PLAN_DEVIATION_FOUND/);
  assert.match(specReviewerPrompt, /AMBIGUITY_ESCALATION_REQUIRED/);

  const codeQualityPrompt = readUtf8(path.join(REPO_ROOT, 'skills/subagent-driven-development/code-quality-reviewer-prompt.md'));
  assert.match(codeQualityPrompt, /TASK_PACKET/);
  assert.match(codeQualityPrompt, /work outside planned file decomposition/);
  assert.match(codeQualityPrompt, /new files or abstractions outside packet scope/);
});

test('repo-writing workflow skills document the protected-branch repo-safety gate consistently', () => {
  const expectedTargets = {
    brainstorming: /spec-artifact-write/,
    'plan-ceo-review': /approval-header-write/,
    'writing-plans': /plan-artifact-write/,
    'plan-eng-review': /approval-header-write/,
    'executing-plans': /execution-task-slice/,
    'subagent-driven-development': /execution-task-slice/,
    'document-release': /release-doc-write/,
    'finishing-a-development-branch': /branch-finish/,
  };

  for (const [skill, targetPattern] of Object.entries(expectedTargets)) {
    const content = readUtf8(getSkillPath(skill));
    assert.match(content, /Protected-Branch Repo-Write Gate/, `${skill} should document the protected-branch gate`);
    assert.match(content, /featureforge repo-safety check --intent write/, `${skill} should run the repo-safety check`);
    assert.match(content, /featureforge repo-safety approve --stage/, `${skill} should document the approval rescue flow`);
    assert.match(content, /featureforge:using-git-worktrees/, `${skill} should route blocked writes to using-git-worktrees`);
    assert.match(content, /branch, the stage, and the blocking `failure_class`/, `${skill} should surface blocked-write diagnostics`);
    assert.match(content, targetPattern, `${skill} should use the correct write target family`);
  }
});

test('plan-eng-review plan-write targets stay aligned with repo-safety runtime values', () => {
  const runtimeWriteTargets = repoSafetyCliWriteTargets();
  assert.ok(
    runtimeWriteTargets.has('plan-artifact-write'),
    'repo-safety CLI should expose plan-artifact-write for plan-body mutations',
  );
  assert.ok(
    runtimeWriteTargets.has('approval-header-write'),
    'repo-safety CLI should expose approval-header-write for approval flips',
  );

  for (const [label, docPath] of [
    ['template', getTemplatePath('plan-eng-review')],
    ['generated skill', getSkillPath('plan-eng-review')],
  ]) {
    const content = readUtf8(docPath);
    assert.match(
      content,
      /featureforge repo-safety check --intent write --stage featureforge:plan-eng-review --task-id <current-plan-review> --path docs\/featureforge\/plans\/YYYY-MM-DD-<feature-name>\.md --write-target plan-artifact-write/,
      `${label} should gate plan-body writes with plan-artifact-write`,
    );
    assert.match(
      content,
      /--write-target approval-header-write/,
      `${label} should gate approval-header writes with approval-header-write`,
    );
    assert.doesNotMatch(
      content,
      /--write-target repo-file-write/,
      `${label} should not instruct the retired repo-file-write target for plan-eng-review`,
    );
  }
});

test('generated skills use canonical runtime commands instead of helper executables', () => {
  for (const skill of listGeneratedSkills()) {
    const content = readUtf8(getSkillPath(skill));
    assert.doesNotMatch(content, HELPER_COMMAND_PATTERN, `${skill} should not use helper-style executable names`);
  }
});

test('workflow handoff skills make terminal ownership explicit', () => {
  const usingFeatureForge = readUtf8(getSkillPath('using-featureforge'));
  assert.doesNotMatch(usingFeatureForge, /brainstorming first, then implementation skills/);
  assert.match(
    usingFeatureForge,
    /brainstorming first, then follow the artifact-state workflow: plan-ceo-review -> writing-plans -> plan-fidelity review -> plan-eng-review -> execution\./,
  );
  assert.match(
    usingFeatureForge,
    /Do NOT jump from brainstorming straight to implementation\. For workflow-routed work, every stage owns the handoff into the next one\./,
  );
  assert.match(
    usingFeatureForge,
    /"Fix this bug" → debugging first, then if it changes FeatureForge product or workflow behavior follow the artifact-state workflow; otherwise continue to the appropriate implementation skill\./,
  );
  assert.match(
    usingFeatureForge,
    /For feature requests, bugfixes that materially change FeatureForge product or workflow behavior, product requests, or workflow-change requests inside a FeatureForge project, route by artifact state instead of skipping ahead based on the user's wording alone\./,
  );
  assert.match(
    usingFeatureForge,
    /Only after the bypass gate resolves to `enabled` for the current session key, if `\$_FEATUREFORGE_BIN` is available call `\$_FEATUREFORGE_BIN workflow status --refresh`\./,
  );
  assert.match(
    usingFeatureForge,
    /If the JSON result contains a non-empty `next_skill`, use that route\./,
  );
  assert.match(
    usingFeatureForge,
    /If the JSON result reports `status` `implementation_ready`, proceed to the normal execution preflight and handoff flow using the exact approved plan path\./,
  );
  assert.match(
    usingFeatureForge,
    /Treat the public handoff recommendation as a conservative default\./,
  );
  assert.match(
    usingFeatureForge,
    /featureforge plan execution recommend --plan <approved-plan-path> --isolated-agents <available\|unavailable> --session-intent <stay\|separate\|unknown> --workspace-prepared <yes\|no\|unknown>/,
  );
  assert.match(
    usingFeatureForge,
    /treat `execution_started` as an executor-resume signal only when the reported `phase` is `executing`/i,
  );
  assert.match(
    usingFeatureForge,
    /If the handoff reports a later phase such as `review_blocked`, `qa_pending`, `document_release_pending`, or `ready_for_branch_completion`, follow that reported phase and `next_action` instead of resuming `featureforge:subagent-driven-development` or `featureforge:executing-plans` just because `execution_started` is `yes`\./,
  );
  assert.match(
    usingFeatureForge,
    /Only fall back to manual artifact inspection if the helper itself is unavailable or fails\./,
  );
  assert.match(
    usingFeatureForge,
    /Plan revision:/,
  );
  assert.match(
    usingFeatureForge,
    /Plan execution mode:/,
  );
  assert.match(
    usingFeatureForge,
    /If the helper-backed execution preflight or handoff flow is unavailable, do not route directly from manual fallback into implementation\./,
  );

  const ceoReview = readUtf8(getSkillPath('plan-ceo-review'));
  assert.match(ceoReview, /\*\*The terminal state is invoking writing-plans\.\*\*/);
  assert.match(ceoReview, /Do not draft a plan or offer implementation options from `plan-ceo-review`\./);
  assert.match(ceoReview, /runs `sync --artifact spec`/);

  const engReview = readUtf8(getSkillPath('plan-eng-review'));
  assert.match(engReview, /\*\*The terminal state is presenting the execution preflight handoff with the approved plan path\.\*\*/);
  assert.match(engReview, /plan-eng-review also owns the late refresh-test-plan lane when finish readiness reports `test_plan_artifact_missing` or `test_plan_artifact_stale` for the current approved plan revision\./);
  assert.match(engReview, /\*\*Head SHA:\*\* \{current-head\}/);
  assert.match(engReview, /Set `\*\*Head SHA:\*\*` to the current `git rev-parse HEAD` for the branch state that this test-plan artifact covers\./);
  assert.match(engReview, /In that late-stage lane, the terminal state is returning to the finish-gate flow with a regenerated current-branch test-plan artifact, not reopening execution preflight\./);
  assert.match(engReview, /If the helper returns `status` `implementation_ready`, immediately call `\$_FEATUREFORGE_BIN workflow handoff` before presenting any handoff text\./);
  assert.match(engReview, /If that handoff returns `phase` `execution_preflight`, present the normal execution preflight handoff below\./);
  assert.match(engReview, /If that handoff returns a later phase such as `review_blocked`, `qa_pending`, `document_release_pending`, or `ready_for_branch_completion`, follow that reported phase and `next_action` instead of reopening execution preflight\./);
  assert.match(engReview, /Do not start implementation inside `plan-eng-review`\./);
  assert.match(
    engReview,
    /if `\$_FEATUREFORGE_BIN` is available, call `\$_FEATUREFORGE_BIN workflow status --refresh`/,
  );
  assert.match(engReview, /If the helper returns a non-empty `next_skill`, use that route instead of re-deriving state manually\./);

  const brainstorming = readUtf8(getSkillPath('brainstorming'));
  assert.match(brainstorming, /record the intended spec path with `expect`/);
  assert.match(brainstorming, /"\$_FEATUREFORGE_BIN" workflow expect --artifact spec --path/);
  assert.match(brainstorming, /runs `sync --artifact spec`/);

  const writingPlans = readUtf8(getSkillPath('writing-plans'));
  assert.match(writingPlans, /record the intended plan path with `expect`/);
  assert.match(writingPlans, /"\$_FEATUREFORGE_BIN" workflow expect --artifact plan --path/);
  assert.match(writingPlans, /runs `sync --artifact plan`/);
  assert.match(writingPlans, /Use the execution skill recommended by `featureforge plan execution recommend --plan <approved-plan-path>`/);

  const ceoReviewWithSyncPath = readUtf8(getSkillPath('plan-ceo-review'));
  assert.match(ceoReviewWithSyncPath, /"\$_FEATUREFORGE_BIN" workflow sync --artifact spec --path/);

  const sdd = readUtf8(getSkillPath('subagent-driven-development'));
  assert.match(sdd, /"Have engineering-approved implementation plan\?" \[shape=diamond\];/);
  assert.match(sdd, /"Return to using-featureforge artifact-state routing" \[shape=box\];/);
  assert.match(sdd, /"Have engineering-approved implementation plan\?" -> "Return to using-featureforge artifact-state routing" \[label="no"\];/);
  assert.match(sdd, /"Tasks mostly independent\?" -> "executing-plans" \[label="no - tightly coupled or better handled in one coordinator session"\];/);
  assert.match(sdd, /"More tasks remain\?" -> "Use featureforge:requesting-code-review for final review gate" \[label="no"\];/);
  assert.match(sdd, /\[Announce: I'm using the requesting-code-review skill for the final review pass\.\]/);
  assert.match(sdd, /\[Invoke featureforge:requesting-code-review\]/);
  assert.match(sdd, /Those per-task review loops satisfy the "review early" rule during execution/);
  assert.doesNotMatch(sdd, /Dispatch final code reviewer subagent for entire implementation/);
  assert.doesNotMatch(sdd, /\[Dispatch final code-reviewer\]/);

  const requestingReview = readUtf8(getSkillPath('requesting-code-review'));
  assert.match(requestingReview, /For the final cross-task review gate in workflow-routed work/);
  assert.doesNotMatch(requestingReview, /After each task in subagent-driven development/);
  assert.match(requestingReview, /plan contract analyze-plan --spec "\$SOURCE_SPEC_PATH" --plan "\$APPROVED_PLAN_PATH" --format json/);

  const finishSkill = readUtf8(getSkillPath('finishing-a-development-branch'));
  assert.match(finishSkill, /If the current work is not governed by an approved FeatureForge plan, skip this helper-owned finish gate and continue with the normal completion flow\./);
});

test('planning review sync docs describe additive review summaries and richer QA handoff', () => {
  const ceoReview = readUtf8(getSkillPath('plan-ceo-review'));
  assert.match(ceoReview, /SELECTIVE EXPANSION/);
  assert.match(ceoReview, /Section 11: Design & UX Review/);
  assert.match(ceoReview, /## CEO Review Summary/);
  assert.match(ceoReview, /Label the source as `cross-model` only when the outside voice definitely uses a different model\/provider than the main reviewer\./);
  assert.match(ceoReview, /fresh-context-subagent/);
  assert.match(ceoReview, /transport truncates or summarizes/i);
  assert.match(ceoReview, /note `UI_SCOPE` for Section 11/);
  assert.match(ceoReview, /Present each expansion opportunity as its own individual interactive user question\./);
  assert.match(ceoReview, /Do not use PR metadata or repo default-branch APIs as a fallback; keep the system audit aligned with `document-release`, `requesting-code-review`, and `gate-finish`\./);
  assert.doesNotMatch(ceoReview, /gh pr view --json baseRefName/);

  const engReview = readUtf8(getSkillPath('plan-eng-review'));
  assert.match(engReview, /coverage graph/i);
  assert.match(engReview, /## Key Interactions/);
  assert.match(engReview, /## Edge Cases/);
  assert.match(engReview, /## Critical Paths/);
  assert.match(engReview, /## E2E Test Decision Matrix/);
  assert.match(engReview, /REGRESSION RULE/i);
  assert.match(engReview, /loading, empty, error, success, partial, navigation, responsive, and accessibility-critical states/i);
  assert.match(engReview, /compatibility, retry\/timeout semantics, replay or backfill behavior, and rollback or migration verification/i);
  assert.match(engReview, /Label the source as `cross-model` only when the outside voice definitely uses a different model\/provider than the main reviewer\./);
  assert.match(engReview, /fresh-context-subagent/);
  assert.match(engReview, /transport truncates or summarizes/i);
  assert.match(engReview, /## Engineering Review Summary/);

  const writingPlans = readUtf8(getSkillPath('writing-plans'));
  assert.match(writingPlans, /## CEO Review Summary/);
  assert.match(writingPlans, /additive context only/);

  const qaOnly = readUtf8(getSkillPath('qa-only'));
  assert.match(qaOnly, /## Engineering Review Summary/);
  assert.match(qaOnly, /additive context only/);
  assert.match(qaOnly, /## E2E Test Decision Matrix/);
  assert.match(qaOnly, /Do not use PR metadata or repo default-branch APIs as a fallback; keep diff-aware scoping aligned with `document-release`, `requesting-code-review`, and `gate-finish`\./);
  assert.match(qaOnly, /Match current-branch artifacts by their `\*\*Branch:\*\*` header, not by a filename substring glob, so `my-feature` cannot masquerade as `feature`\./);
  assert.doesNotMatch(qaOnly, /\*-"?\$BRANCH"?-test-plan-\*/);
  assert.doesNotMatch(qaOnly, /gh pr view --json baseRefName/);
});

test('approved workflow-state artifacts document the finalized helper contract', () => {
  const specDoc = readUtf8(path.join(REPO_ROOT, 'docs/archive', RETIRED_PRODUCT, 'specs/2026-03-22-runtime-integration-hardening-design.md'));
  assert.match(
    specDoc,
    new RegExp(String.raw`\`${RETIRED_PRODUCT}-workflow-status\` must emit schema-versioned structured diagnostics including \`contract_state\`, \`reason_codes\`, \`diagnostics\`, \`scan_truncated\`, and candidate counts`),
    'approved spec should describe structured route-time diagnostics',
  );
  assert.match(
    specDoc,
    /`phase` and `doctor` must compose session-entry state/,
    'approved spec should describe session-entry composition in the public CLI',
  );
  assert.match(
    specDoc,
    new RegExp(String.raw`\`${RETIRED_PRODUCT}-plan-execution\` must expose read-only \`preflight\`, \`gate-review\`, and \`gate-finish\` commands`),
    'approved spec should describe helper-owned execution gates',
  );

  const planDoc = readUtf8(path.join(REPO_ROOT, 'docs/archive', RETIRED_PRODUCT, 'plans/2026-03-22-runtime-integration-hardening.md'));
  assert.match(
    planDoc,
    /Route-time readiness and JSON diagnostics are driven by the same canonical approved-plan contract/,
    'approved plan should describe route-time canonical contract hardening',
  );
  assert.match(
    planDoc,
    /The public workflow CLI can report phase, diagnostics, handoff readiness, preflight state, review gate results, and finish gate results/,
    'approved plan should describe the expanded public workflow CLI surface',
  );
  assert.match(
    planDoc,
    /Late-stage gate tasks must leave stale-artifact and stale-evidence proof/,
    'approved plan should require stale-artifact and stale-evidence coverage',
  );
});

test('workflow docs avoid stale ambiguity, commit-ownership, and review-freshness contradictions', () => {
  const usingFeatureForge = readUtf8(getSkillPath('using-featureforge'));
  assert.match(usingFeatureForge, /conservatively for the exact relevant artifacts/);
  assert.doesNotMatch(usingFeatureForge, /newest relevant artifacts/);

  const documentRelease = readUtf8(getSkillPath('document-release'));
  assert.match(documentRelease, /does not own `git commit`, `git merge`, or `git push`/);
  assert.doesNotMatch(documentRelease, /\[--write-target git-commit\]/);

  const finishSkill = readUtf8(getSkillPath('finishing-a-development-branch'));
  assert.match(finishSkill, /A review stops being fresh as soon as new repo changes land, including release-doc or metadata edits from `featureforge:document-release`/);
  assert.match(finishSkill, /If `featureforge:document-release` writes repo files or changes release metadata, treat any earlier code review as stale and loop back through `featureforge:requesting-code-review` before presenting completion options\./);

  const routingScenarios = readUtf8(path.join(REPO_ROOT, 'tests/evals/using-featureforge-routing.scenarios.md'));
  assert.match(routingScenarios, /branch-completion language still routes to `requesting-code-review` when no fresh final review artifact exists/i);
  assert.match(routingScenarios, /fresh code-review, QA, and release-readiness artifacts exist/i);

  const readme = readUtf8(path.join(REPO_ROOT, 'README.md'));
  assert.match(readme, /Six layers matter:/);
});

test('active eval docs use featureforge state roots', () => {
  const evalReadme = readUtf8(path.join(REPO_ROOT, 'tests/evals/README.md'));
  assert.match(evalReadme, /\$FEATUREFORGE_STATE_DIR\/evals\/` or `~\/\.featureforge\/evals\//);
  assert.match(evalReadme, /~\/\.featureforge\/projects\/<slug>\//);
  assert.doesNotMatch(evalReadme, new RegExp(String.raw`~\/\.${RETIRED_PRODUCT}\/(?:evals|projects)\/`));

  const searchBeforeBuildingOrchestrator = readUtf8(path.join(REPO_ROOT, 'tests/evals/search-before-building-contract.orchestrator.md'));
  assert.match(searchBeforeBuildingOrchestrator, /~\/\.featureforge\/projects\/<slug>\/search-before-building-contract-r2\//);
  assert.doesNotMatch(searchBeforeBuildingOrchestrator, new RegExp(String.raw`~\/\.${RETIRED_PRODUCT}\/projects\/`));

  const evalObservability = readUtf8(path.join(REPO_ROOT, 'tests/evals/helpers/eval-observability.mjs'));
  assert.match(evalObservability, /FEATUREFORGE_STATE_DIR/);
  assert.match(evalObservability, /\.featureforge/);
  assert.doesNotMatch(evalObservability, new RegExp(String.raw`\b${RETIRED_PRODUCT.toUpperCase()}_STATE_DIR\b`));
  assert.doesNotMatch(evalObservability, new RegExp(String.raw`\.${RETIRED_PRODUCT}`));
});

test('legacy command shim docs are removed from the active repo', () => {
  for (const relativePath of [
    'commands/brainstorm.md',
    'commands/write-plan.md',
    'commands/execute-plan.md',
  ]) {
    assert.equal(
      fs.existsSync(path.join(REPO_ROOT, relativePath)),
      false,
      `${relativePath} should stay deleted`,
    );
  }
});

test('repo-owned operator docs move to canonical runtime command vocabulary', () => {
  for (const relativePath of [
    'README.md',
    'docs/README.codex.md',
    'docs/README.copilot.md',
    'RELEASE-NOTES.md',
  ]) {
    const content = readUtf8(path.join(REPO_ROOT, relativePath)).replace(
      /tests\/codex-runtime\/test-featureforge-[^\s`]+/g,
      'tests/codex-runtime/test-runtime-contract.sh',
    );
    assert.doesNotMatch(
      content,
      HELPER_COMMAND_PATTERN,
      `${relativePath} should not use helper-style executable names`,
    );
  }
});

test('release-facing docs point at docs/testing.md as the canonical validation entrypoint', () => {
  for (const relativePath of [
    'README.md',
    'docs/README.codex.md',
    'docs/README.copilot.md',
    '.codex/INSTALL.md',
    '.copilot/INSTALL.md',
  ]) {
    assert.match(
      readUtf8(path.join(REPO_ROOT, relativePath)),
      /docs\/testing\.md/,
      `${relativePath} should point readers at docs/testing.md for the canonical validation matrix`,
    );
  }
});
