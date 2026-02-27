import { type FileChange } from 'shared/types';
import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { Trash2, FilePlus2, ArrowRight, FileX, FileClock } from 'lucide-react';
import { getHighLightLanguageFromPath } from '@/shared/lib/extToLanguage';
import { getActualTheme } from '@/shared/lib/theme';
import EditDiffRenderer from './EditDiffRenderer';
import FileContentView from './FileContentView';
import '@/styles/diff-style-overrides.css';
import { useExpandable } from '@/shared/stores/useExpandableStore';
import { cn } from '@/shared/lib/utils';

type Props = {
  path: string;
  change: FileChange;
  expansionKey: string;
  defaultExpanded?: boolean;
  statusAppearance?: 'default' | 'denied' | 'timed_out';
  forceExpanded?: boolean;
};

function isWrite(
  change: FileChange
): change is Extract<FileChange, { action: 'write'; content: string }> {
  return change?.action === 'write';
}
function isDelete(
  change: FileChange
): change is Extract<FileChange, { action: 'delete' }> {
  return change?.action === 'delete';
}
function isRename(
  change: FileChange
): change is Extract<FileChange, { action: 'rename'; new_path: string }> {
  return change?.action === 'rename';
}
function isEdit(
  change: FileChange
): change is Extract<FileChange, { action: 'edit' }> {
  return change?.action === 'edit';
}

const FileChangeRenderer = ({
  path,
  change,
  expansionKey,
  defaultExpanded = false,
  statusAppearance = 'default',
  forceExpanded = false,
}: Props) => {
  const { config } = useUserSystem();
  const [expanded, setExpanded] = useExpandable(expansionKey, defaultExpanded);
  const effectiveExpanded = forceExpanded || expanded;

  const theme = getActualTheme(config?.theme);
  const headerClass = cn('flex items-center gap-1.5 text-secondary-foreground');

  const statusIcon =
    statusAppearance === 'denied' ? (
      <FileX className="h-3 w-3" />
    ) : statusAppearance === 'timed_out' ? (
      <FileClock className="h-3 w-3" />
    ) : null;

  if (statusIcon) {
    return (
      <div>
        <div className={headerClass}>
          {statusIcon}
          <p className="text-sm font-light overflow-x-auto flex-1">{path}</p>
        </div>
      </div>
    );
  }

  // Edit: delegate to EditDiffRenderer for identical styling and behavior
  if (isEdit(change)) {
    return (
      <EditDiffRenderer
        path={path}
        unifiedDiff={change.unified_diff}
        hasLineNumbers={change.has_line_numbers}
        expansionKey={expansionKey}
        defaultExpanded={defaultExpanded}
        statusAppearance={statusAppearance}
        forceExpanded={forceExpanded}
      />
    );
  }

  // Title row content and whether the row is expandable
  const { titleNode, icon, expandable } = (() => {
    if (isDelete(change)) {
      return {
        titleNode: path,
        icon: <Trash2 className="h-3 w-3" />,
        expandable: false,
      };
    }

    if (isRename(change)) {
      return {
        titleNode: (
          <>
            Rename {path} to {change.new_path}
          </>
        ),
        icon: <ArrowRight className="h-3 w-3" />,
        expandable: false,
      };
    }

    if (isWrite(change)) {
      return {
        titleNode: path,
        icon: <FilePlus2 className="h-3 w-3" />,
        expandable: true,
      };
    }

    // No fallback: render nothing for unknown change types
    return {
      titleNode: null,
      icon: null,
      expandable: false,
    };
  })();

  // nothing to display
  if (!titleNode) {
    return null;
  }

  return (
    <div>
      <div className={headerClass}>
        {icon}
        <p
          onClick={() => expandable && setExpanded()}
          className="text-sm font-mono overflow-x-auto flex-1 cursor-pointer"
        >
          {titleNode}
        </p>
      </div>

      {/* Body */}
      {isWrite(change) && effectiveExpanded && (
        <FileContentView
          content={change.content}
          lang={getHighLightLanguageFromPath(path)}
          theme={theme}
        />
      )}
    </div>
  );
};

export default FileChangeRenderer;
