import { useTranslation } from 'react-i18next';
import { TerminalIcon, GearSixIcon } from '@phosphor-icons/react';
import { cn } from '../lib/cn';

export type ScriptPlaceholderType = 'setup' | 'cleanup';

interface ChatScriptPlaceholderProps {
  type: ScriptPlaceholderType;
  className?: string;
  onConfigure?: () => void;
}

export function ChatScriptPlaceholder({
  type,
  className,
  onConfigure,
}: ChatScriptPlaceholderProps) {
  const { t } = useTranslation('tasks');

  const title =
    type === 'setup'
      ? t('conversation.scriptPlaceholder.setupTitle')
      : t('conversation.scriptPlaceholder.cleanupTitle');

  const description =
    type === 'setup'
      ? t('conversation.scriptPlaceholder.setupDescription')
      : t('conversation.scriptPlaceholder.cleanupDescription');

  return (
    <div
      className={cn(
        'flex items-start gap-base text-sm rounded-md -mx-half px-half py-half',
        className
      )}
    >
      <span className="relative shrink-0 pt-0.5">
        <TerminalIcon className="size-icon-base text-lowest" />
      </span>
      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <span className="text-low font-medium">{title}</span>
        <span className="text-lowest text-xs">{description}</span>
      </div>
      {onConfigure && (
        <button
          type="button"
          onClick={onConfigure}
          className="shrink-0 flex items-center gap-1 px-2 py-1 text-xs text-brand hover:text-brand-hover hover:bg-secondary rounded transition-colors"
        >
          <GearSixIcon className="size-icon-xs" />
          <span>{t('conversation.scriptPlaceholder.configure')}</span>
        </button>
      )}
    </div>
  );
}
