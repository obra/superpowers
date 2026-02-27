import type { IssuePriority } from 'shared/remote-types';
import type {
  IssueFormData,
  IssuePanelMode,
} from '@vibe/ui/components/KanbanIssuePanel';

interface EditTextState {
  title: string;
  hasLocalTitleEdit: boolean;
  description: string | null;
  hasLocalDescriptionEdit: boolean;
}

export interface KanbanIssuePanelFormState {
  createFormData: IssueFormData | null;
  editTextState: EditTextState;
  isDraftAutosavePaused: boolean;
  hasRestoredFromScratch: boolean;
}

interface SelectedIssueSnapshot {
  title: string;
  description: string | null;
  status_id: string;
  priority: IssuePriority | null;
}

type KanbanIssuePanelFormAction =
  | {
      type: 'resetForIssueChange';
      mode: IssuePanelMode;
      createFormData: IssueFormData | null;
      hasRestoredFromScratch: boolean;
    }
  | { type: 'setCreateFormData'; createFormData: IssueFormData | null }
  | {
      type: 'patchCreateFormData';
      patch: Partial<IssueFormData>;
      fallback: IssueFormData;
    }
  | { type: 'setCreateAssigneeIds'; assigneeIds: string[] }
  | { type: 'setDraftAutosavePaused'; isPaused: boolean }
  | {
      type: 'setHasRestoredFromScratch';
      hasRestoredFromScratch: boolean;
    }
  | { type: 'setEditTitle'; title: string }
  | { type: 'setEditDescription'; description: string | null };

const EMPTY_EDIT_TEXT_STATE: EditTextState = {
  title: '',
  hasLocalTitleEdit: false,
  description: null,
  hasLocalDescriptionEdit: false,
};

export function createBlankCreateFormData(
  defaultStatusId: string
): IssueFormData {
  return {
    title: '',
    description: null,
    statusId: defaultStatusId,
    priority: null,
    assigneeIds: [],
    tagIds: [],
    createDraftWorkspace: false,
  };
}

export function createInitialKanbanIssuePanelFormState(): KanbanIssuePanelFormState {
  return {
    createFormData: null,
    editTextState: EMPTY_EDIT_TEXT_STATE,
    isDraftAutosavePaused: false,
    hasRestoredFromScratch: false,
  };
}

export function kanbanIssuePanelFormReducer(
  state: KanbanIssuePanelFormState,
  action: KanbanIssuePanelFormAction
): KanbanIssuePanelFormState {
  switch (action.type) {
    case 'resetForIssueChange':
      return {
        createFormData: action.mode === 'create' ? action.createFormData : null,
        editTextState: EMPTY_EDIT_TEXT_STATE,
        isDraftAutosavePaused: false,
        hasRestoredFromScratch:
          action.mode === 'create' ? action.hasRestoredFromScratch : false,
      };
    case 'setCreateFormData':
      return {
        ...state,
        createFormData: action.createFormData,
      };
    case 'patchCreateFormData':
      return {
        ...state,
        createFormData: {
          ...(state.createFormData ?? action.fallback),
          ...action.patch,
        },
      };
    case 'setCreateAssigneeIds':
      return {
        ...state,
        createFormData: state.createFormData
          ? {
              ...state.createFormData,
              assigneeIds: action.assigneeIds,
            }
          : state.createFormData,
      };
    case 'setDraftAutosavePaused':
      return {
        ...state,
        isDraftAutosavePaused: action.isPaused,
      };
    case 'setHasRestoredFromScratch':
      return {
        ...state,
        hasRestoredFromScratch: action.hasRestoredFromScratch,
      };
    case 'setEditTitle':
      return {
        ...state,
        editTextState: {
          ...state.editTextState,
          title: action.title,
          hasLocalTitleEdit: true,
        },
      };
    case 'setEditDescription':
      return {
        ...state,
        editTextState: {
          ...state.editTextState,
          description: action.description,
          hasLocalDescriptionEdit: true,
        },
      };
    default:
      return state;
  }
}

function areStringSetsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const aSet = new Set(a);
  for (const item of b) {
    if (!aSet.has(item)) return false;
  }
  return true;
}

interface DisplayDataSelectorInput {
  state: KanbanIssuePanelFormState;
  mode: IssuePanelMode;
  createModeDefaults: IssueFormData;
  selectedIssue: SelectedIssueSnapshot | null;
  currentAssigneeIds: string[];
  currentTagIds: string[];
}

export function selectDisplayData({
  state,
  mode,
  createModeDefaults,
  selectedIssue,
  currentAssigneeIds,
  currentTagIds,
}: DisplayDataSelectorInput): IssueFormData {
  if (mode === 'create') {
    return state.createFormData ?? createModeDefaults;
  }

  return {
    title: state.editTextState.hasLocalTitleEdit
      ? state.editTextState.title
      : (selectedIssue?.title ?? ''),
    description: state.editTextState.hasLocalDescriptionEdit
      ? state.editTextState.description
      : (selectedIssue?.description ?? null),
    statusId: selectedIssue?.status_id ?? '',
    priority: selectedIssue?.priority ?? null,
    assigneeIds: currentAssigneeIds,
    tagIds: currentTagIds,
    createDraftWorkspace: false,
  };
}

interface CreateDraftDirtySelectorInput {
  state: KanbanIssuePanelFormState;
  mode: IssuePanelMode;
  createModeDefaults: IssueFormData;
}

export function selectIsCreateDraftDirty({
  state,
  mode,
  createModeDefaults,
}: CreateDraftDirtySelectorInput): boolean {
  if (mode !== 'create' || !state.createFormData) return false;

  return (
    state.createFormData.title !== createModeDefaults.title ||
    (state.createFormData.description ?? null) !==
      createModeDefaults.description ||
    state.createFormData.statusId !== createModeDefaults.statusId ||
    state.createFormData.priority !== createModeDefaults.priority ||
    !areStringSetsEqual(
      state.createFormData.assigneeIds,
      createModeDefaults.assigneeIds
    ) ||
    !areStringSetsEqual(
      state.createFormData.tagIds,
      createModeDefaults.tagIds
    ) ||
    state.createFormData.createDraftWorkspace !==
      createModeDefaults.createDraftWorkspace
  );
}
