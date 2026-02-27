'use client';

import { cn } from '../lib/cn';
import { Draggable } from '@hello-pangea/dnd';
import { DotsSixVerticalIcon } from '@phosphor-icons/react';
import { PriorityIcon, type PriorityLevel } from './PriorityIcon';
import { StatusDot } from './StatusDot';
import { KanbanBadge } from './KanbanBadge';
import { KanbanAssignee, type KanbanAssigneeUser } from './KanbanAssignee';
import {
  RelationshipBadge,
  type RelationshipDisplayType,
} from './RelationshipBadge';

/**
 * Formats a date as a relative time string (e.g., "1d", "2h", "3m")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `${diffDays}d`;
  }
  if (diffHours > 0) {
    return `${diffHours}h`;
  }
  if (diffMinutes > 0) {
    return `${diffMinutes}m`;
  }
  return 'now';
}

const MAX_VISIBLE_TAGS = 2;

export interface IssueListRowIssue {
  id: string;
  simple_id: string;
  title: string;
  priority: PriorityLevel | null;
  created_at: string;
}

export interface IssueListRowTag {
  id: string;
  name: string;
  color: string;
}

export interface IssueListRowRelationship {
  relationshipId: string;
  displayType: RelationshipDisplayType;
  relatedIssueDisplayId: string;
}

export interface IssueListRowProps {
  issue: IssueListRowIssue;
  index: number;
  statusColor: string;
  tags: IssueListRowTag[];
  relationships?: IssueListRowRelationship[];
  assignees: KanbanAssigneeUser[];
  onClick: () => void;
  isSelected: boolean;
  className?: string;
}

export function IssueListRow({
  issue,
  index,
  statusColor,
  tags,
  relationships = [],
  assignees,
  onClick,
  isSelected,
  className,
}: IssueListRowProps) {
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);

  return (
    <Draggable draggableId={issue.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick();
            }
          }}
          className={cn(
            'flex items-center justify-between gap-double px-double py-half',
            'transition-colors',
            'hover:bg-secondary',
            isSelected && 'bg-secondary',
            snapshot.isDragging && 'bg-secondary shadow-lg cursor-grabbing',
            className
          )}
        >
          {/* Left side: Drag handle, Priority, ID, Status, Title */}
          <div className="flex items-center gap-double flex-1 min-w-0">
            <div
              {...provided.dragHandleProps}
              className="cursor-grab shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <DotsSixVerticalIcon
                className="size-icon-xs text-low"
                weight="bold"
              />
            </div>
            <PriorityIcon priority={issue.priority} />
            <span className="font-ibm-plex-mono text-sm text-normal shrink-0">
              {issue.simple_id}
            </span>
            <StatusDot color={statusColor} />
            <span className="text-base text-high truncate">{issue.title}</span>
          </div>

          {/* Right side: Tags, Assignee, Age */}
          <div className="flex items-center gap-base shrink-0">
            {visibleTags.length > 0 && (
              <div className="flex items-center gap-half">
                {visibleTags.map((tag) => (
                  <KanbanBadge key={tag.id} name={tag.name} color={tag.color} />
                ))}
              </div>
            )}
            {relationships.length > 0 && (
              <div className="flex items-center gap-half">
                {relationships.slice(0, 2).map((rel) => (
                  <RelationshipBadge
                    key={rel.relationshipId}
                    displayType={rel.displayType}
                    relatedIssueDisplayId={rel.relatedIssueDisplayId}
                    compact
                  />
                ))}
                {relationships.length > 2 && (
                  <span className="text-sm text-low">
                    +{relationships.length - 2}
                  </span>
                )}
              </div>
            )}
            <KanbanAssignee assignees={assignees} />
            <span className="text-sm text-low w-5 text-right">
              {formatRelativeTime(issue.created_at)}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
