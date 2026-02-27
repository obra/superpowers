import { useState, useEffect } from 'react';
import { PrimaryButton } from '@vibe/ui/components/PrimaryButton';
import { Button } from '@vibe/ui/components/Button';
import { Input } from '@vibe/ui/components/Input';
import { Label } from '@vibe/ui/components/Label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@vibe/ui/components/KeyboardDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@vibe/ui/components/Select';
import { Alert, AlertDescription } from '@vibe/ui/components/Alert';
import { create, useModal } from '@ebay/nice-modal-react';
import { useOrganizationMutations } from '@/shared/hooks/useOrganizationMutations';
import { MemberRole } from 'shared/types';
import { useTranslation } from 'react-i18next';
import { defineModal } from '@/shared/lib/modals';
import { ApiError } from '@/shared/lib/api';
import { getRemoteApiUrl } from '@/shared/lib/remoteApi';
import { ArrowSquareOut } from '@phosphor-icons/react';

export type InviteMemberResult = {
  action: 'invited' | 'canceled';
};

export interface InviteMemberDialogProps {
  organizationId: string;
}

const InviteMemberDialogImpl = create<InviteMemberDialogProps>((props) => {
  const modal = useModal();
  const { organizationId } = props;
  const { t } = useTranslation('organization');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>(MemberRole.MEMBER);
  const [error, setError] = useState<string | null>(null);
  const [isSubscriptionRequired, setIsSubscriptionRequired] = useState(false);

  const { createInvitation } = useOrganizationMutations({
    onInviteSuccess: () => {
      modal.resolve({ action: 'invited' } as InviteMemberResult);
      modal.hide();
    },
    onInviteError: (err) => {
      if (err instanceof ApiError && err.statusCode === 402) {
        setIsSubscriptionRequired(true);
        setError(t('inviteDialog.subscriptionRequired'));
      } else {
        setIsSubscriptionRequired(false);
        setError(
          err instanceof Error ? err.message : 'Failed to send invitation'
        );
      }
    },
  });

  useEffect(() => {
    // Reset form when dialog opens
    if (modal.visible) {
      setEmail('');
      setRole(MemberRole.MEMBER);
      setError(null);
      setIsSubscriptionRequired(false);
    }
  }, [modal.visible]);

  const validateEmail = (value: string): string | null => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return 'Email is required';

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedValue)) {
      return 'Please enter a valid email address';
    }

    return null;
  };

  const handleInvite = () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    if (!organizationId) {
      setError('No organization selected');
      return;
    }

    setError(null);
    createInvitation.mutate({
      orgId: organizationId,
      data: {
        email: email.trim(),
        role: role,
      },
    });
  };

  const handleCancel = () => {
    modal.resolve({ action: 'canceled' } as InviteMemberResult);
    modal.hide();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    }
  };

  return (
    <Dialog open={modal.visible} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('inviteDialog.title')}</DialogTitle>
          <DialogDescription>{t('inviteDialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">{t('inviteDialog.emailLabel')}</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder={t('inviteDialog.emailPlaceholder')}
              autoFocus
              disabled={createInvitation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">{t('inviteDialog.roleLabel')}</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as MemberRole)}
              disabled={createInvitation.isPending}
            >
              <SelectTrigger id="invite-role">
                <SelectValue placeholder={t('inviteDialog.rolePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MemberRole.MEMBER}>
                  {t('roles.member')}
                </SelectItem>
                <SelectItem value={MemberRole.ADMIN}>
                  {t('roles.admin')}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('inviteDialog.roleHelper')}
            </p>
          </div>

          {error && (
            <Alert variant={isSubscriptionRequired ? 'default' : 'destructive'}>
              <AlertDescription>
                {error}
                {isSubscriptionRequired && getRemoteApiUrl() && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('inviteDialog.upgradePrompt')}
                    </p>
                    <PrimaryButton
                      onClick={() =>
                        window.open(
                          `${getRemoteApiUrl()}/upgrade?org_id=${organizationId}`,
                          '_blank'
                        )
                      }
                      actionIcon={ArrowSquareOut}
                    >
                      {t('inviteDialog.upgradeButton')}
                    </PrimaryButton>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={createInvitation.isPending}
          >
            {t('common:buttons.cancel')}
          </Button>
          <Button
            onClick={handleInvite}
            disabled={!email.trim() || createInvitation.isPending}
          >
            {createInvitation.isPending
              ? t('inviteDialog.sending')
              : t('inviteDialog.sendButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export const InviteMemberDialog = defineModal<
  InviteMemberDialogProps,
  InviteMemberResult
>(InviteMemberDialogImpl);
