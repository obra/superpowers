import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RUN_ID_RE } from './constants.mjs';
import { validateRunMetadata } from './schema-v1.mjs';

function parseMetadata(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function readEventLines(text) {
  const physicalLines = text.split(/\r?\n/);
  if (physicalLines.at(-1) === '') physicalLines.pop();
  return physicalLines.map((line, index) => ({ lineNumber: index + 1, text: line }));
}

export function loadRunDirectory(runDir) {
  const metadataText = readFileSync(join(runDir, 'run.json'), 'utf8');
  const parsedMetadata = parseMetadata(metadataText);
  const validated = validateRunMetadata(parsedMetadata);
  const eventText = readFileSync(join(runDir, 'events.jsonl'), 'utf8');
  return {
    runDir,
    metadata: parsedMetadata,
    metadataDiagnostics: validated.diagnostics,
    eventLines: readEventLines(eventText),
  };
}

export function listRuns(identity) {
  try {
    return readdirSync(identity.metricsPlanRoot, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && RUN_ID_RE.test(entry.name))
      .map(entry => join(identity.metricsPlanRoot, entry.name))
      .filter(runDir => !lstatSync(runDir).isSymbolicLink())
      .map(loadRunDirectory)
      .filter(run => run.metadataDiagnostics.length === 0 && run.metadata.plan_path === identity.planPath);
  } catch (error) {
    if (error && error.code === 'ENOENT') return [];
    throw error;
  }
}

export function selectRun(runs, requestedRunId) {
  if (!Array.isArray(runs) || runs.length === 0) throw new Error('No runs found for this plan');
  const planPath = runs[0]?.metadata?.plan_path;
  if (requestedRunId !== null && requestedRunId !== undefined) {
    const selected = runs.find(run => run.metadata?.run_id === requestedRunId);
    if (!selected) throw new Error(`Run ${requestedRunId} was not found`);
    if (selected.metadata.plan_path !== planPath) throw new Error(`Run ${requestedRunId} does not belong to this plan`);
    return selected;
  }

  return [...runs].sort((left, right) => {
    const createdAt = right.metadata.created_at.localeCompare(left.metadata.created_at);
    return createdAt || right.metadata.run_id.localeCompare(left.metadata.run_id);
  })[0];
}
