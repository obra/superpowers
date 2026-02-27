import { useTranslation } from 'react-i18next';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { useWorkspaceNotes } from '@/features/workspace/model/hooks/useWorkspaceNotes';
import WYSIWYGEditor from '@/shared/components/WYSIWYGEditor';
import { SpinnerIcon } from '@phosphor-icons/react';

export function WorkspaceNotesContainer() {
  const { t } = useTranslation('common');
  const { workspace } = useWorkspaceContext();
  const workspaceId = workspace?.id;

  const { content, isLoading, setContent } = useWorkspaceNotes(workspaceId);

  if (!workspaceId) {
    return (
      <div className="p-base text-low text-sm flex-1">
        {t('notes.selectWorkspace')}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 p-base">
        <SpinnerIcon className="animate-spin h-5 w-5 text-low" />
      </div>
    );
  }

  return (
    <div className="p-base flex flex-col flex-1 min-h-0 overflow-y-auto">
      <WYSIWYGEditor
        placeholder={t('notes.placeholder')}
        value={content}
        onChange={setContent}
        autoFocus={false}
        className="min-h-[300px]"
      />
    </div>
  );
}
