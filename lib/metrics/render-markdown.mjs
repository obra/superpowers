const metricValue = metric => {
  if (!metric || typeof metric !== 'object') return 'UNKNOWN';
  if (metric.display !== 'UNKNOWN' || !metric.unavailable_reason) return metric.display ?? 'UNKNOWN';
  return `${metric.display} (${metric.unavailable_reason})`;
};

const metricsRows = model => {
  const metrics = model.metrics ?? {};
  return [
    ['Tasks', metrics.tasks ?? 'UNKNOWN'],
    ['Completed', metrics.completed ?? 'UNKNOWN'],
    ['First-pass success', metricValue(metrics.first_pass_success)],
    ['Autonomous completion', metricValue(metrics.autonomous_completion)],
    ['Fix rounds', metrics.fix_rounds ?? 'UNKNOWN'],
    ['Fix rounds/task', metricValue(metrics.fix_rounds_per_task)],
    ['Critical findings', metrics.critical_findings ?? 'UNKNOWN'],
    ['Important findings', metrics.important_findings ?? 'UNKNOWN'],
    ['Blocked tasks', metrics.blocked_tasks ?? 'UNKNOWN'],
    ['Parked findings', metrics.parked_findings ?? 'UNKNOWN'],
    ['Tests passed', model.final_test?.display ?? 'UNKNOWN'],
    ['Final review', model.final_review ?? 'NOT_RUN'],
  ];
};

const table = rows => [
  '| Metric | Value |',
  '| --- | --- |',
  ...rows.map(([label, value]) => `| ${label} | ${value} |`),
].join('\n');

const findingLine = finding => {
  const location = finding.location ? ` at ${finding.location}` : '';
  return `- **${finding.finding_id}** [${finding.severity}/${finding.disposition}] ${finding.title}${location}`;
};

const diagnosticLine = diagnostic => {
  const references = [
    diagnostic.sequence === undefined ? null : `sequence ${diagnostic.sequence}`,
    diagnostic.line === undefined ? null : `line ${diagnostic.line}`,
  ].filter(Boolean).join(', ');
  return '- `' + diagnostic.code + '`' + (references ? ` (${references})` : '') + `: ${diagnostic.message}`;
};

export function renderMarkdown(model) {
  const run = model.run ?? {};
  const sections = [
    `# Lifecycle report: ${run.feature ?? 'UNKNOWN'}`,
    [
      `- Outcome: **${model.outcome ?? 'INCOMPLETE'}**`,
      `- Workflow: \`${run.workflow ?? 'UNKNOWN'}\``,
      `- Plan: \`${run.plan_path ?? 'UNKNOWN'}\``,
      `- Run: \`${run.run_id ?? 'UNKNOWN'}\``,
      `- Created: ${run.created_at ?? 'UNKNOWN'}`,
    ].join('\n'),
    `## Headline metrics\n\n${table(metricsRows(model))}`,
  ];

  const warnings = model.warnings ?? [];
  if (warnings.length > 0) sections.push(`## Warnings\n\n${warnings.map(warning => `- \`${warning.code}\`: ${warning.message}`).join('\n')}`);

  const blockedTasks = (model.tasks ?? []).filter(task => task.state === 'BLOCKED');
  if (blockedTasks.length > 0) {
    sections.push(`## Blocked tasks\n\n${blockedTasks.map(task => `- **${task.task_id}** ${task.title} (BLOCKED)`).join('\n')}`);
  }

  const findings = model.findings ?? [];
  if (findings.length > 0) sections.push(`## Findings\n\n${findings.map(findingLine).join('\n')}`);

  const diagnostics = model.diagnostics ?? [];
  if (diagnostics.length > 0) sections.push(`## Diagnostics\n\n${diagnostics.map(diagnosticLine).join('\n')}`);

  return `${sections.join('\n\n')}\n`;
}
