import { useReducer, useCallback, useRef } from 'react';
import type { PageId, ResolvedGroupItem } from '@/shared/types/commandBar';
import type { ActionDefinition } from '@/shared/types/actions';

export interface CommandBarState {
  page: PageId;
  stack: PageId[];
  search: string;
}

export type CommandBarEvent =
  | { type: 'RESET'; page: PageId }
  | { type: 'SEARCH_CHANGE'; query: string }
  | { type: 'GO_BACK' }
  | { type: 'SELECT_ITEM'; item: ResolvedGroupItem };

export type CommandBarEffect =
  | { type: 'none' }
  | { type: 'execute'; action: ActionDefinition };

const initial = (page: PageId): CommandBarState => ({
  page,
  stack: [],
  search: '',
});

const noEffect: CommandBarEffect = { type: 'none' };

function reducer(
  state: CommandBarState,
  event: CommandBarEvent
): [CommandBarState, CommandBarEffect] {
  if (event.type === 'RESET') {
    return [initial(event.page), noEffect];
  }
  if (event.type === 'SEARCH_CHANGE') {
    return [{ ...state, search: event.query }, noEffect];
  }
  if (event.type === 'GO_BACK') {
    const prevPage = state.stack[state.stack.length - 1];
    if (!prevPage) return [state, noEffect];
    return [initial(prevPage), noEffect];
  }
  if (event.type === 'SELECT_ITEM') {
    const { item } = event;
    if (item.type === 'page') {
      return [
        {
          page: item.pageId,
          stack: [...state.stack, state.page],
          search: '',
        },
        noEffect,
      ];
    }
    if (item.type === 'action') {
      return [state, { type: 'execute', action: item.action }];
    }
  }

  return [state, noEffect];
}

export function useCommandBarState(initialPage: PageId) {
  const stateRef = useRef<CommandBarState>(initial(initialPage));

  const [state, rawDispatch] = useReducer(
    (s: CommandBarState, e: CommandBarEvent) => {
      const [newState] = reducer(s, e);
      stateRef.current = newState;
      return newState;
    },
    undefined,
    () => initial(initialPage)
  );

  // Keep stateRef in sync
  stateRef.current = state;

  // Stable dispatch that doesn't change on every render
  const dispatch = useCallback(
    (event: CommandBarEvent): CommandBarEffect => {
      const [, effect] = reducer(stateRef.current, event);
      rawDispatch(event);
      return effect;
    },
    [] // No dependencies - uses refs for current values
  );

  return {
    state,
    currentPage: state.page,
    canGoBack: state.stack.length > 0,
    dispatch,
  };
}
