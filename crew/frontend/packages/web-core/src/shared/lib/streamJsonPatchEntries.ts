// streamJsonPatchEntries.ts - WebSocket JSON patch streaming utility
import type { Operation } from 'rfc6902';
import { applyUpsertPatch } from '@/shared/lib/jsonPatch';
import { openLocalApiWebSocket } from '@/shared/lib/localApiTransport';

type PatchContainer<E = unknown> = { entries: E[] };

export interface StreamOptions<E = unknown> {
  initial?: PatchContainer<E>;
  /** called after each successful patch application */
  onEntries?: (entries: E[]) => void;
  onConnect?: () => void;
  onError?: (err: unknown) => void;
  /** called once when a "finished" event is received */
  onFinished?: (entries: E[]) => void;
}

interface StreamController<E = unknown> {
  /** Current entries array (immutable snapshot) */
  getEntries(): E[];
  /** Full { entries } snapshot */
  getSnapshot(): PatchContainer<E>;
  /** Best-effort connection state */
  isConnected(): boolean;
  /** Subscribe to updates; returns an unsubscribe function */
  onChange(cb: (entries: E[]) => void): () => void;
  /** Close the stream */
  close(): void;
}

/**
 * Connect to a WebSocket endpoint that emits JSON messages containing:
 *   {"JsonPatch": [{"op": "add", "path": "/entries/0", "value": {...}}, ...]}
 *   {"Finished": ""}
 *
 * Maintains an in-memory { entries: [] } snapshot and returns a controller.
 */
export function streamJsonPatchEntries<E = unknown>(
  url: string,
  opts: StreamOptions<E> = {}
): StreamController<E> {
  let connected = false;
  let closed = false;
  let ws: WebSocket | null = null;
  let snapshot: PatchContainer<E> = structuredClone(
    opts.initial ?? ({ entries: [] } as PatchContainer<E>)
  );

  const subscribers = new Set<(entries: E[]) => void>();
  if (opts.onEntries) subscribers.add(opts.onEntries);

  const notify = () => {
    for (const cb of subscribers) {
      try {
        cb(snapshot.entries);
      } catch {
        /* swallow subscriber errors */
      }
    }
  };

  const handleMessage = (event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);

      // Handle JsonPatch messages (from LogMsg::to_ws_message)
      if (msg.JsonPatch) {
        const raw = msg.JsonPatch as Operation[];
        const ops = dedupeOps(raw);

        // Apply to a working copy (applyPatch mutates)
        const next = structuredClone(snapshot);
        applyUpsertPatch(next, ops);

        snapshot = next;
        notify();
      }

      // Handle Finished messages
      if (msg.finished !== undefined) {
        opts.onFinished?.(snapshot.entries);
        ws?.close();
      }
    } catch (err) {
      opts.onError?.(err);
    }
  };

  void (async () => {
    try {
      const opened = await openLocalApiWebSocket(url);

      if (closed) {
        opened.close();
        return;
      }

      ws = opened;
      ws.addEventListener('open', () => {
        connected = true;
        opts.onConnect?.();
      });

      ws.addEventListener('message', handleMessage);

      ws.addEventListener('error', (err) => {
        connected = false;
        opts.onError?.(err);
      });

      ws.addEventListener('close', () => {
        connected = false;
      });
    } catch (error) {
      if (!closed) {
        opts.onError?.(error);
      }
    }
  })();

  return {
    getEntries(): E[] {
      return snapshot.entries;
    },
    getSnapshot(): PatchContainer<E> {
      return snapshot;
    },
    isConnected(): boolean {
      return connected;
    },
    onChange(cb: (entries: E[]) => void): () => void {
      subscribers.add(cb);
      // push current state immediately
      cb(snapshot.entries);
      return () => subscribers.delete(cb);
    },
    close(): void {
      closed = true;
      ws?.close();
      subscribers.clear();
      connected = false;
    },
  };
}

/**
 * Dedupe multiple ops that touch the same path within a single event.
 * Last write for a path wins, while preserving the overall left-to-right
 * order of the *kept* final operations.
 *
 * Example:
 *   add /entries/4, replace /entries/4  -> keep only the final replace
 */
function dedupeOps(ops: Operation[]): Operation[] {
  const lastIndexByPath = new Map<string, number>();
  ops.forEach((op, i) => lastIndexByPath.set(op.path, i));

  // Keep only the last op for each path, in ascending order of their final index
  const keptIndices = [...lastIndexByPath.values()].sort((a, b) => a - b);
  return keptIndices.map((i) => ops[i]!);
}
