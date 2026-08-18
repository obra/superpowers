import { lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { RETENTION_TERMINAL_LIMIT, RUN_ID_RE } from './constants.mjs';
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
  const planPaths = new Set(runs.map(run => run.metadata?.plan_path));
  if (planPaths.size !== 1 || typeof planPaths.values().next().value !== 'string') throw new Error('A run does not belong to this plan');
  if (requestedRunId !== null && requestedRunId !== undefined) {
    const selected = runs.find(run => run.metadata?.run_id === requestedRunId);
    if (!selected) throw new Error(`Run ${requestedRunId} was not found`);
    return selected;
  }

  return [...runs].sort((left, right) => {
    const createdAt = right.metadata.created_at.localeCompare(left.metadata.created_at);
    return createdAt || right.metadata.run_id.localeCompare(left.metadata.run_id);
  })[0];
}

export function writeReport(identity, markdown) {
  if (!identity || typeof identity.reportPath !== 'string') throw new TypeError('identity.reportPath is required');
  if (typeof markdown !== 'string') throw new TypeError('markdown must be a string');

  const { reportPath } = identity;
  try {
    if (readFileSync(reportPath, 'utf8') === markdown) return { reportPath, changed: false };
  } catch (error) {
    if (!error || error.code !== 'ENOENT') throw error;
  }

  const reportDirectory = dirname(reportPath);
  mkdirSync(reportDirectory, { recursive: true });
  const temporaryPath = join(reportDirectory, `.${basename(reportPath)}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`);
  try {
    writeFileSync(temporaryPath, markdown, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    renameSync(temporaryPath, reportPath);
  } catch (error) {
    try {
      rmSync(temporaryPath, { force: true });
    } catch {
      // Original write error remains useful; cleanup is best effort.
    }
    throw error;
  }
  return { reportPath, changed: true };
}

const retentionDiagnostic = (code, runId, message) => ({ code, run_id: runId, message });
const RUN_METADATA_FIELDS = ['schema_version', 'run_id', 'workflow', 'feature', 'plan_path', 'initial_plan_fingerprint', 'created_at'];

function candidateRunId(candidate) {
  const runId = candidate?.run?.metadata?.run_id;
  if (typeof runId === 'string') return runId;
  const runDir = candidate?.run?.runDir;
  return typeof runDir === 'string' ? basename(runDir) : 'UNKNOWN';
}

function validateRetentionCandidate(identity, candidate) {
  const run = candidate?.run;
  const metadata = run?.metadata;
  const runId = candidateRunId(candidate);
  if (!run || typeof run.runDir !== 'string' || !metadata || typeof metadata !== 'object') {
    return { safe: false, runId, diagnostic: retentionDiagnostic('RETENTION_RUN_UNCLASSIFIABLE', runId, 'Run classification is incomplete') };
  }
  const metadataValidation = validateRunMetadata(metadata);
  if (metadataValidation.diagnostics.length > 0 || metadata.run_id !== runId || metadata.plan_path !== identity.planPath) {
    return { safe: false, runId, diagnostic: retentionDiagnostic('RETENTION_RUN_UNCLASSIFIABLE', runId, 'Run metadata is invalid or belongs to another plan') };
  }
  if (!RUN_ID_RE.test(runId) || run.runDir !== join(identity.metricsPlanRoot, runId)) {
    return { safe: false, runId, diagnostic: retentionDiagnostic('RETENTION_RUN_UNCLASSIFIABLE', runId, 'Run target is not a direct validated child of this plan root') };
  }

  let stat;
  try {
    stat = lstatSync(run.runDir);
  } catch {
    return { safe: false, runId, diagnostic: retentionDiagnostic('RETENTION_RUN_UNCLASSIFIABLE', runId, 'Run directory is unavailable') };
  }
  if (stat.isSymbolicLink()) {
    return { safe: false, runId, diagnostic: retentionDiagnostic('RETENTION_SYMLINK_REFUSED', runId, 'Run directory is a symlink') };
  }
  if (!stat.isDirectory()) {
    return { safe: false, runId, diagnostic: retentionDiagnostic('RETENTION_RUN_UNCLASSIFIABLE', runId, 'Run target is not a directory') };
  }

  const model = candidate.model;
  if (Array.isArray(candidate.diagnostics) && candidate.diagnostics.length > 0) {
    return { safe: false, runId, diagnostic: retentionDiagnostic('RETENTION_RUN_UNCLASSIFIABLE', runId, 'Run contains reduction diagnostics') };
  }
  if (!model || typeof model !== 'object' || !['PASS', 'BLOCKED', 'INCOMPLETE'].includes(model.outcome)
    || typeof model.lifecycle_state !== 'string') {
    return { safe: false, runId, diagnostic: retentionDiagnostic('RETENTION_RUN_UNCLASSIFIABLE', runId, 'Run outcome is unclassifiable') };
  }
  return {
    safe: true,
    runId,
    runDir: run.runDir,
    metadata: { ...metadata },
    directoryIdentity: { dev: stat.dev, ino: stat.ino },
    model,
  };
}

const sameMetadata = (left, right) => RUN_METADATA_FIELDS.every(field => left[field] === right[field]);

function verifyDeletionTarget(candidate) {
  let stat;
  try {
    stat = lstatSync(candidate.runDir);
  } catch {
    return retentionDiagnostic('RETENTION_TARGET_CHANGED', candidate.runId, 'Run directory changed before deletion');
  }
  if (stat.isSymbolicLink()) {
    return retentionDiagnostic('RETENTION_SYMLINK_REFUSED', candidate.runId, 'Run directory became a symlink before deletion');
  }
  if (!stat.isDirectory()) {
    return retentionDiagnostic('RETENTION_TARGET_CHANGED', candidate.runId, 'Run target is no longer a directory');
  }

  let currentMetadata;
  try {
    currentMetadata = parseMetadata(readFileSync(join(candidate.runDir, 'run.json'), 'utf8'));
  } catch {
    return retentionDiagnostic('RETENTION_TARGET_CHANGED', candidate.runId, 'Run metadata changed before deletion');
  }
  const metadataValidation = validateRunMetadata(currentMetadata);
  if (metadataValidation.diagnostics.length > 0
    || !sameMetadata(candidate.metadata, currentMetadata)
    || stat.dev !== candidate.directoryIdentity.dev
    || stat.ino !== candidate.directoryIdentity.ino) {
    return retentionDiagnostic('RETENTION_TARGET_CHANGED', candidate.runId, 'Run directory or metadata changed before deletion');
  }
  return null;
}

export function applyRetention(identity, classifiedRuns, limit = RETENTION_TERMINAL_LIMIT) {
  if (!identity || typeof identity.metricsPlanRoot !== 'string' || typeof identity.planPath !== 'string') {
    throw new TypeError('identity.metricsPlanRoot and identity.planPath are required');
  }
  if (!Array.isArray(classifiedRuns)) throw new TypeError('classifiedRuns must be an array');
  if (!Number.isSafeInteger(limit) || limit < 0) throw new RangeError('retention limit must be a non-negative safe integer');

  const deleted = [];
  const preserved = [];
  const diagnostics = [];
  const eligible = [];
  const runIdCounts = new Map();
  for (const candidate of classifiedRuns) {
    const runId = candidateRunId(candidate);
    runIdCounts.set(runId, (runIdCounts.get(runId) ?? 0) + 1);
  }
  const duplicateRunIds = new Set([...runIdCounts].filter(([, count]) => count > 1).map(([runId]) => runId));
  const handledDuplicates = new Set();

  for (const candidate of classifiedRuns) {
    const classified = validateRetentionCandidate(identity, candidate);
    if (duplicateRunIds.has(classified.runId)) {
      if (!handledDuplicates.has(classified.runId)) {
        preserved.push(classified.runId);
        diagnostics.push(retentionDiagnostic('RETENTION_DUPLICATE_RUN_ID', classified.runId, 'Run was classified more than once'));
        handledDuplicates.add(classified.runId);
      }
      continue;
    }
    if (!classified.safe) {
      preserved.push(classified.runId);
      diagnostics.push(classified.diagnostic);
      continue;
    }
    if (classified.model.lifecycle_state === 'ACTIVE' || classified.model.outcome === 'BLOCKED') {
      preserved.push(classified.runId);
    } else {
      eligible.push(classified);
    }
  }

  eligible.sort((left, right) => {
    const dateOrder = right.metadata.created_at.localeCompare(left.metadata.created_at);
    return dateOrder || right.runId.localeCompare(left.runId);
  });
  const retained = new Set(eligible.slice(0, limit).map(candidate => candidate.runId));
  for (const candidate of eligible) {
    if (retained.has(candidate.runId)) {
      preserved.push(candidate.runId);
      continue;
    }
    try {
      const targetDiagnostic = verifyDeletionTarget(candidate);
      if (targetDiagnostic) {
        preserved.push(candidate.runId);
        diagnostics.push(targetDiagnostic);
        continue;
      }
      rmSync(candidate.runDir, { recursive: true, force: false });
      deleted.push(candidate.runId);
    } catch (error) {
      preserved.push(candidate.runId);
      const message = error instanceof Error ? error.message : String(error);
      diagnostics.push(retentionDiagnostic('RETENTION_DELETE_FAILED', candidate.runId, message));
    }
  }
  return { deleted, preserved, diagnostics };
}
