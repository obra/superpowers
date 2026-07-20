---
name: ace-traceback
description: "Guide the user through selecting, previewing, and uploading a redacted Claude Code, Cursor, or Codex App Local session traceback to HyperData / ace-server."
user-invocable: true
---

# ACE Traceback Skill

You help the user report a Claude Code, Cursor, or Codex App Local session traceback for after-sales support.

## When to use

- The user explicitly runs `/ace-traceback` in Claude Code, Cursor, or Codex App Local.
- A hook (`detect-frustration`) has surfaced the `/ace-traceback` option and the user agrees to upload.

## Goal

Upload the current (or selected) Claude Code, Cursor, or Codex App Local session to HyperData as an `ace_traceback` dataset, then register the report with `ace-server` so the support team receives a Feishu card.

## Runtime detection

Determine which runtime you are in before choosing CLI flags:

- **Cursor** — the host explicitly identifies itself as Cursor, or `CURSOR_AGENT=1`.
- **Claude Code** — the host explicitly identifies itself as Claude Code.
- **Codex App Local** — the host explicitly identifies itself as a local Codex App thread and exposes the current tool-call Hook metadata.

If the signals conflict or no runtime is explicit, ask the user which environment they are reporting from. Do not guess.
If the current local session cannot be obtained and verified, **stop** and do not fall back.

## Step-by-step

1. **Identify the session**

   **Cursor (required path)**
   - Before starting, run `ace traceback --help` and verify that its output contains `--cursor-current`.
   - If `--cursor-current` is absent, **stop** and tell the user to upgrade ACE. This is a version mismatch; do **not** fall back to another session selection strategy.
   - Always use `ace traceback --cursor-current`.
   - Do **not** use `--last`, `--session`, scan transcript directories, or pick the newest file.
   - A Cursor `preToolUse` hook injects `ACE_CURSOR_CONVERSATION_ID` and `ACE_CURSOR_TRANSCRIPT_PATH` for a direct invocation with `--cursor-current` immediately after `traceback`; use the canonical commands below.
   - If the CLI or hook reports missing/invalid metadata (e.g. conversation_id, transcript_path, command parse failure, hook denial), **stop immediately**. Explain the error to the user and suggest `/ace:doctor`. Do **not** fall back to `--last`, scan for the latest transcript, or auto-guess a session.

   **Codex App Local (required path)**
   - Before starting, run `ace traceback --help` and verify that its output contains `--codex-current`.
   - If `--codex-current` is absent, **stop** and tell the user to upgrade ACE. This is a version mismatch; do **not** fall back to another session selection strategy.
   - The user starts this workflow with `/ace-traceback` in Codex App Local. Run the commands below internally; do not ask the user to open a terminal or manually run `ace traceback`.
   - Always use `ace traceback --codex-current`.
   - Do **not** use `--last`, `--session`, scan `$CODEX_HOME`, or pick the newest file.
   - A Codex `PreToolUse` hook injects `ACE_CODEX_SESSION_ID` and `ACE_CODEX_TRANSCRIPT_PATH` for a direct invocation with `--codex-current` immediately after `traceback`; use the canonical commands below.
   - If the CLI or hook reports missing/invalid metadata (e.g. session_id, transcript_path, command parse failure, hook denial), **stop immediately**. Explain the error to the user and suggest `/ace:doctor`. Do **not** fall back to `--last`, scan for the latest transcript, or auto-guess a session.
   - The injected transcript must remain inside the lexical and resolved `$CODEX_HOME` boundary, match `session_meta.payload.id`, identify a top-level thread, and be classified as App Local. Never bypass these checks.

   **Claude Code**
   - If the hook provides a `session_id`, capture it and use `--session <id>` for every preview and the upload.
   - If no hook `session_id` is available, do not select with `--last` yet. The first preview below will use `--last` once and capture its returned `session_id`.
   - Once a session id has been captured, never use `--last` again for this report.

   **All runtimes**
   - If the `ace` CLI is missing, fall back to explaining how to install ACE and offer `/ace:doctor`.

2. **Collect a one-line summary**
   - Ask the user: "请用一句话描述你遇到的问题：".
   - Keep the answer short (it will be redacted and uploaded).
   - Keep the summary under 2000 characters.
   - Safely pass the exact same summary to every dry-run and upload. Use a tool's structured argument passing when available; otherwise apply `shlex.quote` (or an equivalent shell-safe quoting function) and substitute the resulting single shell word for `<shell-quoted-summary>`.
   - Never build a shell command by directly concatenating or interpolating the raw summary.

3. **Preview the bundle**

   **Cursor**
   - Run `ace traceback --cursor-current --dry-run --json -m <shell-quoted-summary>`.
   - Save the returned `session_id` and `source` for upload verification. Pass the preview `session_id` later using structured argument passing when available; otherwise apply `shlex.quote` (or an equivalent shell-safe quoting function) and use the resulting single shell word as `<shell-quoted-preview-session-id>`.

   **Codex App Local**
   - Run `ace traceback --codex-current --dry-run --json -m <shell-quoted-summary>`.
   - Require `source="codex"` and `runtime="codex_app_local"`. Save the returned `session_id`, `source`, and `runtime` for upload verification. Pass the preview `session_id` later using structured argument passing when available; otherwise apply `shlex.quote` (or an equivalent shell-safe quoting function) and use the resulting single shell word as `<shell-quoted-preview-session-id>`.

   **Claude Code**
   - With a hook-provided session id, run `ace traceback --session <id> --dry-run --json -m <shell-quoted-summary>`.
   - Without a hook-provided session id, run `ace traceback --last --dry-run --json -m <shell-quoted-summary>` exactly once and capture the returned `session_id`.
   - Any subsequent preview or retry must use `ace traceback --session <captured-id> --dry-run --json -m <shell-quoted-summary>`. Never run `--last` a second time.

   **All runtimes — show the user**
   - Session id and source
   - File list with sizes
   - Estimated redaction stats (secrets, bearer tokens, emails, phones, user paths)
   - Target endpoint and `dataset_type: ace_traceback`
   - Explain that dry-run leaves the original source bundle for content inspection. It can contain sensitive source content.
   - Explain that the redaction stats are estimates. The upload command creates and redacts a separate temporary copy, so the dry-run source bundle is not the final byte-for-byte upload payload.

4. **Confirm upload**
   - Ask for explicit confirmation: "确认上传这份脱敏报告？"
   - If the user declines, offer `/ace:doctor` instead.

5. **Upload**

   **Cursor**
   - Run `ace traceback --cursor-current --expected-session-id <shell-quoted-preview-session-id> --yes --json -m <shell-quoted-summary>`.
   - Keep `--cursor-current` immediately after `traceback` so the hook recognizes the direct invocation.

   **Codex App Local**
   - Run `ace traceback --codex-current --expected-session-id <shell-quoted-preview-session-id> --yes --json -m <shell-quoted-summary>`.
   - Keep `--codex-current` immediately after `traceback` so the hook recognizes the direct invocation.

   **Claude Code**
   - Run `ace traceback --session <captured-id> --yes --json -m <shell-quoted-summary>`.
   - Use the exact session id captured before confirmation; never use `--last` for upload.

   **All runtimes**
   - Reuse the exact summary and safe shell argument produced for preview. Never directly concatenate the raw summary into the command.
   - If upload fails because the current session changed, **stop**. Run a new preview, show the new preview to the user, and obtain a new explicit confirmation before retrying upload. Never reuse confirmation from the previous preview.

   **Parse the JSON output and report**
   - `session_id`
   - `source`
   - `runtime` (Codex App Local must be `codex_app_local`)
   - `dataset_id`
   - `dataset_code`
   - `upload_id`
   - `report_id` (if ace-server registration succeeded)
   - File count
   - Verify the upload `session_id`, `source`, and, when present, `runtime` match the preview. If any differs, report the mismatch as an error and stop.

6. **Follow-up**
   - Tell the user: "售后团队会处理这份报告，进展会通过 `ace inbox` 推送。"
   - Mention that they can run `ace inbox` at any time.

## Privacy notes

- Emails, bearer tokens, API keys, and absolute user paths are regex-redacted before upload.
- The user can use `--no-redact` but should not be encouraged to do so.
- `--dry-run` leaves the original source bundle on disk for manual content inspection; it is not the final uploaded byte sequence.
- Formal upload creates a separate temporary copy and applies best-effort redaction to that copy.

## Safety

- Never upload without explicit user confirmation after preview.
- **Cursor:** if `--cursor-current` capability is unavailable, hook metadata is missing, session pinning fails, or validation fails, stop — do not substitute another session selection strategy. A changed current session requires a new preview and new confirmation.
- **Codex App Local:** if `--codex-current` capability is unavailable, Hook metadata is missing, `$CODEX_HOME` validation fails, `runtime` is not `codex_app_local`, or session pinning fails, stop — do not substitute another session selection strategy. A changed current session requires a new preview and new confirmation.
- **Claude Code:** pin one captured session id across preview and upload; after capture, never re-resolve with `--last`.
- Pass summaries and session ids as structured arguments when available or as safely quoted shell arguments; never concatenate untrusted values into a command.
- If `ace` CLI returns an error, print the error and suggest `/ace:doctor`.
- Keep the summary under 2000 characters.
