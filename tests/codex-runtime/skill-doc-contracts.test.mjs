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

test('generated non-router skill docs include the shared Search Before Building section', () => {
  for (const skill of listGeneratedSkills()) {
    const content = readUtf8(getSkillPath(skill));

    if (skill === 'using-superpowers') {
      assert.doesNotMatch(content, /## Search Before Building/, 'using-superpowers should stay exempt from the shared section');
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
    assert.match(normalized, /See `\$_SUPERPOWERS_ROOT\/references\/search-before-building\.md`\./, `${skill} should link to the shared reference`);
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
  assert.match(content, /session-entry bootstrap ownership is runtime-owned/, 'using-superpowers should name runtime ownership for the bootstrap boundary');
  assert.match(content, /missing or malformed decision state fails closed/, 'using-superpowers should document fail-closed missing or malformed state');
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
    .replace(/^require_pattern docs\/superpowers\/plans\/2026-03-17-workflow-state-runtime\.md .*$/gm, '')
    .replace(/^require_pattern docs\/superpowers\/specs\/2026-03-22-runtime-integration-hardening-design\.md .*$/gm, '')
    .replace(/^require_pattern docs\/superpowers\/plans\/2026-03-22-runtime-integration-hardening\.md .*$/gm, '');
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
  assert.match(reviewSkill, /Run `superpowers-plan-contract analyze-plan --spec <approved-spec-path> --plan <approved-plan-path> --format json` before dispatching the reviewer\./);
  assert.match(reviewSkill, /Run `superpowers-plan-execution status --plan <approved-plan-path>` before dispatching the reviewer\./);
  assert.match(reviewSkill, /If helper status fails, stop and return to the current execution flow; do not dispatch review against guessed plan state\./);
  assert.match(reviewSkill, /Parse `active_task`, `blocking_task`, and `resume_task` from the status JSON\./);
  assert.match(reviewSkill, /If any of `active_task`, `blocking_task`, or `resume_task` is non-null, stop and return to the current execution flow; final review is only valid when all three are `null`\./);
  assert.match(reviewSkill, /Pass the exact approved plan path and helper-reported execution evidence path into the reviewer context\./);

  const finishSkill = readUtf8(getSkillPath('finishing-a-development-branch'));
  assert.match(finishSkill, /rejects branch-completion handoff if the approved plan is execution-dirty or malformed/);
  assert.match(finishSkill, /must not allow branch completion while any checked-off plan step still lacks semantic implementation evidence/);
  assert.match(finishSkill, /If the current work was executed from an approved Superpowers plan, require the exact approved plan path from the current execution workflow context before presenting completion options\./);
  assert.match(finishSkill, /Run `superpowers-plan-execution status --plan <approved-plan-path>` and read the returned `evidence_path` before presenting completion options\./);
  assert.match(finishSkill, /If the exact approved plan path is unavailable or helper status fails, stop and return to the current execution flow instead of guessing\./);
  assert.match(finishSkill, /Parse `active_task`, `blocking_task`, and `resume_task` from the status JSON\./);
  assert.match(finishSkill, /If any of `active_task`, `blocking_task`, or `resume_task` is non-null, stop and return to the current execution flow; branch completion is only valid when all three are `null`\./);

  const reviewPrompt = readUtf8(path.join(REPO_ROOT, 'skills/requesting-code-review/code-reviewer.md'));
  assert.match(reviewPrompt, /\*\*Approved plan path:\*\* \{APPROVED_PLAN_PATH\}/);
  assert.match(reviewPrompt, /\*\*Execution evidence path:\*\* \{EXECUTION_EVIDENCE_PATH\}/);
  assert.match(reviewPrompt, /When approved plan and execution evidence paths are provided, read both artifacts and verify that checked-off plan steps are semantically satisfied by the implementation and explicitly evidenced\./);

  const subagentReviewPrompt = readUtf8(path.join(REPO_ROOT, 'skills/subagent-driven-development/code-quality-reviewer-prompt.md'));
  assert.match(subagentReviewPrompt, /APPROVED_PLAN_PATH: \[exact approved plan path for plan-routed final review, otherwise blank\]/);
  assert.match(subagentReviewPrompt, /EXECUTION_EVIDENCE_PATH: \[helper-reported evidence path for plan-routed final review, otherwise blank\]/);
});

test('task-fidelity workflow docs and prompts require packet-backed plan contracts', () => {
  const writingPlans = readUtf8(getSkillPath('writing-plans'));
  assert.match(writingPlans, /Requirement Coverage Matrix/);
  assert.match(writingPlans, /\*\*Spec Coverage:\*\*/);
  assert.match(writingPlans, /\*\*Task Outcome:\*\*/);
  assert.match(writingPlans, /\*\*Plan Constraints:\*\*/);
  assert.match(writingPlans, /\*\*Open Questions:\*\* none/);
  assert.match(writingPlans, /superpowers-plan-contract" lint/);

  const planEngReview = readUtf8(getSkillPath('plan-eng-review'));
  assert.match(planEngReview, /superpowers-plan-contract" analyze-plan/);
  assert.match(planEngReview, /contract_state == valid/);
  assert.match(planEngReview, /packet_buildable_tasks == task_count/);
  assert.match(planEngReview, /missing, stale, or non-buildable for the approved plan revision/);
  assert.match(planEngReview, /Requirement Index/);
  assert.match(planEngReview, /Requirement Coverage Matrix/);
  assert.match(planEngReview, /tasks with `Open Questions` not equal to `none`/);
  assert.match(planEngReview, /invalid `Files:` block structure/);
  assert.match(planEngReview, /Does the `Requirement Coverage Matrix` cover every approved requirement without orphaned or over-broad tasks\?/);
  assert.match(planEngReview, /Do `Files:` blocks stay within the minimum file scope needed for the covered requirements, or do they signal file-scope drift that should be split or reapproved\?/);

  const executingPlans = readUtf8(getSkillPath('executing-plans'));
  assert.match(executingPlans, /build the canonical task packet/);
  assert.match(executingPlans, /treat it as the exact task contract for that execution segment/);

  const subagentSkill = readUtf8(getSkillPath('subagent-driven-development'));
  assert.match(subagentSkill, /pass the packet verbatim to implementer and reviewers/);
  assert.match(subagentSkill, /If the packet does not answer it, the task is ambiguous and execution must stop or route back to review\./);
  assert.match(subagentSkill, /The coordinator owns every `git commit`, `git merge`, and `git push` for this workflow/);
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
    assert.match(content, /superpowers-repo-safety check --intent write/, `${skill} should run the repo-safety check`);
    assert.match(content, /superpowers-repo-safety approve --stage/, `${skill} should document the approval rescue flow`);
    assert.match(content, /superpowers:using-git-worktrees/, `${skill} should route blocked writes to using-git-worktrees`);
    assert.match(content, /branch, the stage, and the blocking `failure_class`/, `${skill} should surface blocked-write diagnostics`);
    assert.match(content, targetPattern, `${skill} should use the correct write target family`);
  }
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
    /If the JSON result reports `status` `implementation_ready`, proceed to the normal execution preflight and handoff flow using the exact approved plan path\./,
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
    /Plan revision:/,
  );
  assert.match(
    usingSuperpowers,
    /Plan execution mode:/,
  );
  assert.match(
    usingSuperpowers,
    /If the helper-backed execution preflight or handoff flow is unavailable, do not route directly from manual fallback into implementation\./,
  );

  const ceoReview = readUtf8(getSkillPath('plan-ceo-review'));
  assert.match(ceoReview, /\*\*The terminal state is invoking writing-plans\.\*\*/);
  assert.match(ceoReview, /Do not draft a plan or offer implementation options from `plan-ceo-review`\./);
  assert.match(ceoReview, /runs `sync --artifact spec`/);

  const engReview = readUtf8(getSkillPath('plan-eng-review'));
  assert.match(engReview, /\*\*The terminal state is presenting the execution preflight handoff with the approved plan path\.\*\*/);
  assert.match(engReview, /Do not start implementation inside `plan-eng-review`\./);
  assert.match(
    engReview,
    /if `\$_SUPERPOWERS_ROOT\/bin\/superpowers-workflow-status` is available, call `\$_SUPERPOWERS_ROOT\/bin\/superpowers-workflow-status status --refresh`/,
  );
  assert.match(engReview, /If the helper returns a non-empty `next_skill`, use that route instead of re-deriving state manually\./);
  assert.match(engReview, /If the helper returns `status` `implementation_ready`, present the normal execution preflight handoff below\./);

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
  const specDoc = readUtf8(path.join(REPO_ROOT, 'docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md'));
  assert.match(
    specDoc,
    /`superpowers-workflow-status` must emit schema-versioned structured diagnostics including `contract_state`, `reason_codes`, `diagnostics`, `scan_truncated`, and candidate counts/,
    'approved spec should describe structured route-time diagnostics',
  );
  assert.match(
    specDoc,
    /`phase` and `doctor` must compose session-entry state/,
    'approved spec should describe session-entry composition in the public CLI',
  );
  assert.match(
    specDoc,
    /`superpowers-plan-execution` must expose read-only `preflight`, `gate-review`, and `gate-finish` commands/,
    'approved spec should describe helper-owned execution gates',
  );

  const planDoc = readUtf8(path.join(REPO_ROOT, 'docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md'));
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
  const usingSuperpowers = readUtf8(getSkillPath('using-superpowers'));
  assert.match(usingSuperpowers, /conservatively for the exact relevant artifacts/);
  assert.doesNotMatch(usingSuperpowers, /newest relevant artifacts/);

  const documentRelease = readUtf8(getSkillPath('document-release'));
  assert.match(documentRelease, /does not own `git commit`, `git merge`, or `git push`/);
  assert.doesNotMatch(documentRelease, /\[--write-target git-commit\]/);

  const finishSkill = readUtf8(getSkillPath('finishing-a-development-branch'));
  assert.match(finishSkill, /A review stops being fresh as soon as new repo changes land, including release-doc or metadata edits from `superpowers:document-release`/);
  assert.match(finishSkill, /If `superpowers:document-release` writes repo files or changes release metadata, treat any earlier code review as stale and loop back through `superpowers:requesting-code-review` before presenting completion options\./);

  const readme = readUtf8(path.join(REPO_ROOT, 'README.md'));
  assert.match(readme, /Six layers matter:/);
});

test('deprecated command docs act as compatibility shims instead of dead-end deprecations', () => {
  const brainstorm = readUtf8(path.join(REPO_ROOT, 'commands/brainstorm.md'));
  assert.match(brainstorm, /current phase/i);
  assert.match(brainstorm, /superpowers-workflow phase/);
  assert.match(brainstorm, /superpowers:brainstorming/);
  assert.doesNotMatch(brainstorm, /will be removed in the next major release/i);

  const writePlan = readUtf8(path.join(REPO_ROOT, 'commands/write-plan.md'));
  assert.match(writePlan, /current phase/i);
  assert.match(writePlan, /superpowers-workflow handoff/);
  assert.match(writePlan, /superpowers:writing-plans/);
  assert.doesNotMatch(writePlan, /will be removed in the next major release/i);

  const executePlan = readUtf8(path.join(REPO_ROOT, 'commands/execute-plan.md'));
  assert.match(executePlan, /public handoff surface/i);
  assert.match(executePlan, /exact approved plan/i);
  assert.match(executePlan, /recommended execution path/i);
  assert.match(executePlan, /If the handoff reports `phase` `needs_user_choice` or `next_action` `session_entry_gate`, resolve the session-entry decision first/i);
  assert.match(executePlan, /execution already started for that plan revision/i);
  assert.doesNotMatch(executePlan, /will be removed in the next major release/i);
});
