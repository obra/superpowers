import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { create, useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/shared/lib/modals';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@vibe/ui/components/KeyboardDialog';
import { Alert, AlertDescription } from '@vibe/ui/components/Alert';
import { Button } from '@vibe/ui/components/Button';
import { Checkbox } from '@vibe/ui/components/Checkbox';
import { MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { usePrComments } from '@/shared/hooks/usePrComments';
import { PrCommentCard } from '@vibe/ui/components/pr-comment-card';
import type { UnifiedPrComment } from 'shared/types';

export interface PrCommentsDialogProps {
  attemptId: string;
  repoId: string;
}

export interface PrCommentsDialogResult {
  comments: UnifiedPrComment[];
}

function getCommentId(comment: UnifiedPrComment): string {
  return comment.comment_type === 'general'
    ? comment.id
    : comment.id.toString();
}

const PrCommentsDialogImpl = create<PrCommentsDialogProps>(
  ({ attemptId, repoId }) => {
    const { t } = useTranslation(['tasks', 'common']);
    const modal = useModal();
    const { data, isLoading, isError, error } = usePrComments(
      attemptId,
      repoId
    );
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const comments = data?.comments ?? [];

    // Reset selection when dialog opens
    useEffect(() => {
      if (modal.visible) {
        setSelectedIds(new Set());
      }
    }, [modal.visible]);

    const toggleSelection = (id: string) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    };

    const selectAll = () => {
      setSelectedIds(new Set(comments.map((c) => getCommentId(c))));
    };

    const deselectAll = () => {
      setSelectedIds(new Set());
    };

    const isAllSelected =
      comments.length > 0 && selectedIds.size === comments.length;

    const handleConfirm = () => {
      const selected = comments.filter((c) => selectedIds.has(getCommentId(c)));
      modal.resolve({ comments: selected });
      modal.hide();
    };

    const handleOpenChange = (open: boolean) => {
      if (!open) {
        modal.resolve({ comments: [] });
        modal.hide();
      }
    };

    // Check for specific error types from the API
    const errorMessage = isError ? getErrorMessage(error) : null;

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={handleOpenChange}
        className="max-w-2xl p-0 overflow-hidden"
      >
        <DialogContent
          className="p-0"
          onKeyDownCapture={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              modal.resolve({ comments: [] });
              modal.hide();
            }
          }}
        >
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('tasks:prComments.dialog.title')}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[70vh] flex flex-col min-h-0">
            <div className="p-4 overflow-auto flex-1 min-h-0">
              {errorMessage ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('tasks:prComments.dialog.noComments')}
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">
                      {t('tasks:prComments.dialog.selectedCount', {
                        selected: selectedIds.size,
                        total: comments.length,
                      })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={isAllSelected ? deselectAll : selectAll}
                    >
                      {isAllSelected
                        ? t('tasks:prComments.dialog.deselectAll')
                        : t('tasks:prComments.dialog.selectAll')}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {comments.map((comment) => {
                      const id = getCommentId(comment);
                      return (
                        <div
                          key={id}
                          className="flex items-start gap-3 min-w-0"
                        >
                          <Checkbox
                            checked={selectedIds.has(id)}
                            onCheckedChange={() => toggleSelection(id)}
                            className="mt-3"
                          />
                          <PrCommentCard
                            author={comment.author}
                            body={comment.body}
                            createdAt={comment.created_at}
                            url={comment.url}
                            commentType={comment.comment_type}
                            path={
                              comment.comment_type === 'review'
                                ? comment.path
                                : undefined
                            }
                            line={
                              comment.comment_type === 'review' &&
                              comment.line != null
                                ? Number(comment.line)
                                : undefined
                            }
                            diffHunk={
                              comment.comment_type === 'review'
                                ? comment.diff_hunk
                                : undefined
                            }
                            variant="list"
                            onClick={() => toggleSelection(id)}
                            className="flex-1 min-w-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {!errorMessage && !isLoading && comments.length > 0 && (
            <DialogFooter className="px-4 py-3 border-t">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t('common:buttons.cancel')}
              </Button>
              <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
                {t('tasks:prComments.dialog.add')}
                {selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    );
  }
);

function getErrorMessage(error: unknown): string {
  // Check if it's an API error with error_data
  if (error && typeof error === 'object' && 'error_data' in error) {
    const errorData = (error as { error_data?: { type?: string } }).error_data;
    if (errorData?.type === 'no_pr_attached') {
      return 'No PR is attached to this task attempt. Create a PR first to see comments.';
    }
    if (errorData?.type === 'cli_not_installed') {
      return 'CLI is not installed. Please install it to fetch PR comments.';
    }
    if (errorData?.type === 'cli_not_logged_in') {
      return 'CLI is not logged in. Please authenticate to fetch PR comments.';
    }
  }
  return 'Failed to load PR comments. Please try again.';
}

export const PrCommentsDialog = defineModal<
  PrCommentsDialogProps,
  PrCommentsDialogResult
>(PrCommentsDialogImpl);
