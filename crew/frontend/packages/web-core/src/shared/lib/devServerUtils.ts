import type { ExecutionProcess } from 'shared/types';

/**
 * Extract the working directory from a dev server process's executor action.
 */
export function getDevServerWorkingDir(
  process: ExecutionProcess
): string | null {
  const typ = process.executor_action?.typ;
  if (typ && 'type' in typ && typ.type === 'ScriptRequest') {
    return (typ as { working_dir: string | null }).working_dir;
  }
  return null;
}

/**
 * Deduplicate dev server processes by working directory, keeping the latest
 * process for each unique directory.
 */
export function deduplicateDevServersByWorkingDir(
  processes: ExecutionProcess[]
): ExecutionProcess[] {
  const byWorkingDir = new Map<string, ExecutionProcess>();
  for (const process of processes) {
    const workingDir = getDevServerWorkingDir(process) ?? 'unknown';
    const existing = byWorkingDir.get(workingDir);
    if (
      !existing ||
      new Date(process.started_at) > new Date(existing.started_at)
    ) {
      byWorkingDir.set(workingDir, process);
    }
  }
  return Array.from(byWorkingDir.values());
}

/**
 * Filter processes to only include dev servers.
 */
export function filterDevServerProcesses(
  processes: ExecutionProcess[]
): ExecutionProcess[] {
  return processes.filter((process) => process.run_reason === 'devserver');
}

/**
 * Filter processes to only include running dev servers.
 */
export function filterRunningDevServers(
  processes: ExecutionProcess[]
): ExecutionProcess[] {
  return processes.filter(
    (process) =>
      process.run_reason === 'devserver' && process.status === 'running'
  );
}
