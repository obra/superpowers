import {
  BuildingsIcon,
  CheckIcon,
  GearIcon,
  PlusIcon,
  SignInIcon,
  SignOutIcon,
  UserIcon,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './Dropdown';

export interface AppBarUserOrganization {
  id: string;
  name: string;
}

interface AppBarUserPopoverProps {
  isSignedIn: boolean;
  avatarUrl: string | null;
  avatarError: boolean;
  organizations: AppBarUserOrganization[];
  selectedOrgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrgSelect: (orgId: string) => void;
  onCreateOrg?: () => void;
  onOrgSettings?: (orgId: string) => void;
  onSettings?: () => void;
  onSignIn: () => void;
  onLogout: () => void;
  onAvatarError: () => void;
}

export function AppBarUserPopover({
  isSignedIn,
  avatarUrl,
  avatarError,
  organizations,
  selectedOrgId,
  open,
  onOpenChange,
  onOrgSelect,
  onCreateOrg,
  onOrgSettings,
  onSettings,
  onSignIn,
  onLogout,
  onAvatarError,
}: AppBarUserPopoverProps) {
  const { t } = useTranslation();
  const settingsLabel = t('settings:settings.layout.nav.title', {
    defaultValue: 'Settings',
  });

  if (!isSignedIn) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg',
              'bg-panel text-normal font-medium text-sm',
              'transition-colors cursor-pointer',
              'hover:bg-panel/70',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand'
            )}
            aria-label="Sign in"
          >
            <UserIcon className="size-icon-sm" weight="bold" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" className="min-w-[200px]">
          <DropdownMenuItem icon={SignInIcon} onClick={onSignIn}>
            {t('signIn')}
          </DropdownMenuItem>
          {onSettings && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={GearIcon} onClick={onSettings}>
                {settingsLabel}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            'transition-colors cursor-pointer overflow-hidden',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
            (!avatarUrl || avatarError) &&
              'bg-panel text-normal font-medium text-sm',
            (!avatarUrl || avatarError) && 'hover:bg-panel/70'
          )}
          aria-label="Account"
        >
          {avatarUrl && !avatarError ? (
            <img
              src={avatarUrl}
              alt="User avatar"
              className="w-full h-full object-cover"
              onError={onAvatarError}
            />
          ) : (
            <UserIcon className="size-icon-sm" weight="bold" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="min-w-[200px]">
        <DropdownMenuLabel>{t('orgSwitcher.organizations')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            icon={org.id === selectedOrgId ? CheckIcon : BuildingsIcon}
            onClick={() => onOrgSelect(org.id)}
            className={cn(org.id === selectedOrgId && 'bg-brand/10', 'group')}
          >
            <span className="flex items-center gap-2 w-full">
              <span className="flex-1 truncate">{org.name}</span>
              {onOrgSettings && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenChange(false);
                    onOrgSettings(org.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary transition-opacity shrink-0"
                  aria-label={t('orgSwitcher.orgSettings')}
                >
                  <GearIcon className="size-icon-xs" weight="bold" />
                </button>
              )}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={PlusIcon} onClick={onCreateOrg}>
          {t('orgSwitcher.createOrganization')}
        </DropdownMenuItem>
        {onSettings && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem icon={GearIcon} onClick={onSettings}>
              {settingsLabel}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={SignOutIcon} onClick={onLogout}>
          {t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
