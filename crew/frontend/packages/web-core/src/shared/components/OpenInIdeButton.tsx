import { useMemo } from 'react';
import { Button } from '@vibe/ui/components/Button';
import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { IdeIcon } from '@/shared/components/IdeIcon';
import { getIdeName } from '@/shared/lib/ideName';

type OpenInIdeButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

export function OpenInIdeButton({
  onClick,
  disabled = false,
  className,
}: OpenInIdeButtonProps) {
  const { config } = useUserSystem();
  const editorType = config?.editor?.editor_type ?? null;

  const label = useMemo(() => {
    const ideName = getIdeName(editorType);
    return `Open in ${ideName}`;
  }, [editorType]);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-10 w-10 p-0 hover:opacity-70 transition-opacity ${className ?? ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <IdeIcon editorType={editorType} className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </Button>
  );
}
