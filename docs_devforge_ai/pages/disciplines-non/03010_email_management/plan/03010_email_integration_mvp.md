# 1300_03020_EMAIL_INTEGRATION_MVP

Status: Draft for immediate implementation
Scope: Deliver a minimal but complete email routing capability integrated with documents, DLs, RBAC, and auditing.

1. Objectives
- Enable sending documents to users and distribution lists from 00200 and document detail views.
- Enforce deterministic attach vs signed-link delivery with override.
- Provide full audit of send decisions and link accesses.

2. Backend API
- POST /api/email/send
  - Inputs:
    - recipients: string[] (userId or email)
    - lists: string[] (distributionListId) optional
    - subject: string
    - templateId?: string
    - body?: string (used when templateId is omitted)
    - documentRefs: { docId: string; versionId?: string; fileKey?: string }[]
    - attachMode: "auto" | "attach" | "link" (default: "auto")
  - Logic:
    1) Resolve recipients (RBAC-filtered) from users + lists.
    2) Resolve file metadata (size, storage key) for each documentRef.
    3) Apply attach/link decision per file:
       - If attachMode="auto": if size ≤ 5MB (configurable), attach; else link.
       - If "attach": force attach, but block oversize with helpful error (configurable).
       - If "link": always link.
    4) Generate signed URLs for links (expiry default 7 days).
    5) Build message using template (templateId) or body; insert variables: {docNumber, title, version, link, dueDate}.
    6) Send via provider (per 1300_03010).
    7) Create audit record with per-file decision.
    8) Return { status, messageId, attachments[], links[], auditId }.
- GET /api/documents/download?token=...
  - Validates token, increments access log, streams file or 302 to signed URL.

3. Data Model (MVP)
- email_sends
  - id (pk), actor_id, recipients_json, lists_json, template_id, subject, sent_at, mode ("auto"|"attach"|"link")
- email_attachments
  - id (pk), email_send_id (fk), doc_id, version_id, file_key, delivery_mode ("attach"|"link"), signed_url, expires_at, size_bytes
- email_access_logs
  - id (pk), email_send_id (fk), doc_id, actor_id?, accessed_at, ip, user_agent

4. Frontend Compose Modal
- Multi-recipient typeahead (users) and DL picker (RBAC filtered).
- Template selector + preview (if templates available) OR body text input.
- Attach vs link toggle with "auto" default.
- Document selection comes from invoking context (00200 selection or current document/version).
- Validation and UX:
  - Require at least one recipient and content (template or body).
  - Show final delivery decisions: e.g., "Doc A: attach", "Doc B: link (12.4MB)".
  - Success toast links to audit record.

5. Security
- Signed URLs with expiry; token scoped to email_sends/email_attachments.
- Optional watermarking for PDFs (feature flag watermark.enabled).
- RBAC enforcement for lists and document access.

6. Configuration
- EMAIL_ATTACH_THRESHOLD_BYTES default 5MB (configurable).
- SIGNED_URL_EXPIRY_DAYS default 7 (configurable).

7. Audit Events
- email_sent: includes actor, recipients, lists, templateId, per-file decision (attach/link), expiries.
- email_download: includes actor (if authenticated), token, ip, ua, docId/versionId.

8. Testing (MVP Tier)
- Unit: attach vs link logic, template rendering variables.
- Integration: send to DLs with mixed file sizes; verify audit rows and signed link expiry.
- E2E: from 00200 multi-select → compose → send → open link (download log recorded).

9. Implementation Notes
- ES Module Compatibility: Routes file was initially using CommonJS require() syntax. Had to convert the service to use proper ES module exports to match the project's ES module structure.

10. Acceptance Criteria
- Users can send emails to users and DLs; DLs respect RBAC.
- Attach/link logic works with override; links expire; access is logged.
- Audit captured for every send with per-file decisions.
