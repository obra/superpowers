import { cn } from '../lib/cn';
import { SpinnerIcon } from '@phosphor-icons/react';
import { GitHubDark } from 'developer-icons';
import { useTranslation } from 'react-i18next';
import { GoogleLogo } from './GoogleLogo';

export type OAuthProvider = 'github' | 'google';

interface OAuthSignInButtonProps {
  provider: OAuthProvider;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  className?: string;
}

const providerConfig = {
  github: {
    i18nKey: 'oauth.continueWithGitHub' as const,
    icon: () => <GitHubDark className="size-5" />,
  },
  google: {
    i18nKey: 'oauth.continueWithGoogle' as const,
    icon: () => <GoogleLogo className="size-5" />,
  },
};

export function OAuthSignInButton({
  provider,
  onClick,
  disabled,
  loading,
  loadingText,
  className,
}: OAuthSignInButtonProps) {
  const { t } = useTranslation('common');
  const config = providerConfig[provider];
  const ProviderIcon = config.icon;

  return (
    <button
      type="button"
      className={cn(
        'relative flex h-10 min-w-[280px] items-center overflow-hidden rounded-[4px] border px-3',
        'border-[#dadce0] bg-[#f2f2f2] text-[#1f1f1f] hover:bg-[#e8eaed] active:bg-[#e2e3e5]',
        'text-[14px] font-medium leading-5 tracking-[0.25px]',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]/40',
        'disabled:cursor-not-allowed disabled:bg-[#ffffff61] disabled:text-[#1f1f1f]/40 disabled:shadow-none',
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
      style={{ fontFamily: "'Roboto', Arial, sans-serif" }}
    >
      <span className="grid w-full grid-cols-[20px_minmax(0,1fr)_20px] items-center gap-[10px]">
        <span className="flex h-5 w-5 items-center justify-center">
          {loading ? (
            <SpinnerIcon
              className="size-4 animate-spin text-[#1f1f1f]"
              weight="bold"
            />
          ) : (
            <ProviderIcon />
          )}
        </span>
        <span className="truncate text-center">
          {loading && loadingText ? loadingText : t(config.i18nKey)}
        </span>
        <span aria-hidden="true" className="h-5 w-5" />
      </span>
    </button>
  );
}
