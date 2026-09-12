const metricDisplay = metric => {
  if (!metric || typeof metric !== 'object') return 'UNKNOWN';
  return metric.display ?? 'UNKNOWN';
};

export function rows(model) {
  const metrics = model.metrics ?? {};
  return [
    ['Tasks', metrics.tasks ?? 'UNKNOWN'],
    ['Completed', metrics.completed ?? 'UNKNOWN'],
    ['First-pass success', metricDisplay(metrics.first_pass_success)],
    ['Autonomous completion', metricDisplay(metrics.autonomous_completion)],
    ['Fix rounds', metrics.fix_rounds ?? 'UNKNOWN'],
    ['Fix rounds/task', metricDisplay(metrics.fix_rounds_per_task)],
    ['Critical findings', metrics.critical_findings ?? 'UNKNOWN'],
    ['Important findings', metrics.important_findings ?? 'UNKNOWN'],
    ['Blocked tasks', metrics.blocked_tasks ?? 'UNKNOWN'],
    ['Parked findings', metrics.parked_findings ?? 'UNKNOWN'],
    ['Tests passed', model.final_test?.display ?? 'UNKNOWN'],
    ['Final review', model.final_review ?? 'NOT_RUN'],
  ];
}

const detailLines = model => {
  const lines = [];
  const warnings = model.warnings ?? [];
  if (warnings.length > 0) {
    lines.push('Warnings:');
    for (const warning of warnings) lines.push(`- ${warning.code}: ${warning.message}`);
  }

  const blockedTasks = (model.tasks ?? []).filter(task => task.state === 'BLOCKED');
  if (blockedTasks.length > 0) {
    lines.push('Blocked tasks:');
    for (const task of blockedTasks) lines.push(`- ${task.task_id}: ${task.title} (BLOCKED)`);
  }

  const findings = model.findings ?? [];
  if (findings.length > 0) {
    lines.push('Findings:');
    for (const finding of findings) {
      const location = finding.location ? ` at ${finding.location}` : '';
      lines.push(`- ${finding.finding_id} [${finding.severity}/${finding.disposition}] ${finding.title}${location}`);
    }
  }

  const diagnostics = model.diagnostics ?? [];
  if (diagnostics.length > 0) {
    lines.push('Diagnostics:');
    for (const diagnostic of diagnostics) {
      const references = [
        diagnostic.sequence === undefined ? null : `sequence ${diagnostic.sequence}`,
        diagnostic.line === undefined ? null : `line ${diagnostic.line}`,
      ].filter(Boolean).join(', ');
      lines.push(`- ${diagnostic.code}${references ? ` (${references})` : ''}: ${diagnostic.message}`);
    }
  }
  return lines;
};

export function renderTerminal(model) {
  const runMetadata = model.run;
  if (!runMetadata || typeof runMetadata !== 'object') throw new TypeError('model.run is required');
  const feature = runMetadata.feature;
  const plan = runMetadata.plan_path;
  const run = runMetadata.run_id;
  const table = rows(model).map(([label, value]) => {
    const text = String(value);
    return `${label.padEnd(31 - text.length)}${text}`;
  });
  const lines = [
    `Feature: ${feature}`,
    `Outcome: ${model.outcome ?? 'INCOMPLETE'}`,
    `Plan: ${plan}`,
    `Run: ${run}`,
    '─────────────────────────────────',
    ...table,
  ];
  const details = detailLines(model);
  if (details.length > 0) lines.push('', ...details);
  return `${lines.join('\n')}\n`;
}
