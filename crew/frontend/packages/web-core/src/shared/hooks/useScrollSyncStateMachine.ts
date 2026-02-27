import { useRef, useCallback, useState } from 'react';

/**
 * State machine for managing bidirectional scroll sync between file tree and diff view.
 *
 * Uses explicit states instead of boolean flags to avoid conflicts between
 * programmatic scrolling and user-initiated scrolling:
 * - Making states explicit (no boolean flags)
 * - Having clear transition rules
 * - Using cooldown period after programmatic scroll
 * - Separating concerns (state machine doesn't do actual scrolling)
 */

export type SyncState =
  | 'idle' // Normal operation, sync active
  | 'programmatic-scroll' // File tree click triggered scroll
  | 'user-scrolling' // User is actively scrolling
  | 'sync-cooldown'; // Brief pause after programmatic scroll

export interface ScrollTarget {
  path: string;
  lineNumber?: number;
  index: number;
}

export interface ScrollSyncOptions {
  /** Debounce delay for user scroll events (default: 150ms) */
  debounceDelay?: number;
  /** Cooldown delay after programmatic scroll (default: 200ms) */
  cooldownDelay?: number;
  /** Map from file path to virtuoso index */
  pathToIndex: Map<string, number>;
  /** Function to get file path from virtuoso index */
  indexToPath: (index: number) => string | null;
  /** Custom function to determine which file is at the top of the visible range */
  getTopFilePath?: (range: {
    startIndex: number;
    endIndex: number;
  }) => string | null;
}

export interface ScrollSyncResult {
  /** Current state of the sync state machine */
  state: SyncState;
  /** Currently visible file path (updated during idle state) */
  fileInView: string | null;
  /** Current scroll target (set during programmatic-scroll state) */
  scrollTarget: ScrollTarget | null;
  /**
   * Trigger a programmatic scroll to a file.
   * Sets state to 'programmatic-scroll' and returns the target index.
   * Returns null if path not found in pathToIndex map.
   */
  scrollToFile: (path: string, lineNumber?: number) => number | null;
  /**
   * Call when user initiates a scroll (e.g., wheel event, touch).
   * Transitions to 'user-scrolling' state if currently idle.
   */
  onUserScroll: () => void;
  /**
   * Call when virtuoso's rangeChanged fires.
   * Updates fileInView only when in 'idle' or 'user-scrolling' state.
   */
  onRangeChanged: (range: { startIndex: number; endIndex: number }) => void;
  /**
   * Call when programmatic scroll animation completes.
   * Transitions from 'programmatic-scroll' to 'sync-cooldown'.
   */
  onScrollComplete: () => void;
}

const DEFAULT_DEBOUNCE_DELAY = 300;
const DEFAULT_COOLDOWN_DELAY = 200;

export function useScrollSyncStateMachine(
  options: ScrollSyncOptions
): ScrollSyncResult {
  const {
    debounceDelay = DEFAULT_DEBOUNCE_DELAY,
    cooldownDelay = DEFAULT_COOLDOWN_DELAY,
    pathToIndex,
    indexToPath,
    getTopFilePath,
  } = options;

  // Use refs for state to avoid stale closure issues in callbacks
  const stateRef = useRef<SyncState>('idle');
  const scrollTargetRef = useRef<ScrollTarget | null>(null);
  const fileInViewRef = useRef<string | null>(null);

  // Timer refs for cleanup
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // React state for triggering re-renders when consumers need updates
  const [, forceUpdate] = useState(0);

  const triggerUpdate = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  const clearTimers = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  }, []);

  const setState = useCallback(
    (newState: SyncState) => {
      if (stateRef.current !== newState) {
        stateRef.current = newState;
        triggerUpdate();
      }
    },
    [triggerUpdate]
  );

  const setFileInView = useCallback(
    (path: string | null) => {
      if (fileInViewRef.current !== path) {
        fileInViewRef.current = path;
        triggerUpdate();
      }
    },
    [triggerUpdate]
  );

  /**
   * Trigger a programmatic scroll to a file.
   * Transition: idle → programmatic-scroll
   */
  const scrollToFile = useCallback(
    (path: string, lineNumber?: number): number | null => {
      const index = pathToIndex.get(path);
      if (index === undefined) {
        return null;
      }

      // Clear any pending timers
      clearTimers();

      // Set scroll target
      scrollTargetRef.current = { path, lineNumber, index };

      // Transition to programmatic-scroll state
      setState('programmatic-scroll');

      return index;
    },
    [pathToIndex, clearTimers, setState]
  );

  /**
   * Handle user-initiated scroll.
   * Transition: idle → user-scrolling
   */
  const onUserScroll = useCallback(() => {
    const currentState = stateRef.current;

    // Only transition from idle to user-scrolling
    // Ignore during programmatic-scroll or sync-cooldown
    if (currentState !== 'idle') {
      return;
    }

    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setState('user-scrolling');

    // Set up debounce timer to return to idle
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      if (stateRef.current === 'user-scrolling') {
        setState('idle');
      }
    }, debounceDelay);
  }, [debounceDelay, setState]);

  /**
   * Handle virtuoso range changes.
   * Updates fileInView only in idle or user-scrolling states.
   */
  const onRangeChanged = useCallback(
    (range: { startIndex: number; endIndex: number }) => {
      const currentState = stateRef.current;

      // Only update fileInView during idle or user-scrolling
      if (
        currentState === 'programmatic-scroll' ||
        currentState === 'sync-cooldown'
      ) {
        return;
      }

      // Use DOM measurement if available, otherwise fall back to index-based
      const path = getTopFilePath
        ? getTopFilePath(range)
        : indexToPath(range.startIndex);
      if (path !== null) {
        setFileInView(path);
      }

      // If user is scrolling, reset the debounce timer
      if (currentState === 'user-scrolling') {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          debounceTimerRef.current = null;
          if (stateRef.current === 'user-scrolling') {
            setState('idle');
          }
        }, debounceDelay);
      }
    },
    [getTopFilePath, indexToPath, debounceDelay, setFileInView, setState]
  );

  /**
   * Handle programmatic scroll completion.
   * Transition: programmatic-scroll → sync-cooldown → idle
   */
  const onScrollComplete = useCallback(() => {
    const currentState = stateRef.current;

    // Only handle if we're in programmatic-scroll state
    if (currentState !== 'programmatic-scroll') {
      return;
    }

    // Clear scroll target
    scrollTargetRef.current = null;

    // Transition to cooldown
    setState('sync-cooldown');

    // Set up cooldown timer to return to idle
    cooldownTimerRef.current = setTimeout(() => {
      cooldownTimerRef.current = null;
      if (stateRef.current === 'sync-cooldown') {
        setState('idle');
      }
    }, cooldownDelay);
  }, [cooldownDelay, setState]);

  return {
    state: stateRef.current,
    fileInView: fileInViewRef.current,
    scrollTarget: scrollTargetRef.current,
    scrollToFile,
    onUserScroll,
    onRangeChanged,
    onScrollComplete,
  };
}
