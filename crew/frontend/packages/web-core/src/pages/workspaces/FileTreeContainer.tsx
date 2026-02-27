import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { FileTree } from '@vibe/ui/components/FileTree';
import {
  buildFileTree,
  filterFileTree,
  getExpandedPathsForSearch,
  getAllFolderPaths,
  sortDiffs,
} from '@/shared/lib/fileTreeUtils';
import { usePersistedCollapsedPaths } from '@/shared/stores/useUiPreferencesStore';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import { useChangesView } from '@/shared/hooks/useChangesView';
import { getFileIcon } from '@/shared/lib/fileTypeIcon';
import { useTheme } from '@/shared/hooks/useTheme';
import { getActualTheme } from '@/shared/lib/theme';
import type { Diff } from 'shared/types';

interface FileTreeContainerProps {
  workspaceId: string;
  diffs: Diff[];
  onSelectFile: (path: string, diff: Diff) => void;
  className: string;
}

export function FileTreeContainer({
  workspaceId,
  diffs,
  onSelectFile,
  className,
}: FileTreeContainerProps) {
  const { theme } = useTheme();
  const actualTheme = getActualTheme(theme);

  const { fileInView } = useChangesView();
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedPaths, setCollapsedPaths] =
    usePersistedCollapsedPaths(workspaceId);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Get GitHub comments state from workspace context
  const {
    showGitHubComments,
    setShowGitHubComments,
    getGitHubCommentCountForFile,
    getFilesWithGitHubComments,
    getFirstCommentLineForFile,
    isGitHubCommentsLoading,
  } = useWorkspaceContext();

  const { selectFile, scrollToFile } = useChangesView();

  // Sync selectedPath with fileInView from context and scroll into view
  useEffect(() => {
    if (fileInView !== undefined) {
      setSelectedPath(fileInView);
      // Scroll the selected node into view if needed
      if (fileInView) {
        const el = nodeRefs.current.get(fileInView);
        if (el) {
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  }, [fileInView]);

  const handleNodeRef = useCallback(
    (path: string, el: HTMLDivElement | null) => {
      if (el) {
        nodeRefs.current.set(path, el);
      } else {
        nodeRefs.current.delete(path);
      }
    },
    []
  );

  // Build tree from diffs
  const fullTree = useMemo(() => buildFileTree(diffs), [diffs]);

  // Get all folder paths for expand all functionality
  const allFolderPaths = useMemo(() => getAllFolderPaths(fullTree), [fullTree]);

  // All folders are expanded when none are in the collapsed set
  const isAllExpanded = collapsedPaths.size === 0;

  // Filter tree based on search
  const filteredTree = useMemo(
    () => filterFileTree(fullTree, searchQuery),
    [fullTree, searchQuery]
  );

  // Auto-expand folders when searching (remove from collapsed set)
  const collapsedPathsRef = useRef(collapsedPaths);
  collapsedPathsRef.current = collapsedPaths;

  useEffect(() => {
    if (searchQuery) {
      const pathsToExpand = getExpandedPathsForSearch(fullTree, searchQuery);
      const next = new Set(collapsedPathsRef.current);
      pathsToExpand.forEach((p) => next.delete(p));
      setCollapsedPaths(next);
    }
  }, [searchQuery, fullTree, setCollapsedPaths]);

  const handleToggleExpand = useCallback(
    (path: string) => {
      const next = new Set(collapsedPaths);
      if (next.has(path)) {
        next.delete(path); // was collapsed, now expand
      } else {
        next.add(path); // was expanded, now collapse
      }
      setCollapsedPaths(next);
    },
    [collapsedPaths, setCollapsedPaths]
  );

  const handleToggleExpandAll = useCallback(() => {
    if (isAllExpanded) {
      setCollapsedPaths(new Set(allFolderPaths)); // collapse all
    } else {
      setCollapsedPaths(new Set()); // expand all
    }
  }, [isAllExpanded, allFolderPaths, setCollapsedPaths]);

  const handleSelectFile = useCallback(
    (path: string) => {
      setSelectedPath(path);
      const diff = diffs.find((d) => d.newPath === path || d.oldPath === path);
      if (diff) {
        scrollToFile(path);
        onSelectFile(path, diff);
      }
    },
    [diffs, onSelectFile, scrollToFile]
  );

  // Get list of diff paths that have GitHub comments, sorted to match visual order
  const filesWithComments = useMemo(() => {
    const ghFiles = getFilesWithGitHubComments();
    // Sort diffs first to match visual order, then filter to those with comments
    return sortDiffs(diffs)
      .map((d) => d.newPath || d.oldPath || '')
      .filter((diffPath) =>
        ghFiles.some(
          (ghPath) => diffPath === ghPath || diffPath.endsWith('/' + ghPath)
        )
      );
  }, [getFilesWithGitHubComments, diffs]);

  // Navigate between files with GitHub comments
  const handleNavigateComments = useCallback(
    (direction: 'prev' | 'next') => {
      if (filesWithComments.length === 0) return;

      const currentIndex = selectedPath
        ? filesWithComments.indexOf(selectedPath)
        : -1;
      let nextIndex: number;

      if (direction === 'next') {
        nextIndex =
          currentIndex < filesWithComments.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex =
          currentIndex > 0 ? currentIndex - 1 : filesWithComments.length - 1;
      }

      const targetPath = filesWithComments[nextIndex];
      const lineNumber = getFirstCommentLineForFile(targetPath);

      // Update local state
      setSelectedPath(targetPath);

      // Select file with line number to scroll to the comment
      selectFile(targetPath, lineNumber ?? undefined);
    },
    [filesWithComments, selectedPath, getFirstCommentLineForFile, selectFile]
  );

  const renderFileIcon = useCallback(
    (fileName: string) => {
      const FileIcon = getFileIcon(fileName, actualTheme);
      return FileIcon ? <FileIcon size={14} /> : null;
    },
    [actualTheme]
  );

  return (
    <FileTree
      nodes={filteredTree}
      collapsedPaths={collapsedPaths}
      onToggleExpand={handleToggleExpand}
      selectedPath={selectedPath}
      onSelectFile={handleSelectFile}
      onNodeRef={handleNodeRef}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      renderFileIcon={renderFileIcon}
      isAllExpanded={isAllExpanded}
      onToggleExpandAll={handleToggleExpandAll}
      className={className}
      showGitHubComments={showGitHubComments}
      onToggleGitHubComments={setShowGitHubComments}
      getGitHubCommentCountForFile={getGitHubCommentCountForFile}
      isGitHubCommentsLoading={isGitHubCommentsLoading}
      onNavigateComments={handleNavigateComments}
      hasFilesWithComments={filesWithComments.length > 0}
    />
  );
}
