import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRelaySession, listRelayHosts } from '@/shared/lib/remoteApi';
import {
  createRelaySessionAuthCode,
  establishRelaySessionBaseUrl,
  finishRelaySpake2Enrollment,
  getRelayApiUrl,
  startRelaySpake2Enrollment,
} from '@/shared/lib/relayBackendApi';
import {
  buildClientProofB64,
  finishSpake2Enrollment,
  generateRelaySigningKeyPair,
  startSpake2Enrollment,
  verifyServerProof,
} from '@/shared/lib/relayPake';
import {
  listPairedRelayHosts,
  removePairedRelayHost,
  savePairedRelayHost,
} from '@/shared/lib/relayPairingStorage';
import { createRelayClientIdentity } from '@/shared/lib/relayClientIdentity';

export const RELAY_REMOTE_HOSTS_QUERY_KEY = [
  'relay',
  'remote',
  'hosts',
] as const;
export const RELAY_REMOTE_PAIRED_HOSTS_QUERY_KEY = [
  'relay',
  'remote',
  'paired-hosts',
] as const;
export const RELAY_APP_BAR_HOSTS_QUERY_KEY = ['relay-app-bar-hosts'] as const;

interface PairRelayHostInput {
  hostId: string;
  hostName: string;
  normalizedCode: string;
}

async function pairRelayHost({
  hostId,
  hostName,
  normalizedCode,
}: PairRelayHostInput): Promise<void> {
  const relaySession = await createRelaySession(hostId);
  const authCode = await createRelaySessionAuthCode(relaySession.id);

  const relaySessionBaseUrl = await establishRelaySessionBaseUrl(
    getRelayApiUrl(),
    hostId,
    authCode.code
  );

  const { state, clientMessageB64 } =
    await startSpake2Enrollment(normalizedCode);

  const startData = await startRelaySpake2Enrollment(relaySessionBaseUrl, {
    enrollment_code: normalizedCode,
    client_message_b64: clientMessageB64,
  });

  const sharedKey = await finishSpake2Enrollment(
    state,
    startData.server_message_b64
  );

  const { privateKeyJwk, publicKeyB64, publicKeyBytes } =
    await generateRelaySigningKeyPair();
  const clientProofB64 = await buildClientProofB64(
    sharedKey,
    startData.enrollment_id,
    publicKeyBytes
  );
  const relayClientIdentity = createRelayClientIdentity();

  const finishData = await finishRelaySpake2Enrollment(relaySessionBaseUrl, {
    enrollment_id: startData.enrollment_id,
    client_id: relayClientIdentity.clientId,
    client_name: relayClientIdentity.clientName,
    client_browser: relayClientIdentity.clientBrowser,
    client_os: relayClientIdentity.clientOs,
    client_device: relayClientIdentity.clientDevice,
    public_key_b64: publicKeyB64,
    client_proof_b64: clientProofB64,
  });

  const serverProofValid = await verifyServerProof(
    sharedKey,
    startData.enrollment_id,
    publicKeyBytes,
    finishData.server_public_key_b64,
    finishData.server_proof_b64
  );
  if (!serverProofValid) {
    throw new Error('Server proof verification failed.');
  }

  await savePairedRelayHost({
    host_id: hostId,
    host_name: hostName,
    client_id: relayClientIdentity.clientId,
    client_name: relayClientIdentity.clientName,
    signing_session_id: finishData.signing_session_id,
    public_key_b64: publicKeyB64,
    private_key_jwk: privateKeyJwk,
    server_public_key_b64: finishData.server_public_key_b64,
    paired_at: new Date().toISOString(),
  });
}

export function useRelayRemoteHostsQuery() {
  return {
    queryKey: RELAY_REMOTE_HOSTS_QUERY_KEY,
    queryFn: listRelayHosts,
  };
}

export function useRelayRemotePairedHostsQuery() {
  return {
    queryKey: RELAY_REMOTE_PAIRED_HOSTS_QUERY_KEY,
    queryFn: async () => {
      try {
        return await listPairedRelayHosts();
      } catch (error) {
        console.error('Failed to load paired hosts', error);
        return [];
      }
    },
  };
}

export function usePairRelayHostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pairRelayHost,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: RELAY_REMOTE_PAIRED_HOSTS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: RELAY_APP_BAR_HOSTS_QUERY_KEY,
        }),
      ]);
    },
  });
}

export function useRemovePairedRelayHostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removePairedRelayHost,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: RELAY_REMOTE_PAIRED_HOSTS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: RELAY_APP_BAR_HOSTS_QUERY_KEY,
        }),
      ]);
    },
  });
}
