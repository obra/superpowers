import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from '@vibe/ui/components/Alert';
import { create, useModal } from '@ebay/nice-modal-react';
import { useOrganizationMutations } from '@/shared/hooks/useOrganizationMutations';
import { useTranslation } from 'react-i18next';
import { defineModal, type NoProps } from '@/shared/lib/modals';

export type CreateOrganizationResult = {
  action: 'created' | 'canceled';
  organizationId?: string;
};

const CreateOrganizationDialogImpl = create<NoProps>(() => {
  const modal = useModal();
  const { t } = useTranslation('organization');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isManualSlug, setIsManualSlug] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { createOrganization } = useOrganizationMutations({
    onCreateSuccess: (result) => {
      modal.resolve({
        action: 'created',
        organizationId: result.organization.id,
      } as CreateOrganizationResult);
      modal.hide();
    },
    onCreateError: (err) => {
      setError(
        err instanceof Error ? err.message : 'Failed to create organization'
      );
    },
  });

  useEffect(() => {
    // Reset form when dialog opens
    if (modal.visible) {
      setName('');
      setSlug('');
      setIsManualSlug(false);
      setError(null);
    }
  }, [modal.visible]);

  // Auto-generate slug from name if not manually edited
  useEffect(() => {
    if (!isManualSlug && name) {
      const generatedSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generatedSlug);
    }
  }, [name, isManualSlug]);

  const validateName = (value: string): string | null => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return 'Organization name is required';
    if (trimmedValue.length < 3)
      return 'Organization name must be at least 3 characters';
    if (trimmedValue.length > 50)
      return 'Organization name must be 50 characters or less';
    return null;
  };

  const validateSlug = (value: string): string | null => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return 'Slug is required';
    if (trimmedValue.length < 3) return 'Slug must be at least 3 characters';
    if (trimmedValue.length > 50) return 'Slug must be 50 characters or less';
    if (!/^[a-z0-9-]+$/.test(trimmedValue)) {
      return 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    if (trimmedValue.startsWith('-') || trimmedValue.endsWith('-')) {
      return 'Slug cannot start or end with a hyphen';
    }
    return null;
  };

  const handleCreate = () => {
    const nameError = validateName(name);
    if (nameError) {
      setError(nameError);
      return;
    }

    const slugError = validateSlug(slug);
    if (slugError) {
      setError(slugError);
      return;
    }

    setError(null);
    createOrganization.mutate({
      name: name.trim(),
      slug: slug.trim(),
    });
  };

  const handleCancel = () => {
    modal.resolve({ action: 'canceled' } as CreateOrganizationResult);
    modal.hide();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsManualSlug(true);
    setSlug(e.target.value);
    setError(null);
  };

  return (
    <Dialog open={modal.visible} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('createDialog.title')}</DialogTitle>
          <DialogDescription>{t('createDialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">{t('createDialog.nameLabel')}</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={t('createDialog.namePlaceholder')}
              maxLength={50}
              autoFocus
              disabled={createOrganization.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-slug">{t('createDialog.slugLabel')}</Label>
            <Input
              id="org-slug"
              value={slug}
              onChange={handleSlugChange}
              placeholder={t('createDialog.slugPlaceholder')}
              maxLength={50}
              disabled={createOrganization.isPending}
            />
            <p className="text-xs text-muted-foreground">
              {t('createDialog.slugHelper')}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={createOrganization.isPending}
          >
            {t('common:buttons.cancel')}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              !name.trim() || !slug.trim() || createOrganization.isPending
            }
          >
            {createOrganization.isPending
              ? t('createDialog.creating')
              : t('createDialog.createButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export const CreateOrganizationDialog = defineModal<
  void,
  CreateOrganizationResult
>(CreateOrganizationDialogImpl);
