<!-- created by riso-tech -->
# Product Roadmap (shared reference)

A per-project roadmap that gives humans a comprehensive view of the product and
its progress. `brainstorming` adds a feature when its spec is written;
`finishing-a-development-branch` marks it done when the work is integrated.

Both skills read/write the same two files in the working project:

```
docs/superpowers/
  roadmap.json    # source of truth (LLM reads/writes — precise edits)
  ROADMAP.html    # rendered view for humans (regenerated from roadmap.json)
```

## roadmap.json schema

An array of entries, keyed by `slug`:

```json
[
  {
    "slug": "user-auth",
    "title": "User authentication",
    "status": "planned",
    "spec": "specs/2026-06-26-user-auth-design.md",
    "plan": null,
    "created": "2026-06-26",
    "completed": null
  }
]
```

- `slug` — stable key. Use `<topic>` from the spec filename
  `YYYY-MM-DD-<topic>-design.md` (strip the date prefix and the `-design` suffix).
- `status` — `"planned"` or `"done"`.
- `spec` / `plan` — paths relative to `docs/superpowers/` (or `null` if none yet).
- `created` / `completed` — `YYYY-MM-DD` (use today's date). `completed` is `null`
  until done.

## Update rules (idempotent by slug)

1. Read `roadmap.json` if it exists, else start from `[]`.
2. Find the entry whose `slug` matches. If found, **update** it; never append a
   duplicate. If not found, **append** a new entry.
3. Write `roadmap.json` back (2-space indent, entries in file order — newest
   appended last).
4. Regenerate `ROADMAP.html` from the full `roadmap.json` using the template below.
5. Commit both files alongside the spec/plan or the integration commit.

When you can't determine the slug (e.g. at finish time with no spec in context),
ask the user which feature this work corresponds to rather than guessing.

## ROADMAP.html template

Self-contained — inline CSS, data embedded directly so it opens by double-click
(no server, no external assets). Render one `<tr>` per entry, **planned rows
first, then done**. Make `spec`/`plan` cells links to the relative path (show "—"
when `null`). Status cell is a badge: `planned` → amber, `done` → green.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Product Roadmap</title>
<style>
  body { font: 15px/1.5 system-ui, sans-serif; margin: 2rem auto; max-width: 960px; color: #1a1a1a; }
  h1 { margin: 0 0 .25rem; }
  .meta { color: #666; margin-bottom: 1.5rem; }
  table { border-collapse: collapse; width: 100%; }
  th, td { text-align: left; padding: .5rem .75rem; border-bottom: 1px solid #eee; }
  th { font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; color: #888; }
  .badge { display: inline-block; padding: .1rem .55rem; border-radius: 999px; font-size: .8rem; font-weight: 600; }
  .planned { background: #fef3c7; color: #92400e; }
  .done { background: #d1fae5; color: #065f46; }
  a { color: #2563eb; text-decoration: none; }
  a:hover { text-decoration: underline; }
  footer { margin-top: 2rem; color: #aaa; font-size: .8rem; }
</style>
</head>
<body>
  <h1>Product Roadmap</h1>
  <div class="meta">Generated from <code>roadmap.json</code></div>
  <table>
    <thead>
      <tr><th>Feature</th><th>Status</th><th>Spec</th><th>Plan</th><th>Created</th><th>Completed</th></tr>
    </thead>
    <tbody>
      <!-- one row per entry, planned first then done -->
      <tr>
        <td>User authentication</td>
        <td><span class="badge planned">planned</span></td>
        <td><a href="specs/2026-06-26-user-auth-design.md">spec</a></td>
        <td>—</td>
        <td>2026-06-26</td>
        <td>—</td>
      </tr>
    </tbody>
  </table>
  <footer>created by riso-tech</footer>
</body>
</html>
```
<!-- end created by riso-tech -->
