# 1300_03040_VERSION_CONTROL_MVP

Status: Draft for immediate implementation
Scope: Minimal versioning system for documents with mandatory notes, two-version compare for text/PDF, rollback as new version, and basic approval for major bumps.

1. Objectives
- Capture a new version on content change with mandatory author notes.
- Allow compare of any two versions (text/PDF) and generate a simple summary.
- Support rollback by creating a new version from a prior state; audit all actions.
- Require approval for major version bumps.

2. Data Model (MVP)
document_versions
- id (pk)
- doc_id (fk)
- version (string, semver-like: MAJOR.MINOR.PATCH)
- author_id (fk)
- note (text, required)
- status ("active" | "pending_approval" | "deprecated" | "superseded")
- created_at (timestamptz)
- approved_by? (fk), approved_at? (timestamptz) for major bumps

Optional helper table (if needed)
- version_approvals: id, version_id, approver_id, decision ("approve"|"reject"), decided_at, note?

3. Versioning Rules (MVP)
- On upsert/update that changes file content:
  - Determine bump suggestion: default PATCH; MAJOR requires approval; MINOR for meaningful additions; allow user override with constraints.
  - Require note entry; store author_id.
  - Create document_versions row; mark:
    - MAJOR: status="pending_approval"
    - MINOR/PATCH: status="active"
- Approval:
  - Approver role can approve/reject MAJOR versions.
  - On approval: status → "active"; on reject: keep non-active or mark "deprecated".
- Rollback:
  - Selecting a previous version creates a NEW version representing that content; mark with note "Rollback from vX.Y.Z".

4. APIs (MVP)
- POST /api/documents/:docId/versions
  - Inputs: bump ("major"|"minor"|"patch"), note (required), storageKey or reference to new content
  - Logic: validate note, compute bump target, create version row, set status, store file reference
  - Output: { versionId, version, status }

- POST /api/documents/:docId/versions/compare
  - Inputs: v1, v2
  - Logic: extract text from both versions; run structured diff; optional LLM summary (feature flag)
  - Output: { diffs: DiffBlock[], summary?: string }

- POST /api/documents/:docId/versions/:versionId/approve
  - Inputs: note? (optional approver note)
  - Requires approver role; sets status="active", approved_by, approved_at

- POST /api/documents/:docId/versions/:versionId/rollback
  - Creates new version from selected version’s content with note; outputs new version info

5. Frontend (MVP)
- Document Details: Version Timeline panel
  - List versions with status, author, note, created_at
  - Actions: Compare v1↔v2 (opens diff modal), Rollback (opens confirm + note), Create new version (form with bump + note)
  - Major bump indicator: shows "Pending approval" until approved

- Compare Modal (text/PDF)
  - Renders structured diffs; highlights changes; optional LLM summary behind flag
  - Handles non-text files gracefully with a message "Diff not supported (MVP)"

6. Audit Events
- version_created: { docId, version, bump, author, note }
- version_approved / version_rejected: { docId, version, approver, note }
- version_rollback: { docId, fromVersion, toVersion, actor, note }
- version_compared: { docId, v1, v2, actor }

7. Security and RBAC
- Only permitted roles can create versions; major approvals require Approver role.
- Access to versions subject to document ACL/RLS where applicable.

8. Testing (MVP Tier)
Unit
- Version bump rules and semver generation
- Mandatory notes enforcement
Integration
- Create version → compare two versions (text/PDF) → rollback flow
- MAJOR version pending approval → approve → becomes active
E2E
- User uploads new file (via upsert), creates version with note, compares, performs rollback, approver approves major

9. Acceptance Criteria
- New versions are created on content change with mandatory notes.
- Compare-two versions works for text/PDF with reasonable diffs.
- Rollback produces a new version and is fully audited.
- Major versions remain pending until approved by an approver role.
