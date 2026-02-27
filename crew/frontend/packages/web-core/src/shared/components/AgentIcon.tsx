import { BaseCodingAgent } from 'shared/types';
import { useTheme, getResolvedTheme } from '@/shared/hooks/useTheme';

type AgentIconProps = {
  agent: BaseCodingAgent | null | undefined;
  className?: string;
};

export function getAgentName(
  agent: BaseCodingAgent | null | undefined
): string {
  if (!agent) return 'Agent';
  switch (agent) {
    case BaseCodingAgent.CLAUDE_CODE:
      return 'Claude Code';
    case BaseCodingAgent.AMP:
      return 'AMP';
    case BaseCodingAgent.GEMINI:
      return 'Gemini';
    case BaseCodingAgent.CODEX:
      return 'Codex';
    case BaseCodingAgent.OPENCODE:
      return 'OpenCode';
    case BaseCodingAgent.CURSOR_AGENT:
      return 'Cursor';
    case BaseCodingAgent.QWEN_CODE:
      return 'Qwen';
    case BaseCodingAgent.COPILOT:
      return 'Copilot';
    case BaseCodingAgent.DROID:
      return 'Droid';
  }
}

export function AgentIcon({ agent, className = 'h-4 w-4' }: AgentIconProps) {
  const { theme } = useTheme();
  const resolvedTheme = getResolvedTheme(theme);
  const isDark = resolvedTheme === 'dark';
  const suffix = isDark ? '-dark' : '-light';

  if (!agent) {
    return null;
  }

  const agentName = getAgentName(agent);
  let iconPath = '';

  switch (agent) {
    case BaseCodingAgent.CLAUDE_CODE:
      iconPath = `/agents/claude${suffix}.svg`;
      break;
    case BaseCodingAgent.AMP:
      iconPath = `/agents/amp${suffix}.svg`;
      break;
    case BaseCodingAgent.GEMINI:
      iconPath = `/agents/gemini${suffix}.svg`;
      break;
    case BaseCodingAgent.CODEX:
      iconPath = `/agents/codex${suffix}.svg`;
      break;
    case BaseCodingAgent.OPENCODE:
      iconPath = `/agents/opencode${suffix}.svg`;
      break;
    case BaseCodingAgent.CURSOR_AGENT:
      iconPath = `/agents/cursor${suffix}.svg`;
      break;
    case BaseCodingAgent.QWEN_CODE:
      iconPath = `/agents/qwen${suffix}.svg`;
      break;
    case BaseCodingAgent.COPILOT:
      iconPath = `/agents/copilot${suffix}.svg`;
      break;
    case BaseCodingAgent.DROID:
      iconPath = `/agents/droid${suffix}.svg`;
      break;
    default:
      return null;
  }

  return <img src={iconPath} alt={agentName} className={className} />;
}
