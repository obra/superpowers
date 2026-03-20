# 1410_03030_RECORD_MANAGER_MVP

Status: Draft for immediate implementation
Scope: Deliver a minimal Record Manager that enforces server-side file-level de-duplication and orchestrates ingestion into LangChain/vector store via a single authoritative upsert API.

1. Objectives
- Prevent duplicate ingestion of identical files using a server-computed SHA-256 hash.
- Centralize all document upserts via POST /api/documents/upsert.
- Enforce vector data isolation and access control during document processing.
- Keep client UI changes minimal; future-proof for chunk-level/incremental ingestion.
- Integrate with VectorIsolationSection component for granular access control.

2. Architecture and Flow (MVP)
Client (all Upsert Modals)
- Always call api.upsertDocument(payload) → POST /api/documents/upsert.
- Never trigger embeddings/vector writes directly from the client.

Server (Authoritative Upsert Path)
- POST /api/documents/upsert
  Inputs:
    - filename: string
    - contentType: string
    - size: number
    - department_id: string
    - doc_id?: string (if updating an existing document)
    - pathParams or source_path: object|string for path resolution
    - storageKey?: string (if presigned upload flow) or multipart form file
    - note?: string (optional, if coupling with versioning MVP)
    - isolation_metadata?: object (VectorIsolationSection settings)
      - accessScope: 'private' | 'team' | 'shared' | 'public' | 'temporary'
      - workspaceId?: uuid
      - sharedWithDisciplines?: string[]
      - documentType?: string
      - autoCleanup?: string
  Steps:
    1) Accept upload or reference (storageKey).
    2) Validate vector isolation metadata and user access permissions.
    3) Resolve storage path according to 1300_00200 path rules.
    4) Compute SHA-256 of the file (file-level).
    5) Lookup document_hashes by hash.
       - If exists: validate access permissions; audit "dedupe_skip"; return existing docRef.
       - If not: insert document_hashes row with isolation metadata, call ingestDocument(...), audit "ingested_new".
    6) Route embeddings to discipline-specific vector table (e.g., a_01900_procurement_vector).
    7) Return {dedupe, docId, jobId?, vectorIsolation: {...}, message}.
  Output:
    - { dedupe: "skip" | "ingested", docId, jobId?, vectorIsolation: {...}, message }

LangChain Processing Service (MVP)
- ingestDocument({ storagePath, docId, metadata }): idempotent; assumes dedupe decision already made by the API.
- Produces embeddings and stores vectors; emits job status logs.

3. Data Model (MVP)
document_hashes
- id (pk)
- doc_id (nullable) — can be linked when a canonical doc record exists
- hash (unique) — SHA-256 of full file
- timestamp
- source_path
- uploaded_by
- department_id
Indexes/Constraints
- UNIQUE(hash)
- INDEX(department_id), INDEX(timestamp)

4. API Contracts
Request
POST /api/documents/upsert
- Content-Type: multipart/form-data or application/json (with storageKey)
- Body: {
    filename, contentType, size, department_id, doc_id?, pathParams or source_path,
    storageKey?, note?,
    isolation_metadata?: {
      accessScope: 'private' | 'team' | 'shared' | 'public' | 'temporary',
      workspaceId?: string,
      sharedWithDisciplines?: string[],
      documentType?: string,
      autoCleanup?: string
    }
  }

Response
- { dedupe: "skip" | "ingested", docId, jobId?, vectorIsolation: {...}, message }

Errors
- 400: missing fields, invalid types, invalid isolation metadata
- 403: RBAC violation, insufficient access permissions
- 413: file too large (if you choose to enforce)
- 422: invalid vector isolation settings
- 500: hashing/storage/ingestion failures (with correlationId)

5. Audit Events
- upload_attempt: pre-dedupe; includes actor, filename, size, isolation_metadata
- dedupe_skip: found existing hash; includes hash, existing doc link, access validation
- ingested_new: inserted hash and started ingestion; includes hash, docId, storagePath, vector_table
- isolation_applied: vector isolation settings applied; includes access_scope, workspace_id, shared_disciplines
- access_denied: user attempted to access document without permissions; includes user_id, doc_id, reason
- ingest_failed: ingestion error with details/correlationId

6. Vector Isolation Integration
- VectorIsolationSection component provides UI for configuring access controls
- isolation_metadata is validated server-side before document processing
- Embeddings are stored in discipline-specific vector tables (e.g., a_01900_procurement_vector)
- Row Level Security (RLS) policies enforce access based on isolation settings
- Audit logging captures all isolation-related operations and access attempts

7. Security and RBAC
- Only authenticated users with upload permissions may call upsert.
- department_id must match caller's allowed departments (RLS on server-side reads/writes).
- Vector isolation settings are validated against user permissions.
- No client-side hashing is trusted.
- Access control is enforced at both document and vector levels.

8. Testing (MVP Tier)
Unit
- SHA-256 computation on fixture files.
- Hash-to-decision logic (skip vs ingest).
- Storage path resolution against path rules.

Integration
- POST /upsert with same file twice → first ingests, second dedupe_skip.
- POST /upsert with different file → new ingestion.
- Verify document_hashes unique constraint enforced by DB.

E2E
- Upload duplicate and new files via modal → observe dedupe/injest messaging in UI.
- Check audit records for upload_attempt, dedupe_skip, ingested_new.

9. Acceptance Criteria
- Duplicate files (byte-identical) are blocked from re-ingestion (dedupe_skip) and audited.
- New files ingest successfully via LangChain; audit captures decisions and errors.
- All modal uploads route exclusively through POST /api/documents/upsert.
- Vector isolation settings are properly validated and applied.
- Embeddings are stored in discipline-specific vector tables with proper access controls.

10. Future Extensions (Out of MVP)
- Chunk-level hashing and incremental ingestion for modified sections only.
- Part/section lineage tracking for document structure-aware updates.
- Semantic diff detection to avoid re-embedding unchanged content.
