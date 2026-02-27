import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { create, useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/shared/lib/modals';
import { ProjectProvider } from '@/shared/providers/remote/ProjectProvider';
import { useProjectContext } from '@/shared/hooks/useProjectContext';
import { CommandDialog } from '@vibe/ui/components/Command';
import {
  CommandBar,
  type CommandBarGroupItem,
} from '@vibe/ui/components/CommandBar';
import type { PageId, ResolvedGroupItem } from '@/shared/types/commandBar';
import type { StatusItem } from '@/shared/types/selectionItems';
import type { Issue } from 'shared/remote-types';
import { buildStatusSelectionPages } from './statusSelection';
import { buildPrioritySelectionPages } from './prioritySelection';
import { buildSubIssueSelectionPages } from './subIssueSelection';
import { buildRelationshipSelectionPages } from './relationshipSelection';
import { resolveLabel, type ActionDefinition } from '@/shared/types/actions';
import type { SelectionPage } from '../SelectionDialog';
import type { StatusSelectionResult } from './statusSelection';
import type { PrioritySelectionResult } from './prioritySelection';
import type { SubIssueSelectionResult } from './subIssueSelection';
import type { RelationshipSelectionResult } from './relationshipSelection';

// Union of all selection modes
export type SelectionMode =
  | { type: 'status'; issueIds: string[]; isCreateMode?: boolean }
  | { type: 'priority'; issueIds: string[]; isCreateMode?: boolean }
  | {
      type: 'subIssue';
      parentIssueId: string;
      mode: 'addChild' | 'setParent';
    }
  | {
      type: 'relationship';
      issueId: string;
      relationshipType: 'blocking' | 'related' | 'has_duplicate';
      direction: 'forward' | 'reverse';
    };

interface ProjectSelectionDialogProps {
  projectId: string;
  selection: SelectionMode;
}

function getInitialPageId(selectionType: SelectionMode['type']): string {
  switch (selectionType) {
    case 'status':
      return 'selectStatus';
    case 'priority':
      return 'selectPriority';
    case 'subIssue':
      return 'selectSubIssue';
    case 'relationship':
      return 'selectRelationshipIssue';
  }
}

// Inner component that has access to ProjectContext
function ProjectSelectionContent({ selection }: { selection: SelectionMode }) {
  const modal = useModal();
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const {
    statuses,
    issues,
    issueRelationships,
    updateIssue,
    insertIssueRelationship,
  } = useProjectContext();
  const initialPageId = useMemo(
    () => getInitialPageId(selection.type),
    [selection.type]
  );
  const [search, setSearch] = useState('');
  const [currentPageId, setCurrentPageId] = useState(initialPageId);
  const [pageStack, setPageStack] = useState<string[]>([]);

  // Capture focus on mount
  if (!previousFocusRef.current && modal.visible) {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }

  // NiceModal reuses dialog instances; reset local navigation when mode changes.
  useEffect(() => {
    setCurrentPageId(initialPageId);
    setPageStack([]);
    setSearch('');
  }, [initialPageId]);

  const sortedStatuses: StatusItem[] = useMemo(
    () =>
      [...statuses]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((s) => ({ id: s.id, name: s.name, color: s.color })),
    [statuses]
  );

  // Build filtered issue list for sub-issue selection
  const filteredIssuesForSubIssue = useMemo((): Issue[] => {
    if (selection.type !== 'subIssue') return [];
    const { parentIssueId, mode } = selection;

    const issuesById = new Map(issues.map((i) => [i.id, i]));

    const getAncestorIds = (issueId: string): Set<string> => {
      const ancestors = new Set<string>();
      let current = issuesById.get(issueId);
      while (current?.parent_issue_id) {
        ancestors.add(current.parent_issue_id);
        current = issuesById.get(current.parent_issue_id);
      }
      return ancestors;
    };

    const getDescendantIds = (issueId: string): Set<string> => {
      const descendants = new Set<string>();
      const queue = [issueId];
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        for (const issue of issues) {
          if (
            issue.parent_issue_id === currentId &&
            !descendants.has(issue.id)
          ) {
            descendants.add(issue.id);
            queue.push(issue.id);
          }
        }
      }
      return descendants;
    };

    const anchorIssue = issuesById.get(parentIssueId);

    if (mode === 'addChild') {
      const ancestorIds = getAncestorIds(parentIssueId);
      return issues.filter((issue) => {
        if (issue.id === parentIssueId) return false;
        if (issue.parent_issue_id === parentIssueId) return false;
        if (ancestorIds.has(issue.id)) return false;
        return true;
      });
    } else {
      const descendantIds = getDescendantIds(parentIssueId);
      return issues.filter((issue) => {
        if (issue.id === parentIssueId) return false;
        if (anchorIssue?.parent_issue_id === issue.id) return false;
        if (descendantIds.has(issue.id)) return false;
        return true;
      });
    }
  }, [issues, selection]);

  // Build filtered issue list for relationship selection
  const filteredIssuesForRelationship = useMemo((): Issue[] => {
    if (selection.type !== 'relationship') return [];
    const { issueId } = selection;

    const existingRelatedIds = new Set(
      issueRelationships
        .filter((r) => r.issue_id === issueId || r.related_issue_id === issueId)
        .flatMap((r) => [r.issue_id, r.related_issue_id])
    );

    return issues.filter((issue) => {
      if (issue.id === issueId) return false;
      if (existingRelatedIds.has(issue.id)) return false;
      return true;
    });
  }, [issues, issueRelationships, selection]);

  // Build pages based on selection mode
  const pages = useMemo((): Record<string, SelectionPage> => {
    switch (selection.type) {
      case 'status':
        return buildStatusSelectionPages(sortedStatuses) as Record<
          string,
          SelectionPage
        >;
      case 'priority':
        return buildPrioritySelectionPages() as Record<string, SelectionPage>;
      case 'subIssue':
        return buildSubIssueSelectionPages(
          filteredIssuesForSubIssue,
          selection.mode
        ) as Record<string, SelectionPage>;
      case 'relationship':
        return buildRelationshipSelectionPages(
          filteredIssuesForRelationship
        ) as Record<string, SelectionPage>;
    }
  }, [
    selection,
    sortedStatuses,
    filteredIssuesForSubIssue,
    filteredIssuesForRelationship,
  ]);

  // Handle mutation after selection
  const handleResult = useCallback(
    (data: unknown) => {
      if (!data) return;

      if (selection.type === 'status') {
        const result = data as StatusSelectionResult;
        if (selection.isCreateMode) return; // Create mode: caller handles URL update
        for (const issueId of selection.issueIds) {
          updateIssue(issueId, { status_id: result.statusId });
        }
      } else if (selection.type === 'priority') {
        const result = data as PrioritySelectionResult;
        if (selection.isCreateMode) return;
        for (const issueId of selection.issueIds) {
          updateIssue(issueId, { priority: result.priority });
        }
      } else if (selection.type === 'subIssue') {
        const result = data as SubIssueSelectionResult;
        if (result.type === 'selected') {
          if (selection.mode === 'addChild') {
            updateIssue(result.issueId, {
              parent_issue_id: selection.parentIssueId,
            });
          } else {
            updateIssue(selection.parentIssueId, {
              parent_issue_id: result.issueId,
            });
          }
        }
        // 'createNew' is handled by the caller (AddSubIssue action)
      } else if (selection.type === 'relationship') {
        const result = data as RelationshipSelectionResult;
        if (selection.direction === 'forward') {
          insertIssueRelationship({
            issue_id: selection.issueId,
            related_issue_id: result.issueId,
            relationship_type: selection.relationshipType,
          });
        } else {
          insertIssueRelationship({
            issue_id: result.issueId,
            related_issue_id: selection.issueId,
            relationship_type: selection.relationshipType,
          });
        }
      }
    },
    [selection, updateIssue, insertIssueRelationship]
  );

  const fallbackPage = pages[initialPageId] ?? Object.values(pages)[0];
  const currentPage = pages[currentPageId] ?? fallbackPage;

  const resolvedPage = useMemo(
    () =>
      currentPage
        ? {
            id: currentPage.id,
            title: currentPage.title,
            groups: currentPage.buildGroups(),
          }
        : { id: initialPageId, title: '', groups: [] },
    [currentPage, initialPageId]
  );

  const handleSelect = useCallback(
    (item: CommandBarGroupItem<ActionDefinition, PageId>) => {
      const result = currentPage.onSelect(item as ResolvedGroupItem);
      if (result.type === 'complete') {
        handleResult(result.data);
        modal.resolve(result.data);
        modal.hide();
      } else if (result.type === 'navigate') {
        setPageStack((prev) => [...prev, currentPage.id]);
        setCurrentPageId(result.pageId);
        setSearch('');
      }
    },
    [currentPage, modal, handleResult]
  );

  const handleGoBack = useCallback(() => {
    const prevPage = pageStack[pageStack.length - 1];
    if (prevPage) {
      setPageStack((prev) => prev.slice(0, -1));
      setCurrentPageId(prevPage);
      setSearch('');
    }
  }, [pageStack]);

  const handleClose = useCallback(() => {
    modal.resolve(undefined);
    modal.hide();
  }, [modal]);

  const handleCloseAutoFocus = useCallback((event: Event) => {
    event.preventDefault();
    const activeElement = document.activeElement;
    const isInDialog = activeElement?.closest('[role="dialog"]');
    if (!isInDialog) {
      previousFocusRef.current?.focus();
    }
  }, []);

  if (!currentPage) {
    return null;
  }

  return (
    <CommandDialog
      open={modal.visible}
      onOpenChange={(open) => !open && handleClose()}
      onCloseAutoFocus={handleCloseAutoFocus}
    >
      <CommandBar
        page={resolvedPage}
        canGoBack={pageStack.length > 0}
        onGoBack={handleGoBack}
        onSelect={handleSelect}
        getLabel={(action) => resolveLabel(action)}
        search={search}
        onSearchChange={setSearch}
        statuses={sortedStatuses}
      />
    </CommandDialog>
  );
}

const ProjectSelectionDialogImpl = create<ProjectSelectionDialogProps>(
  ({ projectId, selection }) => {
    return (
      <ProjectProvider projectId={projectId}>
        <ProjectSelectionContent selection={selection} />
      </ProjectProvider>
    );
  }
);

export const ProjectSelectionDialog = defineModal<
  ProjectSelectionDialogProps,
  unknown | undefined
>(ProjectSelectionDialogImpl);
