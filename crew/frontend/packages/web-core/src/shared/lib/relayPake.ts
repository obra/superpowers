import { ed25519 } from '@noble/curves/ed25519';

const ENCODER = new TextEncoder();

const SPAKE2_CLIENT_ID = ENCODER.encode('vibe-kanban-browser');
const SPAKE2_SERVER_ID = ENCODER.encode('vibe-kanban-server');

const KEY_CONFIRMATION_INFO = ENCODER.encode('key-confirmation');
const CLIENT_PROOF_CONTEXT = ENCODER.encode('vk-spake2-client-proof-v2');
const SERVER_PROOF_CONTEXT = ENCODER.encode('vk-spake2-server-proof-v2');

const SPAKE2_PASSWORD_INFO = ENCODER.encode('SPAKE2 pw');
const ENROLLMENT_CODE_LENGTH = 6;

// Ed25519 subgroup order (same value used in curve25519-dalek).
const CURVE_ORDER =
  7237005577332262213973186563042994240857116359379907606001950938285454250989n;

const SPAKE2_M = ed25519.ExtendedPoint.fromHex(
  '15cfd18e385952982b6a8f8c7854963b58e34388c8e6dae891db756481a02312'
);
const SPAKE2_N = ed25519.ExtendedPoint.fromHex(
  'f04f2e7eb734b2a8f8b472eaf9c3c632576ac64aea650b496a8a20ff00e583c3'
);

export interface Spake2EnrollmentClientState {
  passwordBytes: Uint8Array;
  passwordScalar: bigint;
  xScalar: bigint;
  clientMessageBytes: Uint8Array;
}

export function normalizeEnrollmentCode(rawCode: string): string {
  return rawCode
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export async function startSpake2Enrollment(
  rawEnrollmentCode: string
): Promise<{ state: Spake2EnrollmentClientState; clientMessageB64: string }> {
  const enrollmentCode = normalizeEnrollmentCode(rawEnrollmentCode);
  if (enrollmentCode.length !== ENROLLMENT_CODE_LENGTH) {
    throw new Error('Enrollment code must be 6 characters.');
  }

  const passwordBytes = ENCODER.encode(enrollmentCode);
  const passwordScalar = await hashToSpake2Scalar(passwordBytes);
  const xScalar = randomScalar();

  const clientPoint = ed25519.ExtendedPoint.BASE.multiply(xScalar).add(
    SPAKE2_M.multiply(passwordScalar)
  );
  const clientPointBytes = clientPoint.toRawBytes();

  const clientMessage = new Uint8Array(1 + clientPointBytes.length);
  clientMessage[0] = 0x41; // 'A'
  clientMessage.set(clientPointBytes, 1);

  return {
    state: {
      passwordBytes,
      passwordScalar,
      xScalar,
      clientMessageBytes: clientPointBytes,
    },
    clientMessageB64: bytesToBase64(clientMessage),
  };
}

export async function finishSpake2Enrollment(
  state: Spake2EnrollmentClientState,
  serverMessageB64: string
): Promise<Uint8Array> {
  const serverMessage = base64ToBytes(serverMessageB64);
  if (serverMessage.length !== 33) {
    throw new Error('Server message has invalid length.');
  }
  if (serverMessage[0] !== 0x42) {
    throw new Error('Server message has invalid side identifier.');
  }

  const serverPointBytes = serverMessage.slice(1);
  const serverPoint = ed25519.ExtendedPoint.fromHex(serverPointBytes);
  const negativePasswordScalar =
    (CURVE_ORDER - state.passwordScalar) % CURVE_ORDER;

  const keyPoint = serverPoint
    .add(SPAKE2_N.multiply(negativePasswordScalar))
    .multiply(state.xScalar);
  const keyPointBytes = keyPoint.toRawBytes();

  return hashAb(
    state.passwordBytes,
    SPAKE2_CLIENT_ID,
    SPAKE2_SERVER_ID,
    state.clientMessageBytes,
    serverPointBytes,
    keyPointBytes
  );
}

export async function generateRelaySigningKeyPair(): Promise<{
  privateKeyJwk: JsonWebKey;
  publicKeyBytes: Uint8Array;
  publicKeyB64: string;
}> {
  const keyPair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair;

  const [privateKeyJwk, publicKeyRaw] = await Promise.all([
    crypto.subtle.exportKey('jwk', keyPair.privateKey),
    crypto.subtle.exportKey('raw', keyPair.publicKey),
  ]);

  const publicKeyBytes = new Uint8Array(publicKeyRaw);
  return {
    privateKeyJwk,
    publicKeyBytes,
    publicKeyB64: bytesToBase64(publicKeyBytes),
  };
}

export async function buildClientProofB64(
  sharedKey: Uint8Array,
  enrollmentId: string,
  browserPublicKeyBytes: Uint8Array
): Promise<string> {
  const confirmationKey = await deriveConfirmationKey(sharedKey);
  const enrollmentIdBytes = uuidToBytes(enrollmentId);
  const payload = concatBytes(
    CLIENT_PROOF_CONTEXT,
    enrollmentIdBytes,
    browserPublicKeyBytes
  );
  const proof = await hmacSha256(confirmationKey, payload);
  return bytesToBase64(proof);
}

export async function verifyServerProof(
  sharedKey: Uint8Array,
  enrollmentId: string,
  browserPublicKeyBytes: Uint8Array,
  serverPublicKeyB64: string,
  serverProofB64: string
): Promise<boolean> {
  const confirmationKey = await deriveConfirmationKey(sharedKey);
  const enrollmentIdBytes = uuidToBytes(enrollmentId);
  const serverPublicKeyBytes = base64ToBytes(serverPublicKeyB64);

  const payload = concatBytes(
    SERVER_PROOF_CONTEXT,
    enrollmentIdBytes,
    browserPublicKeyBytes,
    serverPublicKeyBytes
  );
  const expectedProof = await hmacSha256(confirmationKey, payload);
  const actualProof = base64ToBytes(serverProofB64);

  return constantTimeEqual(expectedProof, actualProof);
}

async function hashAb(
  passwordBytes: Uint8Array,
  idA: Uint8Array,
  idB: Uint8Array,
  firstMessage: Uint8Array,
  secondMessage: Uint8Array,
  keyBytes: Uint8Array
): Promise<Uint8Array> {
  const transcript = new Uint8Array(6 * 32);

  transcript.set(await sha256(passwordBytes), 0);
  transcript.set(await sha256(idA), 32);
  transcript.set(await sha256(idB), 64);
  transcript.set(firstMessage, 96);
  transcript.set(secondMessage, 128);
  transcript.set(keyBytes, 160);

  return sha256(transcript);
}

async function hashToSpake2Scalar(passwordBytes: Uint8Array): Promise<bigint> {
  const okm = await hkdfSha256(
    passwordBytes,
    new Uint8Array(0),
    SPAKE2_PASSWORD_INFO,
    48
  );

  const reducible = new Uint8Array(64);
  for (let i = 0; i < okm.length; i += 1) {
    reducible[okm.length - 1 - i] = okm[i];
  }

  return bytesToBigIntLE(reducible) % CURVE_ORDER;
}

function randomScalar(): bigint {
  const randomBytes = new Uint8Array(64);
  crypto.getRandomValues(randomBytes);
  return bytesToBigIntLE(randomBytes) % CURVE_ORDER;
}

async function deriveConfirmationKey(
  sharedKey: Uint8Array
): Promise<Uint8Array> {
  return hkdfSha256(sharedKey, new Uint8Array(0), KEY_CONFIRMATION_INFO, 32);
}

async function hkdfSha256(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(ikm),
    'HKDF',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      info: toArrayBuffer(info),
    },
    key,
    length * 8
  );
  return new Uint8Array(derivedBits);
}

async function hmacSha256(
  keyBytes: Uint8Array,
  data: Uint8Array
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(keyBytes),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, toArrayBuffer(data));
  return new Uint8Array(signature);
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', toArrayBuffer(data));
  return new Uint8Array(digest);
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return new Uint8Array(data).buffer;
}

function uuidToBytes(rawUuid: string): Uint8Array {
  const hex = rawUuid.replace(/-/g, '');
  if (hex.length !== 32) {
    throw new Error('Invalid enrollment ID.');
  }

  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i += 1) {
    const value = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(value)) {
      throw new Error('Invalid enrollment ID.');
    }
    bytes[i] = value;
  }

  return bytes;
}

function bytesToBigIntLE(bytes: Uint8Array): bigint {
  let value = 0n;
  for (let i = bytes.length - 1; i >= 0; i -= 1) {
    value = (value << 8n) + BigInt(bytes[i]);
  }
  return value;
}

function concatBytes(...chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a[i] ^ b[i];
  }
  return mismatch === 0;
}

function bytesToBase64(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
