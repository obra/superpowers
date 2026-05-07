# Document Platform Protocol

Use this protocol before reading, creating, or editing TD documents on Lark / Feishu, Confluence, or a fallback local/exported workflow.

## Local config

Before document operations, read `$TECHNICAL_DESIGN_CONFIG` if set; otherwise read `~/.config/technical-design/config.md`.

If the file does not exist or lacks required platform/default-location info, ask the user for:

- preferred doc platform,
- authentication method and credential reference for Lark / Feishu and/or Confluence,
- default TD save location,
- Edit Log location convention,
- comment support expectations.

Create the config from `local-config-template.md`. Prefer credential references over raw secrets.

## Preferred path: `lark-cli`

If `lark-cli` and the Lark document skills are available, use `docs` v2:

```bash
lark-cli docs +fetch  --api-version v2 --doc "<doc-url-or-token>"
lark-cli docs +create --api-version v2 --content "<title>...</title><p>...</p>"
lark-cli docs +update --api-version v2 --doc "<doc-url-or-token>" --command append --content "<p>...</p>"
```

Rules adapted from Lark `lark-doc` skill:

- `docs +create`, `docs +fetch`, and `docs +update` MUST include `--api-version v2`.
- Default to DocxXML for creation and precise edits. Markdown is OK when the user explicitly provides/imports Markdown.
- For existing docs, fetch before editing. Prefer partial fetches (outline/section/keyword) for large docs, then fetch exact sections before updates.
- For resource discovery, use `drive +search` when available, not deprecated `docs +search`.
- For comments/reactions, use Lark drive/comment tooling if available. If comment APIs are unavailable, insert an inline `待定` callout block and log it in Edit Log.

## Fallback path: no Lark tooling

Do not claim to have read or updated Feishu. Ask the engineer for one of:

- exported TD Markdown/XML plus Edit Log content,
- pasted relevant sections,
- permission to use browser automation after they log in,
- screenshots only for visual context, never as the only source for exact TD text.

When writing without direct Lark access, produce paste-ready Markdown/XML chunks and explicit insertion anchors.

## Confluence

Use Confluence only when configured or explicitly requested. Required config:

- base URL,
- space key,
- default parent page or save location,
- auth method / credential reference,
- whether inline comments are supported by the available tool/API.

If Confluence tooling is unavailable, do not claim direct reads/writes. Ask for exported/pasted page content, or provide paste-ready Markdown/storage-format content with insertion anchors.

## Required session reads

Before every edit/resume:

1. Fetch/read TD outline and relevant sections.
2. Fetch/read Edit Log.
3. Read PRD/TRD inputs or pasted requirements.
4. Read `td-template.md`, `be-development-guidelines.md`, `edit-log-template.md`, and local config.

## Update discipline

- Update smallest stable section, then verify by re-fetching the changed block/section.
- Never overwrite whole TD unless creating from local `td-template.md` or user explicitly asks.
- Keep Edit Log append-only except for correcting obvious formatting mistakes.
