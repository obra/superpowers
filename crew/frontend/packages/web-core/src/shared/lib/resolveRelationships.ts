import type { IssueRelationship, Issue } from 'shared/remote-types';

export type RelationshipDisplayType =
  | 'blocks'
  | 'blocked_by'
  | 'related'
  | 'duplicate_of'
  | 'duplicated_by';

export interface ResolvedRelationship {
  relationshipId: string;
  displayType: RelationshipDisplayType;
  relatedIssueId: string;
  relatedIssueDisplayId: string;
}

export function resolveRelationshipsForIssue(
  issueId: string,
  relationships: IssueRelationship[],
  issuesById: Map<string, Issue>
): ResolvedRelationship[] {
  return relationships
    .map((r) => {
      const isSource = r.issue_id === issueId;
      const otherIssueId = isSource ? r.related_issue_id : r.issue_id;
      const otherIssue = issuesById.get(otherIssueId);
      if (!otherIssue) return null;

      let displayType: RelationshipDisplayType;
      if (r.relationship_type === 'blocking') {
        displayType = isSource ? 'blocks' : 'blocked_by';
      } else if (r.relationship_type === 'related') {
        displayType = 'related';
      } else {
        displayType = isSource ? 'duplicate_of' : 'duplicated_by';
      }

      return {
        relationshipId: r.id,
        displayType,
        relatedIssueId: otherIssueId,
        relatedIssueDisplayId: otherIssue.simple_id,
      };
    })
    .filter((r): r is ResolvedRelationship => r !== null);
}

export function getRelationshipLabel(
  displayType: RelationshipDisplayType
): string {
  switch (displayType) {
    case 'blocks':
      return 'blocks';
    case 'blocked_by':
      return 'blocked by';
    case 'related':
      return 'related';
    case 'duplicate_of':
      return 'dup of';
    case 'duplicated_by':
      return 'dup';
  }
}
