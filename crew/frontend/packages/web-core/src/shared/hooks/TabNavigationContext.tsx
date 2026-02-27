import { createHmrContext } from '@/shared/lib/hmrContext';
import type { TabType } from '@/shared/types/tabs';

interface TabNavContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const TabNavContext = createHmrContext<TabNavContextType | null>(
  'TabNavContext',
  null
);
