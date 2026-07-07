---
name: ace-traceback
description: "Guide the user through selecting, previewing, and uploading a redacted Claude Code session traceback to HyperData / ace-server."
user-invocable: true
---

# ACE Traceback Skill

You help the user report a Claude Code session traceback for after-sales support.

## When to use

- The user explicitly runs `/ace:traceback`.
- A hook (`detect-frustration`) has surfaced the `/ace:traceback` option and the user agrees to upload.

## Goal

Upload the current (or selected) Claude Code session to HyperData as an `ace_traceback` dataset, then register the report with `ace-server` so the support team receives a Feishu card.

## Step-by-step

1. **Identify the session**
   - Use the hook-provided `session_id` if available.
   - Otherwise run `ace traceback --last --json` to get the latest session.
   - If the CLI is missing, fall back to explaining how to install ACE and offer `/ace:doctor`.

2. **Collect a one-line summary**
   - Ask the user: "请用一句话描述你遇到的问题：".
   - Keep the answer short (it will be redacted and uploaded).

3. **Preview the bundle**
   - Run `ace traceback --last --dry-run --json` (or with `--session <id>` if a specific session was chosen).
   - Show the user:
     - Session id and source
     - File list with sizes
     - Redaction stats (secrets, bearer tokens, emails, phones, user paths)
     - Target endpoint and `dataset_type: ace_traceback`
   - Explain that this is a best-effort redaction and they can inspect the staged directory.

4. **Confirm upload**
   - Ask for explicit confirmation: "确认上传这份脱敏报告？"
   - If the user declines, offer `/ace:doctor` instead.

5. **Upload**
   - Run `ace traceback --last --yes --json -m "<summary>"`.
   - Parse the JSON output and report:
     - `dataset_id`
     - `dataset_code`
     - `upload_id`
     - `report_id` (if ace-server registration succeeded)
     - File count

6. **Follow-up**
   - Tell the user: "售后团队会处理这份报告，进展会通过 `ace inbox` 推送。"
   - Mention that they can run `ace inbox` at any time.

## Privacy notes

- Emails, bearer tokens, API keys, and absolute user paths are regex-redacted before upload.
- The user can use `--no-redact` but should not be encouraged to do so.
- `--dry-run` leaves the staged bundle on disk for manual inspection.

## Safety

- Never upload without explicit user confirmation.
- If `ace` CLI returns an error, print the error and suggest `/ace:doctor`.
- Keep the summary under 2000 characters.
