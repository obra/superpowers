import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type State = {
  selectedOrgId: string | null;
  setSelectedOrgId: (orgId: string | null) => void;
  clearSelectedOrgId: () => void;
};

export const useOrganizationStore = create<State>()(
  persist(
    (set) => ({
      selectedOrgId: null,
      setSelectedOrgId: (orgId) => set({ selectedOrgId: orgId }),
      clearSelectedOrgId: () => set({ selectedOrgId: null }),
    }),
    {
      name: 'organization-selection',
      partialize: (state) => ({ selectedOrgId: state.selectedOrgId }),
    }
  )
);

export const useSelectedOrgId = () =>
  useOrganizationStore((s) => s.selectedOrgId);
export const useSetSelectedOrgId = () =>
  useOrganizationStore((s) => s.setSelectedOrgId);
