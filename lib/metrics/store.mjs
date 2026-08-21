import { lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
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
  const diagnostics = [];
  const runs = [];
  try {
    for (const entry of readdirSync(identity.metricsPlanRoot, { withFileTypes: true })) {
      const runDir = join(identity.metricsPlanRoot, entry.name);
      if (entry.isSymbolicLink()) {
        diagnostics.push(retentionDiagnostic('RETENTION_SYMLINK_REFUSED', entry.name, 'Run store child is a symlink'));
        continue;
      }
      if (!entry.isDirectory() || !RUN_ID_RE.test(entry.name)) {
        diagnostics.push(retentionDiagnostic('RETENTION_RUN_UNCLASSIFIABLE', entry.name, 'Run store child is not a validated run directory'));
        continue;
      }
      try {
        const run = loadRunDirectory(runDir);
        if (run.metadataDiagnostics.length > 0 || run.metadata?.plan_path !== identity.planPath) {
          diagnostics.push(retentionDiagnostic('RETENTION_RUN_UNCLASSIFIABLE', entry.name, 'Run metadata is invalid or belongs to another plan'));
          continue;
        }
        runs.push(run);
      } catch {
        diagnostics.push(retentionDiagnostic('RETENTION_RUN_UNCLASSIFIABLE', entry.name, 'Run directory cannot be classified safely'));
      }
    }
  } catch (error) {
    if (error && error.code === 'ENOENT') return attachDiagnostics(runs, diagnostics);
    throw error;
  }
  return attachDiagnostics(runs, diagnostics);
}

function attachDiagnostics(runs, diagnostics) {
  Object.defineProperty(runs, 'diagnostics', { value: diagnostics, enumerable: false });
  return runs;
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
  if (!identity || typeof identity.root !== 'string' || typeof identity.reportPath !== 'string') throw new TypeError('identity.root and identity.reportPath are required');
  if (typeof markdown !== 'string') throw new TypeError('markdown must be a string');

  const { reportPath } = identity;
  const reportDirectory = validateReportDirectory(identity);
  validateReportTarget(reportPath, reportDirectory);
  try {
    if (readFileSync(reportPath, 'utf8') === markdown) return { reportPath, changed: false };
  } catch (error) {
    if (!error || error.code !== 'ENOENT') throw error;
  }

  const temporaryPath = join(reportDirectory, `.${basename(reportPath)}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`);
  try {
    writeFileSync(temporaryPath, markdown, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    validateReportTarget(temporaryPath, reportDirectory, { temporary: true });
    validateReportTarget(reportPath, reportDirectory);
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

function outsideRoot(root, candidate) {
  const pathToCandidate = relative(root, candidate);
  return pathToCandidate === '..' || pathToCandidate.startsWith(`..${sep}`) || isAbsolute(pathToCandidate);
}

function validateReportDirectory(identity) {
  let rootStat;
  let realRoot;
  try {
    rootStat = lstatSync(identity.root);
    realRoot = realpathSync(identity.root);
  } catch {
    throw new Error('Report worktree root is unavailable');
  }
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) throw new Error('Report worktree root is not a real directory');

  const reportDirectory = dirname(resolve(identity.reportPath));
  if (outsideRoot(realRoot, reportDirectory)) throw new Error('Report path must remain inside the real worktree');
  const components = relative(realRoot, reportDirectory).split(sep).filter(Boolean);
  let current = realRoot;
  for (const component of components) {
    current = join(current, component);
    try {
      const stat = lstatSync(current);
      if (stat.isSymbolicLink()) throw new Error(`Report path component is a symlink: ${component}`);
      if (!stat.isDirectory()) throw new Error(`Report path component is not a directory: ${component}`);
    } catch (error) {
      if (!error || error.code !== 'ENOENT') throw error;
      mkdirSync(current);
      const created = lstatSync(current);
      if (created.isSymbolicLink() || !created.isDirectory()) throw new Error(`Report path component is unsafe: ${component}`);
    }
    let realCurrent;
    try {
      realCurrent = realpathSync(current);
    } catch {
      throw new Error(`Report path component is unavailable: ${component}`);
    }
    if (outsideRoot(realRoot, realCurrent)) throw new Error(`Report path component escapes the worktree: ${component}`);
  }
  return reportDirectory;
}

function validateReportTarget(targetPath, reportDirectory, { temporary = false } = {}) {
  if (dirname(resolve(targetPath)) !== reportDirectory) throw new Error('Report target is outside its validated directory');
  try {
    const stat = lstatSync(targetPath);
    if (stat.isSymbolicLink()) throw new Error(`Report target is a symlink: ${basename(targetPath)}`);
    if (!stat.isFile()) throw new Error(`Report target is not a regular file: ${basename(targetPath)}`);
  } catch (error) {
    if (error && error.code === 'ENOENT' && !temporary) return;
    throw error;
  }
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

function verifyDeletionTarget(candidate, targetPath = candidate.runDir) {
  let stat;
  try {
    stat = lstatSync(targetPath);
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
    currentMetadata = parseMetadata(readFileSync(join(targetPath, 'run.json'), 'utf8'));
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

function quarantinePathFor(identity, candidate) {
  return join(identity.metricsPlanRoot, `.${candidate.runId}.retention-${process.pid}-${Math.random().toString(16).slice(2)}`);
}

function restoreQuarantine(candidate, quarantinePath) {
  try {
    lstatSync(candidate.runDir);
    return false;
  } catch (error) {
    if (!error || error.code !== 'ENOENT') return false;
  }
  try {
    renameSync(quarantinePath, candidate.runDir);
    return true;
  } catch {
    return false;
  }
}

function retainUncertainTarget(candidate, quarantinePath, diagnostic) {
  const restored = restoreQuarantine(candidate, quarantinePath);
  if (restored) return diagnostic;
  return retentionDiagnostic(
    diagnostic.code,
    candidate.runId,
    `${diagnostic.message}; quarantined target was preserved`,
  );
}

function deleteThroughQuarantine(identity, candidate) {
  const preRenameDiagnostic = verifyDeletionTarget(candidate);
  if (preRenameDiagnostic) return { deleted: false, diagnostic: preRenameDiagnostic };

  const quarantinePath = quarantinePathFor(identity, candidate);
  try {
    renameSync(candidate.runDir, quarantinePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { deleted: false, diagnostic: retentionDiagnostic('RETENTION_DELETE_FAILED', candidate.runId, message) };
  }

  const afterRenameDiagnostic = verifyDeletionTarget(candidate, quarantinePath);
  if (afterRenameDiagnostic) {
    return { deleted: false, diagnostic: retainUncertainTarget(candidate, quarantinePath, afterRenameDiagnostic) };
  }

  identity.retentionHooks?.beforeQuarantineDelete?.({
    runId: candidate.runId,
    originalPath: candidate.runDir,
    quarantinePath,
  });
  const finalDiagnostic = verifyDeletionTarget(candidate, quarantinePath);
  if (finalDiagnostic) {
    return { deleted: false, diagnostic: retainUncertainTarget(candidate, quarantinePath, finalDiagnostic) };
  }

  try {
    rmSync(quarantinePath, { recursive: true, force: false });
    return { deleted: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      deleted: false,
      diagnostic: retainUncertainTarget(
        candidate,
        quarantinePath,
        retentionDiagnostic('RETENTION_DELETE_FAILED', candidate.runId, message),
      ),
    };
  }
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
    const deletion = deleteThroughQuarantine(identity, candidate);
    if (deletion.deleted) {
      deleted.push(candidate.runId);
    } else {
      preserved.push(candidate.runId);
      diagnostics.push(deletion.diagnostic);
    }
  }
  return { deleted, preserved, diagnostics };
}
