# Remote Sync Strategy

TD authoring uses a local-first workflow: update the local Markdown copy during the writing session, then sync to Lark / Confluence only at session end or on explicit developer instruction.

## Local Source of Truth

- Keep one local TD copy and one local Edit Log copy per TD.
- Default path comes from local config, e.g. `~/.config/technical-design/workspace/<slug>/td.md` and `edit-log.md`.
- Every edit updates local files first.
- Remote docs are publication targets, not the live editing buffer.
- Before syncing, compare local copy against the last synced snapshot or remote fetch to avoid overwriting remote-only changes.

## Sync Triggers

Sync remote only when:

- the writing session ends,
- the developer explicitly asks to sync/publish/update remote,
- a milestone section is approved and the developer asks to publish it.

Do not sync after every small local edit. This preserves remote comment stability and avoids noisy document history.

## Lark / Feishu

Recommended method:

- Fetch target sections with block IDs before syncing.
- Use `docs +update --api-version v2` with the smallest precise command: `str_replace`, `block_insert_after`, or `block_replace`.
- Prefer DocxXML for precise updates and styling.
- For change marking, wrap new/changed text in supported text color or background color styles when the doc owner wants visible version marks.
- Lark block patch APIs support rich text style attributes such as text color/background color. Existing comments may be moved within the same block version, but new comments are not created by the text patch itself; use comment tooling separately when available.

Comment preservation:

- Avoid `overwrite` for existing TDs because it risks losing anchors/comments.
- Avoid replacing large blocks that contain active comments.
- If a target block has comments and must change, prefer inserting a new colored/highlighted paragraph after it, then let the developer resolve/move comments.

## Confluence

Recommended method:

- Fetch page storage format and version before syncing.
- Apply minimal storage-format patches to sections rather than replacing the whole page.
- Bump page version only after local diff is reviewed.
- For change marking, use storage-format spans such as `<span style="color: rgb(54,179,126);">...</span>` or an agreed Confluence macro/status marker.

Comment preservation:

- Inline comments depend on `ac:inline-comment-marker` tags in storage format.
- Do not cut/paste or rewrite ranges containing inline comment markers unless you preserve the exact marker tags.
- If the target range contains inline comments, insert a new version-marked paragraph near the existing text instead of rewriting the marked range.

## Version Marking

Recommended config options:

- `none`: clean final TD, rely on Edit Log/version history.
- `color-by-session`: changed/new text in a configured color for the current session.
- `callout-by-session`: add a short “Changes in this session” callout at the top of synced sections.
- `edit-log-only`: no visible remote styling; all changes tracked in Edit Log.

Use visible color only when useful for review. Before final approval, ask whether to remove colors/highlights.

## Sync Checklist

1. Update local TD and local Edit Log.
2. Fetch remote TD/Edit Log sections if remote is configured.
3. Detect remote-only changes since last sync; ask before overwriting.
4. Apply minimal section/block updates.
5. Preserve or avoid comment anchors.
6. Re-fetch changed sections to verify.
7. Update local sync metadata: remote URL, remote version/block ids if available, last synced time, and change marking mode.
