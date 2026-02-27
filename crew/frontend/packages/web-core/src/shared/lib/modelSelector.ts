import type {
  ModelInfo,
  ModelSelectorConfig,
  ReasoningOption,
} from 'shared/types';

function toPrettyCase(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function getSelectedModel(
  models: ModelInfo[],
  selectedProviderId: string | null,
  selectedModelId: string | null
): ModelInfo | null {
  if (!selectedModelId) return null;
  const selectedId = selectedModelId.toLowerCase();
  if (selectedProviderId) {
    const providerId = selectedProviderId.toLowerCase();
    return (
      models.find(
        (model) =>
          model.id.toLowerCase() === selectedId &&
          model.provider_id?.toLowerCase() === providerId
      ) ?? null
    );
  }
  return models.find((model) => model.id.toLowerCase() === selectedId) ?? null;
}

export function getReasoningLabel(
  options: ReasoningOption[],
  selectedId: string | null
): string | null {
  if (!selectedId) return null;
  return (
    options.find((option) => option.id === selectedId)?.label ??
    toPrettyCase(selectedId)
  );
}

export function escapeAttributeValue(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/["\\]/g, '\\$&');
}

export function parseModelId(
  value?: string | null,
  hasProviders?: boolean
): {
  providerId: string | null;
  modelId: string | null;
} {
  if (!value) return { providerId: null, modelId: null };
  if (!hasProviders) return { providerId: null, modelId: value };
  const slashIdx = value.indexOf('/');
  if (slashIdx === -1) return { providerId: null, modelId: value };
  return {
    providerId: value.substring(0, slashIdx),
    modelId: value.substring(slashIdx + 1),
  };
}

export function appendPresetModel(
  config: ModelSelectorConfig | null,
  presetModel: string | null | undefined
): ModelSelectorConfig | null {
  if (!config || !presetModel) return config;
  const hasProviders = config.providers.length > 0;
  const { providerId, modelId } = parseModelId(presetModel, hasProviders);
  if (!modelId) return config;

  const exists = config.models.some(
    (m) =>
      m.id.toLowerCase() === modelId.toLowerCase() &&
      (!providerId || m.provider_id?.toLowerCase() === providerId.toLowerCase())
  );
  if (exists) return config;

  return {
    ...config,
    models: [
      {
        id: modelId,
        name: modelId,
        provider_id: providerId,
        reasoning_options: [],
      },
      ...config.models,
    ],
  };
}

export function resolveDefaultModelId(
  models: ModelInfo[],
  providerId: string | null,
  defaultModel: string | null | undefined,
  hasProviders?: boolean
): string | null {
  if (models.length === 0) return null;
  const scoped = providerId
    ? models.filter((model) => model.provider_id === providerId)
    : models;
  if (scoped.length === 0) return null;

  const { providerId: defaultProvider, modelId: defaultId } = parseModelId(
    defaultModel,
    hasProviders
  );
  if (
    defaultId &&
    (!providerId || !defaultProvider || providerId === defaultProvider)
  ) {
    const match = scoped.find((model) => model.id === defaultId);
    if (match) return match.id;
  }

  if (!defaultModel) return null;

  return scoped[0]?.id ?? null;
}

export function isModelAvailable(
  config: ModelSelectorConfig,
  providerId: string,
  modelId: string
): boolean {
  const providerLower = providerId.toLowerCase();
  const modelLower = modelId.toLowerCase();
  return config.models.some(
    (model) =>
      model.id.toLowerCase() === modelLower &&
      model.provider_id?.toLowerCase() === providerLower
  );
}

export function resolveDefaultReasoningId(
  options: ReasoningOption[]
): string | null {
  return (
    options.find((option) => option.is_default)?.id ?? options[0]?.id ?? null
  );
}
