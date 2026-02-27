import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { SpinnerGap } from '@phosphor-icons/react';
import { tagsApi } from '@/shared/lib/api';
import { TagEditDialog } from '@/shared/dialogs/shared/TagEditDialog';
import { PrimaryButton } from '@vibe/ui/components/PrimaryButton';
import { IconButton } from '@vibe/ui/components/IconButton';
import type { Tag } from 'shared/types';

export function TagManager() {
  const { t } = useTranslation('settings');
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tagsApi.list();
      setTags(data);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleOpenDialog = useCallback(
    async (tag?: Tag) => {
      try {
        const result = await TagEditDialog.show({
          tag: tag || null,
        });

        if (result === 'saved') {
          await fetchTags();
        }
      } catch (error) {
        // User cancelled - do nothing
      }
    },
    [fetchTags]
  );

  const handleDelete = useCallback(
    async (tag: Tag) => {
      if (
        !confirm(
          t('settings.general.tags.manager.deleteConfirm', {
            tagName: tag.tag_name,
          })
        )
      ) {
        return;
      }

      try {
        await tagsApi.delete(tag.id);
        await fetchTags();
      } catch (err) {
        console.error('Failed to delete tag:', err);
      }
    },
    [fetchTags, t]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <SpinnerGap className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {t('settings.general.tags.manager.title')}
        </h3>
        <PrimaryButton
          variant="tertiary"
          onClick={() => handleOpenDialog()}
          actionIcon={PlusIcon}
        >
          {t('settings.general.tags.manager.addTag')}
        </PrimaryButton>
      </div>

      {tags.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('settings.general.tags.manager.noTags')}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[400px] overflow-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-2 text-sm font-medium">
                    {t('settings.general.tags.manager.table.tagName')}
                  </th>
                  <th className="text-left p-2 text-sm font-medium">
                    {t('settings.general.tags.manager.table.content')}
                  </th>
                  <th className="text-right p-2 text-sm font-medium">
                    {t('settings.general.tags.manager.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr
                    key={tag.id}
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-2 text-sm font-medium">@{tag.tag_name}</td>
                    <td className="p-2 text-sm">
                      <div
                        className="max-w-[400px] truncate"
                        title={tag.content || ''}
                      >
                        {tag.content || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex justify-end gap-1">
                        <IconButton
                          icon={PencilSimpleIcon}
                          aria-label="edit"
                          onClick={() => handleOpenDialog(tag)}
                          title={t(
                            'settings.general.tags.manager.actions.editTag'
                          )}
                        />
                        <IconButton
                          icon={TrashIcon}
                          aria-label="delete"
                          onClick={() => handleDelete(tag)}
                          title={t(
                            'settings.general.tags.manager.actions.deleteTag'
                          )}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
