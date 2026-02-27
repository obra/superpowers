import type {
  BaseCodingAgent,
  ExecutorProfile,
  ModelInfo,
  ModelProvider,
} from 'shared/types';

type ProfilesMap = Record<string, ExecutorProfile> | null;

const MAX_RECENT_MODELS = 20;

export function getModelKey(model: ModelInfo): string {
  return model.provider_id ? `${model.provider_id}/${model.id}` : model.id;
}

export function getRecentModelEntries(
  profiles: ProfilesMap,
  executor: BaseCodingAgent | null
): string[] {
  if (!profiles || !executor) return [];
  const entries = profiles[executor]?.recently_used_models?.models ?? [];
  return entries.map((e) => e.trim()).filter(Boolean);
}

export function getRecentReasoningByModel(
  profiles: ProfilesMap,
  executor: BaseCodingAgent | null
): Record<string, string> {
  if (!profiles || !executor) return {};
  const raw = profiles[executor]?.recently_used_models?.reasoning_by_model;
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v) out[k] = v;
  }
  return out;
}

/**
 * Touch a model in the LRU list: move it to the end (most recent).
 * If the model doesn't exist, append it. Caps list at MAX_RECENT_MODELS.
 */
export function touchRecentModel(
  entries: string[],
  model: ModelInfo
): string[] {
  const key = getModelKey(model);
  const keyLower = key.toLowerCase();
  const filtered = entries.filter((e) => e.toLowerCase() !== keyLower);
  const updated = [...filtered, key];
  if (updated.length > MAX_RECENT_MODELS) {
    return updated.slice(updated.length - MAX_RECENT_MODELS);
  }
  return updated;
}

export function updateRecentModelEntries(
  profiles: Record<string, ExecutorProfile>,
  executor: BaseCodingAgent,
  entries: string[],
  reasoningByModel?: Record<string, string>
): Record<string, ExecutorProfile> {
  const normalized = entries.map((e) => e.trim()).filter(Boolean);
  const existing = profiles[executor]?.recently_used_models;
  const mergedReasoning = reasoningByModel ?? existing?.reasoning_by_model;
  const recentModels =
    normalized.length > 0 ||
    (mergedReasoning && Object.keys(mergedReasoning).length > 0)
      ? {
          ...(normalized.length > 0 ? { models: normalized } : {}),
          ...(mergedReasoning && Object.keys(mergedReasoning).length > 0
            ? { reasoning_by_model: mergedReasoning }
            : {}),
        }
      : null;
  const existingConfig = profiles[executor] ?? {};

  return {
    ...profiles,
    [executor]: {
      ...existingConfig,
      recently_used_models: recentModels,
    } as ExecutorProfile,
  };
}

export function setRecentReasoning(
  profiles: Record<string, ExecutorProfile>,
  executor: BaseCodingAgent,
  model: ModelInfo,
  reasoningId: string | null
): Record<string, ExecutorProfile> {
  const existing = getRecentReasoningByModel(profiles, executor);
  const key = getModelKey(model);
  const updated = { ...existing };
  if (reasoningId) {
    updated[key] = reasoningId;
  } else {
    delete updated[key];
  }
  const entries = getRecentModelEntries(profiles, executor);
  return updateRecentModelEntries(profiles, executor, entries, updated);
}

/**
 * Get the index of a model in the LRU list (-1 if not found).
 * Higher index = more recently used.
 */
export function getRecentIndex(
  recentEntries: string[],
  model: ModelInfo
): number {
  const key = getModelKey(model).toLowerCase();
  return recentEntries.findIndex((e) => e.toLowerCase() === key);
}

/**
 * Sort models by recency. Defaults to bottom-weighted ordering:
 * recent items last and non-recent reversed for bottom-up reading.
 */
export type RecentAlignment = 'top' | 'bottom';

export function sortByRecency(
  models: ModelInfo[],
  recentEntries: string[],
  align: RecentAlignment = 'bottom'
): ModelInfo[] {
  if (recentEntries.length === 0) {
    return align === 'bottom' ? [...models].reverse() : [...models];
  }
  const recentMap = new Map(recentEntries.map((e, i) => [e.toLowerCase(), i]));

  // Separate into non-recent and recent groups
  const nonRecent: ModelInfo[] = [];
  const recent: { model: ModelInfo; idx: number }[] = [];

  for (const model of models) {
    const key = getModelKey(model).toLowerCase();
    const idx = recentMap.get(key) ?? -1;
    if (idx === -1) {
      nonRecent.push(model);
    } else {
      recent.push({ model, idx });
    }
  }

  // Non-recent: reversed original order (bottom-up reading)
  if (align === 'bottom') {
    nonRecent.reverse();
  }

  // Recent: sorted by recency (higher index = more recent)
  recent.sort((a, b) => (align === 'bottom' ? a.idx - b.idx : b.idx - a.idx));

  if (align === 'top') {
    return [...recent.map((r) => r.model), ...nonRecent];
  }
  return [...nonRecent, ...recent.map((r) => r.model)];
}

export function sortProvidersByRecency(
  providers: ModelProvider[],
  models: ModelInfo[],
  recentEntries: string[]
): ModelProvider[] {
  const baseProviders = [...providers].reverse();
  if (recentEntries.length === 0) return baseProviders;

  const recencyByProvider = new Map<string, number>();
  for (const model of models) {
    if (!model.provider_id) continue;
    const idx = getRecentIndex(recentEntries, model);
    if (idx === -1) continue;
    const current = recencyByProvider.get(model.provider_id) ?? -1;
    if (idx > current) {
      recencyByProvider.set(model.provider_id, idx);
    }
  }

  const order = new Map(
    baseProviders.map((provider, index) => [provider.id, index])
  );

  return [...baseProviders].sort((a, b) => {
    const aRecent = recencyByProvider.get(a.id) ?? -1;
    const bRecent = recencyByProvider.get(b.id) ?? -1;
    if (aRecent === -1 && bRecent === -1) {
      return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
    }
    if (aRecent === -1) return -1;
    if (bRecent === -1) return 1;
    if (aRecent === bRecent) {
      return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
    }
    return aRecent - bRecent;
  });
}
