import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@vibe/ui/components/Button';
import { ChevronsUpDown, FolderGit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@vibe/ui/components/DropdownMenu';
import type { Repo } from 'shared/types';

type Props = {
  repos: Repo[];
  selectedRepoId: string | null;
  onRepoSelect: (repoId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

function RepoSelector({
  repos,
  selectedRepoId,
  onRepoSelect,
  placeholder,
  className = '',
  disabled = false,
}: Props) {
  const { t } = useTranslation(['tasks']);
  const [open, setOpen] = useState(false);

  const effectivePlaceholder =
    placeholder ?? t('repos.selector.placeholder', 'Select repository');

  const selectedRepo = repos.find((r) => r.id === selectedRepoId);

  const handleRepoSelect = useCallback(
    (repoId: string) => {
      onRepoSelect(repoId);
      setOpen(false);
    },
    [onRepoSelect]
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`w-full justify-between text-xs ${className}`}
          disabled={disabled}
        >
          <div className="flex items-center gap-1.5 w-full min-w-0">
            <FolderGit className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {selectedRepo?.display_name || effectivePlaceholder}
            </span>
          </div>
          {repos.length > 1 && (
            <ChevronsUpDown className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64">
        {repos.length === 0 ? (
          <div className="p-2 text-sm text-muted-foreground text-center">
            {t('repos.selector.empty', 'No repositories available')}
          </div>
        ) : (
          repos.map((repo) => {
            const isSelected = selectedRepoId === repo.id;
            return (
              <DropdownMenuItem
                key={repo.id}
                onSelect={() => handleRepoSelect(repo.id)}
                className={isSelected ? 'bg-accent text-accent-foreground' : ''}
              >
                <div className="flex items-center gap-2 w-full">
                  <FolderGit className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{repo.display_name}</span>
                </div>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default RepoSelector;
