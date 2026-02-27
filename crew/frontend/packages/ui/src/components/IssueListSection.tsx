'use client';

import { useCallback, useState } from 'react';
import { cn } from '../lib/cn';
import { Droppable } from '@hello-pangea/dnd';
import { CaretDownIcon } from '@phosphor-icons/react';
import { StatusDot } from './StatusDot';
import { KanbanBadge } from './KanbanBadge';
import {
  IssueListRow,
  type IssueListRowIssue,
  type IssueListRowTag,
  type IssueListRowRelationship,
} from './IssueListRow';
import type { KanbanAssigneeUser } from './KanbanAssignee';

export interface IssueListSectionStatus {
  id: string;
  name: string;
  color: string;
}

export interface IssueListSectionProps {
  status: IssueListSectionStatus;
  issueIds: string[];
  issueMap: Record<string, IssueListRowIssue>;
  issueAssigneesMap: Record<string, KanbanAssigneeUser[]>;
  getTagObjectsForIssue: (issueId: string) => IssueListRowTag[];
  getResolvedRelationshipsForIssue?: (
    issueId: string
  ) => IssueListRowRelationship[];
  onIssueClick: (issueId: string) => void;
  selectedIssueId: string | null;
  className?: string;
}

export function IssueListSection({
  status,
  issueIds,
  issueMap,
  issueAssigneesMap,
  getTagObjectsForIssue,
  getResolvedRelationshipsForIssue,
  onIssueClick,
  selectedIssueId,
  className,
}: IssueListSectionProps) {
  const storageKey = `ui.issue-list-section.${status.id}`;
  const [isExpanded, setExpanded] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem(storageKey);
    return stored == null ? true : stored === 'true';
  });
  const handleToggleExpanded = useCallback(() => {
    setExpanded((prevExpanded) => {
      const nextExpanded = !prevExpanded;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, String(nextExpanded));
      }
      return nextExpanded;
    });
  }, [storageKey]);

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Section Header */}
      <button
        type="button"
        onClick={handleToggleExpanded}
        className={cn(
          'flex items-center justify-between',
          'h-8 px-double py-base',
          'bg-panel border-y border-border',
          'cursor-pointer transition-colors',
          'hover:bg-secondary'
        )}
      >
        <div className="flex items-center gap-base">
          <CaretDownIcon
            className={cn(
              'size-icon-xs text-low transition-transform',
              !isExpanded && '-rotate-90'
            )}
            weight="bold"
          />
          <StatusDot color={status.color} />
          <span className="text-base font-medium text-high">{status.name}</span>
        </div>
        <KanbanBadge name={String(issueIds.length)} />
      </button>

      {/* Section Content - Droppable area */}
      <Droppable droppableId={status.id}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-col min-h-8"
          >
            {isExpanded &&
              issueIds.map((issueId, index) => {
                const issue = issueMap[issueId];
                if (!issue) return null;

                return (
                  <IssueListRow
                    key={issue.id}
                    issue={issue}
                    index={index}
                    statusColor={status.color}
                    tags={getTagObjectsForIssue(issue.id)}
                    relationships={getResolvedRelationshipsForIssue?.(issue.id)}
                    assignees={issueAssigneesMap[issue.id] ?? []}
                    onClick={() => onIssueClick(issue.id)}
                    isSelected={selectedIssueId === issue.id}
                  />
                );
              })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
