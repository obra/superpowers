import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SpinnerIcon,
  PlusIcon,
  UserPlusIcon,
  TrashIcon,
  SignInIcon,
  ArrowSquareOutIcon,
  InfoIcon,
} from '@phosphor-icons/react';
import { useUserOrganizations } from '@/shared/hooks/useUserOrganizations';
import { useOrganizationSelection } from '@/shared/hooks/useOrganizationSelection';
import { useOrganizationMembers } from '@/shared/hooks/useOrganizationMembers';
import { useOrganizationInvitations } from '@/shared/hooks/useOrganizationInvitations';
import { useOrganizationMutations } from '@/shared/hooks/useOrganizationMutations';
import { useAuth } from '@/shared/hooks/auth/useAuth';
import { OAuthDialog } from '@/shared/dialogs/global/OAuthDialog';
import {
  CreateOrganizationDialog,
  type CreateOrganizationResult,
} from '@/shared/dialogs/org/CreateOrganizationDialog';
import {
  InviteMemberDialog,
  type InviteMemberResult,
} from '@/shared/dialogs/org/InviteMemberDialog';
import { MemberListItem } from '@/shared/components/org/MemberListItem';
import { PendingInvitationItem } from '@/shared/components/org/PendingInvitationItem';
import type { MemberRole } from 'shared/types';
import { MemberRole as MemberRoleEnum } from 'shared/types';
import { ApiError, organizationsApi } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import { getRemoteApiUrl } from '@/shared/lib/remoteApi';
import { PrimaryButton } from '@vibe/ui/components/PrimaryButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuTriggerButton,
} from '@vibe/ui/components/Dropdown';
import { SettingsCard, SettingsField } from './SettingsComponents';

export function OrganizationsSettingsSection() {
  const { t } = useTranslation('organization');
  const { isSignedIn, isLoaded, userId } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isOpeningBilling, setIsOpeningBilling] = useState(false);

  // Fetch all organizations
  const {
    data: orgsResponse,
    isLoading: orgsLoading,
    error: orgsError,
    refetch: refetchOrgs,
  } = useUserOrganizations();

  // Organization selection
  const { selectedOrgId, selectedOrg, handleOrgSelect } =
    useOrganizationSelection({
      organizations: orgsResponse,
      onSelectionChange: () => {
        setSuccess(null);
        setError(null);
      },
    });

  // Get current user's role and ID
  const currentUserRole = selectedOrg?.user_role;
  const isAdmin = currentUserRole === MemberRoleEnum.ADMIN;
  const isPersonalOrg = selectedOrg?.is_personal ?? false;
  const currentUserId = userId;

  // Fetch members
  const { data: members = [], isLoading: loadingMembers } =
    useOrganizationMembers(selectedOrgId);

  // Fetch invitations (admin only)
  const { data: invitations = [], isLoading: loadingInvitations } =
    useOrganizationInvitations({
      organizationId: selectedOrgId || null,
      isAdmin,
      isPersonal: isPersonalOrg,
    });

  // Organization mutations
  const {
    removeMember,
    updateMemberRole,
    revokeInvitation,
    deleteOrganization,
  } = useOrganizationMutations({
    onRevokeSuccess: () => {
      setSuccess('Invitation revoked successfully');
      setTimeout(() => setSuccess(null), 3000);
    },
    onRevokeError: (err) => {
      setError(
        err instanceof Error ? err.message : 'Failed to revoke invitation'
      );
    },
    onRemoveSuccess: () => {
      setSuccess('Member removed successfully');
      setTimeout(() => setSuccess(null), 3000);
    },
    onRemoveError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    },
    onRoleChangeSuccess: () => {
      setSuccess('Member role updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    },
    onRoleChangeError: (err) => {
      setError(
        err instanceof Error ? err.message : 'Failed to update member role'
      );
    },
    onDeleteSuccess: async () => {
      setSuccess(t('settings.deleteSuccess'));
      setTimeout(() => setSuccess(null), 3000);
      await refetchOrgs();
      if (orgsResponse?.organizations) {
        const personalOrg = orgsResponse.organizations.find(
          (org) => org.is_personal
        );
        if (personalOrg) {
          handleOrgSelect(personalOrg.id);
        }
      }
    },
    onDeleteError: (err) => {
      setError(err instanceof Error ? err.message : t('settings.deleteError'));
    },
  });

  const handleCreateOrganization = async () => {
    try {
      const result: CreateOrganizationResult =
        await CreateOrganizationDialog.show();

      if (result.action === 'created' && result.organizationId) {
        handleOrgSelect(result.organizationId ?? '');
        setSuccess('Organization created successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch {
      // Dialog cancelled
    }
  };

  const handleInviteMember = async () => {
    if (!selectedOrgId) return;

    try {
      const result: InviteMemberResult = await InviteMemberDialog.show({
        organizationId: selectedOrgId,
      });

      if (result.action === 'invited') {
        setSuccess('Member invited successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch {
      // Dialog cancelled
    }
  };

  const handleRevokeInvitation = (invitationId: string) => {
    if (!selectedOrgId) return;
    setError(null);
    revokeInvitation.mutate({ orgId: selectedOrgId, invitationId });
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedOrgId) return;

    const confirmed = window.confirm(t('confirmRemoveMember'));
    if (!confirmed) return;

    setError(null);
    removeMember.mutate({ orgId: selectedOrgId, userId });
  };

  const handleRoleChange = async (userId: string, newRole: MemberRole) => {
    if (!selectedOrgId) return;
    setError(null);
    updateMemberRole.mutate({ orgId: selectedOrgId, userId, role: newRole });
  };

  const handleDeleteOrganization = async () => {
    if (!selectedOrgId || !selectedOrg) return;

    const confirmed = window.confirm(
      t('settings.confirmDelete', { orgName: selectedOrg.name })
    );
    if (!confirmed) return;

    setError(null);
    deleteOrganization.mutate(selectedOrgId);
  };

  const handleManageBilling = async () => {
    if (!selectedOrgId || isOpeningBilling) {
      return;
    }

    // Open tab immediately so browsers treat it as user-initiated.
    const stripeTab = window.open('', '_blank');
    setError(null);
    setIsOpeningBilling(true);

    try {
      const returnUrl = window.location.href;
      const billingStatus =
        await organizationsApi.getBillingStatus(selectedOrgId);

      const createCheckoutUrl = async () => {
        const { url: checkoutUrl } =
          await organizationsApi.createCheckoutSession(
            selectedOrgId,
            returnUrl,
            returnUrl
          );
        return checkoutUrl;
      };

      const url = await (async () => {
        if (billingStatus.status === 'requires_subscription') {
          return createCheckoutUrl();
        }

        try {
          const { url: portalUrl } = await organizationsApi.createPortalSession(
            selectedOrgId,
            returnUrl
          );
          return portalUrl;
        } catch (err) {
          if (
            err instanceof ApiError &&
            (err.statusCode === 402 || err.statusCode === 503)
          ) {
            return createCheckoutUrl();
          }

          throw err;
        }
      })();

      if (stripeTab) {
        stripeTab.opener = null;
        stripeTab.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      stripeTab?.close();
      setError(err instanceof Error ? err.message : 'Failed to open billing');
    } finally {
      setIsOpeningBilling(false);
    }
  };

  if (!isLoaded || orgsLoading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2">
        <SpinnerIcon
          className="size-icon-lg animate-spin text-brand"
          weight="bold"
        />
        <span className="text-normal">
          {t('settings.loadingOrganizations')}
        </span>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-medium text-high">
            {t('loginRequired.title')}
          </h3>
          <p className="text-sm text-low mt-1">
            {t('loginRequired.description')}
          </p>
        </div>
        <PrimaryButton
          variant="secondary"
          value={t('loginRequired.action')}
          onClick={() => void OAuthDialog.show({})}
        >
          <SignInIcon className="size-icon-xs mr-1" weight="bold" />
        </PrimaryButton>
      </div>
    );
  }

  if (orgsError) {
    return (
      <div className="py-8">
        <div className="bg-error/10 border border-error/50 rounded-sm p-4 text-error">
          {orgsError instanceof Error
            ? orgsError.message
            : t('settings.loadError')}
        </div>
      </div>
    );
  }

  const organizations = orgsResponse?.organizations ?? [];
  const orgOptions = organizations.map((org) => ({
    value: org.id,
    label: org.name,
  }));

  return (
    <>
      {/* Status messages */}
      {error && (
        <div className="bg-error/10 border border-error/50 rounded-sm p-4 text-error">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success/10 border border-success/50 rounded-sm p-4 text-success font-medium">
          {success}
        </div>
      )}

      {/* Organization selector */}
      <SettingsCard
        title={t('settings.title')}
        description={t('settings.description')}
        headerAction={
          <PrimaryButton
            variant="secondary"
            value={t('createDialog.createButton')}
            onClick={handleCreateOrganization}
          >
            <PlusIcon className="size-icon-xs mr-1" weight="bold" />
          </PrimaryButton>
        }
      >
        <SettingsField
          label={t('settings.selectLabel')}
          description={t('settings.selectHelper')}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <DropdownMenuTriggerButton
                label={
                  orgOptions.find((o) => o.value === selectedOrgId)?.label ||
                  t('settings.selectPlaceholder')
                }
                className="w-full justify-between"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
              {orgOptions.length > 0 ? (
                orgOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => handleOrgSelect(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  {t('settings.noOrganizations')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SettingsField>
      </SettingsCard>

      {/* Pending Invitations (admin only) */}
      {selectedOrg &&
        isAdmin &&
        !isPersonalOrg &&
        (loadingInvitations || invitations.length > 0) && (
          <SettingsCard
            title={t('invitationList.title')}
            description={t('invitationList.description', {
              orgName: selectedOrg.name,
            })}
          >
            {loadingInvitations ? (
              <div className="flex items-center justify-center py-4 gap-2">
                <SpinnerIcon className="size-icon-sm animate-spin" />
                <span className="text-sm text-low">
                  {t('invitationList.loading')}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {invitations.map((invitation) => (
                  <PendingInvitationItem
                    key={invitation.id}
                    invitation={invitation}
                    onRevoke={handleRevokeInvitation}
                    isRevoking={revokeInvitation.isPending}
                  />
                ))}
              </div>
            )}
          </SettingsCard>
        )}

      {/* Members */}
      {selectedOrg && (
        <SettingsCard
          title={t('memberList.title')}
          description={t('memberList.description', {
            orgName: selectedOrg.name,
          })}
          headerAction={
            isAdmin && !isPersonalOrg ? (
              <PrimaryButton
                variant="secondary"
                value={t('memberList.inviteButton')}
                onClick={handleInviteMember}
              >
                <UserPlusIcon className="size-icon-xs mr-1" weight="bold" />
              </PrimaryButton>
            ) : undefined
          }
        >
          {isPersonalOrg && (
            <div className="bg-info/10 border border-info/50 rounded-sm p-4 mb-4">
              <div className="flex items-start gap-3">
                <InfoIcon
                  className="size-icon-sm text-info flex-shrink-0 mt-0.5"
                  weight="bold"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-high">
                    {t('personalOrg.cannotInvite')}
                  </p>
                  <p className="text-sm text-low mt-1">
                    {t('personalOrg.createOrgPrompt')}
                  </p>
                  <PrimaryButton
                    variant="secondary"
                    value={t('personalOrg.createOrgButton')}
                    onClick={handleCreateOrganization}
                    className="mt-3"
                  >
                    <PlusIcon className="size-icon-xs mr-1" weight="bold" />
                  </PrimaryButton>
                </div>
              </div>
            </div>
          )}
          {loadingMembers ? (
            <div className="flex items-center justify-center py-4 gap-2">
              <SpinnerIcon className="size-icon-sm animate-spin" />
              <span className="text-sm text-low">
                {t('memberList.loading')}
              </span>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-4 text-sm text-low">
              {t('memberList.none')}
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <MemberListItem
                  key={member.user_id}
                  member={member}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onRemove={handleRemoveMember}
                  onRoleChange={handleRoleChange}
                  isRemoving={removeMember.isPending}
                  isRoleChanging={updateMemberRole.isPending}
                />
              ))}
            </div>
          )}
        </SettingsCard>
      )}

      {/* Billing CTA (admin only, non-personal orgs, when remote URL is configured) */}
      {selectedOrg && isAdmin && !isPersonalOrg && getRemoteApiUrl() && (
        <SettingsCard
          title={t('billing.title')}
          description={t('billing.description')}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-low">{t('billing.openInBrowser')}</p>
            <button
              type="button"
              onClick={() => void handleManageBilling()}
              disabled={isOpeningBilling}
              className={cn(
                'flex items-center gap-2 px-base py-half rounded-sm text-sm font-medium',
                'bg-brand/10 text-brand hover:bg-brand/20 border border-brand/50',
                'transition-colors disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {isOpeningBilling ? (
                <SpinnerIcon className="size-icon-xs animate-spin" />
              ) : (
                <ArrowSquareOutIcon className="size-icon-xs" weight="bold" />
              )}
              {t('billing.manageButton')}
            </button>
          </div>
        </SettingsCard>
      )}

      {/* Danger Zone */}
      {selectedOrg && isAdmin && !isPersonalOrg && (
        <SettingsCard
          title={t('settings.dangerZone')}
          description={t('settings.dangerZoneDescription')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-normal">
                {t('settings.deleteOrganization')}
              </p>
              <p className="text-sm text-low">
                {t('settings.deleteOrganizationDescription')}
              </p>
            </div>
            <button
              onClick={handleDeleteOrganization}
              disabled={deleteOrganization.isPending}
              className={cn(
                'flex items-center gap-2 px-base py-half rounded-sm text-sm font-medium',
                'bg-error/10 text-error hover:bg-error/20 border border-error/50',
                'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              )}
            >
              {deleteOrganization.isPending ? (
                <SpinnerIcon className="size-icon-xs animate-spin" />
              ) : (
                <TrashIcon className="size-icon-xs" weight="bold" />
              )}
              {t('common:buttons.delete')}
            </button>
          </div>
        </SettingsCard>
      )}
    </>
  );
}

// Alias for backwards compatibility
export { OrganizationsSettingsSection as OrganizationsSettingsSectionContent };
