import test from 'node:test';
import assert from 'node:assert/strict';
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
    if (skill === 'using-superpowers') continue;
    const content = readUtf8(getSkillPath(skill));
    const bashBlock = extractBashBlockUnderHeading(content, 'Preamble (run first)');
    assert.ok(bashBlock, `${skill} should include a preamble bash block`);
    assert.match(bashBlock, /_IS_SUPERPOWERS_RUNTIME_ROOT\(\)/, `${skill} should define runtime-root detection`);
    assert.match(bashBlock, /_SESSIONS=/, `${skill} should track session count`);
    assert.match(bashBlock, /_CONTRIB=/, `${skill} should load contributor state`);
  }
});

test('using-superpowers gets a dedicated bootstrap preamble contract', () => {
  const content = readUtf8(getSkillPath('using-superpowers'));
  const bootstrapBlock = extractBashBlockUnderHeading(content, 'Preamble (run first)');
  const normalStackBlock = extractBashBlockUnderHeading(content, 'Normal Superpowers Stack');
  assert.match(bootstrapBlock, /session-flags\/using-superpowers/, 'using-superpowers should derive the decision-file path');
  assert.doesNotMatch(bootstrapBlock, /touch "\$_SP_STATE_DIR\/sessions\/\$PPID"/, 'using-superpowers should not write session markers before the bypass decision');
  assert.doesNotMatch(bootstrapBlock, /_CONTRIB=/, 'using-superpowers should not load contributor mode before the bypass decision');
  assert.ok(normalStackBlock, 'using-superpowers should define the post-gate normal stack');
  assert.match(normalStackBlock, /superpowers-update-check/, 'using-superpowers should restore update checks after the bypass gate');
  assert.match(normalStackBlock, /touch "\$_SP_STATE_DIR\/sessions\/\$PPID"/, 'using-superpowers should restore session markers after the bypass gate');
  assert.match(normalStackBlock, /_CONTRIB=/, 'using-superpowers should restore contributor mode after the bypass gate');
  assert.match(content, /ask one interactive question before any normal Superpowers work happens/, 'using-superpowers should ask before the normal stack');
  assert.match(content, /do not compute `_SESSIONS`/, 'using-superpowers should exempt the opt-out gate from _SESSIONS handling');
  assert.match(content, /If the bypass gate resolves to `enabled` for this turn, run the normal shared Superpowers stack before any further Superpowers behavior:/, 'using-superpowers should explicitly restore the normal stack after an enabled decision');
  assert.match(content, /If the session decision file exists but contains malformed content:/, 'using-superpowers should document malformed-state handling');
  assert.match(content, /if the user explicitly requests Superpowers or explicitly names a Superpowers skill, rewrite the session decision to `enabled` and continue on the same turn/, 'using-superpowers should treat explicit skill naming as re-entry');
  assert.match(content, /If the user explicitly requests re-entry but the bootstrap cannot rewrite the session decision to `enabled`:/, 'using-superpowers should document re-entry write-failure handling');
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
    assert.match(content, /_SLUG_ENV=\$\("\$_SUPERPOWERS_ROOT\/bin\/superpowers-slug" 2>\/dev\/null \|\| true\)/, `${skill} should capture helper output into _SLUG_ENV`);
    assert.match(content, /if \[ -n "\$_SLUG_ENV" \]; then\n\s+eval "\$_SLUG_ENV"\nfi/, `${skill} should only eval guarded helper output`);
    assert.doesNotMatch(content, /eval "\$\("\$_SUPERPOWERS_ROOT\/bin\/superpowers-slug"\)/, `${skill} should not unguardedly eval helper command substitution`);
  }
});

test('branch-aware skill docs consume the slug helper instead of inline sanitization fragments', () => {
  for (const skill of ['qa-only', 'plan-eng-review', 'finishing-a-development-branch']) {
    const content = readUtf8(getSkillPath(skill));
    assert.match(content, /bin\/superpowers-slug/, `${skill} should use the shared slug helper`);
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

test('workflow sequencing test uses local fixtures instead of historical docs paths', () => {
  const content = readUtf8(path.join(REPO_ROOT, 'tests/codex-runtime/test-workflow-sequencing.sh'));
  const stripped = content
    .replace(/^require_pattern docs\/superpowers\/specs\/2026-03-17-workflow-state-runtime-design\.md .*$/gm, '')
    .replace(/^require_pattern docs\/superpowers\/plans\/2026-03-17-workflow-state-runtime\.md .*$/gm, '');
  assert.match(content, /WORKFLOW_FIXTURE_DIR="tests\/codex-runtime\/fixtures\/workflow-artifacts"/);
  assert.doesNotMatch(stripped, /docs\/superpowers\/specs\/2026-/);
  assert.doesNotMatch(stripped, /docs\/superpowers\/plans\/2026-/);
});

test('broad-safe skill descriptions expand discovery language without taking over workflow authority', () => {
  const expected = {
    'using-superpowers': [/which skill/i, /workflow stage applies/i],
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
    'plan-ceo-review': [/written Superpowers design or architecture spec/i, /before implementation planning/i],
    'writing-plans': [/CEO-approved Superpowers spec/i, /write the implementation plan/i],
    'plan-eng-review': [/written Superpowers implementation plan/i, /CEO-approved spec/i],
    'subagent-driven-development': [/engineering-approved Superpowers implementation plan/i, /mostly independent tasks/i],
    'executing-plans': [/engineering-approved Superpowers implementation plan/i, /separate session/i],
    'requesting-code-review': [/after implementation work/i, /completed plan\/task slice/i],
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
  assert.match(planEngReview, /superpowers-plan-execution recommend --plan <approved-plan-path>/);
  assert.match(planEngReview, /Present the helper-recommended execution skill as the default path with the approved plan path\./);
  assert.match(planEngReview, /If isolated-agent workflows are unavailable, do not present `superpowers:subagent-driven-development` as an available override\./);

  const writingPlans = readUtf8(getSkillPath('writing-plans'));
  assert.match(writingPlans, /\*\*Plan Revision:\*\* 1/);
  assert.match(writingPlans, /\*\*Execution Mode:\*\* none/);

  for (const skill of ['subagent-driven-development', 'executing-plans']) {
    const content = readUtf8(getSkillPath(skill));
    assert.match(content, /calls `status --plan \.\.\.` during preflight/);
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
  assert.match(reviewSkill, /For plan-routed final review, require the exact approved plan path from the current execution handoff or session context\./);
  assert.match(reviewSkill, /Run `superpowers-plan-execution status --plan <approved-plan-path>` before dispatching the reviewer\./);
  assert.match(reviewSkill, /If helper status fails, stop and return to the current execution flow; do not dispatch review against guessed plan state\./);
  assert.match(reviewSkill, /Pass the exact approved plan path and helper-reported execution evidence path into the reviewer context\./);

  const finishSkill = readUtf8(getSkillPath('finishing-a-development-branch'));
  assert.match(finishSkill, /rejects branch-completion handoff if the approved plan is execution-dirty or malformed/);
  assert.match(finishSkill, /must not allow branch completion while any checked-off plan step still lacks semantic implementation evidence/);
  assert.match(finishSkill, /If the current work was executed from an approved Superpowers plan, require the exact approved plan path from the current execution workflow context before presenting completion options\./);
  assert.match(finishSkill, /Run `superpowers-plan-execution status --plan <approved-plan-path>` and read the returned `evidence_path` before presenting completion options\./);
  assert.match(finishSkill, /If the exact approved plan path is unavailable or helper status fails, stop and return to the current execution flow instead of guessing\./);

  const reviewPrompt = readUtf8(path.join(REPO_ROOT, 'skills/requesting-code-review/code-reviewer.md'));
  assert.match(reviewPrompt, /\*\*Approved plan path:\*\* \{APPROVED_PLAN_PATH\}/);
  assert.match(reviewPrompt, /\*\*Execution evidence path:\*\* \{EXECUTION_EVIDENCE_PATH\}/);
  assert.match(reviewPrompt, /When approved plan and execution evidence paths are provided, read both artifacts and verify that checked-off plan steps are semantically satisfied by the implementation and explicitly evidenced\./);

  const subagentReviewPrompt = readUtf8(path.join(REPO_ROOT, 'skills/subagent-driven-development/code-quality-reviewer-prompt.md'));
  assert.match(subagentReviewPrompt, /APPROVED_PLAN_PATH: \[exact approved plan path for plan-routed final review, otherwise blank\]/);
  assert.match(subagentReviewPrompt, /EXECUTION_EVIDENCE_PATH: \[helper-reported evidence path for plan-routed final review, otherwise blank\]/);
});

test('workflow handoff skills make terminal ownership explicit', () => {
  const usingSuperpowers = readUtf8(getSkillPath('using-superpowers'));
  assert.doesNotMatch(usingSuperpowers, /brainstorming first, then implementation skills/);
  assert.match(
    usingSuperpowers,
    /brainstorming first, then follow the artifact-state workflow: plan-ceo-review -> writing-plans -> plan-eng-review -> execution\./,
  );
  assert.match(
    usingSuperpowers,
    /Do NOT jump from brainstorming straight to implementation\. For workflow-routed work, every stage owns the handoff into the next one\./,
  );
  assert.match(
    usingSuperpowers,
    /"Fix this bug" → debugging first, then if it changes Superpowers product or workflow behavior follow the artifact-state workflow; otherwise continue to the appropriate implementation skill\./,
  );
  assert.match(
    usingSuperpowers,
    /For feature requests, bugfixes that materially change Superpowers product or workflow behavior, product requests, or workflow-change requests inside a Superpowers project, route by artifact state instead of skipping ahead based on the user's wording alone\./,
  );
  assert.match(
    usingSuperpowers,
    /First, if `\$_SUPERPOWERS_ROOT\/bin\/superpowers-workflow-status` is available, call `\$_SUPERPOWERS_ROOT\/bin\/superpowers-workflow-status status --refresh`\./,
  );
  assert.match(
    usingSuperpowers,
    /If the JSON result contains a non-empty `next_skill`, use that route\./,
  );
  assert.match(
    usingSuperpowers,
    /If the JSON result reports `status` `implementation_ready`, proceed to the normal execution handoff using the exact approved plan path\./,
  );
  assert.match(
    usingSuperpowers,
    /Choose between `superpowers:subagent-driven-development` and `superpowers:executing-plans` through the helper-backed execution recommendation contract, not a top-level isolated-agent shortcut\./,
  );
  assert.match(
    usingSuperpowers,
    /Only fall back to manual artifact inspection if the helper itself is unavailable or fails\./,
  );
  assert.match(
    usingSuperpowers,
    /Plan is `Engineering Approved` and its `Source Spec:` path plus `Source Spec Revision:` match the latest approved spec: proceed to implementation through the normal execution handoff for that approved plan path\./,
  );

  const ceoReview = readUtf8(getSkillPath('plan-ceo-review'));
  assert.match(ceoReview, /\*\*The terminal state is invoking writing-plans\.\*\*/);
  assert.match(ceoReview, /Do not draft a plan or offer implementation options from `plan-ceo-review`\./);
  assert.match(ceoReview, /runs `sync --artifact spec`/);

  const engReview = readUtf8(getSkillPath('plan-eng-review'));
  assert.match(engReview, /\*\*The terminal state is presenting the execution handoff with the approved plan path\.\*\*/);
  assert.match(engReview, /Do not start implementation inside `plan-eng-review`\./);
  assert.match(
    engReview,
    /if `\$_SUPERPOWERS_ROOT\/bin\/superpowers-workflow-status` is available, call `\$_SUPERPOWERS_ROOT\/bin\/superpowers-workflow-status status --refresh`/,
  );
  assert.match(engReview, /If the helper returns a non-empty `next_skill`, use that route instead of re-deriving state manually\./);
  assert.match(engReview, /If the helper returns `status` `implementation_ready`, present the normal execution handoff below\./);

  const brainstorming = readUtf8(getSkillPath('brainstorming'));
  assert.match(brainstorming, /record the intended spec path with `expect`/);
  assert.match(brainstorming, /"\$_SUPERPOWERS_ROOT\/bin\/superpowers-workflow-status" expect --artifact spec --path/);
  assert.match(brainstorming, /runs `sync --artifact spec`/);

  const writingPlans = readUtf8(getSkillPath('writing-plans'));
  assert.match(writingPlans, /record the intended plan path with `expect`/);
  assert.match(writingPlans, /"\$_SUPERPOWERS_ROOT\/bin\/superpowers-workflow-status" expect --artifact plan --path/);
  assert.match(writingPlans, /runs `sync --artifact plan`/);

  const ceoReviewWithSyncPath = readUtf8(getSkillPath('plan-ceo-review'));
  assert.match(ceoReviewWithSyncPath, /"\$_SUPERPOWERS_ROOT\/bin\/superpowers-workflow-status" sync --artifact spec --path/);

  const sdd = readUtf8(getSkillPath('subagent-driven-development'));
  assert.match(sdd, /"Have engineering-approved implementation plan\?" \[shape=diamond\];/);
  assert.match(sdd, /"Return to using-superpowers artifact-state routing" \[shape=box\];/);
  assert.match(sdd, /"Have engineering-approved implementation plan\?" -> "Return to using-superpowers artifact-state routing" \[label="no"\];/);
  assert.match(sdd, /"Tasks mostly independent\?" -> "executing-plans" \[label="no - tightly coupled or better handled in one coordinator session"\];/);
  assert.match(sdd, /"More tasks remain\?" -> "Use superpowers:requesting-code-review for final review gate" \[label="no"\];/);
  assert.match(sdd, /\[Announce: I'm using the requesting-code-review skill for the final review pass\.\]/);
  assert.match(sdd, /\[Invoke superpowers:requesting-code-review\]/);
  assert.doesNotMatch(sdd, /Dispatch final code reviewer subagent for entire implementation/);
  assert.doesNotMatch(sdd, /\[Dispatch final code-reviewer\]/);
});

test('approved workflow-state artifacts document the finalized helper contract', () => {
  const specDoc = readUtf8(path.join(REPO_ROOT, 'docs/superpowers/specs/2026-03-17-workflow-state-runtime-design.md'));
  assert.match(
    specDoc,
    /skills call `\$_SUPERPOWERS_ROOT\/bin\/superpowers-workflow-status`/,
    'approved spec should describe runtime-root-aware helper invocation',
  );
  assert.match(
    specDoc,
    /`next_skill` is only used when non-empty/,
    'approved spec should describe non-empty next_skill consumption',
  );
  assert.match(
    specDoc,
    /`implementation_ready` is a terminal status/,
    'approved spec should describe implementation_ready as terminal',
  );
  assert.match(
    specDoc,
    /`status --summary` is human-oriented/,
    'approved spec should describe summary mode as human-oriented',
  );
  assert.match(
    specDoc,
    /`reason` is the canonical diagnostic field/,
    'approved spec should describe canonical reason diagnostics',
  );

  const planDoc = readUtf8(path.join(REPO_ROOT, 'docs/superpowers/plans/2026-03-17-workflow-state-runtime.md'));
  assert.match(
    planDoc,
    /`\$_SUPERPOWERS_ROOT\/bin\/superpowers-workflow-status status --refresh`/,
    'approved plan should describe runtime-root-aware helper invocation',
  );
  assert.match(
    planDoc,
    /If the helper returns a non-empty `next_skill`, use that route\./,
    'approved plan should describe non-empty next_skill consumption',
  );
  assert.match(
    planDoc,
    /If the helper returns `status` `implementation_ready`, present the normal execution handoff\./,
    'approved plan should describe terminal implementation_ready handling',
  );
  assert.match(
    planDoc,
    /`status --summary` is human-oriented/,
    'approved plan should describe summary mode as human-oriented',
  );
  assert.match(
    planDoc,
    /`reason` is the canonical diagnostic field/,
    'approved plan should describe canonical reason diagnostics',
  );
});
