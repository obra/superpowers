import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { Tooltip } from './Tooltip';

export interface ContextUsageInfo {
  total_tokens: number;
  model_context_window: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export interface ContextUsageGaugeProps {
  tokenUsageInfo?: ContextUsageInfo | null;
  className?: string;
}

export function ContextUsageGauge({
  tokenUsageInfo,
  className,
}: ContextUsageGaugeProps) {
  const { t } = useTranslation('common');
  const { percentage, formattedUsed, formattedTotal, status } = useMemo(() => {
    if (!tokenUsageInfo || tokenUsageInfo.model_context_window === 0) {
      return {
        percentage: 0,
        formattedUsed: '0',
        formattedTotal: '0',
        status: 'empty' as const,
      };
    }

    const pct = Math.min(
      100,
      (tokenUsageInfo.total_tokens / tokenUsageInfo.model_context_window) * 100
    );

    const formatTokens = (n: number) => {
      if (n >= 1_000_000) {
        const m = n / 1_000_000;
        return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
      }
      if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
      return n.toString();
    };

    let statusValue: 'low' | 'medium' | 'high' | 'critical' | 'empty';
    if (pct < 50) statusValue = 'low';
    else if (pct < 75) statusValue = 'medium';
    else if (pct < 90) statusValue = 'high';
    else statusValue = 'critical';

    return {
      percentage: pct,
      formattedUsed: formatTokens(tokenUsageInfo.total_tokens),
      formattedTotal: formatTokens(tokenUsageInfo.model_context_window),
      status: statusValue,
    };
  }, [tokenUsageInfo]);

  const progress = clamp(percentage / 100, 0, 1);

  const tooltip =
    status === 'empty'
      ? t('contextUsage.emptyTooltip')
      : t('contextUsage.tooltip', {
          percentage: Math.round(percentage),
          used: formattedUsed,
          total: formattedTotal,
        });

  const progressColor =
    status === 'empty'
      ? 'text-low/40'
      : status === 'critical'
        ? 'text-error'
        : status === 'high'
          ? 'text-brand-secondary'
          : status === 'medium'
            ? 'text-normal'
            : 'text-low';

  const radius = 8;
  const strokeWidth = 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <Tooltip content={tooltip} side="bottom">
      <div
        className={cn(
          'flex items-center justify-center rounded-sm p-half',
          'hover:bg-panel transition-colors cursor-help',
          className
        )}
        aria-label={
          status === 'empty'
            ? t('contextUsage.label')
            : t('contextUsage.ariaLabel', {
                percentage: Math.round(percentage),
              })
        }
        role="img"
      >
        <svg
          viewBox="0 0 20 20"
          className="size-icon-base -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="10"
            cy="10"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-border/60"
          />
          <circle
            cx="10"
            cy="10"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            className={cn(
              progressColor,
              'transition-all duration-500 ease-out'
            )}
          />
        </svg>
      </div>
    </Tooltip>
  );
}
