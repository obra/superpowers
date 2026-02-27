import { useState, useEffect, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
import { defineModal } from '@/shared/lib/modals';
import { useShape } from '@/shared/integrations/electric/hooks';
import {
  PROJECTS_SHAPE,
  PROJECT_MUTATION,
  type Project,
} from 'shared/remote-types';
import { getRandomPresetColor, PRESET_COLORS } from '@/shared/lib/colors';
import { ColorPicker } from '@/shared/components/ui-new/containers/ColorPickerContainer';

export type CreateRemoteProjectDialogProps = {
  organizationId: string;
};

export type CreateRemoteProjectResult = {
  action: 'created' | 'canceled';
  project?: Project;
};

const CreateRemoteProjectDialogImpl = create<CreateRemoteProjectDialogProps>(
  ({ organizationId }) => {
    const modal = useModal();
    const { t } = useTranslation('projects');
    const [name, setName] = useState('');
    const [color, setColor] = useState<string>(() => getRandomPresetColor());
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const params = useMemo(
      () => ({ organization_id: organizationId }),
      [organizationId]
    );

    const { insert, error: syncError } = useShape(PROJECTS_SHAPE, params, {
      mutation: PROJECT_MUTATION,
    });

    useEffect(() => {
      // Reset form when dialog opens
      if (modal.visible) {
        setName('');
        setColor(getRandomPresetColor());
        setError(null);
        setIsCreating(false);
      }
    }, [modal.visible]);

    useEffect(() => {
      if (syncError) {
        setError(syncError.message || 'Failed to create project');
        setIsCreating(false);
      }
    }, [syncError]);

    const validateName = (value: string): string | null => {
      const trimmedValue = value.trim();
      if (!trimmedValue) return 'Project name is required';
      if (trimmedValue.length < 2)
        return 'Project name must be at least 2 characters';
      if (trimmedValue.length > 100)
        return 'Project name must be 100 characters or less';
      return null;
    };

    const handleCreate = async () => {
      const nameError = validateName(name);
      if (nameError) {
        setError(nameError);
        return;
      }

      setError(null);
      setIsCreating(true);

      try {
        const { data: project, persisted } = insert({
          organization_id: organizationId,
          name: name.trim(),
          color: color,
        });

        const persistedProject = await persisted;

        modal.resolve({
          action: 'created',
          project: persistedProject ?? project,
        } as CreateRemoteProjectResult);
        modal.hide();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to create project'
        );
        setIsCreating(false);
      }
    };

    const handleCancel = () => {
      modal.resolve({ action: 'canceled' } as CreateRemoteProjectResult);
      modal.hide();
    };

    const handleOpenChange = (open: boolean) => {
      if (isCreating) return;

      if (!open) {
        handleCancel();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && name.trim() && !isCreating) {
        e.preventDefault();
        void handleCreate();
      }
    };

    return (
      <Dialog open={modal.visible} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('createProjectDialog.title', 'Create Project')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'createProjectDialog.description',
                'Create a new project in this organization.'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">
                {t('createProjectDialog.nameLabel', 'Project name')}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="project-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={t(
                    'createProjectDialog.namePlaceholder',
                    'Enter project name'
                  )}
                  maxLength={100}
                  autoFocus
                  disabled={isCreating}
                  className="flex-1"
                />
                <ColorPicker
                  value={color}
                  onChange={setColor}
                  colors={PRESET_COLORS}
                  disabled={isCreating}
                  align="start"
                  side="bottom"
                >
                  <button
                    type="button"
                    className="w-10 h-10 rounded border cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: `hsl(${color})` }}
                    disabled={isCreating}
                    aria-label={t(
                      'createProjectDialog.selectColor',
                      'Select project color'
                    )}
                  />
                </ColorPicker>
              </div>
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
              disabled={isCreating}
            >
              {t('common:buttons.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || isCreating}
            >
              {isCreating
                ? t('createProjectDialog.creating', 'Creating...')
                : t('createProjectDialog.createButton', 'Create Project')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export const CreateRemoteProjectDialog = defineModal<
  CreateRemoteProjectDialogProps,
  CreateRemoteProjectResult
>(CreateRemoteProjectDialogImpl);
