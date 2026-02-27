import { useMemo, useCallback } from 'react';
import {
  PlusIcon,
  ArrowBendUpRightIcon,
  ProhibitIcon,
  ArrowsLeftRightIcon,
  CopyIcon,
} from '@phosphor-icons/react';
import { useProjectContext } from '@/shared/hooks/useProjectContext';
import { useActions } from '@/shared/hooks/useActions';
import { useKanbanNavigation } from '@/shared/hooks/useKanbanNavigation';
import { resolveRelationshipsForIssue } from '@/shared/lib/resolveRelationships';
import { IssueRelationshipsSection } from '@vibe/ui/components/IssueRelationshipsSection';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@vibe/ui/components/Dropdown';

interface IssueRelationshipsSectionContainerProps {
  issueId: string;
}

export function IssueRelationshipsSectionContainer({
  issueId,
}: IssueRelationshipsSectionContainerProps) {
  const { projectId, openIssue } = useKanbanNavigation();
  const { openRelationshipSelection } = useActions();

  const {
    getRelationshipsForIssue,
    removeIssueRelationship,
    issuesById,
    isLoading,
  } = useProjectContext();

  const relationships = useMemo(
    () =>
      resolveRelationshipsForIssue(
        issueId,
        getRelationshipsForIssue(issueId),
        issuesById
      ),
    [issueId, getRelationshipsForIssue, issuesById]
  );

  const handleRelationshipClick = useCallback(
    (relatedIssueId: string) => {
      openIssue(relatedIssueId);
    },
    [openIssue]
  );

  const handleRemoveRelationship = useCallback(
    (relationshipId: string) => {
      removeIssueRelationship(relationshipId);
    },
    [removeIssueRelationship]
  );

  const handleSelectType = useCallback(
    (
      relationshipType: 'blocking' | 'related' | 'has_duplicate',
      direction: 'forward' | 'reverse'
    ) => {
      if (projectId) {
        openRelationshipSelection(
          projectId,
          issueId,
          relationshipType,
          direction
        );
      }
    },
    [projectId, issueId, openRelationshipSelection]
  );

  const headerExtra = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          className="text-low hover:text-normal"
          onClick={(e) => e.stopPropagation()}
        >
          <PlusIcon className="size-icon-xs" weight="bold" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          icon={ArrowBendUpRightIcon}
          onSelect={() => handleSelectType('blocking', 'forward')}
        >
          Blocks...
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={ProhibitIcon}
          onSelect={() => handleSelectType('blocking', 'reverse')}
        >
          Blocked by...
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={ArrowsLeftRightIcon}
          onSelect={() => handleSelectType('related', 'forward')}
        >
          Related to...
        </DropdownMenuItem>
        <DropdownMenuItem
          icon={CopyIcon}
          onSelect={() => handleSelectType('has_duplicate', 'forward')}
        >
          Duplicate of...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <IssueRelationshipsSection
      relationships={relationships}
      onRelationshipClick={handleRelationshipClick}
      onRemoveRelationship={handleRemoveRelationship}
      isLoading={isLoading}
      headerExtra={headerExtra}
    />
  );
}
