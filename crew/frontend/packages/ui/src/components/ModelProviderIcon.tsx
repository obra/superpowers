import {
  GoogleLogoIcon,
  HardDriveIcon,
  SparkleIcon,
} from '@phosphor-icons/react';
import { cn } from '../lib/cn';

interface ModelProviderIconProps {
  providerId: string;
  theme?: 'light' | 'dark';
}

export function ModelProviderIcon({
  providerId,
  theme = 'light',
}: ModelProviderIconProps) {
  const suffix = theme === 'dark' ? '-dark' : '-light';
  const id = providerId.toLowerCase();
  const className = cn('size-icon-sm', 'flex-shrink-0');

  if (id.includes('anthropic') || id.includes('claude')) {
    return (
      <img
        src={`/agents/claude${suffix}.svg`}
        alt="Anthropic"
        className={className}
      />
    );
  }

  if (id.includes('openai') || id.includes('gpt')) {
    return (
      <img
        src={`/agents/codex${suffix}.svg`}
        alt="OpenAI"
        className={className}
      />
    );
  }

  if (id.includes('google') || id.includes('gemini')) {
    return <GoogleLogoIcon className={className} />;
  }

  if (
    id.includes('local') ||
    id.includes('ollama') ||
    id.includes('llama') ||
    id.includes('server')
  ) {
    return <HardDriveIcon className={className} />;
  }

  return <SparkleIcon className={className} />;
}
