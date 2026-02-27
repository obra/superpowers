import { useCallback, useEffect, useRef, useState } from 'react';

type Args = {
  processVariant: string | null;
  scratchVariant?: string | null;
};

/**
 * Hook to manage variant selection with priority:
 * 1. User dropdown selection (current session) - highest priority
 * 2. Scratch-persisted variant (from previous session)
 * 3. Last execution process variant (fallback)
 */
export function useVariant({ processVariant, scratchVariant }: Args) {
  // Track if user has explicitly selected a variant this session
  const hasUserSelectionRef = useRef(false);

  // Compute initial value: scratch takes priority over process
  const getInitialVariant = () =>
    scratchVariant !== undefined ? scratchVariant : processVariant;

  const [selectedVariant, setSelectedVariantState] = useState<string | null>(
    getInitialVariant
  );

  // Sync state when inputs change (if user hasn't made a selection)
  useEffect(() => {
    if (hasUserSelectionRef.current) return;

    const newVariant =
      scratchVariant !== undefined ? scratchVariant : processVariant;
    setSelectedVariantState(newVariant);
  }, [scratchVariant, processVariant]);

  // When user explicitly selects a variant, mark it and update state
  const setSelectedVariant = useCallback((variant: string | null) => {
    hasUserSelectionRef.current = true;
    setSelectedVariantState(variant);
  }, []);

  return { selectedVariant, setSelectedVariant } as const;
}
