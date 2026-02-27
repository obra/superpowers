import { useCallback, useEffect, useMemo } from 'react';
import type {
  OrganizationWithRole,
  ListOrganizationsResponse,
} from 'shared/types';
import { useOrganizationStore } from '@/shared/stores/useOrganizationStore';

interface UseOrganizationSelectionOptions {
  organizations: ListOrganizationsResponse | undefined;
  onSelectionChange?: () => void;
}

export function useOrganizationSelection(
  options: UseOrganizationSelectionOptions
) {
  const { organizations, onSelectionChange } = options;
  const selectedOrgId = useOrganizationStore((s) => s.selectedOrgId);
  const setSelectedOrgId = useOrganizationStore((s) => s.setSelectedOrgId);

  const orgList = useMemo(
    () => organizations?.organizations ?? [],
    [organizations]
  );

  // Default to first available organization if none selected or selection is invalid
  useEffect(() => {
    if (orgList.length === 0) return;

    const hasValidSelection = selectedOrgId
      ? orgList.some((org) => org.id === selectedOrgId)
      : false;

    if (!selectedOrgId || !hasValidSelection) {
      // Prefer first non-personal org, fallback to first org if all are personal
      const firstNonPersonal = orgList.find((org) => !org.is_personal);
      const fallbackId = (firstNonPersonal ?? orgList[0]).id;
      setSelectedOrgId(fallbackId);
    }
  }, [orgList, selectedOrgId, setSelectedOrgId]);

  // Derive the selected organization object
  const selectedOrg = useMemo<OrganizationWithRole | null>(() => {
    if (!selectedOrgId || orgList.length === 0) return null;
    return orgList.find((o) => o.id === selectedOrgId) ?? null;
  }, [selectedOrgId, orgList]);

  // Handle organization selection from dropdown
  const handleOrgSelect = useCallback(
    (id: string) => {
      if (id === selectedOrgId) return;
      setSelectedOrgId(id);
      onSelectionChange?.();
    },
    [selectedOrgId, setSelectedOrgId, onSelectionChange]
  );

  return {
    selectedOrgId: selectedOrgId ?? '',
    selectedOrg,
    handleOrgSelect,
  };
}
