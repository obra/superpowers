import { useTranslation } from 'react-i18next';
import { Droppable } from '@hello-pangea/dnd';
import {
  CollapsibleSectionHeader,
  type SectionAction,
} from './CollapsibleSectionHeader';
import { SubIssueRow } from './SubIssueRow';
import type { PriorityLevel } from './PriorityIcon';
import type { KanbanAssigneeUser } from './KanbanAssignee';

export interface SubIssueData {
  id: string;
  simpleId: string;
  title: string;
  priority: PriorityLevel | null;
  statusColor: string;
  assignees: KanbanAssigneeUser[];
  createdAt: string;
  parentIssueSortOrder: number | null;
}

export interface IssueSubIssuesSectionProps {
  parentIssueId: string;
  subIssues: SubIssueData[];
  onSubIssueClick: (issueId: string) => void;
  onSubIssueMarkIndependent?: (subIssueId: string) => void;
  onSubIssueDelete?: (subIssueId: string) => void;
  onSubIssuePriorityClick?: (subIssueId: string) => void;
  onSubIssueAssigneeClick?: (subIssueId: string) => void;
  isLoading?: boolean;
  isReordering?: boolean;
  actions?: SectionAction[];
}

export function IssueSubIssuesSection({
  parentIssueId,
  subIssues,
  onSubIssueClick,
  onSubIssueMarkIndependent,
  onSubIssueDelete,
  onSubIssuePriorityClick,
  onSubIssueAssigneeClick,
  isLoading,
  isReordering,
  actions,
}: IssueSubIssuesSectionProps) {
  const { t } = useTranslation('common');

  return (
    <CollapsibleSectionHeader
      title={t('kanban.subIssues', 'Sub-issues')}
      persistKey="kanban-issue-sub-issues"
      defaultExpanded={true}
      actions={actions}
    >
      <Droppable droppableId={parentIssueId}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="p-base flex flex-col relative border-t"
          >
            {isReordering && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                <p className="text-low">{t('common.loading', 'Loading...')}</p>
              </div>
            )}
            {isLoading ? (
              <p className="text-low py-half">
                {t('common.loading', 'Loading...')}
              </p>
            ) : subIssues.length === 0 ? (
              <p className="text-low py-half">
                {t('kanban.noSubIssues', 'No sub-issues')}
              </p>
            ) : (
              subIssues.map((subIssue, index) => (
                <SubIssueRow
                  key={subIssue.id}
                  id={subIssue.id}
                  index={index}
                  simpleId={subIssue.simpleId}
                  title={subIssue.title}
                  priority={subIssue.priority}
                  statusColor={subIssue.statusColor}
                  assignees={subIssue.assignees}
                  createdAt={subIssue.createdAt}
                  onClick={() => onSubIssueClick(subIssue.id)}
                  onMarkIndependentClick={
                    onSubIssueMarkIndependent
                      ? (e) => {
                          e.stopPropagation();
                          onSubIssueMarkIndependent(subIssue.id);
                        }
                      : undefined
                  }
                  onDeleteClick={
                    onSubIssueDelete
                      ? (e) => {
                          e.stopPropagation();
                          onSubIssueDelete(subIssue.id);
                        }
                      : undefined
                  }
                  onPriorityClick={
                    onSubIssuePriorityClick
                      ? (e) => {
                          e.stopPropagation();
                          onSubIssuePriorityClick(subIssue.id);
                        }
                      : undefined
                  }
                  onAssigneeClick={
                    onSubIssueAssigneeClick
                      ? (e) => {
                          e.stopPropagation();
                          onSubIssueAssigneeClick(subIssue.id);
                        }
                      : undefined
                  }
                />
              ))
            )}
            {provided.placeholder}

            {/* Loading overlay - preserves height while showing loading state */}
            {isReordering && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <span className="text-low text-sm">
                  {t('common.saving', 'Saving...')}
                </span>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </CollapsibleSectionHeader>
  );
}
