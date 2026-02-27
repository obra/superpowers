import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cloneDeep, isEqual, merge } from 'lodash';
import { SignInIcon, SpinnerIcon } from '@phosphor-icons/react';
import { OAuthDialog } from '@/shared/dialogs/global/OAuthDialog';
import {
  UserSystemContext,
  type UserSystemContextType,
} from '@/shared/hooks/useUserSystem';
import { useAuth } from '@/shared/hooks/auth/useAuth';
import { relayApi } from '@/shared/lib/api';
import { normalizeEnrollmentCode } from '@/shared/lib/relayPake';
import { PrimaryButton } from '@vibe/ui/components/PrimaryButton';
import {
  usePairRelayHostMutation,
  useRelayRemoteHostsQuery,
  useRelayRemotePairedHostsQuery,
  useRemovePairedRelayHostMutation,
} from '@/shared/dialogs/settings/settings/useRelayRemoteHostMutations';
import {
  SettingsCard,
  SettingsCheckbox,
  SettingsSaveBar,
  SettingsSelect,
} from './SettingsComponents';
import { useSettingsDirty } from './SettingsDirtyContext';

interface PairedHostRow {
  id: string;
  name: string;
  status: string;
  agentVersion: string | null;
  pairedAt: string;
}

const RELAY_PAIRED_CLIENTS_QUERY_KEY = ['relay', 'paired-clients'] as const;
const RELAY_REMOTE_CONTROL_DOCS_URL =
  'https://www.vibekanban.com/docs/remote-control';

interface RelaySettingsSectionInitialState {
  hostId?: string;
}
export function RelaySettingsSectionContent({
  initialState,
}: {
  initialState?: RelaySettingsSectionInitialState;
}) {
  const userSystem = useContext(UserSystemContext);

  if (userSystem) {
    return <LocalRelaySettingsSectionContent userSystem={userSystem} />;
  }

  return <RemoteRelaySettingsSectionContent initialState={initialState} />;
}

function LocalRelaySettingsSectionContent({
  userSystem,
}: {
  userSystem: UserSystemContextType;
}) {
  const { t } = useTranslation(['settings', 'common']);
  const { setDirty: setContextDirty } = useSettingsDirty();
  const { config, loading, updateAndSaveConfig } = userSystem;
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState(() => (config ? cloneDeep(config) : null));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [enrollmentCode, setEnrollmentCode] = useState<string | null>(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const [removingClientId, setRemovingClientId] = useState<string | null>(null);

  const {
    data: pairedClients = [],
    isLoading: pairedClientsLoading,
    error: pairedClientsError,
  } = useQuery({
    queryKey: RELAY_PAIRED_CLIENTS_QUERY_KEY,
    queryFn: () => relayApi.listPairedClients(),
    enabled: isSignedIn && (draft?.relay_enabled ?? false),
    refetchInterval: 10000,
  });

  const removePairedClientMutation = useMutation({
    mutationFn: (clientId: string) => relayApi.removePairedClient(clientId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: RELAY_PAIRED_CLIENTS_QUERY_KEY,
      });
    },
  });

  useEffect(() => {
    if (!config) return;
    if (!dirty) {
      setDraft(cloneDeep(config));
    }
  }, [config, dirty]);

  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !config) return false;
    return !isEqual(draft, config);
  }, [draft, config]);

  useEffect(() => {
    setContextDirty('relay', hasUnsavedChanges);
    return () => setContextDirty('relay', false);
  }, [hasUnsavedChanges, setContextDirty]);

  const updateDraft = useCallback(
    (patch: Partial<typeof config>) => {
      setDraft((prev: typeof config) => {
        if (!prev) return prev;
        const next = merge({}, prev, patch);
        if (!isEqual(next, config)) {
          setDirty(true);
        }
        return next;
      });
    },
    [config]
  );

  const handleSave = async () => {
    if (!draft) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateAndSaveConfig(draft);
      setDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError(t('settings.general.save.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!config) return;
    setDraft(cloneDeep(config));
    setDirty(false);
  };

  const handleShowEnrollmentCode = async () => {
    setEnrollmentLoading(true);
    setEnrollmentError(null);
    try {
      const result = await relayApi.getEnrollmentCode();
      setEnrollmentCode(result.enrollment_code);
    } catch {
      setEnrollmentError(t('settings.relay.enrollmentCode.fetchError'));
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const handleRemovePairedClient = async (clientId: string) => {
    setRemovingClientId(clientId);
    try {
      await removePairedClientMutation.mutateAsync(clientId);
    } finally {
      setRemovingClientId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2">
        <SpinnerIcon
          className="size-icon-lg animate-spin text-brand"
          weight="bold"
        />
        <span className="text-normal">{t('settings.general.loading')}</span>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="py-8">
        <div className="bg-error/10 border border-error/50 rounded-sm p-4 text-error">
          {t('settings.general.loadError')}
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="bg-error/10 border border-error/50 rounded-sm p-4 text-error">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success/10 border border-success/50 rounded-sm p-4 text-success font-medium">
          {t('settings.general.save.success')}
        </div>
      )}

      <SettingsCard
        title={t('settings.relay.title')}
        description={
          <>
            {t('settings.relay.description')}{' '}
            <a
              href={RELAY_REMOTE_CONTROL_DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="text-brand hover:underline"
            >
              {t('settings.relay.docsLink', 'Read docs')}
            </a>
          </>
        }
      >
        <SettingsCheckbox
          id="relay-enabled"
          label={t('settings.relay.enabled.label')}
          description={t('settings.relay.enabled.helper')}
          checked={draft?.relay_enabled ?? true}
          onChange={(checked) => updateDraft({ relay_enabled: checked })}
        />

        {draft?.relay_enabled && (
          <div className="space-y-3 mt-2">
            {isSignedIn ? (
              <>
                {!enrollmentCode && (
                  <PrimaryButton
                    variant="secondary"
                    value={t('settings.relay.enrollmentCode.show')}
                    onClick={handleShowEnrollmentCode}
                    disabled={enrollmentLoading}
                    actionIcon={enrollmentLoading ? 'spinner' : undefined}
                  />
                )}

                {enrollmentError && (
                  <p className="text-sm text-error">{enrollmentError}</p>
                )}

                {enrollmentCode && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-normal">
                      {t('settings.relay.enrollmentCode.label')}
                    </label>
                    <div className="bg-secondary border border-border rounded-sm px-base py-half font-mono text-lg text-high tracking-widest select-all">
                      {enrollmentCode}
                    </div>
                    <p className="text-sm text-low">
                      {t('settings.relay.enrollmentCode.helper')}
                    </p>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-border/70">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-normal">
                      {t(
                        'settings.relay.pairedClients.title',
                        'Paired clients'
                      )}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-low">
                      <SpinnerIcon
                        className="size-icon-xs animate-spin"
                        weight="bold"
                      />
                      <span>
                        {t(
                          'settings.relay.pairedClients.checking',
                          'Checking for new clients'
                        )}
                      </span>
                    </div>
                  </div>

                  {pairedClientsLoading && (
                    <div className="flex items-center gap-2 text-sm text-low">
                      <SpinnerIcon
                        className="size-icon-sm animate-spin"
                        weight="bold"
                      />
                      <span>
                        {t(
                          'settings.relay.pairedClients.loading',
                          'Loading paired clients...'
                        )}
                      </span>
                    </div>
                  )}

                  {pairedClientsError instanceof Error && (
                    <p className="text-sm text-error">
                      {pairedClientsError.message}
                    </p>
                  )}

                  {removePairedClientMutation.error instanceof Error && (
                    <p className="text-sm text-error">
                      {removePairedClientMutation.error.message}
                    </p>
                  )}

                  {!pairedClientsLoading && pairedClients.length === 0 && (
                    <div className="rounded-sm border border-border bg-secondary/30 p-3 text-sm text-low">
                      {t(
                        'settings.relay.pairedClients.empty',
                        'No paired clients found.'
                      )}
                    </div>
                  )}

                  {!pairedClientsLoading && pairedClients.length > 0 && (
                    <div className="space-y-2">
                      {pairedClients.map((client) => (
                        <div
                          key={client.client_id}
                          className="rounded-sm border border-border bg-secondary/30 p-3 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-high truncate">
                              {client.client_name}
                            </p>
                            <p className="text-xs text-low">
                              {client.client_browser} · {client.client_os} ·{' '}
                              {formatDeviceLabel(client.client_device)}
                            </p>
                          </div>
                          <PrimaryButton
                            variant="tertiary"
                            value={t(
                              'settings.relay.pairedClients.remove',
                              'Remove'
                            )}
                            onClick={() =>
                              void handleRemovePairedClient(client.client_id)
                            }
                            disabled={
                              removePairedClientMutation.isPending &&
                              removingClientId === client.client_id
                            }
                            actionIcon={
                              removePairedClientMutation.isPending &&
                              removingClientId === client.client_id
                                ? 'spinner'
                                : undefined
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-low">
                  {t('settings.relay.enrollmentCode.loginRequired')}
                </p>
                <PrimaryButton
                  variant="secondary"
                  value={t(
                    'settings.remoteProjects.loginRequired.action',
                    'Sign in'
                  )}
                  onClick={() => void OAuthDialog.show({})}
                >
                  <SignInIcon className="size-icon-xs mr-1" weight="bold" />
                </PrimaryButton>
              </div>
            )}
          </div>
        )}
      </SettingsCard>

      <SettingsSaveBar
        show={hasUnsavedChanges}
        saving={saving}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </>
  );
}

function RemoteRelaySettingsSectionContent({
  initialState,
}: {
  initialState?: RelaySettingsSectionInitialState;
}) {
  const { t } = useTranslation(['settings', 'common']);
  const { isSignedIn } = useAuth();
  const initialHostId = initialState?.hostId;
  const hasAppliedInitialHostRef = useRef(false);

  const [showPairForm, setShowPairForm] = useState(false);
  const [selectedHostId, setSelectedHostId] = useState<string | undefined>();
  const [pairingCode, setPairingCode] = useState('');
  const [pairError, setPairError] = useState<string | null>(null);
  const [pairSuccess, setPairSuccess] = useState<string | null>(null);
  const [removingHostId, setRemovingHostId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const {
    data: hosts = [],
    isLoading: hostsLoading,
    error: hostsQueryError,
  } = useQuery({
    ...useRelayRemoteHostsQuery(),
    enabled: isSignedIn,
  });

  const { data: pairedHosts = [], isLoading: pairedHostsLoading } = useQuery({
    ...useRelayRemotePairedHostsQuery(),
    enabled: isSignedIn,
  });

  const hostsError =
    hostsQueryError != null
      ? t('settings.relay.remote.hosts.loadError', 'Failed to load hosts.')
      : null;

  const { mutateAsync: pairRelayHostMutation, isPending: isPairing } =
    usePairRelayHostMutation();

  const { mutateAsync: removePairedHostMutation } =
    useRemovePairedRelayHostMutation();

  const pairedHostIds = useMemo(
    () => new Set(pairedHosts.map((host) => host.host_id)),
    [pairedHosts]
  );

  const availableHostsToPair = useMemo(
    () => hosts.filter((host) => !pairedHostIds.has(host.id)),
    [hosts, pairedHostIds]
  );

  useEffect(() => {
    if (!showPairForm) {
      return;
    }

    if (
      availableHostsToPair.length > 0 &&
      (!selectedHostId ||
        !availableHostsToPair.some((host) => host.id === selectedHostId))
    ) {
      setSelectedHostId(availableHostsToPair[0]?.id);
    }
  }, [availableHostsToPair, selectedHostId, showPairForm]);

  useEffect(() => {
    if (!initialHostId || hasAppliedInitialHostRef.current) {
      return;
    }

    if (hostsLoading || pairedHostsLoading) {
      return;
    }

    if (!availableHostsToPair.some((host) => host.id === initialHostId)) {
      hasAppliedInitialHostRef.current = true;
      return;
    }

    setPairSuccess(null);
    setPairError(null);
    setSelectedHostId(initialHostId);
    setShowPairForm(true);
    hasAppliedInitialHostRef.current = true;
  }, [availableHostsToPair, hostsLoading, initialHostId, pairedHostsLoading]);

  const pairedHostRows = useMemo<PairedHostRow[]>(() => {
    return pairedHosts.map((entry) => {
      const liveHost = hosts.find((host) => host.id === entry.host_id);
      return {
        id: entry.host_id,
        name: liveHost?.name ?? entry.host_name,
        status: liveHost?.status ?? 'offline',
        agentVersion: liveHost?.agent_version ?? null,
        pairedAt: entry.paired_at,
      };
    });
  }, [hosts, pairedHosts]);

  const hostOptions = useMemo(
    () =>
      availableHostsToPair.map((host) => ({
        value: host.id,
        label: host.name,
      })),
    [availableHostsToPair]
  );

  const canSubmitPairing =
    !!selectedHostId &&
    normalizeEnrollmentCode(pairingCode).length === 6 &&
    !isPairing;

  const resetPairForm = () => {
    setPairingCode('');
    setPairError(null);
    setPairSuccess(null);
    setShowPairForm(false);
  };

  const handlePairHost = useCallback(async () => {
    if (!selectedHostId) {
      return;
    }

    const normalizedCode = normalizeEnrollmentCode(pairingCode);
    if (normalizedCode.length !== 6) {
      setPairError(
        t(
          'settings.relay.remote.pair.code.invalid',
          'Enter a 6-character code.'
        )
      );
      return;
    }

    setPairError(null);
    setPairSuccess(null);

    try {
      const selectedHost = hosts.find((host) => host.id === selectedHostId);
      await pairRelayHostMutation({
        hostId: selectedHostId,
        hostName: selectedHost?.name ?? selectedHostId,
        normalizedCode,
      });
      setPairSuccess(
        t('settings.relay.remote.pair.success', 'Host paired successfully.')
      );
      setPairingCode('');
      setShowPairForm(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPairError(message);
    }
  }, [hosts, pairRelayHostMutation, pairingCode, selectedHostId, t]);

  const handleRemovePairedHost = useCallback(
    async (hostId: string) => {
      setRemovingHostId(hostId);
      setRemoveError(null);
      setPairSuccess(null);

      try {
        await removePairedHostMutation(hostId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setRemoveError(message);
      } finally {
        setRemovingHostId(null);
      }
    },
    [removePairedHostMutation]
  );

  if (!isSignedIn) {
    return (
      <SettingsCard
        title={t('settings.relay.title')}
        description={
          <>
            {t('settings.relay.description')}{' '}
            <a
              href={RELAY_REMOTE_CONTROL_DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="text-brand hover:underline"
            >
              {t('settings.relay.docsLink', 'Read docs')}
            </a>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-low">
            {t(
              'settings.relay.remote.loginRequired',
              'Sign in to view and pair relay hosts.'
            )}
          </p>
          <PrimaryButton
            variant="secondary"
            value={t('settings.remoteProjects.loginRequired.action', 'Sign in')}
            onClick={() => void OAuthDialog.show({})}
          >
            <SignInIcon className="size-icon-xs mr-1" weight="bold" />
          </PrimaryButton>
        </div>
      </SettingsCard>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <SettingsCard
        title={t('settings.relay.title')}
        description={
          <>
            {t(
              'settings.relay.remote.description',
              'Pair browser access to your relay hosts using a one-time code.'
            )}{' '}
            <a
              href={RELAY_REMOTE_CONTROL_DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="text-brand hover:underline"
            >
              {t('settings.relay.docsLink', 'Read docs')}
            </a>
          </>
        }
        headerAction={
          <PrimaryButton
            variant="secondary"
            value={t('settings.relay.remote.pair.button', 'Pair new host')}
            onClick={() => {
              setPairSuccess(null);
              setPairError(null);
              setShowPairForm((current) => !current);
            }}
            disabled={availableHostsToPair.length === 0 || isPairing}
          />
        }
      >
        {pairSuccess && (
          <div className="bg-success/10 border border-success/50 rounded-sm p-3 text-success text-sm">
            {pairSuccess}
          </div>
        )}

        {hostsError && (
          <div className="bg-error/10 border border-error/50 rounded-sm p-3 text-error text-sm">
            {hostsError}
          </div>
        )}

        {showPairForm && (
          <div className="border border-border rounded-sm bg-secondary/40 p-4 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-normal">
                {t('settings.relay.remote.pair.host.label', 'Host')}
              </label>
              <SettingsSelect
                value={selectedHostId}
                options={hostOptions}
                onChange={setSelectedHostId}
                placeholder={t(
                  'settings.relay.remote.pair.host.placeholder',
                  'Select a host'
                )}
                disabled={isPairing || hostOptions.length === 0}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-normal">
                {t('settings.relay.remote.pair.code.label', 'Pairing code')}
              </label>
              <RelayCodeInput
                value={pairingCode}
                onChange={setPairingCode}
                disabled={isPairing}
              />
              <p className="text-sm text-low">
                {t(
                  'settings.relay.remote.pair.code.helper',
                  'Enter the 6-character code shown on the host settings page.'
                )}
              </p>
            </div>

            {pairError && <p className="text-sm text-error">{pairError}</p>}

            {isPairing && (
              <div className="flex items-center gap-2 text-sm text-normal">
                <SpinnerIcon
                  className="size-icon-sm animate-spin"
                  weight="bold"
                />
                <span>
                  {t(
                    'settings.relay.remote.pair.inProgress',
                    'Pairing host, please wait...'
                  )}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <PrimaryButton
                value={t('settings.relay.remote.pair.confirm', 'Pair host')}
                onClick={() => void handlePairHost()}
                disabled={!canSubmitPairing}
                actionIcon={isPairing ? 'spinner' : undefined}
              />
              <PrimaryButton
                variant="tertiary"
                value={t('common:buttons.cancel')}
                onClick={resetPairForm}
                disabled={isPairing}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-normal">
            {t('settings.relay.remote.pairedHosts.title', 'Paired hosts')}
          </h4>

          {(hostsLoading || pairedHostsLoading) && (
            <div className="flex items-center gap-2 text-sm text-low">
              <SpinnerIcon
                className="size-icon-sm animate-spin"
                weight="bold"
              />
              <span>
                {t(
                  'settings.relay.remote.pairedHosts.loading',
                  'Loading hosts...'
                )}
              </span>
            </div>
          )}

          {removeError && <p className="text-sm text-error">{removeError}</p>}

          {!hostsLoading &&
            !pairedHostsLoading &&
            pairedHostRows.length === 0 && (
              <div className="rounded-sm border border-border bg-secondary/30 p-3 text-sm text-low">
                {t(
                  'settings.relay.remote.pairedHosts.empty',
                  'No hosts are paired yet.'
                )}
              </div>
            )}

          {!hostsLoading &&
            !pairedHostsLoading &&
            pairedHostRows.length > 0 && (
              <div className="space-y-2">
                {pairedHostRows.map((host) => (
                  <div
                    key={host.id}
                    className="rounded-sm border border-border bg-secondary/30 p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-high truncate">
                        {host.name}
                      </p>
                      <p className="text-xs text-low">
                        {host.status === 'online'
                          ? t('settings.relay.remote.status.online', 'Online')
                          : t(
                              'settings.relay.remote.status.offline',
                              'Offline'
                            )}
                        {host.agentVersion ? ` · v${host.agentVersion}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-xs text-low shrink-0">
                        {t(
                          'settings.relay.remote.pairedHosts.pairedOn',
                          'Paired'
                        )}{' '}
                        · {new Date(host.pairedAt).toLocaleDateString()}
                      </p>
                      <PrimaryButton
                        variant="tertiary"
                        value={t(
                          'settings.relay.remote.pairedHosts.remove',
                          'Remove'
                        )}
                        onClick={() => void handleRemovePairedHost(host.id)}
                        disabled={removingHostId !== null}
                        actionIcon={
                          removingHostId === host.id ? 'spinner' : undefined
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </SettingsCard>
    </div>
  );
}

function formatDeviceLabel(device: string): string {
  if (!device) {
    return '';
  }
  return `${device[0]?.toUpperCase() ?? ''}${device.slice(1)}`;
}

function RelayCodeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (nextValue: string) => void;
  disabled?: boolean;
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const normalizedValue = normalizeEnrollmentCode(value).slice(0, 6);
  const characters = useMemo(
    () => Array.from({ length: 6 }, (_, index) => normalizedValue[index] ?? ''),
    [normalizedValue]
  );

  const setCharacterAt = (index: number, char: string) => {
    const next = [...characters];
    next[index] = char;
    onChange(next.join(''));
  };

  return (
    <div
      className="flex gap-2"
      onPaste={(event) => {
        const pasted = normalizeEnrollmentCode(
          event.clipboardData.getData('text')
        ).slice(0, 6);
        if (!pasted) {
          return;
        }

        event.preventDefault();
        onChange(pasted);
        const focusIndex = Math.min(pasted.length, 5);
        inputsRef.current[focusIndex]?.focus();
      }}
    >
      {characters.map((char, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          type="text"
          inputMode="text"
          autoComplete="one-time-code"
          value={char}
          maxLength={1}
          disabled={disabled}
          onChange={(event) => {
            const nextChar = normalizeEnrollmentCode(event.target.value).slice(
              -1
            );
            setCharacterAt(index, nextChar);
            if (nextChar && index < 5) {
              inputsRef.current[index + 1]?.focus();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !characters[index] && index > 0) {
              inputsRef.current[index - 1]?.focus();
            }
            if (event.key === 'ArrowLeft' && index > 0) {
              event.preventDefault();
              inputsRef.current[index - 1]?.focus();
            }
            if (event.key === 'ArrowRight' && index < 5) {
              event.preventDefault();
              inputsRef.current[index + 1]?.focus();
            }
          }}
          className="w-10 h-12 rounded-sm border border-border bg-panel text-center font-mono text-lg uppercase text-high focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
        />
      ))}
    </div>
  );
}
