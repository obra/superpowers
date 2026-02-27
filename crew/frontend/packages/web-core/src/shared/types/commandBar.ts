import type { Icon } from '@phosphor-icons/react';
import type { Issue } from 'shared/remote-types';
import type { ActionDefinition, ActionVisibilityContext } from './actions';
import type {
  RepoItem,
  StatusItem,
  PriorityItem,
  BranchItem,
} from '@/shared/types/selectionItems';

// Define page IDs first to avoid circular reference
export type PageId =
  | 'root'
  | 'workspaceActions'
  | 'diffOptions'
  | 'viewOptions'
  | 'repoActions' // Page for repo-specific actions (opened from repo card or CMD+K)
  | 'issueActions'; // Page for issue-specific actions (kanban mode)

// Items that can appear inside a group
export type CommandBarGroupItem =
  | { type: 'action'; action: ActionDefinition }
  | { type: 'page'; pageId: PageId; label: string; icon: Icon }
  | { type: 'childPages'; id: PageId };

// Group container with label and nested items
export interface CommandBarGroup {
  type: 'group';
  label: string;
  items: CommandBarGroupItem[];
}

// Top-level items in a page are groups
export type CommandBarItem = CommandBarGroup;

// Resolved types (after childPages expansion)
export type ResolvedGroupItem =
  | { type: 'action'; action: ActionDefinition }
  | { type: 'page'; pageId: PageId; label: string; icon: Icon }
  | { type: 'repo'; repo: RepoItem }
  | { type: 'status'; status: StatusItem }
  | { type: 'priority'; priority: PriorityItem }
  | { type: 'issue'; issue: Issue }
  | { type: 'createSubIssue' }
  | { type: 'branch'; branch: BranchItem };

export interface ResolvedGroup {
  label: string;
  items: ResolvedGroupItem[];
}

export interface CommandBarPage {
  id: string;
  title?: string; // Optional heading shown in command bar
  items: CommandBarItem[];
  // Optional: parent page for back button navigation
  parent?: PageId;
  // Optional visibility condition - if omitted, page is always visible
  isVisible?: (ctx: ActionVisibilityContext) => boolean;
}

export type StaticPageId = PageId;
