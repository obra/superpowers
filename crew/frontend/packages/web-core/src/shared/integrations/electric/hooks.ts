import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLiveQuery } from '@tanstack/react-db';
import { createShapeCollection } from '@/shared/lib/electric/collections';
import { useSyncErrorContext } from '@/shared/hooks/useSyncErrorContext';
import type { MutationDefinition, ShapeDefinition } from 'shared/remote-types';
import type { SyncError } from '@/shared/lib/electric/types';
import type { MutationResult, InsertResult } from '@/shared/lib/electric/types';

// Type helpers for extracting types from MutationDefinition
type MutationCreateType<M> =
  M extends MutationDefinition<unknown, infer C, unknown> ? C : never;
type MutationUpdateType<M> =
  M extends MutationDefinition<unknown, unknown, infer U> ? U : never;

/**
 * Base result type returned by useShape (read-only).
 */
export interface UseShapeResult<TRow> {
  /** The synced data array */
  data: TRow[];
  /** Whether the initial sync is still loading */
  isLoading: boolean;
  /** Sync error if one occurred */
  error: SyncError | null;
  /** Function to retry after an error */
  retry: () => void;
}

/**
 * Extended result when mutation is provided — adds insert/update/remove.
 */
export interface UseShapeMutationResult<TRow, TCreate, TUpdate>
  extends UseShapeResult<TRow> {
  /** Insert a new row (optimistic), returns row and persistence promise */
  insert: (data: TCreate) => InsertResult<TRow>;
  /** Update a row by ID (optimistic), returns persistence promise */
  update: (id: string, changes: Partial<TUpdate>) => MutationResult;
  /** Update multiple rows in a single optimistic transaction */
  updateMany: (
    updates: Array<{ id: string; changes: Partial<TUpdate> }>
  ) => MutationResult;
  /** Delete a row by ID (optimistic), returns persistence promise */
  remove: (id: string) => MutationResult;
}

/**
 * Options for the useShape hook.
 */
export interface UseShapeOptions<
  M extends
    | MutationDefinition<unknown, unknown, unknown>
    | undefined = undefined,
> {
  /**
   * Whether to enable the Electric sync subscription.
   * When false, returns empty data and no-op mutation functions.
   * @default true
   */
  enabled?: boolean;
  /**
   * Optional mutation definition. When provided, the hook returns
   * insert/update/remove functions for optimistic mutations.
   */
  mutation?: M;
}

/**
 * Hook for subscribing to a shape's data via Electric sync,
 * with optional optimistic mutation support.
 *
 * @param shape - The shape definition from shared/remote-types.ts
 * @param params - URL parameters matching the shape's requirements
 * @param options - Optional configuration (enabled, mutation, etc.)
 *
 * @example
 * // Read-only:
 * const { data, isLoading } = useShape(PROJECT_PULL_REQUESTS_SHAPE, { project_id });
 *
 * // With mutations:
 * const { data, insert, update, remove } = useShape(
 *   PROJECT_ISSUES_SHAPE,
 *   { project_id },
 *   { mutation: ISSUE_MUTATION }
 * );
 */
export function useShape<
  T extends Record<string, unknown>,
  M extends
    | MutationDefinition<unknown, unknown, unknown>
    | undefined = undefined,
>(
  shape: ShapeDefinition<T>,
  params: Record<string, string>,
  options: UseShapeOptions<M> = {} as UseShapeOptions<M>
): M extends MutationDefinition<unknown, unknown, unknown>
  ? UseShapeMutationResult<T, MutationCreateType<M>, MutationUpdateType<M>>
  : UseShapeResult<T> {
  const { enabled = true, mutation } = options;

  const [error, setError] = useState<SyncError | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const syncErrorContext = useSyncErrorContext();
  const registerErrorFn = syncErrorContext?.registerError;
  const clearErrorFn = syncErrorContext?.clearError;

  const handleError = useCallback((err: SyncError) => setError(err), []);

  const retry = useCallback(() => {
    setError(null);
    setRetryKey((k) => k + 1);
  }, []);

  const paramsKey = JSON.stringify(params);
  const stableParams = useMemo(
    () => JSON.parse(paramsKey) as Record<string, string>,
    [paramsKey]
  );

  const streamId = useMemo(
    () => `${shape.table}:${paramsKey}`,
    [shape.table, paramsKey]
  );

  useEffect(() => {
    if (error && registerErrorFn) {
      registerErrorFn(streamId, shape.table, error, retry);
    } else if (!error && clearErrorFn) {
      clearErrorFn(streamId);
    }

    return () => {
      clearErrorFn?.(streamId);
    };
  }, [error, streamId, shape.table, retry, registerErrorFn, clearErrorFn]);

  const collection = useMemo(() => {
    if (!enabled) return null;
    const config = { onError: handleError };
    void retryKey;
    return createShapeCollection(shape, stableParams, config, mutation);
  }, [enabled, shape, mutation, handleError, retryKey, stableParams]);

  const { data, isLoading: queryLoading } = useLiveQuery(
    (query) => (collection ? query.from({ item: collection }) : undefined),
    [collection]
  );

  const items = useMemo(() => {
    if (!enabled || !collection || !data || queryLoading) return [];
    return data as unknown as T[];
  }, [enabled, collection, data, queryLoading]);

  const isLoading = enabled ? queryLoading : false;

  // --- Mutation support (only used when mutation is provided) ---

  const itemsRef = useRef<T[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  type TransactionResult = { isPersisted: { promise: Promise<void> } };
  type CollectionWithMutations = {
    insert: (data: unknown) => TransactionResult;
    update: {
      (
        id: string,
        updater: (draft: Record<string, unknown>) => void
      ): TransactionResult;
      (
        ids: string[],
        updater: (drafts: Array<Record<string, unknown>>) => void
      ): TransactionResult;
    };
    delete: (id: string) => TransactionResult;
  };
  const typedCollection =
    collection as unknown as CollectionWithMutations | null;

  const insert = useCallback(
    (insertData: unknown): InsertResult<T> => {
      const dataWithId = {
        id: crypto.randomUUID(),
        ...(insertData as Record<string, unknown>),
      };
      if (!typedCollection) {
        return {
          data: dataWithId as unknown as T,
          persisted: Promise.resolve(dataWithId as unknown as T),
        };
      }
      const tx = typedCollection.insert(dataWithId);
      return {
        data: dataWithId as unknown as T,
        persisted: tx.isPersisted.promise.then(() => {
          const synced = itemsRef.current.find(
            (item) => (item as unknown as { id: string }).id === dataWithId.id
          );
          return (synced ?? dataWithId) as unknown as T;
        }),
      };
    },
    [typedCollection]
  );

  const update = useCallback(
    (id: string, changes: unknown): MutationResult => {
      if (!typedCollection) {
        return { persisted: Promise.resolve() };
      }
      const tx = typedCollection.update(id, (draft: Record<string, unknown>) =>
        Object.assign(draft, changes)
      );
      return { persisted: tx.isPersisted.promise };
    },
    [typedCollection]
  );

  const updateMany = useCallback(
    (updates: Array<{ id: string; changes: unknown }>): MutationResult => {
      if (!typedCollection || updates.length === 0) {
        return { persisted: Promise.resolve() };
      }

      const ids = updates.map((update) => update.id);
      const changesById = new Map(
        updates.map((update) => [update.id, update.changes])
      );

      const tx = typedCollection.update(
        ids,
        (drafts: Array<Record<string, unknown>>) => {
          for (const draft of drafts) {
            const draftId = String(draft.id ?? '');
            const changes = changesById.get(draftId);
            if (changes) {
              Object.assign(draft, changes);
            }
          }
        }
      );

      return { persisted: tx.isPersisted.promise };
    },
    [typedCollection]
  );

  const remove = useCallback(
    (id: string): MutationResult => {
      if (!typedCollection) {
        return { persisted: Promise.resolve() };
      }
      const tx = typedCollection.delete(id);
      return { persisted: tx.isPersisted.promise };
    },
    [typedCollection]
  );

  const base: UseShapeResult<T> = {
    data: items,
    isLoading,
    error,
    retry,
  };

  if (mutation) {
    return {
      ...base,
      insert,
      update,
      updateMany,
      remove,
    } as M extends MutationDefinition<unknown, unknown, unknown>
      ? UseShapeMutationResult<T, MutationCreateType<M>, MutationUpdateType<M>>
      : UseShapeResult<T>;
  }

  return base as M extends MutationDefinition<unknown, unknown, unknown>
    ? UseShapeMutationResult<T, MutationCreateType<M>, MutationUpdateType<M>>
    : UseShapeResult<T>;
}
