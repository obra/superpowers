import type { Diff } from 'shared/types';
import type { TreeNode } from '@/shared/types/fileTree';

/**
 * Transforms flat Diff[] into hierarchical TreeNode[]
 */
export function buildFileTree(diffs: Diff[]): TreeNode[] {
  const rootMap = new Map<string, TreeNode>();

  for (const diff of diffs) {
    // Use newPath for most changes, oldPath for deletions
    const filePath = diff.newPath ?? diff.oldPath;
    if (!filePath) continue;

    const parts = filePath.split('/');
    let currentMap = rootMap;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      if (!currentMap.has(part)) {
        const node: TreeNode = {
          id: currentPath,
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
        };

        if (isFile) {
          node.diff = diff;
          node.changeKind = diff.change;
          node.additions = diff.additions;
          node.deletions = diff.deletions;
        }

        currentMap.set(part, node);
      }

      const node = currentMap.get(part)!;

      if (!isFile && node.children) {
        // Build map for next level from existing children
        const childMap = new Map<string, TreeNode>();
        for (const child of node.children) {
          childMap.set(child.name, child);
        }

        // Process remaining parts, then sync back to children array
        if (i < parts.length - 1) {
          const nextPart = parts[i + 1];
          const nextPath = parts.slice(0, i + 2).join('/');
          const nextIsFile = i + 1 === parts.length - 1;

          if (!childMap.has(nextPart)) {
            const nextNode: TreeNode = {
              id: nextPath,
              name: nextPart,
              path: nextPath,
              type: nextIsFile ? 'file' : 'folder',
              children: nextIsFile ? undefined : [],
            };

            if (nextIsFile) {
              nextNode.diff = diff;
              nextNode.changeKind = diff.change;
              nextNode.additions = diff.additions;
              nextNode.deletions = diff.deletions;
            }

            childMap.set(nextPart, nextNode);
            node.children.push(nextNode);
          }

          currentMap = childMap;
        }
      }
    }
  }

  return sortTreeNodes(Array.from(rootMap.values()));
}

/**
 * Sort nodes: folders first, then alphabetically
 */
function sortTreeNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .map((node) => ({
      ...node,
      children: node.children ? sortTreeNodes(node.children) : undefined,
    }))
    .sort((a, b) => {
      // Folders before files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      // Alphabetical within same type
      return a.name.localeCompare(b.name);
    });
}

/**
 * Filter tree based on search query only
 */
export function filterFileTree(
  nodes: TreeNode[],
  searchQuery: string
): TreeNode[] {
  if (!searchQuery) {
    return nodes;
  }

  const query = searchQuery.toLowerCase();

  function filterNode(node: TreeNode): TreeNode | null {
    // For folders, recursively filter children
    if (node.type === 'folder' && node.children) {
      const filteredChildren = node.children
        .map(filterNode)
        .filter((n): n is TreeNode => n !== null);

      if (filteredChildren.length === 0) {
        return null;
      }

      return { ...node, children: filteredChildren };
    }

    // For files, check search query
    if (node.type === 'file') {
      if (node.path.toLowerCase().includes(query)) {
        return node;
      }
    }

    return null;
  }

  return nodes.map(filterNode).filter((n): n is TreeNode => n !== null);
}

/**
 * Get all folder paths that should be expanded to show matching files
 */
export function getExpandedPathsForSearch(
  nodes: TreeNode[],
  searchQuery: string
): Set<string> {
  const paths = new Set<string>();
  const query = searchQuery.toLowerCase();

  function traverse(node: TreeNode, parentPaths: string[]) {
    if (node.type === 'file' && node.path.toLowerCase().includes(query)) {
      // Add all parent folder paths
      parentPaths.forEach((p) => paths.add(p));
    }

    if (node.children) {
      const currentPaths = [...parentPaths, node.path];
      node.children.forEach((child) => traverse(child, currentPaths));
    }
  }

  nodes.forEach((node) => traverse(node, []));
  return paths;
}

/**
 * Get all folder paths in the tree
 */
export function getAllFolderPaths(nodes: TreeNode[]): string[] {
  const paths: string[] = [];

  function traverse(node: TreeNode) {
    if (node.type === 'folder') {
      paths.push(node.path);
      node.children?.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return paths;
}

/**
 * Sort diffs to match FileTree ordering: folders before files at each level,
 * then alphabetically within each group
 */
export function sortDiffs(diffs: Diff[]): Diff[] {
  return [...diffs].sort((a, b) => {
    const pathA = a.newPath || a.oldPath || '';
    const pathB = b.newPath || b.oldPath || '';

    const partsA = pathA.split('/');
    const partsB = pathB.split('/');

    const minLength = Math.min(partsA.length, partsB.length);

    for (let i = 0; i < minLength; i++) {
      const isLastA = i === partsA.length - 1;
      const isLastB = i === partsB.length - 1;

      // If one is a file (last segment) and other is a folder (not last), folder comes first
      if (isLastA !== isLastB) {
        return isLastA ? 1 : -1;
      }

      // Same type at this level, compare alphabetically
      const cmp = partsA[i].localeCompare(partsB[i]);
      if (cmp !== 0) return cmp;
    }

    // Shorter path (folder) comes before longer path (nested file)
    return partsA.length - partsB.length;
  });
}
