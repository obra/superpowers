# Lark / Feishu Document Protocol

Use this protocol before reading, creating, or editing Feishu TD documents.

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

## Required session reads

Before every edit/resume:

1. Fetch/read TD outline and relevant sections.
2. Fetch/read Edit Log.
3. Read PRD/TRD inputs or pasted requirements.
4. Read `td-template.md`, `be-development-guidelines.md`, and `edit-log-template.md` from this skill.

## Update discipline

- Update smallest stable section, then verify by re-fetching the changed block/section.
- Never overwrite whole TD unless creating from template or user explicitly asks.
- Keep Edit Log append-only except for correcting obvious formatting mistakes.
