import * as React from 'react';
import { X } from 'lucide-react';
import { useHotkeys, useHotkeysContext } from 'react-hotkeys-hook';
import { createPortal } from 'react-dom';

import { cn } from '../lib/cn';

const DIALOG_SCOPE = 'dialog';
const KANBAN_SCOPE = 'kanban';
const PROJECTS_SCOPE = 'projects';

function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  if (ref) {
    ref.current = value;
  }
}

const Dialog = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    uncloseable?: boolean;
  }
>(({ className, open, onOpenChange, children, uncloseable, ...props }, ref) => {
  const { enableScope, disableScope } = useHotkeysContext();
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  const setDialogRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      dialogRef.current = node;
      assignRef(ref, node);
    },
    [ref]
  );

  // Manage dialog scope when open/closed
  React.useEffect(() => {
    if (open) {
      enableScope(DIALOG_SCOPE);
      disableScope(KANBAN_SCOPE);
      disableScope(PROJECTS_SCOPE);
    } else {
      disableScope(DIALOG_SCOPE);
      enableScope(KANBAN_SCOPE);
      enableScope(PROJECTS_SCOPE);
    }
    return () => {
      disableScope(DIALOG_SCOPE);
      enableScope(KANBAN_SCOPE);
      enableScope(PROJECTS_SCOPE);
    };
  }, [open, enableScope, disableScope]);

  useHotkeys(
    'esc',
    (e) => {
      if (!open) return;
      if (uncloseable) return;

      const activeElement = document.activeElement as HTMLElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable)
      ) {
        activeElement.blur();
        e?.preventDefault();
        return;
      }

      onOpenChange?.(false);
    },
    {
      enabled: !!open,
      scopes: [DIALOG_SCOPE],
      preventDefault: true,
    },
    [open, uncloseable, onOpenChange]
  );

  useHotkeys(
    'enter',
    (e) => {
      if (!open) return;

      const activeElement = document.activeElement as HTMLElement;
      if (activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const container = dialogRef.current;
      if (!container) {
        return;
      }

      const submitButton = container.querySelector(
        'button[type="submit"]'
      ) as HTMLButtonElement | null;
      if (submitButton && !submitButton.disabled) {
        e?.preventDefault();
        submitButton.click();
        return;
      }

      const buttons = Array.from(
        container.querySelectorAll('button')
      ) as HTMLButtonElement[];
      const primaryButton = buttons.find(
        (btn) =>
          !btn.disabled &&
          !btn.textContent?.toLowerCase().includes('cancel') &&
          !btn.textContent?.toLowerCase().includes('close') &&
          btn.type !== 'button'
      );

      if (primaryButton) {
        e?.preventDefault();
        primaryButton.click();
      }
    },
    {
      enabled: !!open,
      scopes: [DIALOG_SCOPE],
    },
    [open]
  );

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => (uncloseable ? {} : onOpenChange?.(false))}
      />
      <div
        ref={setDialogRef}
        className={cn(
          'relative z-[10000] flex flex-col w-full max-w-xl gap-4 bg-primary p-6 shadow-lg duration-200 sm:rounded-lg my-8',
          className
        )}
        {...props}
      >
        {!uncloseable && (
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
            onClick={() => onOpenChange?.(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
});
Dialog.displayName = 'Dialog';

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-4', className)} {...props} />
));
DialogContent.displayName = 'DialogContent';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
};
