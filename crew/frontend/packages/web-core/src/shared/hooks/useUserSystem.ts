import { useContext } from 'react';
import { createHmrContext } from '@/shared/lib/hmrContext';
import type {
  Config,
  Environment,
  BaseAgentCapability,
  LoginStatus,
} from 'shared/types';
import type { ExecutorProfile } from 'shared/types';

export interface UserSystemState {
  config: Config | null;
  environment: Environment | null;
  profiles: Record<string, ExecutorProfile> | null;
  capabilities: Record<string, BaseAgentCapability[]> | null;
  analyticsUserId: string | null;
  loginStatus: LoginStatus | null;
}

export interface UserSystemContextType {
  // Full system state
  system: UserSystemState;

  // Hot path - config helpers (most frequently used)
  config: Config | null;
  updateConfig: (updates: Partial<Config>) => void;
  updateAndSaveConfig: (updates: Partial<Config>) => Promise<boolean>;
  saveConfig: () => Promise<boolean>;

  // System data access
  environment: Environment | null;
  profiles: Record<string, ExecutorProfile> | null;
  capabilities: Record<string, BaseAgentCapability[]> | null;
  analyticsUserId: string | null;
  loginStatus: LoginStatus | null;
  setEnvironment: (env: Environment | null) => void;
  setProfiles: (profiles: Record<string, ExecutorProfile> | null) => void;
  setCapabilities: (caps: Record<string, BaseAgentCapability[]> | null) => void;

  // Reload system data
  reloadSystem: () => Promise<void>;

  // State
  loading: boolean;
}

export const UserSystemContext = createHmrContext<
  UserSystemContextType | undefined
>('UserSystemContext', undefined);

export function useUserSystem() {
  const context = useContext(UserSystemContext);
  if (context === undefined) {
    throw new Error('useUserSystem must be used within a UserSystemProvider');
  }
  return context;
}
