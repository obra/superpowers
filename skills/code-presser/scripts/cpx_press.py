#!/usr/bin/env python3
"""
CPX1 seal/unseal — compress-then-encrypt source trees.

Usage:
  cpx_press.py seal --input DIR --output FILE [--split N]
  cpx_press.py seal --input DIR --output DIR --split N
  cpx_press.py unseal --input FILE --output DIR
  cpx_press.py unseal --input SHARD_DIR --output DIR
  cpx_press.py unpack ...   # alias for unseal

Passphrase is read from terminal only (getpass). Never pass on argv.
"""

from __future__ import annotations

import argparse
import getpass
import gzip
import io
import os
import secrets
import struct
import sys
import tarfile
from pathlib import Path

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.kdf.argon2 import Argon2id
except ImportError:
    print("Install: python3 -m pip install cryptography", file=sys.stderr)
    sys.exit(1)

HEADER_SIZE = 48  # salt(32) + nonce(12) + ct_len(4)
GCM_TAG_SIZE = 16
SHARD_HDR_SIZE = 2  # shard_index(1) + shard_total(1)
MAX_SHARDS = 255
EXCLUDE_DIRS = {
    ".git",
    "node_modules",
    "vendor",
    "dist",
    "mock",
    "__pycache__",
    ".cursor",
}
EXCLUDE_SUFFIXES = {".cpx", ".age"}


def _derive_key(passphrase: str, salt: bytes) -> bytes:
    kdf_kwargs: dict = {
        "salt": salt,
        "length": 32,
        "iterations": 3,
        "memory_cost": 65536,
    }
    try:
        kdf = Argon2id(**kdf_kwargs, parallelism=4)
    except TypeError:
        kdf = Argon2id(**kdf_kwargs, lanes=4)
    return kdf.derive(passphrase.encode("utf-8"))


def _should_skip(path: Path) -> bool:
    parts = set(path.parts)
    if parts & EXCLUDE_DIRS:
        return True
    if path.suffix.lower() in EXCLUDE_SUFFIXES:
        return True
    return False


def _tar_gzip(paths: list[Path]) -> bytes:
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w") as tar:
        for root in paths:
            root = root.resolve()
            if root.is_file():
                tar.add(root, arcname=root.name)
                continue
            for dirpath, dirnames, filenames in os.walk(root):
                dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
                for fn in filenames:
                    fp = Path(dirpath) / fn
                    if _should_skip(fp):
                        continue
                    arcname = fp.relative_to(root)
                    tar.add(fp, arcname=str(arcname))
    raw = buf.getvalue()
    return gzip.compress(raw, compresslevel=9)


def _prompt_passphrase(confirm: bool = False) -> str:
    passphrase = getpass.getpass("Passphrase: ")
    if confirm:
        again = getpass.getpass("Confirm: ")
        if passphrase != again:
            print("Passphrases do not match.", file=sys.stderr)
            sys.exit(1)
    if len(passphrase) < 12:
        print("Use at least 12 characters.", file=sys.stderr)
        sys.exit(1)
    return passphrase


def _build_container(plaintext: bytes, passphrase: str) -> bytes:
    salt = secrets.token_bytes(32)
    nonce = secrets.token_bytes(12)
    key = _derive_key(passphrase, salt)
    aes = AESGCM(key)
    ciphertext_with_tag = aes.encrypt(nonce, plaintext, None)
    ct_len = len(ciphertext_with_tag) - GCM_TAG_SIZE
    return salt + nonce + struct.pack(">I", ct_len) + ciphertext_with_tag


def _split_binary(data: bytes, n: int) -> list[bytes]:
    if n < 1 or n > MAX_SHARDS:
        raise ValueError(f"split must be 1..{MAX_SHARDS}")
    base, rem = divmod(len(data), n)
    chunks: list[bytes] = []
    offset = 0
    for i in range(n):
        size = base + (1 if i < rem else 0)
        chunks.append(data[offset : offset + size])
        offset += size
    return chunks


def _write_shards(chunks: list[bytes], out_dir: Path) -> list[Path]:
    n = len(chunks)
    out_dir.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    for i, chunk in enumerate(chunks):
        name = secrets.token_hex(16)
        path = out_dir / name
        with open(path, "wb") as f:
            f.write(bytes([i, n]))
            f.write(chunk)
        os.chmod(path, 0o600)
        paths.append(path)
    return paths


def _merge_shards(shard_dir: Path) -> bytes:
    if not shard_dir.is_dir():
        print(f"Not a directory: {shard_dir}", file=sys.stderr)
        sys.exit(1)

    shards: dict[int, tuple[int, bytes]] = {}
    for fp in sorted(shard_dir.iterdir()):
        if not fp.is_file():
            continue
        raw = fp.read_bytes()
        if len(raw) < SHARD_HDR_SIZE:
            continue
        idx, total = raw[0], raw[1]
        if total < 1 or total > MAX_SHARDS or idx >= total:
            print(f"Invalid shard header in {fp.name}", file=sys.stderr)
            sys.exit(1)
        if idx in shards:
            print(f"Duplicate shard index {idx} ({fp.name})", file=sys.stderr)
            sys.exit(1)
        shards[idx] = (total, raw[SHARD_HDR_SIZE:])

    if not shards:
        print(f"No shard files in {shard_dir}", file=sys.stderr)
        sys.exit(1)

    expected_total = next(iter(shards.values()))[0]
    for idx, (total, _) in shards.items():
        if total != expected_total:
            print(f"Shard count mismatch at index {idx}", file=sys.stderr)
            sys.exit(1)

    missing = [i for i in range(expected_total) if i not in shards]
    if missing:
        print(f"Missing shard indices: {missing}", file=sys.stderr)
        sys.exit(1)

    return b"".join(shards[i][1] for i in range(expected_total))


def _decrypt_container(data: bytes, passphrase: str) -> bytes:
    if len(data) < HEADER_SIZE + GCM_TAG_SIZE:
        print("Invalid container: too short.", file=sys.stderr)
        sys.exit(1)

    salt = data[:32]
    nonce = data[32:44]
    ct_len = struct.unpack(">I", data[44:48])[0]
    blob = data[48:]
    if len(blob) != ct_len + GCM_TAG_SIZE:
        print("Invalid container: length mismatch.", file=sys.stderr)
        sys.exit(1)

    key = _derive_key(passphrase, salt)
    aes = AESGCM(key)
    try:
        return aes.decrypt(nonce, blob, None)
    except Exception:
        print("Decryption failed (wrong passphrase or corrupted data).", file=sys.stderr)
        sys.exit(1)


def _extract_tar_gzip(plaintext: bytes, output_dir: Path) -> None:
    try:
        tar_bytes = gzip.decompress(plaintext)
    except OSError:
        print("Decompression failed.", file=sys.stderr)
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)
    with tarfile.open(fileobj=io.BytesIO(tar_bytes), mode="r") as tar:
        if hasattr(tarfile, "data_filter"):
            tar.extractall(path=output_dir, filter="data")
        else:
            for member in tar.getmembers():
                if member.name.startswith("/") or ".." in Path(member.name).parts:
                    raise tarfile.TarError(f"unsafe path: {member.name}")
            tar.extractall(path=output_dir)


def seal(input_paths: list[Path], output: Path, split: int) -> None:
    passphrase = _prompt_passphrase(confirm=True)

    plaintext = _tar_gzip(input_paths)
    container = _build_container(plaintext, passphrase)

    if split == 1:
        if output.exists() and output.is_dir():
            print("--output must be a file when --split 1", file=sys.stderr)
            sys.exit(1)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(container)
        os.chmod(output, 0o600)
        print(
            f"Sealed {len(plaintext)} bytes -> {output} "
            f"({output.stat().st_size} bytes, 1 shard)"
        )
        return

    if output.exists() and output.is_file():
        print("--output must be a directory when --split > 1", file=sys.stderr)
        sys.exit(1)

    chunks = _split_binary(container, split)
    paths = _write_shards(chunks, output)
    print(
        f"Sealed {len(plaintext)} bytes -> {split} shards in {output} "
        f"(container {len(container)} bytes)"
    )
    for p in paths:
        print(f"  {p.name} ({p.stat().st_size} bytes)")


def unseal(input_path: Path, output_dir: Path) -> None:
    passphrase = _prompt_passphrase(confirm=False)

    if input_path.is_dir():
        container = _merge_shards(input_path)
        print(f"Merged {len(container)} bytes from shards in {input_path}")
    else:
        container = input_path.read_bytes()

    plaintext = _decrypt_container(container, passphrase)
    _extract_tar_gzip(plaintext, output_dir)
    print(f"Restored to {output_dir}")


def main() -> None:
    parser = argparse.ArgumentParser(description="CPX1 seal/unseal")
    sub = parser.add_subparsers(dest="cmd", required=True)

    for name in ("seal",):
        p = sub.add_parser(name)
        p.add_argument("--input", required=True, help="File or directory to seal")
        p.add_argument(
            "--output",
            required=True,
            help="Output file (--split 1) or directory (--split N)",
        )
        p.add_argument(
            "--split",
            type=int,
            default=1,
            metavar="N",
            help=f"Binary shard count after encrypt (1..{MAX_SHARDS}, default 1)",
        )

    for name in ("unseal", "unpack"):
        p = sub.add_parser(name, help="Restore sealed source (unpack = unseal)")
        p.add_argument(
            "--input",
            required=True,
            help="Single CPX1 blob or directory containing all shards",
        )
        p.add_argument("--output", required=True, help="Directory to restore into")

    args = parser.parse_args()

    if args.cmd == "seal":
        if args.split < 1 or args.split > MAX_SHARDS:
            print(f"--split must be 1..{MAX_SHARDS}", file=sys.stderr)
            sys.exit(1)
        inp = Path(args.input)
        if not inp.exists():
            print(f"Not found: {inp}", file=sys.stderr)
            sys.exit(1)
        seal([inp], Path(args.output), args.split)
    elif args.cmd in ("unseal", "unpack"):
        unseal(Path(args.input), Path(args.output))


if __name__ == "__main__":
    main()
