---
name: feishu-cli
description: Operate Feishu (Lark) via CLI — messages, docs, sheets, calendar, email, meetings, tasks, knowledge base, and more. Use when the user needs to interact with Feishu or Lark.
---

# Feishu (Lark) CLI Integration

Operate Feishu via command line. Read messages, create documents, manage calendar, send emails, search knowledge base, and more — directly from the agent session.

## When to Use

- The user mentions Feishu, Lark, 飞书, or any Feishu-related task
- Creating/editing Feishu documents, spreadsheets, or slides
- Scheduling meetings or checking calendar in Feishu
- Sending messages to Feishu groups or individuals
- Searching knowledge base or documents
- Managing tasks, emails, or approvals
- Any workflow that involves Feishu as a communication/collaboration tool

## When NOT to Use

- When the user explicitly says they do not use Feishu/Lark
- When operating other platforms (WeChat, Slack, Teams, DingTalk) — use their respective tools

## Prerequisites

- Node.js with npm/npx
- Feishu CLI installed (`lark-cli` command available)
- Authenticated with `lark-cli auth login`

## Quick Reference

| Command | Purpose |
|---------|---------|
| `lark-cli help` | List all commands |
| `lark-cli auth status` | Check login status |
| `lark-cli auth login` | Login (user auth) |
| `lark-cli config init --new` | Configure app credentials |

## Installation

If `lark-cli` is not available, install it:

```bash
# Install CLI globally
npm install -g @larksuite/cli

# Install Feishu SKILL for AI agent
npx -y skills add https://open.feishu.cn --skill -y
```

After installation, configure credentials:

```bash
# Step 1: Initialize app config (creates new app or uses existing)
lark-cli config init --new
# → User scans QR code or opens URL to authorize

# Step 2: Login with user identity
lark-cli auth login --recommend
# → Extract auth URL and send to user

# Step 3: Verify
lark-cli auth status
```

## Core Capabilities

### Messaging & Groups
- Search messages and group chats
- Send messages, reply to threads
- Manage members and emoji reactions
- Send images, files, audio, video

### Documents (云文档)
- Create documents, read content, update body
- Insert images and attachments
- Search documents
- Convert Markdown to Feishu document and vice versa
- Add comments and replies

### Spreadsheets (电子表格)
- Create spreadsheets, read/write cells
- Batch append, find/replace, filter views
- Add floating images, merge/split cells

### Bitable (多维表格)
- Manage tables, fields, records, views
- Forms and dashboards
- Automation and permission roles
- Batch upload/download attachments (up to 50 files, 2GB each)

### Calendar
- Check schedules, create single or recurring meetings
- Resolve shared event links through the user's primary calendar
- Invite users, groups, and meeting rooms
- Check availability, recommend times
- Reply to invitations

#### Creating recurring meetings (verified workflow)

Always use the `calendar +create` shortcut with `--attendee-ids`; the lower-level `calendar events create --data` silently drops attendees.

```bash
lark-cli calendar +create --as user \
  --summary "paper 摘要" \
  --description "" \
  --start "2026-07-10T18:00:00+09:00" \
  --end "2026-07-10T19:30:00+09:00" \
  --rrule "FREQ=WEEKLY;INTERVAL=2;BYDAY=FR;COUNT=7" \
  --attendee-ids "ou_xxxxxxxxxxxxx,oc_xxxxxxxxxxxxx" \
  --format json
```

Common RRULE patterns:
- Every 2 weeks on Friday, 7 times: `FREQ=WEEKLY;INTERVAL=2;BYDAY=FR;COUNT=7`
- Weekly Friday for 3 months: `FREQ=WEEKLY;BYDAY=FR;COUNT=13`
- Until a specific date: `FREQ=WEEKLY;INTERVAL=2;BYDAY=FR;UNTIL=20261031T235959Z`

Attendee ID formats:
- User: `ou_xxxxxxxx`
- Chat/group: `oc_xxxxxxxx`
- Meeting room: `omm_xxxxxxxx` (booking may fail silently; verify after creation)

After creation, always verify attendees:

```bash
lark-cli calendar event.attendees list --as user --calendar-id primary --event-id <event_id>
```

If attendees are missing, delete the broken event and recreate it with `+create`.

**Pitfalls**
1. Login must use `--domain calendar`; manually listing scopes with `--scope` often fails.
2. Share-link `calendarId` values are not API-usable. Search the user's primary calendar instead:
   ```bash
   lark-cli calendar +search-event --as user --query "<title>" --start YYYY-MM-DD --end YYYY-MM-DD
   ```
3. Primary-calendar event IDs end in `_0`; use that suffixed ID for `+get` and attendee operations.
4. A successful `events create` response does not guarantee attendees were added — verify explicitly.

### Meetings & Minutes (妙记)
- Search recordings, download media
- Get summaries, to-dos, chapters
- Edit minutes (rename titles, replace speakers)
- Generate minutes from uploaded audio/video

### Email
- Search, read, draft, send, reply, forward, archive
- Manage folders, labels, rules
- Request read receipts
- Set priority (urgent/normal/low)
- Attach calendar invites

### Tasks
- Create tasks, update status, add subtasks
- Manage checklists and collaborators
- Upload attachments

### Knowledge Base (知识库)
- Query spaces, manage members
- Manage nodes and document hierarchy
- Create new knowledge spaces

### Directory (通讯录)
- Search users, colleagues, departments
- Filter by "chatted with", "external contacts"
- View multilingual names, emails, departments

### Slides (幻灯片)
- Create presentations, read page content
- Add/delete slides, insert images
- Export to PPTX or PDF
- Use 42+ official templates

### Whiteboard (画板)
- Read whiteboard, export images
- Update with DSL/PlantUML/Mermaid
- Insert images

### OKR
- View cycles, manage objectives and key results
- Maintain alignment relationships and metrics

### Approvals
- Query approval instances, process tasks
- Add approvers, rollback to previous nodes

### Attendance
- Query check-in records

## Common Workflows

### Create a Document from Markdown
```bash
lark-cli doc create --title "My Document" --content "# Heading\n\nBody text"
```

### Search and Read Messages
```bash
lark-cli message search --query "project update"
```

### Schedule a Recurring Meeting
```bash
lark-cli calendar +create --as user \
  --summary "Team Sync" \
  --start "2026-07-10T18:00:00+09:00" \
  --end "2026-07-10T19:00:00+09:00" \
  --rrule "FREQ=WEEKLY;INTERVAL=2;BYDAY=FR;COUNT=7" \
  --attendee-ids "ou_xxxxxxxxxxxxx,oc_xxxxxxxxxxxxx"
```

Then verify attendees with `lark-cli calendar event.attendees list`.

### Check Unread Emails
```bash
lark-cli email list --unread
```

### Convert Markdown to Feishu Doc
```bash
lark-cli doc create --file ./my-article.md
```

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `lark-cli: command not found` | CLI not installed | Run `npm install -g @larksuite/cli` |
| `Unauthorized` | Not logged in | Run `lark-cli auth login` |
| `Permission denied` | Missing scope | Run `lark-cli auth login --scope <missing_scope>` |
| `Auth code expired` | OAuth timeout | Re-run `lark-cli auth login` |

## Wiki & Document Reading — Real-world Pitfalls

This section captures failure modes observed in actual agent sessions so future agents do not repeat them.

### 1. CLI shows "not configured" even though installed
**Symptom**: `lark-cli auth status` returns `{"ok":false,"error":{"type":"config","message":"not configured"}}`
**Fix**: Run `lark-cli config init --new`, extract the verification URL from output, and have the user open it in a browser to authorize the app.

### 2. Wiki node fetch requires app-scope enablement in the developer console
**Symptom**: `lark-cli wiki +node-get` returns `App scope not enabled: required scope wiki:node:read [99991672]`
**Fix**: Open the `console_url` from the error response (or construct `https://open.feishu.cn/page/scope-apply?clientID=<appId>&scopes=wiki%3Anode%3Aread`) and have the user click "enable". This is **not** solvable by re-logging in.

### 3. Flag naming is kebab-case, not snake_case
**Symptom**: `unknown flag: --node_token`
**Fix**: Use `--node-token` (kebab-case). Same applies to `--obj-type`, `--space-id`, etc.

### 4. Passing a bare token requires `--obj-type`
**Symptom**: `--obj-type is required for a raw obj_token ... (one of: doc, docx, sheet, bitable, mindnote, slides, file)`
**Fix**: Either pass `--obj-type docx` (or the correct type), or pass the **full Lark URL** (e.g. `https://<tenant>.feishu.cn/wiki/<token>`) so the CLI can infer the type automatically.

### 5. There is no `docx` command — use `docs +fetch --api-version v2`
**Symptom**: `unknown command "docx" for "lark-cli"`
**Fix**: Read docx content with:
```bash
lark-cli docs +fetch --doc "<obj_token>" --api-version v2
```
The `--doc` flag accepts a document URL or token.

### 6. Bot identity alone often cannot read tenant documents
**Symptom**: After configuring the app, `lark-cli auth status` shows `bot: ready` but `user: missing`. Some wiki/docs APIs still return permission errors or empty results.
**Fix**: If bot calls fail, run `lark-cli auth login --recommend` to obtain a user identity, then retry the command with `--as user` if needed.

## Canonical Statements

- "Checking Feishu CLI installation..."
- "Installing Feishu CLI..."
- "Configuring Feishu credentials..."
- "Please scan the QR code or open this URL to authorize: [url]"
- "Executing Feishu command..."
- "Feishu operation completed successfully"

## See Also

- [Feishu CLI Official Docs](https://open.larkoffice.com/document/mcp_open_tools/feishu-cli-let-ai-actually-do-your-work-in-feishu.md)
- [Feishu CLI GitHub](https://github.com/larksuite/cli)
