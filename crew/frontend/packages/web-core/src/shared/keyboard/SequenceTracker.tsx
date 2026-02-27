import { useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { createHmrContext } from '@/shared/lib/hmrContext';
import {
  SEQUENCE_FIRST_KEYS,
  sequentialBindings,
} from '@/shared/keyboard/registry';

interface SequenceTrackerContextValue {
  buffer: string[];
  isActive: boolean;
  isInvalid: boolean;
}

const SequenceTrackerContext = createHmrContext<SequenceTrackerContextValue>(
  'SequenceTrackerContext',
  {
    buffer: [],
    isActive: false,
    isInvalid: false,
  }
);

export const useSequenceTracker = () => useContext(SequenceTrackerContext);

const SEQUENCE_TIMEOUT_MS = 1500;
const INVALID_DISPLAY_MS = 400;

const VALID_SEQUENCES = new Set(
  sequentialBindings.map((b) => b.keys.join(','))
);

function isValidPartialSequence(buffer: string[]): boolean {
  if (buffer.length === 0) return false;
  if (buffer.length === 1) {
    return SEQUENCE_FIRST_KEYS.has(buffer[0]);
  }
  return VALID_SEQUENCES.has(buffer.join(','));
}

interface SequenceTrackerProviderProps {
  children: ReactNode;
}

/**
 * Visual feedback for sequential shortcuts (g>s, v>c).
 * Display-only - execution handled by react-hotkeys-hook.
 *
 * IMPORTANT: Uses refs alongside state because React setState is async.
 * Without synchronous ref updates, rapid keypresses read stale state.
 */
export function SequenceTrackerProvider({
  children,
}: SequenceTrackerProviderProps) {
  const [buffer, setBuffer] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  const bufferRef = useRef<string[]>([]);
  const isActiveRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const invalidTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  bufferRef.current = buffer;
  isActiveRef.current = isActive;

  useEffect(() => {
    const clearBuffer = () => {
      bufferRef.current = [];
      isActiveRef.current = false;
      setBuffer([]);
      setIsActive(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const showInvalid = (invalidBuffer: string[]) => {
      bufferRef.current = invalidBuffer;
      isActiveRef.current = false;
      setBuffer(invalidBuffer);
      setIsInvalid(true);
      setIsActive(false);

      if (invalidTimeoutRef.current) {
        clearTimeout(invalidTimeoutRef.current);
      }
      invalidTimeoutRef.current = setTimeout(() => {
        setIsInvalid(false);
        setBuffer([]);
        invalidTimeoutRef.current = null;
      }, INVALID_DISPLAY_MS);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
        return;
      }

      const key = mapCodeToLogicalKey(event.code, event.key);
      if (!key) return;

      const currentIsActive = isActiveRef.current;
      const currentBuffer = bufferRef.current;

      if (!currentIsActive && !SEQUENCE_FIRST_KEYS.has(key)) {
        return;
      }

      const newBuffer = currentIsActive ? [...currentBuffer, key] : [key];

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (newBuffer.length === 1) {
        bufferRef.current = newBuffer;
        isActiveRef.current = true;
        setBuffer(newBuffer);
        setIsActive(true);
        timeoutRef.current = setTimeout(clearBuffer, SEQUENCE_TIMEOUT_MS);
      } else if (newBuffer.length === 2) {
        isActiveRef.current = false;
        if (isValidPartialSequence(newBuffer)) {
          bufferRef.current = newBuffer;
          setBuffer(newBuffer);
          timeoutRef.current = setTimeout(clearBuffer, 200);
        } else {
          showInvalid(newBuffer);
        }
        setIsActive(false);
      } else {
        clearBuffer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (invalidTimeoutRef.current) clearTimeout(invalidTimeoutRef.current);
    };
  }, []);

  return (
    <SequenceTrackerContext.Provider value={{ buffer, isActive, isInvalid }}>
      {children}
    </SequenceTrackerContext.Provider>
  );
}

/** Maps event.code to logical key for keyboard layout independence (KeyG -> 'g') */
function mapCodeToLogicalKey(code: string, key: string): string | null {
  if (code.startsWith('Key')) {
    return code.slice(3).toLowerCase();
  }
  return key.toLowerCase();
}
