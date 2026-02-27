import { useCallback, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PreviewControls } from '@vibe/ui/components/PreviewControls';
import { usePreviewDevServer } from '@/features/workspace/model/hooks/usePreviewDevServer';
import { useLogStream } from '@/shared/hooks/useLogStream';
import {
  useUiPreferencesStore,
  RIGHT_MAIN_PANEL_MODES,
} from '@/shared/stores/useUiPreferencesStore';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { useLogsPanel } from '@/shared/hooks/useLogsPanel';
import { VirtualizedProcessLogs } from '@/shared/components/VirtualizedProcessLogs';
import { getDevServerWorkingDir } from '@/shared/lib/devServerUtils';

interface PreviewControlsContainerProps {
  attemptId: string;
  className: string;
}

export function PreviewControlsContainer({
  attemptId,
  className,
}: PreviewControlsContainerProps) {
  const { t } = useTranslation(['tasks', 'common']);
  const { repos } = useWorkspaceContext();
  const { viewProcessInPanel } = useLogsPanel();
  const setRightMainPanelMode = useUiPreferencesStore(
    (s) => s.setRightMainPanelMode
  );

  const { isStarting, runningDevServers, devServerProcesses } =
    usePreviewDevServer(attemptId);

  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);

  useEffect(() => {
    if (devServerProcesses.length > 0 && !activeProcessId) {
      setActiveProcessId(devServerProcesses[0].id);
    }
  }, [devServerProcesses, activeProcessId]);

  const activeProcess =
    devServerProcesses.find((p) => p.id === activeProcessId) ??
    devServerProcesses[0];

  const processTabs = useMemo(
    () =>
      devServerProcesses.map((process) => ({
        id: process.id,
        label:
          getDevServerWorkingDir(process) ??
          t('preview.browser.devServerFallback'),
      })),
    [devServerProcesses, t]
  );

  const { logs, error: logsError } = useLogStream(activeProcess?.id ?? '');

  const handleViewFullLogs = useCallback(() => {
    const targetId = activeProcess?.id;
    if (targetId) {
      viewProcessInPanel(targetId);
    } else {
      setRightMainPanelMode(RIGHT_MAIN_PANEL_MODES.LOGS);
    }
  }, [activeProcess?.id, viewProcessInPanel, setRightMainPanelMode]);

  const handleTabChange = useCallback((processId: string) => {
    setActiveProcessId(processId);
  }, []);

  const hasDevScript = repos.some(
    (repo) => repo.dev_server_script && repo.dev_server_script.trim() !== ''
  );

  // Don't render if no repos have dev server scripts configured
  if (!hasDevScript) {
    return null;
  }

  return (
    <PreviewControls
      processTabs={processTabs}
      activeProcessId={activeProcess?.id ?? null}
      logsContent={
        <VirtualizedProcessLogs
          logs={logs}
          error={logsError}
          searchQuery=""
          matchIndices={[]}
          currentMatchIndex={-1}
        />
      }
      onViewFullLogs={handleViewFullLogs}
      onTabChange={handleTabChange}
      isLoading={isStarting || runningDevServers.length > 0}
      className={className}
    />
  );
}
