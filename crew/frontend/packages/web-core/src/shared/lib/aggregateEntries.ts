import type {
  PatchTypeWithKey,
  DisplayEntry,
  AggregatedPatchGroup,
  AggregatedDiffGroup,
  AggregatedThinkingGroup,
  ToolAggregationType,
} from '@/shared/hooks/useConversationHistory/types';

/**
 * Checks if a patch entry is a user_message entry.
 */
function isUserMessage(entry: PatchTypeWithKey): boolean {
  if (entry.type !== 'NORMALIZED_ENTRY') return false;
  return entry.content.entry_type.type === 'user_message';
}

/**
 * Checks if a patch entry is a thinking entry.
 */
function isThinkingEntry(entry: PatchTypeWithKey): boolean {
  if (entry.type !== 'NORMALIZED_ENTRY') return false;
  return entry.content.entry_type.type === 'thinking';
}

/**
 * Extracts the file path from a file_edit entry, or null if not a file_edit entry.
 */
function getFileEditPath(entry: PatchTypeWithKey): string | null {
  if (entry.type !== 'NORMALIZED_ENTRY') return null;

  const entryType = entry.content.entry_type;
  if (entryType.type !== 'tool_use') return null;

  const { action_type } = entryType;
  if (action_type.action === 'file_edit') {
    return action_type.path;
  }

  return null;
}

/**
 * Determines if a patch entry can be aggregated and returns its aggregation type.
 * Handles file_read, search, web_fetch, and command_run (categorized by command type).
 */
function getAggregationType(
  entry: PatchTypeWithKey
): ToolAggregationType | null {
  if (entry.type !== 'NORMALIZED_ENTRY') return null;

  const entryType = entry.content.entry_type;
  if (entryType.type !== 'tool_use') return null;

  const { action_type } = entryType;
  if (action_type.action === 'file_read') return 'file_read';
  if (action_type.action === 'search') return 'search';
  if (action_type.action === 'web_fetch') return 'web_fetch';

  if (action_type.action === 'command_run') {
    const category = action_type.category;
    if (
      category === 'read' ||
      category === 'search' ||
      category === 'edit' ||
      category === 'fetch'
    ) {
      return `command_run_${category}`;
    }
  }

  return null;
}

/**
 * First pass: group consecutive thinking entries within each turn (between user messages)
 * for all turns except the last one.
 */
function aggregateThinkingInPreviousTurns(
  entries: PatchTypeWithKey[]
): PatchTypeWithKey[] {
  if (entries.length === 0) return [];

  // Find all user message indices
  const userMessageIndices: number[] = [];
  entries.forEach((entry, index) => {
    if (isUserMessage(entry)) {
      userMessageIndices.push(index);
    }
  });

  // If there's 0 or 1 user message, no "previous" turns exist
  if (userMessageIndices.length <= 1) {
    return entries;
  }

  // The last user message index marks the start of the "current" turn
  const lastUserMessageIndex =
    userMessageIndices[userMessageIndices.length - 1];

  // Process entries, grouping thinking entries in previous turns
  const result: PatchTypeWithKey[] = [];
  let currentThinkingGroup: PatchTypeWithKey[] = [];

  const flushThinkingGroup = () => {
    if (currentThinkingGroup.length === 0) return;

    if (currentThinkingGroup.length === 1) {
      // Single thinking entry - create a group anyway for consistency in collapsed view
      const entry = currentThinkingGroup[0];
      const aggregatedGroup: AggregatedThinkingGroup = {
        type: 'AGGREGATED_THINKING_GROUP',
        entries: [...currentThinkingGroup],
        patchKey: `agg-thinking:${entry.patchKey}`,
        executionProcessId: entry.executionProcessId,
      };
      // Cast to PatchTypeWithKey to maintain the array type
      result.push(aggregatedGroup as unknown as PatchTypeWithKey);
    } else {
      // Multiple entries - create an aggregated thinking group
      const firstEntry = currentThinkingGroup[0];
      const aggregatedGroup: AggregatedThinkingGroup = {
        type: 'AGGREGATED_THINKING_GROUP',
        entries: [...currentThinkingGroup],
        patchKey: `agg-thinking:${firstEntry.patchKey}`,
        executionProcessId: firstEntry.executionProcessId,
      };
      // Cast to PatchTypeWithKey to maintain the array type
      result.push(aggregatedGroup as unknown as PatchTypeWithKey);
    }

    currentThinkingGroup = [];
  };

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isInPreviousTurn = i < lastUserMessageIndex;

    // Track turn boundaries
    if (isUserMessage(entry)) {
      // Flush any pending thinking group before the user message
      flushThinkingGroup();
      result.push(entry);
      continue;
    }

    // Only aggregate thinking entries in previous turns
    if (isInPreviousTurn && isThinkingEntry(entry)) {
      currentThinkingGroup.push(entry);
    } else {
      // Flush any pending thinking group
      flushThinkingGroup();
      result.push(entry);
    }
  }

  // Flush any remaining thinking group
  flushThinkingGroup();

  return result;
}

/**
 * Aggregates consecutive entries of the same aggregatable type (file_read, search, web_fetch)
 * into grouped entries for accordion-style display.
 *
 * Also aggregates consecutive file_edit entries for the same file path.
 * Also aggregates thinking entries in previous conversation turns.
 *
 * Rules:
 * - Only group entries of the same type that follow each other consecutively
 * - For file_edit entries, also group by file path
 * - Thinking entries in previous turns (before the last user message) are collapsed
 * - Preserve the original order of entries
 * - Single entries of an aggregatable type are NOT grouped (returned as-is)
 * - At least 2 consecutive entries of the same type are required to form a group
 */
export function aggregateConsecutiveEntries(
  entries: PatchTypeWithKey[]
): DisplayEntry[] {
  if (entries.length === 0) return [];

  // First pass: aggregate thinking entries in previous turns
  const entriesWithThinkingAggregated =
    aggregateThinkingInPreviousTurns(entries);

  const result: DisplayEntry[] = [];

  // State for tool aggregation (file_read, search, web_fetch, command_run_*)
  let currentToolGroup: PatchTypeWithKey[] = [];
  let currentAggregationType: ToolAggregationType | null = null;

  // State for diff aggregation (file_edit by path)
  let currentDiffGroup: PatchTypeWithKey[] = [];
  let currentDiffPath: string | null = null;

  const flushToolGroup = () => {
    if (currentToolGroup.length === 0) return;

    if (currentToolGroup.length === 1) {
      // Single entry - don't aggregate, return as-is
      result.push(currentToolGroup[0]);
    } else {
      // Multiple entries - create an aggregated group
      const firstEntry = currentToolGroup[0];
      const aggregatedGroup: AggregatedPatchGroup = {
        type: 'AGGREGATED_GROUP',
        aggregationType: currentAggregationType!,
        entries: [...currentToolGroup],
        patchKey: `agg:${firstEntry.patchKey}`,
        executionProcessId: firstEntry.executionProcessId,
      };
      result.push(aggregatedGroup);
    }

    currentToolGroup = [];
    currentAggregationType = null;
  };

  const flushDiffGroup = () => {
    if (currentDiffGroup.length === 0) return;

    if (currentDiffGroup.length === 1) {
      // Single entry - don't aggregate, return as-is
      result.push(currentDiffGroup[0]);
    } else {
      // Multiple entries for same file - create an aggregated diff group
      const firstEntry = currentDiffGroup[0];
      const aggregatedDiffGroup: AggregatedDiffGroup = {
        type: 'AGGREGATED_DIFF_GROUP',
        filePath: currentDiffPath!,
        entries: [...currentDiffGroup],
        patchKey: `agg-diff:${firstEntry.patchKey}`,
        executionProcessId: firstEntry.executionProcessId,
      };
      result.push(aggregatedDiffGroup);
    }

    currentDiffGroup = [];
    currentDiffPath = null;
  };

  for (const entry of entriesWithThinkingAggregated) {
    // Check if this is already an aggregated thinking group (from first pass)
    if (
      (entry as unknown as AggregatedThinkingGroup).type ===
      'AGGREGATED_THINKING_GROUP'
    ) {
      flushToolGroup();
      flushDiffGroup();
      result.push(entry as unknown as DisplayEntry);
      continue;
    }

    const aggregationType = getAggregationType(entry);
    const fileEditPath = getFileEditPath(entry);

    // Handle file_edit entries
    if (fileEditPath !== null) {
      // Flush any pending tool group first
      flushToolGroup();

      if (currentDiffPath === null) {
        // Start a new diff group
        currentDiffPath = fileEditPath;
        currentDiffGroup.push(entry);
      } else if (fileEditPath === currentDiffPath) {
        // Same file - add to current diff group
        currentDiffGroup.push(entry);
      } else {
        // Different file - flush current diff group and start new one
        flushDiffGroup();
        currentDiffPath = fileEditPath;
        currentDiffGroup.push(entry);
      }
    }
    // Handle tool aggregation (file_read, search, web_fetch)
    else if (aggregationType !== null) {
      // Flush any pending diff group first
      flushDiffGroup();

      if (currentAggregationType === null) {
        // Start a new tool group
        currentAggregationType = aggregationType;
        currentToolGroup.push(entry);
      } else if (aggregationType === currentAggregationType) {
        // Same type - add to current group
        currentToolGroup.push(entry);
      } else {
        // Different aggregatable type - flush current group and start new one
        flushToolGroup();
        currentAggregationType = aggregationType;
        currentToolGroup.push(entry);
      }
    }
    // Non-aggregatable entry
    else {
      // Flush any pending groups and add this entry
      flushToolGroup();
      flushDiffGroup();
      result.push(entry);
    }
  }

  // Flush any remaining groups
  flushToolGroup();
  flushDiffGroup();

  return result;
}
