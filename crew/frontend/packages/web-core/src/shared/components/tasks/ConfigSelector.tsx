import { Settings2, ArrowDown } from 'lucide-react';
import { Button } from '@vibe/ui/components/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@vibe/ui/components/DropdownMenu';
import { Label } from '@vibe/ui/components/Label';
import { getSortedExecutorVariantKeys } from '@/shared/lib/executor';
import type { ExecutorProfileId } from 'shared/types';

interface ConfigSelectorProps {
  profiles: Record<string, Record<string, unknown>> | null;
  selectedExecutorProfile: ExecutorProfileId | null;
  onChange: (profile: ExecutorProfileId) => void;
  disabled?: boolean;
  className?: string;
  showLabel?: boolean;
}

export function ConfigSelector({
  profiles,
  selectedExecutorProfile,
  onChange,
  disabled,
  className = '',
  showLabel = false,
}: ConfigSelectorProps) {
  const selectedAgent = selectedExecutorProfile?.executor;
  const configs = selectedAgent && profiles ? profiles[selectedAgent] : null;
  const configOptions = configs ? getSortedExecutorVariantKeys(configs) : [];
  const selectedVariant = selectedExecutorProfile?.variant || 'DEFAULT';

  if (!selectedAgent || !profiles || !configs || configOptions.length === 0)
    return null;

  return (
    <div className="flex-1">
      {showLabel && (
        <Label htmlFor="executor-variant" className="text-sm font-medium">
          Configuration
        </Label>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`w-full justify-between text-xs ${showLabel ? 'mt-1.5' : ''} ${className}`}
            disabled={disabled}
            aria-label="Select configuration"
          >
            <div className="flex items-center gap-1.5 w-full">
              <Settings2 className="h-3 w-3" />
              <span className="truncate">{selectedVariant}</span>
            </div>
            <ArrowDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60">
          {configOptions.map((variant) => (
            <DropdownMenuItem
              key={variant}
              onClick={() => {
                onChange({
                  executor: selectedAgent,
                  variant: variant === 'DEFAULT' ? null : variant,
                });
              }}
              className={
                (variant === 'DEFAULT' ? null : variant) ===
                selectedExecutorProfile?.variant
                  ? 'bg-accent'
                  : ''
              }
            >
              {variant}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
