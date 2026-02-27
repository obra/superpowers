import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon } from '@phosphor-icons/react';
import type { BaseCodingAgent, ExecutorProfile } from 'shared/types';
import { McpConfig } from 'shared/types';
import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { mcpServersApi } from '@/shared/lib/api';
import { McpConfigStrategyGeneral } from '@/shared/lib/mcpStrategies';
import { cn } from '@/shared/lib/utils';
import { toPrettyCase } from '@/shared/lib/string';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuTriggerButton,
} from '@vibe/ui/components/Dropdown';
import {
  SettingsCard,
  SettingsField,
  SettingsSaveBar,
  SettingsTextarea,
} from './SettingsComponents';
import { useSettingsDirty } from './SettingsDirtyContext';

export function McpSettingsSection() {
  const { t } = useTranslation('settings');
  const { setDirty: setContextDirty } = useSettingsDirty();
  const { config, profiles } = useUserSystem();
  const [mcpServers, setMcpServers] = useState('{}');
  const [originalMcpServers, setOriginalMcpServers] = useState('{}');
  const [mcpConfig, setMcpConfig] = useState<McpConfig | null>(null);
  const [mcpError, setMcpError] = useState<string | null>(null);
  const [mcpLoading, setMcpLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] =
    useState<ExecutorProfile | null>(null);
  const [mcpApplying, setMcpApplying] = useState(false);
  const [mcpConfigPath, setMcpConfigPath] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const isDirty = mcpServers !== originalMcpServers;

  // Sync dirty state to context for unsaved changes confirmation
  useEffect(() => {
    setContextDirty('mcp', isDirty);
    return () => setContextDirty('mcp', false);
  }, [isDirty, setContextDirty]);

  // Initialize selected profile when config loads
  useEffect(() => {
    if (config?.executor_profile && profiles && !selectedProfile) {
      const currentProfile = profiles[config.executor_profile.executor];
      if (currentProfile) {
        setSelectedProfile(currentProfile);
      } else if (Object.keys(profiles).length > 0) {
        setSelectedProfile(Object.values(profiles)[0]);
      }
    }
  }, [config?.executor_profile, profiles, selectedProfile]);

  // Load MCP configuration when selected profile changes
  useEffect(() => {
    const loadMcpServersForProfile = async (profile: ExecutorProfile) => {
      setMcpLoading(true);
      setMcpError(null);
      setMcpConfigPath('');

      try {
        const profileKey = profiles
          ? Object.keys(profiles).find((key) => profiles[key] === profile)
          : null;
        if (!profileKey) {
          throw new Error('Profile key not found');
        }

        const result = await mcpServersApi.load({
          executor: profileKey as BaseCodingAgent,
        });
        setMcpConfig(result.mcp_config);
        const fullConfig = McpConfigStrategyGeneral.createFullConfig(
          result.mcp_config
        );
        const configJson = JSON.stringify(fullConfig, null, 2);
        setMcpServers(configJson);
        setOriginalMcpServers(configJson);
        setMcpConfigPath(result.config_path);
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          err.message.includes('does not support MCP')
        ) {
          setMcpError(err.message);
        } else {
          console.error('Error loading MCP servers:', err);
        }
      } finally {
        setMcpLoading(false);
      }
    };

    if (selectedProfile) {
      loadMcpServersForProfile(selectedProfile);
    }
  }, [selectedProfile, profiles]);

  const handleMcpServersChange = (value: string) => {
    setMcpServers(value);
    setMcpError(null);

    if (value.trim() && mcpConfig) {
      try {
        const parsedConfig = JSON.parse(value);
        McpConfigStrategyGeneral.validateFullConfig(mcpConfig, parsedConfig);
      } catch (err) {
        if (err instanceof SyntaxError) {
          setMcpError(t('settings.mcp.errors.invalidJson'));
        } else {
          setMcpError(
            err instanceof Error
              ? err.message
              : t('settings.mcp.errors.validationError')
          );
        }
      }
    }
  };

  const handleApplyMcpServers = async () => {
    if (!selectedProfile || !mcpConfig) return;

    setMcpApplying(true);
    setMcpError(null);

    try {
      if (mcpServers.trim()) {
        try {
          const fullConfig = JSON.parse(mcpServers);
          McpConfigStrategyGeneral.validateFullConfig(mcpConfig, fullConfig);
          const mcpServersConfig =
            McpConfigStrategyGeneral.extractServersForApi(
              mcpConfig,
              fullConfig
            );

          const selectedProfileKey = profiles
            ? Object.keys(profiles).find(
                (key) => profiles[key] === selectedProfile
              )
            : null;
          if (!selectedProfileKey) {
            throw new Error('Selected profile key not found');
          }

          await mcpServersApi.save(
            {
              executor: selectedProfileKey as BaseCodingAgent,
            },
            { servers: mcpServersConfig }
          );

          setOriginalMcpServers(mcpServers);
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } catch (mcpErr) {
          if (mcpErr instanceof SyntaxError) {
            setMcpError(t('settings.mcp.errors.invalidJson'));
          } else {
            setMcpError(
              mcpErr instanceof Error
                ? mcpErr.message
                : t('settings.mcp.errors.saveFailed')
            );
          }
        }
      }
    } catch (err) {
      setMcpError(t('settings.mcp.errors.applyFailed'));
      console.error('Error applying MCP servers:', err);
    } finally {
      setMcpApplying(false);
    }
  };

  const handleDiscard = () => {
    setMcpServers(originalMcpServers);
    setMcpError(null);
  };

  const addServer = (key: string) => {
    try {
      const existing = mcpServers.trim() ? JSON.parse(mcpServers) : {};
      const updated = McpConfigStrategyGeneral.addPreconfiguredToConfig(
        mcpConfig!,
        existing,
        key
      );
      setMcpServers(JSON.stringify(updated, null, 2));
      setMcpError(null);
    } catch (err) {
      console.error(err);
      setMcpError(
        err instanceof Error
          ? err.message
          : t('settings.mcp.errors.addServerFailed')
      );
    }
  };

  const preconfiguredObj = (mcpConfig?.preconfigured ?? {}) as Record<
    string,
    unknown
  >;
  const meta =
    typeof preconfiguredObj.meta === 'object' && preconfiguredObj.meta !== null
      ? (preconfiguredObj.meta as Record<
          string,
          { name?: string; description?: string; url?: string; icon?: string }
        >)
      : {};
  const servers = Object.fromEntries(
    Object.entries(preconfiguredObj).filter(([k]) => k !== 'meta')
  ) as Record<string, unknown>;
  const getMetaFor = (key: string) => meta[key] || {};

  const profileOptions = profiles
    ? Object.keys(profiles)
        .sort()
        .map((key) => ({ value: key, label: toPrettyCase(key) }))
    : [];

  const selectedProfileKey = selectedProfile
    ? Object.keys(profiles || {}).find(
        (key) => profiles![key] === selectedProfile
      ) || ''
    : '';

  if (!config) {
    return (
      <div className="py-8">
        <div className="bg-error/10 border border-error/50 rounded-sm p-4 text-error">
          {t('settings.mcp.errors.loadFailed')}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Status messages */}
      {mcpError && !mcpError.includes('does not support MCP') && (
        <div className="bg-error/10 border border-error/50 rounded-sm p-4 text-error">
          {t('settings.mcp.errors.mcpError', { error: mcpError })}
        </div>
      )}

      {success && (
        <div className="bg-success/10 border border-success/50 rounded-sm p-4 text-success font-medium">
          {t('settings.mcp.save.successMessage')}
        </div>
      )}

      {/* MCP Configuration */}
      <SettingsCard
        title={t('settings.mcp.title')}
        description={t('settings.mcp.description')}
      >
        <SettingsField
          label={t('settings.mcp.labels.agent')}
          description={t('settings.mcp.labels.agentHelper')}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <DropdownMenuTriggerButton
                label={
                  selectedProfileKey
                    ? toPrettyCase(selectedProfileKey)
                    : t('settings.mcp.labels.agentPlaceholder')
                }
                className="w-full justify-between"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
              {profileOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => {
                    const profile = profiles?.[option.value];
                    if (profile) setSelectedProfile(profile);
                  }}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SettingsField>

        {mcpError && mcpError.includes('does not support MCP') ? (
          <div className="rounded-sm border border-warning/50 bg-warning/10 p-4">
            <h3 className="text-sm font-medium text-warning">
              {t('settings.mcp.errors.notSupported')}
            </h3>
            <div className="mt-2 text-sm text-low">
              <p>{mcpError}</p>
              <p className="mt-1">{t('settings.mcp.errors.supportMessage')}</p>
            </div>
          </div>
        ) : (
          <>
            <SettingsField
              label={t('settings.mcp.labels.serverConfig')}
              description={
                mcpLoading ? (
                  t('settings.mcp.loadingStates.configuration')
                ) : (
                  <>
                    {t('settings.mcp.labels.saveLocation')}
                    {mcpConfigPath && (
                      <span className="ml-2 font-mono text-xs">
                        {mcpConfigPath}
                      </span>
                    )}
                  </>
                )
              }
            >
              <SettingsTextarea
                value={
                  mcpLoading
                    ? t('settings.mcp.loadingStates.jsonEditor')
                    : mcpServers
                }
                onChange={handleMcpServersChange}
                disabled={mcpLoading}
                rows={14}
                placeholder='{\n  "server-name": {\n    "type": "stdio",\n    "command": "your-command",\n    "args": ["arg1", "arg2"]\n  }\n}'
              />
            </SettingsField>

            {/* Preconfigured servers */}
            {mcpConfig?.preconfigured &&
              typeof mcpConfig.preconfigured === 'object' &&
              Object.keys(servers).length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-normal">
                    {t('settings.mcp.labels.popularServers')}
                  </label>
                  <p className="text-sm text-low">
                    {t('settings.mcp.labels.serverHelper')}
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(servers).map(([key]) => {
                      const metaObj = getMetaFor(key) as {
                        name?: string;
                        description?: string;
                        icon?: string;
                      };
                      const name = metaObj.name || key;
                      const description =
                        metaObj.description || 'No description';
                      const icon = metaObj.icon ? `/${metaObj.icon}` : null;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => addServer(key)}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-sm border border-border/50 bg-secondary/30',
                            'hover:bg-secondary hover:border-border transition-colors text-left'
                          )}
                        >
                          <div className="w-6 h-6 rounded-sm border border-border bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                            {icon ? (
                              <img
                                src={icon}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-normal">
                                {name.slice(0, 1).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-normal truncate">
                              {name}
                            </div>
                            <div className="text-xs text-low line-clamp-2">
                              {description}
                            </div>
                          </div>
                          <PlusIcon
                            className="size-icon-xs text-low shrink-0"
                            weight="bold"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
          </>
        )}
      </SettingsCard>

      <SettingsSaveBar
        show={isDirty && !mcpError?.includes('does not support MCP')}
        saving={mcpApplying}
        saveDisabled={!!mcpError}
        onSave={handleApplyMcpServers}
        onDiscard={handleDiscard}
      />
    </>
  );
}

// Alias for backwards compatibility
export { McpSettingsSection as McpSettingsSectionContent };
