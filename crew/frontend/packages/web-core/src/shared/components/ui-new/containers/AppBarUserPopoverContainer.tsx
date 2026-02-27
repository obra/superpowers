import { useState } from 'react';
import type { OrganizationWithRole } from 'shared/types';
import { AppBarUserPopover } from '@vibe/ui/components/AppBarUserPopover';
import { SettingsDialog } from '@/shared/dialogs/settings/SettingsDialog';
import { useAuth } from '@/shared/hooks/auth/useAuth';
import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { useOrganizationStore } from '@/shared/stores/useOrganizationStore';
import { useActions } from '@/shared/hooks/useActions';
import { Actions } from '@/shared/actions';

interface AppBarUserPopoverContainerProps {
  organizations: OrganizationWithRole[];
  selectedOrgId: string;
  onOrgSelect: (orgId: string) => void;
  onCreateOrg: () => void;
}

export function AppBarUserPopoverContainer({
  organizations,
  selectedOrgId,
  onOrgSelect,
  onCreateOrg,
}: AppBarUserPopoverContainerProps) {
  const { executeAction } = useActions();
  const { isSignedIn } = useAuth();
  const { loginStatus } = useUserSystem();
  const setSelectedOrgId = useOrganizationStore((s) => s.setSelectedOrgId);
  const [open, setOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Extract avatar URL from first provider
  const avatarUrl =
    loginStatus?.status === 'loggedin'
      ? (loginStatus.profile.providers[0]?.avatar_url ?? null)
      : null;

  const handleSignIn = async () => {
    await executeAction(Actions.SignIn);
  };

  const handleLogout = async () => {
    await executeAction(Actions.SignOut);
  };

  const handleOrgSettings = async (orgId: string) => {
    setSelectedOrgId(orgId);
    await SettingsDialog.show({ initialSection: 'organizations' });
  };

  const handleSettings = async () => {
    setOpen(false);
    await SettingsDialog.show();
  };

  return (
    <AppBarUserPopover
      isSignedIn={isSignedIn}
      avatarUrl={avatarUrl}
      avatarError={avatarError}
      organizations={organizations}
      selectedOrgId={selectedOrgId}
      open={open}
      onOpenChange={setOpen}
      onOrgSelect={onOrgSelect}
      onCreateOrg={onCreateOrg}
      onOrgSettings={handleOrgSettings}
      onSignIn={handleSignIn}
      onLogout={handleLogout}
      onAvatarError={() => setAvatarError(true)}
      onSettings={handleSettings}
    />
  );
}
