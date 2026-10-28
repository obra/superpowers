# Mobile Security (React Native / Expo)

## No Secrets in the JavaScript Bundle

All API keys and secrets in the JavaScript bundle are extractable — even with Hermes bytecode compilation. The bundle is a file on the device that can be read, decompiled, and searched for strings.

- `react-native-config` values are baked into the bundle at build time. They are not secret.
- `EXPO_PUBLIC_` values are baked into the bundle at build time. They are not secret.
- Environment variables set via `eas.json` or `app.config.js` that end up in the JS bundle are not secret.

The only safe approach: **use a backend proxy** for all third-party API calls that require secret keys. The mobile app calls your server; your server calls the third-party API with the key.

```typescript
// BAD: API key in the mobile app
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
});

// GOOD: call your own backend, which holds the key
const response = await fetch('https://your-api.com/ai/chat', {
  headers: { 'Authorization': `Bearer ${userSessionToken}` },
  body: JSON.stringify({ message: userInput }),
});
```

## Secure Token Storage

- **Use `expo-secure-store`** (Expo) or **`react-native-keychain`** (bare React Native) for auth tokens.
- **Never use `AsyncStorage`** — it's unencrypted plaintext on disk. On a rooted/jailbroken device, tokens are trivially readable.

```typescript
// BAD: plaintext on disk
await AsyncStorage.setItem('authToken', token);

// GOOD: encrypted in device keychain
await SecureStore.setItemAsync('authToken', token);
```

## Deep Link Security

Deep links (`myapp://path?param=value`) can be triggered by any app or website. They are an attack surface:

- **Validate and sanitize all parameters.** Never trust deep link input.
- **Never include sensitive data in deep link URLs** (tokens, passwords, user IDs that grant access).
- **Don't perform destructive actions** directly from deep link parameters without user confirmation.

## Biometric Authentication

A simple boolean success check from biometric auth (`isAuthenticated = true`) can be hooked with tools like Frida on a jailbroken device. Proper biometric auth must use **cryptographic verification**:

1. Server sends a challenge (random nonce)
2. App signs the challenge with a hardware-backed key (Secure Enclave / Strongbox)
3. Server verifies the signature

This way, even if the biometric check is bypassed, the attacker can't forge the cryptographic signature.
