# CPX1 Container Format (seal mode)

Opaque binary container for **compress-then-encrypt** payloads. Designed so casual inspection and naive agent tricks (rename, strip fixed ASCII header) do not yield plaintext.

## Layout

All integers big-endian.

```text
+--------+--------+----------+----------------------------------+
| salt   | nonce  | ct_len   | ciphertext || gcm_tag (16)     |
| 32 B   | 12 B   | 4 B      | ct_len bytes + 16 B tag        |
+--------+--------+----------+----------------------------------+
Total header: 48 bytes (high entropy except ct_len encodes size)
```

| Field | Size | Description |
|-------|------|-------------|
| `salt` | 32 | Random; used in Argon2id |
| `nonce` | 12 | Random; AES-GCM nonce |
| `ct_len` | 4 | Length of ciphertext **excluding** 16-byte GCM tag |
| `ciphertext` | `ct_len` | AES-256-GCM encrypted plaintext |
| `gcm_tag` | 16 | Authentication tag |

Plaintext inside GCM = `gzip(tar(source_tree))`.

## Key Derivation

- Algorithm: Argon2id
- Parameters: `time_cost=3`, `memory_cost=65536` (64 MiB), `parallelism=4`, `hash_len=32`
- Password: user passphrase from terminal (UTF-8)
- Salt: file `salt` field

## Security Notes

- **No magic bytes** at file start — `salt` and `nonce` look random
- Stripping first 48 bytes **always fails** GCM verification
- Filename and extension carry **no** format signal
- Security depends on passphrase entropy and Argon2id/AES-GCM (standard crypto), not obscurity

## Sharding (`--split N`, N > 1)

Pipeline:

```text
source → tar → gzip → AES-256-GCM (CPX1 container) → binary split into N shards
```

Each shard file:

```text
+-------------+-------------+---------------------------+
| shard_index | shard_total | payload (binary chunk)    |
| 1 B (0..N-1)| 1 B (= N)   | variable                  |
+-------------+-------------+---------------------------+
```

- **shard_index**: 0-based sequence number
- **shard_total**: total shard count (same value in every file)
- **payload**: consecutive slice of the full CPX1 container (salt through GCM tag)

Shards are written as random 32-hex filenames with no extension. Payloads are equal-sized ±1 byte.

**Unseal / unpack:** read every file in the shard directory, parse headers, verify indices `0..N-1` present, concatenate payloads in order, then decrypt and extract tar as single-blob unseal.

## Versioning

First implementation = CPX1. Future versions may change Argon2 params; embed version in encrypted tar metadata, not in clear header.
