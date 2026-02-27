function isSlashCommandPrompt(prompt: string): boolean {
  const trimmed = prompt.trimStart();
  if (!trimmed.startsWith('/')) return false;

  const match = /^\/([^\s/]+)(?:\s|$)/.exec(trimmed);
  if (!match) return false;

  return true;
}

export function buildAgentPrompt(
  rawUserMessage: string,
  contextParts: (string | null | undefined)[]
) {
  const trimmed = rawUserMessage.trim();
  const isSlashCommand = !!trimmed && isSlashCommandPrompt(trimmed);

  const parts = isSlashCommand
    ? [trimmed]
    : [...contextParts, rawUserMessage].filter(Boolean);

  return {
    prompt: parts.join('\n\n'),
    isSlashCommand,
  };
}
