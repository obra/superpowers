import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type RefObject,
} from 'react';
import {
  useContextBarPosition as useContextBarPositionStore,
  type ContextBarPosition,
} from '@/shared/stores/useUiPreferencesStore';

const EDGE_PADDING = 16;

export type SnapPosition = ContextBarPosition;

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface UseContextBarPositionReturn {
  position: SnapPosition;
  style: React.CSSProperties;
  isDragging: boolean;
  dragHandlers: {
    onMouseDown: (e: React.MouseEvent) => void;
  };
}

function getPositionStyle(
  position: SnapPosition,
  _barWidth: number,
  barHeight: number
): React.CSSProperties {
  const halfHeight = barHeight / 2;

  switch (position) {
    case 'top-left':
      return { top: EDGE_PADDING, left: EDGE_PADDING };
    case 'top-right':
      return { top: EDGE_PADDING, right: EDGE_PADDING };
    case 'middle-left':
      return { top: `calc(50% - ${halfHeight}px)`, left: EDGE_PADDING };
    case 'middle-right':
      return { top: `calc(50% - ${halfHeight}px)`, right: EDGE_PADDING };
    case 'bottom-left':
      return { bottom: EDGE_PADDING, left: EDGE_PADDING };
    case 'bottom-right':
      return { bottom: EDGE_PADDING, right: EDGE_PADDING };
  }
}

function calculateNearestSnapPosition(
  x: number,
  y: number,
  containerWidth: number,
  containerHeight: number
): SnapPosition {
  // Determine left/right based on which half of container
  const xZone = x < containerWidth / 2 ? 'left' : 'right';

  // Determine top/middle/bottom based on thirds
  const yZone =
    y < containerHeight / 3
      ? 'top'
      : y > (2 * containerHeight) / 3
        ? 'bottom'
        : 'middle';

  return `${yZone}-${xZone}` as SnapPosition;
}

export function useContextBarPosition(
  containerRef: RefObject<HTMLElement | null>,
  barWidth = 38,
  barHeight = 177
): UseContextBarPositionReturn {
  const [position, setPosition] = useContextBarPositionStore();
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  // Store the bar's position relative to the container during drag
  const barRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  // Store container rect at drag start for consistent calculations
  const containerRectRef = useRef<DOMRect | null>(null);

  // Handle mouse down on drag handle
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      // Get container rect
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      containerRectRef.current = containerRect;

      // Get current position of the bar relative to container
      const barElement = e.currentTarget.parentElement
        ?.parentElement as HTMLElement;
      const barRect = barElement?.getBoundingClientRect();
      if (barRect) {
        // Store position relative to container
        barRef.current = {
          x: barRect.left - containerRect.left,
          y: barRect.top - containerRect.top,
        };
      }

      setDragState({
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
      });
    },
    [containerRef]
  );

  // Handle mouse move during drag
  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setDragState((prev) => ({
        ...prev,
        currentX: e.clientX,
        currentY: e.clientY,
      }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) {
        setDragState({
          isDragging: false,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
        });
        return;
      }

      // Calculate the final position of the bar center relative to container
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;
      const finalX = barRef.current.x + deltaX + barWidth / 2;
      const finalY = barRef.current.y + deltaY + barHeight / 2;

      // Calculate nearest snap position using container dimensions
      const newPosition = calculateNearestSnapPosition(
        finalX,
        finalY,
        containerRect.width,
        containerRect.height
      );

      setPosition(newPosition);
      setDragState({
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    dragState.isDragging,
    dragState.startX,
    dragState.startY,
    barWidth,
    barHeight,
    containerRef,
    setPosition,
  ]);

  // Calculate style based on position or drag state
  const style: React.CSSProperties = dragState.isDragging
    ? {
        // During drag, use absolute position relative to container
        left: barRef.current.x + (dragState.currentX - dragState.startX),
        top: barRef.current.y + (dragState.currentY - dragState.startY),
      }
    : getPositionStyle(position, barWidth, barHeight);

  return {
    position,
    style,
    isDragging: dragState.isDragging,
    dragHandlers: {
      onMouseDown: handleMouseDown,
    },
  };
}
