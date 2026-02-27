import {
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useState,
  type ReactNode,
  type MouseEvent,
  type CSSProperties,
} from 'react';

// --- Headless Compound Components ---

type VerticalSide = 'top' | 'bottom';

interface TypeaheadPlacement {
  side: VerticalSide;
  maxHeight: number;
  left: number;
  top: number;
}

function getViewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

function getViewportWidth() {
  return window.visualViewport?.width ?? window.innerWidth;
}

function parseLength(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveLineHeight(
  style: CSSStyleDeclaration,
  fallbackHeight: number
): number {
  const explicit = parseLength(style.lineHeight);
  if (explicit > 0) return explicit;

  const fontSize = parseLength(style.fontSize);
  if (fontSize > 0) return fontSize;

  return Math.max(fallbackHeight, 0);
}

function round(value: number): number {
  return Math.round(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function placementsEqual(
  a: TypeaheadPlacement,
  b: TypeaheadPlacement
): boolean {
  return (
    a.side === b.side &&
    a.left === b.left &&
    a.top === b.top &&
    a.maxHeight === b.maxHeight
  );
}

function computePlacement(
  anchorEl: HTMLElement,
  menuEl: HTMLElement,
  editorEl?: HTMLElement | null
): TypeaheadPlacement {
  const anchorRect = anchorEl.getBoundingClientRect();
  const menuRect = menuEl.getBoundingClientRect();
  const editorRect = editorEl?.getBoundingClientRect();
  const anchorStyles = window.getComputedStyle(anchorEl);
  const menuStyles = window.getComputedStyle(menuEl);
  const viewportWidth = getViewportWidth();
  const viewportHeight = getViewportHeight();
  const marginTop = parseLength(menuStyles.marginTop);
  const marginBottom = parseLength(menuStyles.marginBottom);
  const marginLeft = parseLength(menuStyles.marginLeft);
  const marginRight = parseLength(menuStyles.marginRight);
  const configuredMinHeight = parseLength(menuStyles.minHeight);
  const configuredMaxHeight = parseLength(menuStyles.maxHeight);
  const measuredHeight = round(
    menuRect.height ||
      parseLength(menuStyles.height) ||
      parseLength(menuStyles.minHeight)
  );

  const lineHeight = resolveLineHeight(anchorStyles, anchorRect.height);
  const cursorTopBoundary = anchorRect.top - lineHeight;
  const topBoundary = editorRect
    ? Math.max(editorRect.top, cursorTopBoundary)
    : cursorTopBoundary;
  const aboveSpace = topBoundary - marginBottom;
  const belowSpace = viewportHeight - anchorRect.bottom - marginTop;
  const side: VerticalSide =
    belowSpace >= measuredHeight || belowSpace >= aboveSpace ? 'bottom' : 'top';
  const availableSpace = Math.max(
    side === 'bottom' ? belowSpace : aboveSpace,
    0
  );

  let maxHeight = configuredMaxHeight
    ? Math.min(configuredMaxHeight, availableSpace)
    : availableSpace;
  if (configuredMinHeight) {
    maxHeight = Math.max(
      maxHeight,
      Math.min(configuredMinHeight, availableSpace)
    );
  }

  const measuredWidth =
    round(menuRect.width) ||
    round(parseLength(menuStyles.width)) ||
    round(parseLength(menuStyles.minWidth));
  const minLeft = marginLeft;
  const maxLeft = Math.max(
    minLeft,
    viewportWidth - measuredWidth - marginRight
  );
  const left = clamp(round(anchorRect.left), round(minLeft), round(maxLeft));
  const top =
    side === 'bottom'
      ? round(anchorRect.bottom + marginTop)
      : round(topBoundary - marginBottom);

  return {
    side,
    maxHeight: round(maxHeight),
    left,
    top,
  };
}

interface TypeaheadMenuProps {
  anchorEl: HTMLElement;
  editorEl?: HTMLElement | null;
  onClickOutside?: () => void;
  children: ReactNode;
}

function TypeaheadMenuRoot({
  anchorEl,
  editorEl,
  onClickOutside,
  children,
}: TypeaheadMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<TypeaheadPlacement | null>(null);

  const syncPlacement = useCallback(() => {
    const menuEl = menuRef.current;
    if (!menuEl) return;

    const nextPlacement = computePlacement(anchorEl, menuEl, editorEl);
    setPlacement((previous) => {
      if (previous && placementsEqual(previous, nextPlacement)) {
        return previous;
      }

      return nextPlacement;
    });
  }, [anchorEl, editorEl]);

  useLayoutEffect(() => {
    syncPlacement();
    const frameId = window.requestAnimationFrame(syncPlacement);
    return () => window.cancelAnimationFrame(frameId);
  }, [syncPlacement]);

  useEffect(() => {
    const updateOnFrame = () => {
      window.requestAnimationFrame(syncPlacement);
    };

    window.addEventListener('resize', updateOnFrame);
    window.addEventListener('scroll', updateOnFrame, true);
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', updateOnFrame);
      vv.addEventListener('scroll', updateOnFrame);
    }

    return () => {
      window.removeEventListener('resize', updateOnFrame);
      window.removeEventListener('scroll', updateOnFrame, true);
      if (vv) {
        vv.removeEventListener('resize', updateOnFrame);
        vv.removeEventListener('scroll', updateOnFrame);
      }
    };
  }, [syncPlacement]);

  useEffect(() => {
    const menuEl = menuRef.current;
    if (!menuEl) return;

    const observer = new ResizeObserver(() => {
      syncPlacement();
    });

    observer.observe(anchorEl);
    observer.observe(menuEl);
    if (editorEl) {
      observer.observe(editorEl);
    }

    return () => {
      observer.disconnect();
    };
  }, [anchorEl, editorEl, syncPlacement]);

  // Click-outside detection
  useEffect(() => {
    if (!onClickOutside) return;
    const handlePointerDown = (e: PointerEvent) => {
      const menu = menuRef.current;
      if (menu && !menu.contains(e.target as Node)) {
        onClickOutside();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [onClickOutside]);

  // When side is 'top' the menu grows upward — use bottom-anchored positioning
  // so the menu expands upward from a fixed bottom edge.
  const style: CSSProperties = !placement
    ? {
        position: 'fixed',
        visibility: 'hidden',
      }
    : placement.side === 'bottom'
      ? ({
          position: 'fixed',
          left: placement.left,
          top: placement.top,
          '--typeahead-menu-max-height': `${placement.maxHeight}px`,
        } as CSSProperties)
      : ({
          position: 'fixed',
          left: placement.left,
          bottom: getViewportHeight() - placement.top,
          '--typeahead-menu-max-height': `${placement.maxHeight}px`,
        } as CSSProperties);

  return (
    <div
      ref={menuRef}
      style={style}
      className="z-[10000] w-auto min-w-80 max-w-full p-0 overflow-hidden bg-panel border border-border rounded-sm shadow-md flex flex-col"
    >
      {children}
    </div>
  );
}

function TypeaheadMenuHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-base py-half border-b border-border ${className ?? ''}`}
    >
      <div className="flex items-center gap-half text-xs font-medium text-low">
        {children}
      </div>
    </div>
  );
}

function TypeaheadMenuScrollArea({ children }: { children: ReactNode }) {
  return (
    <div
      className="py-half overflow-auto flex-1 min-h-0"
      style={{ maxHeight: 'var(--typeahead-menu-max-height, 100vh)' }}
    >
      {children}
    </div>
  );
}

function TypeaheadMenuSectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="px-base py-half text-xs font-medium text-low">
      {children}
    </div>
  );
}

function TypeaheadMenuDivider() {
  return <div className="h-px bg-border my-half" />;
}

function TypeaheadMenuEmpty({ children }: { children: ReactNode }) {
  return <div className="px-base py-half text-sm text-low">{children}</div>;
}

interface TypeaheadMenuActionProps {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}

function TypeaheadMenuAction({
  onClick,
  disabled = false,
  children,
}: TypeaheadMenuActionProps) {
  return (
    <button
      type="button"
      className="w-full px-base py-half text-left text-sm text-low hover:bg-secondary hover:text-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

interface TypeaheadMenuItemProps {
  isSelected: boolean;
  index: number;
  setHighlightedIndex: (index: number) => void;
  onClick: () => void;
  children: ReactNode;
}

function TypeaheadMenuItemComponent({
  isSelected,
  index,
  setHighlightedIndex,
  onClick,
  children,
}: TypeaheadMenuItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isSelected]);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const pos = { x: event.clientX, y: event.clientY };
    const last = lastMousePositionRef.current;
    if (!last || last.x !== pos.x || last.y !== pos.y) {
      lastMousePositionRef.current = pos;
      setHighlightedIndex(index);
    }
  };

  return (
    <div
      ref={ref}
      className={`px-base py-half rounded-sm cursor-pointer text-sm transition-colors ${
        isSelected ? 'bg-secondary text-high' : 'hover:bg-secondary text-normal'
      }`}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export const TypeaheadMenu = Object.assign(TypeaheadMenuRoot, {
  Header: TypeaheadMenuHeader,
  ScrollArea: TypeaheadMenuScrollArea,
  SectionHeader: TypeaheadMenuSectionHeader,
  Divider: TypeaheadMenuDivider,
  Empty: TypeaheadMenuEmpty,
  Action: TypeaheadMenuAction,
  Item: TypeaheadMenuItemComponent,
});
