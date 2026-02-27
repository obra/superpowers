export const workspaceSummaryKeys = {
  all: ['workspace-summaries'] as const,
  byArchived: (archived: boolean) =>
    ['workspace-summaries', archived ? 'archived' : 'active'] as const,
};
