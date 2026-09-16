export const meta = {
  name: 'sdd-workflow',
  description: 'Run the superpowers subagent-driven-development loop as a deterministic workflow: setup, per-task implement/review/fix rounds, final review with one fix wave, adjudication',
  phases: [
    { title: 'Setup', detail: 'workspace, ledger, pre-flight scan' },
    { title: 'Tasks', detail: 'implement, review, fix rounds (cap 5) per task, in plan order' },
    { title: 'Final review', detail: 'whole-branch review, one fix wave, one scoped re-review' },
    { title: 'Finish', detail: 'adjudicate residuals, write ledger and rulings' },
  ],
}

const { repo, plan, spec, sdd, reviewer_template, tasks } = args
const S = `${sdd}/scripts`
const common = `Repository (run every command from here): ${repo}\nPlan file: ${repo}/${plan}. Spec: ${repo}/${spec}. This is a local scratch repo with no remote; work directly on main. Never dispatch subagents. Your final text is data, not a message for a human.`

const SETUP = {
  type: 'object',
  properties: {
    workspace: { type: 'string' },
    global_constraints: { type: 'string' },
    scan_rows: { type: 'integer' },
    rulings: { type: 'array', items: { type: 'string' } },
  },
  required: ['workspace', 'global_constraints', 'scan_rows', 'rulings'],
}
const PREP = {
  type: 'object',
  properties: { brief: { type: 'string' }, base: { type: 'string' }, task_name: { type: 'string' } },
  required: ['brief', 'base', 'task_name'],
}
const IMPL = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['DONE', 'DONE_WITH_CONCERNS', 'BLOCKED', 'NEEDS_CONTEXT'] },
    head: { type: 'string' },
    commits: { type: 'array', items: { type: 'string' } },
    test_summary: { type: 'string' },
    concerns: { type: 'string' },
    report: { type: 'string' },
  },
  required: ['status', 'head', 'commits', 'test_summary', 'concerns', 'report'],
}
const FINDING = {
  type: 'object',
  properties: {
    severity: { type: 'string', enum: ['Critical', 'Important', 'Minor'] },
    text: { type: 'string' },
    plan_mandated: { type: 'boolean' },
  },
  required: ['severity', 'text', 'plan_mandated'],
}
const REVIEW = {
  type: 'object',
  properties: {
    spec_compliant: { type: 'boolean' },
    cannot_verify: { type: 'array', items: { type: 'string' } },
    findings: { type: 'array', items: FINDING },
    approved: { type: 'boolean' },
    package: { type: 'string' },
  },
  required: ['spec_compliant', 'cannot_verify', 'findings', 'approved', 'package'],
}
const REREVIEW = {
  type: 'object',
  properties: {
    addressed: { type: 'array', items: { type: 'string' } },
    open: { type: 'array', items: { type: 'string' } },
    new_breakage: { type: 'array', items: FINDING },
  },
  required: ['addressed', 'open', 'new_breakage'],
}
const RULINGS = {
  type: 'object',
  properties: { rulings: { type: 'array', items: { type: 'string' } }, load_bearing: { type: 'array', items: { type: 'string' } } },
  required: ['rulings', 'load_bearing'],
}
const FINISH = {
  type: 'object',
  properties: { ledger: { type: 'string' }, head: { type: 'string' }, tests: { type: 'string' } },
  required: ['ledger', 'head', 'tests'],
}

const blocking = fs => fs.filter(f => f.severity !== 'Minor')
const minors = fs => fs.filter(f => f.severity === 'Minor')

// ---------------------------------------------------------------- Setup
phase('Setup')
const setup = await agent(`${common}
You are the setup step of subagent-driven-development, executed as a workflow.
1. Run \`${S}/sdd-workspace ${plan}\` and note the workspace path it prints.
2. Create the ledger at <workspace>/progress.md with the first line \`# SDD ledger — plan: ${plan}\`.
3. Read ${plan} and ${spec}. Copy the spec's project-wide binding requirements (exact values, formats, relationships) into a Global Constraints block; return it as global_constraints.
4. Pre-flight conflict scan, written to the ledger as a table: one row per pair of tasks that share a file or interface (what one produces vs what the other consumes, and what you found), one row per task (does its text agree with itself). Rule on any conflict with the spec as the binding authority; record each ruling in the ledger as \`Ruling: <decided> — <why> — <cost if wrong>\`.
Return workspace, global_constraints, scan_rows (rows you wrote), rulings (may be empty).`,
  { label: 'setup+preflight', phase: 'Setup', model: 'sonnet', schema: SETUP })
if (!setup) throw new Error('setup failed')
log(`workspace ${setup.workspace}; scan rows ${setup.scan_rows}; rulings ${setup.rulings.length}`)
const rulings = [...setup.rulings]
const deferred = []
const taskLog = []

// ---------------------------------------------------------------- Tasks
phase('Tasks')
for (const n of tasks) {
  const prep = await agent(`${common}
Run \`${S}/task-brief ${plan} ${n}\` and return the brief path it wrote. Run \`git rev-parse HEAD\` and return it as base. Read the brief's first heading and return the task name.`,
    { label: `prep task ${n}`, phase: 'Tasks', model: 'haiku', effort: 'low', schema: PREP })
  if (!prep) throw new Error(`prep ${n} failed`)
  const report = `${setup.workspace}/task-${n}-report.md`

  const implPrompt = (extra) => `${common}
You are implementing Task ${n}: ${prep.task_name}.
Your instructions are the template at ${sdd}/implementer-prompt.md — read it first and follow it exactly, with these placeholder values: BRIEF_FILE=${prep.brief}; REPORT_FILE=${report}; work directory=${repo}.
Global constraints that bind this task:
${setup.global_constraints}
${extra}
Return status, head (git rev-parse HEAD after committing), commits (short SHA + subject), test_summary, concerns (empty string if none), report (the report file path).`

  let impl = await agent(implPrompt(''), { label: `implement task ${n}`, phase: 'Tasks', model: 'sonnet', schema: IMPL })
  if (!impl || impl.status === 'BLOCKED' || impl.status === 'NEEDS_CONTEXT') {
    impl = await agent(implPrompt(`A prior implementer reported ${impl ? impl.status : 'no result'}: ${impl ? impl.concerns : ''}. Read the report file if it exists. You own the task now.`),
      { label: `implement task ${n} (escalated)`, phase: 'Tasks', model: 'opus', schema: IMPL })
    if (!impl) throw new Error(`task ${n} blocked`)
  }

  const reviewPrompt = `${common}
Run \`${S}/review-package ${plan} ${prep.base} ${impl.head}\` and use the file path it prints as DIFF_FILE.
Your instructions are the template at ${sdd}/task-reviewer-prompt.md — read it first and follow it exactly, with these placeholder values: BRIEF_FILE=${prep.brief}; REPORT_FILE=${report}; BASE_SHA=${prep.base}; HEAD_SHA=${impl.head}; DIFF_FILE=(the printed path); GLOBAL_CONSTRAINTS as below.
${setup.global_constraints}
Return spec_compliant, cannot_verify, findings (each with severity Critical/Important/Minor, text with file:line, plan_mandated), approved (task quality approved), package (the diff file path).`
  let review = await agent(reviewPrompt, { label: `review task ${n}`, phase: 'Tasks', model: 'sonnet', schema: REVIEW })
  if (!review) throw new Error(`review ${n} failed`)
  deferred.push(...minors(review.findings).map(f => `Task ${n}: minor (deferred): ${f.text}`))

  let open = review.spec_compliant ? blocking(review.findings) : [{ severity: 'Important', text: 'spec ❌: ' + review.findings.map(f => f.text).join('; '), plan_mandated: false }, ...blocking(review.findings)]
  let fixBase = impl.head
  let round = 0
  while (open.length && round < 5) {
    round++
    const model = round >= 4 ? 'opus' : 'sonnet'
    const fix = await agent(`${common}
You are fixing review findings on Task ${n}: ${prep.task_name} (fix round ${round} of 5).
Read the brief ${prep.brief} and the report file ${report} (prior attempts are recorded there). Fix each open finding, re-run the tests covering the amended code, append a fix report to ${report} (what changed, covering tests, command, output), and commit.
Open findings:
${open.map((f, i) => `${i + 1}. [${f.severity}] ${f.text}`).join('\n')}
${round >= 4 ? `A prior implementer attempted this task ${round - 1} times; you own it now.` : ''}
Return status, head, commits, test_summary, concerns, report.`,
      { label: `fix task ${n} round ${round}`, phase: 'Tasks', model, schema: IMPL })
    if (!fix) break
    const re = await agent(`${common}
Run \`${S}/review-package ${plan} ${fixBase} ${fix.head}\` and use the printed path as the fix diff.
Your instructions are the template at ${sdd}/re-review-prompt.md — read it first and follow it exactly. BRIEF_FILE=${prep.brief}; the implementer's report (fix reports appended) is ${report}; fix base ${fixBase}; head ${fix.head}.
Findings under verification:
${open.map((f, i) => `${i + 1}. [${f.severity}] ${f.text}`).join('\n')}
Return addressed (finding texts), open (finding texts still open), new_breakage (Critical/Important only, in the fix diff).`,
      { label: `re-review task ${n} round ${round}`, phase: 'Tasks', model: 'sonnet', schema: REREVIEW })
    if (!re) break
    fixBase = fix.head
    impl = fix
    const stillOpen = open.filter(f => re.open.some(o => o && f.text.slice(0, 40) === o.slice(0, 40)) || !re.addressed.some(a => a && f.text.slice(0, 40) === a.slice(0, 40)))
    open = [...stillOpen, ...blocking(re.new_breakage)]
    log(`task ${n} round ${round}: ${re.addressed.length} addressed, ${open.length} open`)
  }
  if (open.length) {
    const adj = await agent(`${common}
You are the controller adjudicating Task ${n} at the fix-round cap (5 rounds, findings still open). Read the brief ${prep.brief}, the report ${report}, and ${spec}. For each open finding decide: reviewer wrong/contestable (park with ruling), real but nothing downstream builds on it (park, deferred), or real and load-bearing (rule on the smallest change that unblocks dependent tasks). Record every decision as \`Task ${n}: Ruling: <finding> — <decided and why> — <cost if wrong>\`.
Open findings:
${open.map((f, i) => `${i + 1}. [${f.severity}] ${f.text}`).join('\n')}
Return rulings (all of them) and load_bearing (the ones later tasks must honor).`,
      { label: `adjudicate task ${n}`, phase: 'Tasks', model: 'opus', schema: RULINGS })
    if (adj) { rulings.push(...adj.rulings); deferred.push(...adj.load_bearing.map(r => `Task ${n}: load-bearing ruling: ${r}`)) }
  }
  taskLog.push(`Task ${n}: complete (commits ${prep.base.slice(0, 7)}..${impl.head.slice(0, 7)}, ${open.length ? open.length + ' parked' : 'review clean'}${round ? ', ' + round + ' fix round(s)' : ''})`)
  log(taskLog[taskLog.length - 1])
}

// ---------------------------------------------------------------- Final review
phase('Final review')
const final = await agent(`${common}
Run \`git merge-base main HEAD\` — since work is on main, use the fixture commit (first commit in \`git log --reverse\`) as MERGE_BASE — then \`${S}/review-package ${plan} MERGE_BASE HEAD\` and use the printed path as the diff file.
Your instructions are the template at ${reviewer_template} — read it and follow it, reviewing the whole branch against ${plan} and ${spec} from the diff file (do not re-derive the diff with git). Deferred minors and parked items from the task loop, for you to triage which must be fixed before merge:
${deferred.length ? deferred.map(d => '- ' + d).join('\n') : '(none)'}
Return spec_compliant, cannot_verify, findings (severity, text with file:line, plan_mandated), approved (ready to merge), package (the diff file path).`,
  { label: 'final whole-branch review', phase: 'Final review', model: 'opus', schema: REVIEW })
let finalOpen = final ? blocking(final.findings) : []
let finalHead = null
if (finalOpen.length) {
  const fix = await agent(`${common}
You are fixing the findings from the final whole-branch code review, in ONE pass. Fix every finding below under TDD, re-run the covering tests, and commit. Record what you did in ${setup.workspace}/final-fix-report.md (changes, covering tests, command, output).
Findings:
${finalOpen.map((f, i) => `${i + 1}. [${f.severity}] ${f.text}`).join('\n')}
Return status, head, commits, test_summary, concerns, report.`,
    { label: 'final fix wave', phase: 'Final review', model: 'sonnet', schema: IMPL })
  if (fix) {
    finalHead = fix.head
    const re = await agent(`${common}
Run \`${S}/review-package ${plan} ${final.package.match(/review-([0-9a-f]+)\.\./) ? 'HEAD~' + fix.commits.length : 'HEAD~1'} ${fix.head}\` — the fix range is the last ${fix.commits.length} commit(s) — and use the printed path as the fix diff.
Your instructions are the template at ${sdd}/re-review-prompt.md — read it first and follow it exactly. The implementer's report is ${setup.workspace}/final-fix-report.md; head ${fix.head}.
Findings under verification:
${finalOpen.map((f, i) => `${i + 1}. [${f.severity}] ${f.text}`).join('\n')}
Return addressed, open, new_breakage (Critical/Important only).`,
      { label: 'final scoped re-review', phase: 'Final review', model: 'sonnet', schema: REREVIEW })
    if (re) {
      finalOpen = [...finalOpen.filter(f => re.open.some(o => o && f.text.slice(0, 40) === o.slice(0, 40))), ...blocking(re.new_breakage)]
      log(`final fix wave: ${re.addressed.length} addressed, ${finalOpen.length} residual`)
    }
  }
}
if (finalOpen.length) {
  const adj = await agent(`${common}
You are the controller adjudicating residual findings after the final review's single fix wave. Read ${spec}. Park each with a ruling, or rule on the load-bearing ones. Record each as \`Final: Ruling: <finding> — <decided and why> — <cost if wrong>\`.
Residual findings:
${finalOpen.map((f, i) => `${i + 1}. [${f.severity}] ${f.text}`).join('\n')}
Return rulings and load_bearing.`,
    { label: 'adjudicate residuals', phase: 'Final review', model: 'opus', schema: RULINGS })
  if (adj) rulings.push(...adj.rulings)
}

// ---------------------------------------------------------------- Finish
phase('Finish')
const fin = await agent(`${common}
Append these lines to the ledger ${setup.workspace}/progress.md, in order, then run \`python3 -m unittest\` and \`git rev-parse HEAD\` and \`git status --short\`. Do NOT delete the workspace.
Lines:
${[...taskLog, ...deferred, ...rulings.map(r => r.startsWith('Ruling') || /Ruling:/.test(r) ? r : 'Ruling: ' + r), `Final review: ${final ? (final.approved ? 'approved' : 'findings') : 'failed'}; ${final ? final.findings.length : 0} findings${finalHead ? '; fix wave to ' + finalHead.slice(0, 7) : ''}`].map(l => '- ' + l).join('\n')}
Return ledger (the ledger's full text), head, tests (the unittest summary line).`,
  { label: 'write ledger', phase: 'Finish', model: 'haiku', effort: 'low', schema: FINISH })

return {
  tasks: taskLog,
  final_review: final ? { approved: final.approved, findings: final.findings } : null,
  final_fix_head: finalHead,
  rulings,
  deferred,
  head: fin ? fin.head : null,
  tests: fin ? fin.tests : null,
}