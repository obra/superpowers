import { useTranslation } from 'react-i18next';
import { XIcon } from '@phosphor-icons/react';

import { GeneralSettingsSectionContent } from './GeneralSettingsSection';
import { ReposSettingsSectionContent } from './ReposSettingsSection';
import { OrganizationsSettingsSectionContent } from './OrganizationsSettingsSection';
import { RemoteProjectsSettingsSectionContent } from './RemoteProjectsSettingsSection';
import { AgentsSettingsSectionContent } from './AgentsSettingsSection';
import { McpSettingsSectionContent } from './McpSettingsSection';
import { RelaySettingsSectionContent } from './RelaySettingsSection';

export type SettingsSectionType =
  | 'general'
  | 'repos'
  | 'organizations'
  | 'remote-projects'
  | 'agents'
  | 'mcp'
  | 'relay';

// Section-specific initial state types
export type SettingsSectionInitialState = {
  general: undefined;
  repos: { repoId?: string } | undefined;
  organizations: { organizationId?: string } | undefined;
  'remote-projects':
    | { organizationId?: string; projectId?: string }
    | undefined;
  agents: { executor?: string; variant?: string } | undefined;
  mcp: undefined;
  relay: { hostId?: string } | undefined;
};

interface SettingsSectionProps {
  type: SettingsSectionType;
  onClose?: () => void;
  initialState?: SettingsSectionInitialState[SettingsSectionType];
}

export function SettingsSection({
  type,
  onClose,
  initialState,
}: SettingsSectionProps) {
  const { t } = useTranslation('settings');

  const renderContent = () => {
    switch (type) {
      case 'general':
        return <GeneralSettingsSectionContent />;
      case 'repos':
        return (
          <ReposSettingsSectionContent
            initialState={initialState as SettingsSectionInitialState['repos']}
          />
        );
      case 'organizations':
        return <OrganizationsSettingsSectionContent />;
      case 'remote-projects':
        return (
          <RemoteProjectsSettingsSectionContent
            initialState={
              initialState as SettingsSectionInitialState['remote-projects']
            }
          />
        );
      case 'agents':
        return <AgentsSettingsSectionContent />;
      case 'mcp':
        return <McpSettingsSectionContent />;
      case 'relay':
        return (
          <RelaySettingsSectionContent
            initialState={initialState as SettingsSectionInitialState['relay']}
          />
        );
      default:
        return <GeneralSettingsSectionContent />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - sticky */}
      <div className="p-4 border-b border-border bg-panel/95 backdrop-blur-sm hidden sm:flex items-center justify-between">
        <h2 className="text-lg font-semibold text-high">
          {t(`settings.layout.nav.${type}`)}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 ring-offset-panel transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            <XIcon className="h-4 w-4 text-normal" weight="bold" />
            <span className="sr-only">
              {t('buttons.close', { ns: 'common' })}
            </span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6 px-6 pt-4 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}
