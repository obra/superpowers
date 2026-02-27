import { useContext } from 'react';
import { createHmrContext } from '@/shared/lib/hmrContext';

/** Callback type for scroll-to-file implementation (provided by ChangesPanelContainer) */
export type ScrollToFileCallback = (path: string, lineNumber?: number) => void;

interface ChangesViewContextValue {
  /** File path selected by user (triggers scroll-to in ChangesPanelContainer) */
  selectedFilePath: string | null;
  /** Line number to scroll to within the selected file (for GitHub comment navigation) */
  selectedLineNumber: number | null;
  /** File currently in view from scrolling (for FileTree highlighting) */
  fileInView: string | null;
  /** Select a file and optionally scroll to a specific line (legacy - use scrollToFile for tree clicks) */
  selectFile: (path: string, lineNumber?: number) => void;
  /** Scroll to a file in the diff view (for file tree clicks - uses state machine) */
  scrollToFile: (path: string, lineNumber?: number) => void;
  /** Update the file currently in view (from scroll observer) */
  setFileInView: (path: string | null) => void;
  /** Navigate to changes mode and scroll to a specific file */
  viewFileInChanges: (filePath: string) => void;
  /** Set of file paths currently in the diffs (for checking if inline code should be clickable) */
  diffPaths: Set<string>;
  /** Find a diff path matching the given text (supports partial/right-hand match) */
  findMatchingDiffPath: (text: string) => string | null;
  /** Register the scroll-to-file callback (called by ChangesPanelContainer) */
  registerScrollToFile: (callback: ScrollToFileCallback | null) => void;
}

const EMPTY_SET = new Set<string>();

const defaultValue: ChangesViewContextValue = {
  selectedFilePath: null,
  selectedLineNumber: null,
  fileInView: null,
  selectFile: () => {},
  scrollToFile: () => {},
  setFileInView: () => {},
  viewFileInChanges: () => {},
  diffPaths: EMPTY_SET,
  findMatchingDiffPath: () => null,
  registerScrollToFile: () => {},
};

export const ChangesViewContext = createHmrContext<ChangesViewContextValue>(
  'ChangesViewContext',
  defaultValue
);

export function useChangesView(): ChangesViewContextValue {
  return useContext(ChangesViewContext);
}
