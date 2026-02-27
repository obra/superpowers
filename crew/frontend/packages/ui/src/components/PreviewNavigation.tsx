import { ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react';
import { IconButtonGroup, IconButtonGroupItem } from './IconButtonGroup';

export interface PreviewNavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
}

interface PreviewNavigationProps {
  navigation: PreviewNavigationState | null;
  onBack: () => void;
  onForward: () => void;
  disabled?: boolean;
  className?: string;
}

export function PreviewNavigation({
  navigation,
  onBack,
  onForward,
  disabled = false,
  className,
}: PreviewNavigationProps) {
  return (
    <IconButtonGroup className={className}>
      <IconButtonGroupItem
        icon={ArrowLeftIcon}
        onClick={onBack}
        disabled={!navigation?.canGoBack || disabled}
        aria-label="Go back"
        title="Go back"
      />
      <IconButtonGroupItem
        icon={ArrowRightIcon}
        onClick={onForward}
        disabled={!navigation?.canGoForward || disabled}
        aria-label="Go forward"
        title="Go forward"
      />
    </IconButtonGroup>
  );
}
