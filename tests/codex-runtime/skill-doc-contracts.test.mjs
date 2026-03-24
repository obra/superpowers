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

const HELPER_COMMAND_PATTERN = /\bsuperpowers-(plan-contract|plan-execution|workflow-status|workflow|repo-safety|session-entry|config|slug|update-check|migrate-install)\b/;

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
  assert.match(bootstrapBlock, /session-entry\/using-superpowers/, 'using-superpowers should derive the decision-file path');
  assert.doesNotMatch(bootstrapBlock, /touch "\$_SP_STATE_DIR\/sessions\/\$PPID"/, 'using-superpowers should not write session markers before the bypass decision');
  assert.doesNotMatch(bootstrapBlock, /_CONTRIB=/, 'using-superpowers should not load contributor mode before the bypass decision');
  assert.ok(normalStackBlock, 'using-superpowers should define the post-gate normal stack');
  assert.match(normalStackBlock, /superpowers" update-check/, 'using-superpowers should restore update checks after the bypass gate');
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
  assert.match(content, /superpowers session-entry resolve --message-file <path>/, 'using-superpowers should reference the canonical session-entry command');
  assert.doesNotMatch(content, /superpowers-session-entry/, 'using-superpowers should not keep helper-style session-entry commands');
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
    assert.match(content, /_SLUG_ENV=\$\("\$_SUPERPOWERS_ROOT\/bin\/superpowers" repo slug 2>\/dev\/null \|\| true\)/, `${skill} should capture canonical command output into _SLUG_ENV`);
    assert.match(content, /if \[ -n "\$_SLUG_ENV" \]; then\n\s+eval "\$_SLUG_ENV"\nfi/, `${skill} should only eval guarded helper output`);
    assert.doesNotMatch(content, /eval "\$\("\$_SUPERPOWERS_ROOT\/bin\/superpowers" repo slug\)/, `${skill} should not unguardedly eval command substitution`);
  }
});

test('branch-aware skill docs consume the slug helper instead of inline sanitization fragments', () => {
  for (const skill of ['qa-only', 'plan-eng-review', 'finishing-a-development-branch']) {
    const content = readUtf8(getSkillPath(skill));
    assert.match(content, /bin\/superpowers" repo slug/, `${skill} should use the canonical repo slug command`);
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
  assert.doesNotMatch(content, /docs\/superpowers\/specs\/2026-/);
  assert.doesNotMatch(content, /docs\/superpowers\/plans\/2026-/);
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
  assert.match(planEngReview, /superpowers plan execution recommend --plan <approved-plan-path>/);
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
  assert.match(reviewSkill, /Run `superpowers plan contract analyze-plan --spec <approved-spec-path> --plan <approved-plan-path> --format json` before dispatching the reviewer\./);
  assert.match(reviewSkill, /Run `superpowers plan execution status --plan <approved-plan-path>` before dispatching the reviewer\./);
  assert.match(reviewSkill, /If helper status fails, stop and return to the current execution flow; do not dispatch review against guessed plan state\./);
  assert.match(reviewSkill, /Parse `active_task`, `blocking_task`, and `resume_task` from the status JSON\./);
  assert.match(reviewSkill, /If any of `active_task`, `blocking_task`, or `resume_task` is non-null, stop and return to the current execution flow; final review is only valid when all three are `null`\./);
  assert.match(reviewSkill, /Pass the exact approved plan path and helper-reported execution evidence path into the reviewer context\./);
  assert.match(reviewSkill, /Do not use PR metadata or repo default-branch APIs as a fallback; keep the review base aligned with `superpowers:document-release` and `gate-finish`\./);
  assert.match(reviewSkill, /project-scoped code-review artifact/);
  assert.match(reviewSkill, /\{user\}-\{safe-branch\}-code-review-\{datetime\}\.md/);
  assert.match(reviewSkill, /\*\*Generated By:\*\* superpowers:requesting-code-review/);
  assert.match(reviewSkill, /structured finish-gate input for final review freshness/);
  assert.doesNotMatch(reviewSkill, /git log --oneline \| grep "Task 1"/);
  assert.match(reviewSkill, /git rev-parse HEAD~1/);
  assert.match(reviewSkill, /CONTRACT_STATE=\$\(printf '%s\\n' "\$ANALYZE_JSON" \| node -e 'const fs = require\("fs"\); const parsed = JSON\.parse\(fs\.readFileSync\(0, "utf8"\)\); process\.stdout\.write\(parsed\.contract_state \|\| ""\)'/);
  assert.match(reviewSkill, /if \[ "\$CONTRACT_STATE" != "valid" \] \|\| \[ "\$PACKET_BUILDABLE_TASKS" != "\$TASK_COUNT" \]; then/);
  assert.match(reviewSkill, /if \[ -n "\$ACTIVE_TASK\$BLOCKING_TASK\$RESUME_TASK" \]; then/);
  assert.match(reviewSkill, /REVIEW_GATE_JSON=\$\("\$_SUPERPOWERS_ROOT\/bin\/superpowers" plan execution gate-review --plan "\$APPROVED_PLAN_PATH"\)/);
  assert.match(reviewSkill, /if \[ "\$REVIEW_ALLOWED" != "true" \]; then/);

  const finishSkill = readUtf8(getSkillPath('finishing-a-development-branch'));
  assert.match(finishSkill, /rejects branch-completion handoff if the approved plan is execution-dirty or malformed/);
  assert.match(finishSkill, /must not allow branch completion while any checked-off plan step still lacks semantic implementation evidence/);
  assert.match(finishSkill, /If the current work was executed from an approved Superpowers plan, require the exact approved plan path from the current execution workflow context before presenting completion options\./);
  assert.match(finishSkill, /Run `superpowers plan execution status --plan <approved-plan-path>` and read the returned `evidence_path` before presenting completion options\./);
  assert.match(finishSkill, /If the exact approved plan path is unavailable or helper status fails, stop and return to the current execution flow instead of guessing\./);
  assert.match(finishSkill, /Parse `active_task`, `blocking_task`, and `resume_task` from the status JSON\./);
  assert.match(finishSkill, /If any of `active_task`, `blocking_task`, or `resume_task` is non-null, stop and return to the current execution flow; branch completion is only valid when all three are `null`\./);
  assert.match(finishSkill, /Treat the current-branch test-plan artifact as authoritative only when its `Source Plan`, `Source Plan Revision`, and `Head SHA` match the exact approved plan path, revision, and current branch HEAD from the workflow context\./);
  assert.match(finishSkill, /Match current-branch artifacts by their `\*\*Branch:\*\*` header, not by a filename substring glob, so `my-feature` cannot masquerade as `feature`\./);
  assert.doesNotMatch(finishSkill, /\*-"?\$BRANCH"?-test-plan-\*/);
  assert.match(finishSkill, /For plan-routed completion, use the exact `Base Branch` from the fresh release-readiness artifact instead of redetecting the target branch\./);
  assert.match(finishSkill, /The Step 2 `<base-branch>` value stays authoritative for Options A, B, and D\./);
  assert.match(finishSkill, /Use the exact `<base-branch>` resolved in Step 2\. Do not redetect it during PR creation\./);
  assert.match(finishSkill, /If `gate-finish` fails with `test_plan_artifact_missing` or `test_plan_artifact_stale`, hand control back to `superpowers:plan-eng-review` to regenerate the current-branch test-plan artifact before QA or branch completion\./);
  assert.match(finishSkill, /gh pr create --base "<base-branch>"/);

  const reviewPrompt = readUtf8(path.join(REPO_ROOT, 'skills/requesting-code-review/code-reviewer.md'));
  assert.match(reviewPrompt, /^# Code Review Briefing Template/m);
  assert.match(reviewPrompt, /This file is the skill-local reviewer briefing template, not the generated agent system prompt\./);
  assert.match(reviewPrompt, /\*\*Approved plan path:\*\* \{APPROVED_PLAN_PATH\}/);
  assert.match(reviewPrompt, /\*\*Execution evidence path:\*\* \{EXECUTION_EVIDENCE_PATH\}/);
  assert.match(reviewPrompt, /When approved plan and execution evidence paths are provided, read both artifacts and verify that checked-off plan steps are semantically satisfied by the implementation and explicitly evidenced\./);
  assert.match(reviewPrompt, /same locally derivable base-branch contract as `document-release` and `gate-finish`/);
  assert.doesNotMatch(reviewPrompt, /gh pr view --json baseRefName/);

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
  assert.match(writingPlans, /superpowers" plan contract lint/);

  const planEngReview = readUtf8(getSkillPath('plan-eng-review'));
  assert.match(planEngReview, /superpowers" plan contract analyze-plan/);
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
    assert.match(content, /superpowers repo-safety check --intent write/, `${skill} should run the repo-safety check`);
    assert.match(content, /superpowers repo-safety approve --stage/, `${skill} should document the approval rescue flow`);
    assert.match(content, /superpowers:using-git-worktrees/, `${skill} should route blocked writes to using-git-worktrees`);
    assert.match(content, /branch, the stage, and the blocking `failure_class`/, `${skill} should surface blocked-write diagnostics`);
    assert.match(content, targetPattern, `${skill} should use the correct write target family`);
  }
});

test('generated skills use canonical runtime commands instead of helper executables', () => {
  for (const skill of listGeneratedSkills()) {
    const content = readUtf8(getSkillPath(skill));
    assert.doesNotMatch(content, HELPER_COMMAND_PATTERN, `${skill} should not use helper-style executable names`);
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
    /First, if `\$_SUPERPOWERS_ROOT\/bin\/superpowers` is available, call `\$_SUPERPOWERS_ROOT\/bin\/superpowers workflow status --refresh`\./,
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
    /Treat the public handoff recommendation as a conservative default\./,
  );
  assert.match(
    usingSuperpowers,
    /superpowers plan execution recommend --plan <approved-plan-path> --isolated-agents <available\|unavailable> --session-intent <stay\|separate\|unknown> --workspace-prepared <yes\|no\|unknown>/,
  );
  assert.match(
    usingSuperpowers,
    /treat `execution_started` as an executor-resume signal only when the reported `phase` is `executing`/i,
  );
  assert.match(
    usingSuperpowers,
    /If the handoff reports a later phase such as `review_blocked`, `qa_pending`, `document_release_pending`, or `ready_for_branch_completion`, follow that reported phase and `next_action` instead of resuming `superpowers:subagent-driven-development` or `superpowers:executing-plans` just because `execution_started` is `yes`\./,
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
  assert.match(engReview, /plan-eng-review also owns the late refresh-test-plan lane when finish readiness reports `test_plan_artifact_missing` or `test_plan_artifact_stale` for the current approved plan revision\./);
  assert.match(engReview, /\*\*Head SHA:\*\* \{current-head\}/);
  assert.match(engReview, /Set `\*\*Head SHA:\*\*` to the current `git rev-parse HEAD` for the branch state that this test-plan artifact covers\./);
  assert.match(engReview, /In that late-stage lane, the terminal state is returning to the finish-gate flow with a regenerated current-branch test-plan artifact, not reopening execution preflight\./);
  assert.match(engReview, /If the helper returns `status` `implementation_ready`, immediately call `\$_SUPERPOWERS_ROOT\/bin\/superpowers workflow handoff` before presenting any handoff text\./);
  assert.match(engReview, /If that handoff returns `phase` `execution_preflight`, present the normal execution preflight handoff below\./);
  assert.match(engReview, /If that handoff returns a later phase such as `review_blocked`, `qa_pending`, `document_release_pending`, or `ready_for_branch_completion`, follow that reported phase and `next_action` instead of reopening execution preflight\./);
  assert.match(engReview, /Do not start implementation inside `plan-eng-review`\./);
  assert.match(
    engReview,
    /if `\$_SUPERPOWERS_ROOT\/bin\/superpowers` is available, call `\$_SUPERPOWERS_ROOT\/bin\/superpowers workflow status --refresh`/,
  );
  assert.match(engReview, /If the helper returns a non-empty `next_skill`, use that route instead of re-deriving state manually\./);

  const brainstorming = readUtf8(getSkillPath('brainstorming'));
  assert.match(brainstorming, /record the intended spec path with `expect`/);
  assert.match(brainstorming, /"\$_SUPERPOWERS_ROOT\/bin\/superpowers" workflow expect --artifact spec --path/);
  assert.match(brainstorming, /runs `sync --artifact spec`/);

  const writingPlans = readUtf8(getSkillPath('writing-plans'));
  assert.match(writingPlans, /record the intended plan path with `expect`/);
  assert.match(writingPlans, /"\$_SUPERPOWERS_ROOT\/bin\/superpowers" workflow expect --artifact plan --path/);
  assert.match(writingPlans, /runs `sync --artifact plan`/);
  assert.match(writingPlans, /Use the execution skill recommended by `superpowers plan execution recommend --plan <approved-plan-path>`/);

  const ceoReviewWithSyncPath = readUtf8(getSkillPath('plan-ceo-review'));
  assert.match(ceoReviewWithSyncPath, /"\$_SUPERPOWERS_ROOT\/bin\/superpowers" workflow sync --artifact spec --path/);

  const sdd = readUtf8(getSkillPath('subagent-driven-development'));
  assert.match(sdd, /"Have engineering-approved implementation plan\?" \[shape=diamond\];/);
  assert.match(sdd, /"Return to using-superpowers artifact-state routing" \[shape=box\];/);
  assert.match(sdd, /"Have engineering-approved implementation plan\?" -> "Return to using-superpowers artifact-state routing" \[label="no"\];/);
  assert.match(sdd, /"Tasks mostly independent\?" -> "executing-plans" \[label="no - tightly coupled or better handled in one coordinator session"\];/);
  assert.match(sdd, /"More tasks remain\?" -> "Use superpowers:requesting-code-review for final review gate" \[label="no"\];/);
  assert.match(sdd, /\[Announce: I'm using the requesting-code-review skill for the final review pass\.\]/);
  assert.match(sdd, /\[Invoke superpowers:requesting-code-review\]/);
  assert.match(sdd, /Those per-task review loops satisfy the "review early" rule during execution/);
  assert.doesNotMatch(sdd, /Dispatch final code reviewer subagent for entire implementation/);
  assert.doesNotMatch(sdd, /\[Dispatch final code-reviewer\]/);

  const requestingReview = readUtf8(getSkillPath('requesting-code-review'));
  assert.match(requestingReview, /For the final cross-task review gate in workflow-routed work/);
  assert.doesNotMatch(requestingReview, /After each task in subagent-driven development/);
  assert.match(requestingReview, /plan contract analyze-plan --spec "\$SOURCE_SPEC_PATH" --plan "\$APPROVED_PLAN_PATH" --format json/);

  const finishSkill = readUtf8(getSkillPath('finishing-a-development-branch'));
  assert.match(finishSkill, /If the current work is not governed by an approved Superpowers plan, skip this helper-owned finish gate and continue with the normal completion flow\./);
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

  const routingScenarios = readUtf8(path.join(REPO_ROOT, 'tests/evals/using-superpowers-routing.scenarios.md'));
  assert.match(routingScenarios, /branch-completion language still routes to `requesting-code-review` when no fresh final review artifact exists/i);
  assert.match(routingScenarios, /fresh code-review, QA, and release-readiness artifacts exist/i);

  const readme = readUtf8(path.join(REPO_ROOT, 'README.md'));
  assert.match(readme, /Six layers matter:/);
});

test('deprecated command docs act as compatibility shims instead of dead-end deprecations', () => {
  const brainstorm = readUtf8(path.join(REPO_ROOT, 'commands/brainstorm.md'));
  assert.match(brainstorm, /current phase/i);
  assert.match(brainstorm, /superpowers session-entry resolve --message-file <path>/i);
  assert.match(brainstorm, /before calling any workflow surface/i);
  assert.match(brainstorm, /needs_user_choice/i);
  assert.match(brainstorm, /bypassed/i);
  assert.match(brainstorm, /runtime_failure/i);
  assert.match(brainstorm, /superpowers workflow phase/);
  assert.match(brainstorm, /needs_brainstorming/i);
  assert.match(brainstorm, /superpowers:brainstorming/);
  assert.doesNotMatch(brainstorm, /will be removed in the next major release/i);

  const writePlan = readUtf8(path.join(REPO_ROOT, 'commands/write-plan.md'));
  assert.match(writePlan, /current phase/i);
  assert.match(writePlan, /superpowers session-entry resolve --message-file <path>/i);
  assert.match(writePlan, /before calling any workflow surface/i);
  assert.match(writePlan, /needs_user_choice/i);
  assert.match(writePlan, /bypassed/i);
  assert.match(writePlan, /runtime_failure/i);
  assert.match(writePlan, /superpowers workflow handoff/);
  assert.match(writePlan, /superpowers:writing-plans/);
  assert.doesNotMatch(writePlan, /will be removed in the next major release/i);

  const executePlan = readUtf8(path.join(REPO_ROOT, 'commands/execute-plan.md'));
  assert.match(executePlan, /public handoff surface/i);
  assert.match(executePlan, /superpowers session-entry resolve --message-file <path>/i);
  assert.match(executePlan, /before calling any workflow surface/i);
  assert.match(executePlan, /needs_user_choice/i);
  assert.match(executePlan, /bypassed/i);
  assert.match(executePlan, /runtime_failure/i);
  assert.match(executePlan, /exact approved plan/i);
  assert.match(executePlan, /whether execution should start fresh or resume/i);
  assert.match(executePlan, /conservative default/i);
  assert.match(executePlan, /superpowers plan execution recommend --plan <approved-plan-path>/i);
  assert.match(executePlan, /phase` `execution_preflight/i);
  assert.match(executePlan, /If the handoff reports `phase` `executing`, use the approved plan path from handoff plus `superpowers plan execution status --plan <approved-plan-path>` to resume the current execution flow\./i);
  assert.match(executePlan, /If the handoff reports any later phase such as `review_blocked`, `qa_pending`, `document_release_pending`, or `ready_for_branch_completion`, follow the reported `phase` and `next_action`, or use `superpowers workflow next`, instead of resuming an executor merely because `execution_started` is `yes`\./i);
  assert.doesNotMatch(executePlan, /will be removed in the next major release/i);
});

test('repo-owned operator docs move to canonical runtime command vocabulary', () => {
  for (const relativePath of [
    'README.md',
    'docs/README.codex.md',
    'docs/README.copilot.md',
    'RELEASE-NOTES.md',
    'commands/brainstorm.md',
    'commands/write-plan.md',
    'commands/execute-plan.md',
  ]) {
    const content = readUtf8(path.join(REPO_ROOT, relativePath)).replace(
      /tests\/codex-runtime\/test-superpowers-[^\s`]+/g,
      'tests/codex-runtime/test-runtime-contract.sh',
    );
    assert.doesNotMatch(
      content,
      HELPER_COMMAND_PATTERN,
      `${relativePath} should not use helper-style executable names`,
    );
  }
});
