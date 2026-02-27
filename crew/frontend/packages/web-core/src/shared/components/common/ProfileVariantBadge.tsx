import type { ExecutorConfig } from 'shared/types';
import { cn } from '@/shared/lib/utils';

interface ProfileVariantBadgeProps {
  executorConfig: ExecutorConfig;
  className?: string;
}

export function ProfileVariantBadge({
  executorConfig,
  className,
}: ProfileVariantBadgeProps) {
  return (
    <span className={cn('text-xs text-muted-foreground', className)}>
      {executorConfig.executor}
      {executorConfig.variant && (
        <>
          <span className="mx-1">/</span>
          <span className="font-medium">{executorConfig.variant}</span>
        </>
      )}
    </span>
  );
}
