import type { Diff, DiffChangeKind } from 'shared/types';

export type TreeNodeType = 'file' | 'folder';

export interface TreeNode {
  id: string;
  name: string;
  path: string;
  type: TreeNodeType;
  children?: TreeNode[];
  diff?: Diff;
  changeKind?: DiffChangeKind;
  additions?: number | null;
  deletions?: number | null;
}
