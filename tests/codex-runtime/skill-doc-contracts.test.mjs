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
    const content = readUtf8(getSkillPath(skill));
    const bashBlock = extractBashBlockUnderHeading(content, 'Preamble (run first)');
    assert.ok(bashBlock, `${skill} should include a preamble bash block`);
    assert.match(bashBlock, /_IS_SUPERPOWERS_RUNTIME_ROOT\(\)/, `${skill} should define runtime-root detection`);
    assert.match(bashBlock, /_SESSIONS=/, `${skill} should track session count`);
    assert.match(bashBlock, /_CONTRIB=/, `${skill} should load contributor state`);
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

test('workflow-critical skill descriptions encode approval-stage prerequisites', () => {
  const expected = {
    'writing-plans': /CEO-approved Superpowers spec/,
    'plan-eng-review': /CEO-approved spec/,
    'subagent-driven-development': /engineering-approved Superpowers implementation plan/,
    'executing-plans': /engineering-approved Superpowers implementation plan/,
  };

  for (const [skill, pattern] of Object.entries(expected)) {
    const frontmatter = parseFrontmatter(readUtf8(getSkillPath(skill)));
    assert.ok(frontmatter, `${skill} should have frontmatter`);
    assert.match(frontmatter.description, pattern, `${skill} description should encode the required workflow gate`);
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
    /Plan is `Engineering Approved` and matches the latest approved spec revision: proceed to implementation through the normal execution handoff for that approved plan path\./,
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
