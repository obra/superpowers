# 1300_00220_DOCUMENT_MANAGEMENT_IMPLEMENTATION_PLAN

Status: Approved for implementation  
Scope: Enhance 00200 All Documents page and backend services for enterprise-scale document management (≈10,000 users across ~75 departments).  
Objective: Deliver robust pathing, deduped upsert, multi-doc compare (text/PDF/images), email routing with RBAC, and version control; optionally scaffold a department-scoped page (00210).

## Index
- 1. Objectives and Design Decisions
- 2. Implementation Sequence (Act Mode)
  - A. Fix Pathing: Centralized Path Generator
  - B. Record Manager Integration (LangChain)
  - C. 00200 Page Enhancements
  - D. Compare Endpoint and UI (2–N Docs)
  - E. Email Endpoint and UI
  - F. Optional: Scaffold 00210 Department-Scoped Page
- 3. Version Control System
- 4. RBAC for Distribution Lists
- 5. Pathing Rules and Tests
- 6. Email Integration Details
- 7. Compare Engine Details
- 8. Testing Strategy
- 9. Rollout and Feature Flags
- 10. Timeline and Estimated Effort
- 11. Dependencies and References
- 12. Acceptance Criteria
- 13. Enterprise Hardening Addendum (MVP-First Emphasis)

## 1. Objectives and Design Decisions

1. Unify 00200 as the common interface for all departments:

   - Remove upload from 00200; uploads occur from discipline-specific Upsert states.
   - Add department-aware enhancements (filters, presets, actions), while keeping org-wide capabilities.

2. Document comparison:

   - Support 2–N documents.
   - Provide both Pairwise Tabs and Consolidated Summary modes.
   - PDFs/Text: diff + LLM summary.
   - Images: pixel/structural visual diff; semantic compare enabled only if a Vision LLM is configured.

3. Email integration:

   - Integrate with 1300_03010 email system.
   - Default: Attach files if ≤5MB; otherwise send secure links. Allow user override.
   - Multi-recipient routing and templates; all actions audited.

4. Record Manager and de-duplication:

   - Integrate dedupe and incremental ingestion in LangChain pipeline.
   - Ensure uploads into vector store are not duplicated; allow discrete additions of new parts.

5. Version control:

   - Automatic versioning on change (major/minor/patch), mandatory notes, visual diff, one-click rollback, approval workflow for major bumps.

6. RBAC for distribution lists:

   - Role-Based Access Control (RBAC): Permissions are granted based on a user’s role and department.
     - Department Admins: create/manage distribution lists and presets.
     - List Managers: add/remove members.
     - Members: can use lists for routing.
   - Rules also consider attributes like department affiliation, document type, and seniority.

7. Visual consistency:

   - Change text color on 00200 from yellow to dark green (as per 03010 email page palette).

8. Pathing correctness:
   - Centralized path generator per the numbering and path docs.
   - Fix missing leading “/” errors; ensure path format conforms to 1300_00200 and 1300_00170 docs.

## 2. Implementation Sequence (Act Mode)

A. Fix Pathing: Centralized Path Generator

- Create utility: client and server shared logic where appropriate (e.g., `server/services/path-generator.js` and `client/src/common/js/utils/path-generator.js` or a single source-of-truth in server with client API).
- Responsibilities:
  - Enforce leading “/”.
  - Compose paths from Document Numbering System rules (see docs/1300_00200_DOCUMENT_NUMBERING_COMPLETE_SYSTEM.md).
  - Consider storage path determination (see 1300_00170 docs) and ensure deterministic stable output.
- Tests:
  - Unit tests to cover department, discipline, project, and document numbering variants.
  - Fixtures covering edge cases (missing segment, extra separators, unsafe chars).
- Migration/Refactor:
  - Replace direct string concatenation with path generator everywhere (search in server/services and client upsert flows).

B. Record Manager Integration (LangChain)

- Update `server/services/langchainProcessingService.js` to:
  - Compute content hash (SHA-256) per document chunk/asset.
  - Check a `document_hashes` or `ingestion_registry` table prior to vector upsert.
  - Incremental ingestion: only ingest new hashes or modified variants.
  - Support discrete additions: maintain part/section IDs and lineage to allow appending without duplication.
- Database Migration:
  - Add `document_hashes` table: fields for doc_id, version, hash, chunk_id, timestamp, source_path, and department_id.
  - Indexes on (doc_id, version), hash unique constraint to prevent duplicates.
- Error Handling:
  - Hash collision detection; retries with salt/store metadata; audit logs.

C. 00200 Page Enhancements

- Remove Upload from 00200:
  - Ensure upsert/upload is only reachable from discipline-specific Upsert modals/pages (e.g., 00900 Document Control and others).
- Add multi-select compare and route/email actions:
  - Multi-select checkboxes in the table.
  - Action bar enabling:
    - Compare (activates compare modal/route).
    - Route/Email (opens email composition with recipients/lists).
- Update text color to dark green:
  - Match 03010 email mgmt page’s dark green token (e.g., #006400).
- Department-aware UI:
  - If navigated from a department context, auto-apply filters and default columns.
  - Persist view presets per department.

D. Compare Endpoint and UI (2–N Docs)

- Backend:
  - New endpoint: `POST /api/documents/compare` with payload: doc_ids[], mode flags.
  - Text/PDF:
    - Extract text; generate structured diffs.
    - Produce LLM summarized “Consolidated Summary”.
  - Images:
    - Baseline: pixel/structural diff with overlays.
    - Semantic: only enabled when Vision LLM configured (feature flag).
- Frontend:
  - Pairwise Tabs:
    - Generate pair combinations from selected docs; render side-by-side with highlights.
  - Consolidated Summary:
    - LLM summary of key differences; link back to specific doc segments/versions.
  - Performance:
    - Lazy-load pair tabs; cache results; limit max N with helpful UX if selection is too large (e.g., warn >20).

E. Email Endpoint and UI

- Integrate with docs/1300_03010_EMAIL_MANAGEMENT_SYSTEM_COMPLETE.md specification.
- Backend:
  - `POST /api/email/send` supporting:
    - Recipients (users, distribution lists).
    - Attachments vs links:
      - If size ≤ 5MB, attach; else generate secure signed link with expiration.
      - Override parameter to force link/attachment.
    - Templates and variables (document metadata).
    - Audit log: who sent, when, recipients, link vs attachment, template used.
- Frontend:
  - Compose modal:
    - Multi-recipient selection with typeahead.
    - Department distribution lists (RBAC filtered).
    - Toggle for attachment/link override.
    - Template selector and preview.
- Security:
  - Signed URL generation; download logging; optional watermarking for PDFs.

F. Optional: Scaffold 00210 Department-Scoped Page

- Purpose:
  - Streamlined department context with fixed filters, columns, and quick actions.
- Features:
  - Department presets (default filters, columns, actions).
  - RBAC-based visibility.
  - Navigation: clear breadcrumb back to department hub and 00200.
- Note:
  - 00200 remains the universal interface; 00210 is optional and disabled by default.

## 3. Version Control System
(See also: docs/1300_03040_VERSION_CONTROL_MVP.md for MVP data model, APIs, UI, audit, tests, and acceptance criteria.)

- Backend:
  - Versioned metadata table: doc_id, version (semver-like), author, notes, timestamp, status.
  - Change capture service tied to upsert/update flows.
  - One-click rollback operation:
    - Create a new version from a selected previous state; audit the rollback event.
- Frontend:
  - Version timeline panel with filters (major/minor/patch, date range, author).
  - Compare any two versions via the compare engine.
  - Mandatory version notes and suggested version bump type based on change scope (AI-assisted optional).
- Governance:
  - Major version bump requires approval (Document Control role).
  - Retention policy and purge workflow for stale minor versions (with export/archive option).

## 4. RBAC for Distribution Lists

- Roles:
  - Department Admin: create/delete lists, assign List Managers.
  - List Manager: maintain membership, set defaults/presets for department workflows.
  - Member: use lists in routing and email composition.
- Enforcement:
  - Server-side checks on list retrieval and usage based on user’s department roles and global permissions.
- Data model:
  - Tables for lists, list_members, department_id linkage, role assignments.
- UI:
  - Recipient control shows only accessible lists; Admin/Manager see management options.

## 5. Pathing Rules and Tests

- Inputs:
  - Department, Discipline, Project/Area, Document Number per 1300_00200 docs; storage path policies per 1300_00170.
- Output format:
  - Always starts with “/”.
  - Deterministic structure, e.g.:  
    `/org/{orgId}/dept/{deptCode}/disc/{discCode}/docs/{docNumber}/v{version}/{filename}`
- Validation:
  - Reject unsafe characters; normalize separators; encode spaces where required.
- Tests:
  - Unit tests for all segments; integration tests in upsert flows to ensure the same path is used end-to-end.

## 6. Email Integration Details

- Attachment/link logic:
  - Threshold: 5MB (configurable).
  - Override at send-time; default follows size logic.
- Templates:
  - Department-level templates with variables: {docNumber}, {title}, {version}, {link}, {dueDate}, etc.
- Auditing:
  - Store send events, recipients, selected template, attachment/link decisions, and signed URL parameters.
- Security:
  - Expiring links; optional per-recipient tokens; log access; limit re-shares.

## 7. Compare Engine Details

- Text/PDF:
  - Extract structured content; detect headings/sections; diff by section and content.
  - LLM summary: top changes, impact, references to sections.
- Images:
  - Pixel/structural diff baseline with overlay UI.
  - Semantic annotations when Vision LLM available; feature flag guard.
- UX:
  - Pairwise tabs: on-demand rendering; show differences badge per pair.
  - Consolidated summary: “Key Differences” list with deep links.

## 8. Testing Strategy

- Unit tests:
  - Path generator (100% branch coverage).
  - Hashing/dedupe logic; incremental ingestion.
  - Email decision logic and signed link generation.
- Integration tests:
  - Upsert → Record Manager → Vector store; verify dedupe.
  - Compare API for text/PDF/images with and without Vision LLM flag.
  - Email send flow with DLs, attachments vs links, and audit logging.
- E2E tests:
  - 00200 table multi-select compare and email routing.
  - Version rollback scenarios.
  - RBAC restrictions on distribution lists.

## 9. Rollout and Feature Flags

- Feature flags:
  - visionLLM.enabled
  - compare.consolidatedSummary
  - email.attachmentsOverride
  - deptPresets.enabled (00210)
- Phased rollout:
  - Pilot with Document Control and 1–2 departments.
  - Monitor logs and performance; expand gradually.

## 10. Timeline and Estimated Effort

- Total estimate: ~320–380 hours (8–9.5 dev-weeks @40h/week).
- Suggested sequencing (weeks are indicative if done serially; parallelization possible):
  - Week 1: Path generator + tests.
  - Week 2: Record Manager dedupe/incremental + migration.
  - Week 3: 00200 page UI actions + color update.
  - Weeks 4–5: Compare engine (APIs + UI) + LLM summary.
  - Week 6: Email integration (endpoints + UI + audit).
  - Week 7 (optional): 00210 department-scoped page and presets.

## 11. Dependencies and References

- Email system: docs/1300_03010_EMAIL_MANAGEMENT_SYSTEM_COMPLETE.md
- Document numbering: docs/1300_00200_DOCUMENT_NUMBERING_COMPLETE_SYSTEM.md
- Path management: docs/1300*00200_PATH_MANAGEMENT.md and docs/1300_00170_MODAL*\* docs
- Record manager: docs/1410_LANGCHAIN_RECORD_MANAGER.md, docs/1360_FLOWISE_RECORD_MANAGER_SETUP_GUIDE.md
- Storage and vector store: docs/1410_LANGCHAIN_SUPABASE_STORAGE_IMPLEMENTATION.md
- All documents system reference: docs/1300_0200_ALL_DOCUMENTS_SYSTEM.md

## 12. Acceptance Criteria

1. Pathing: All generated paths start with “/” and pass unit/integration tests.
2. Record Manager: No duplicate embeddings for identical content; incremental ingestion proven by tests.
3. 00200 UI: Upload removed; multi-select compare/email actions functional; dark green text applied.
4. Compare: 2–N selection works; Pairwise tabs and Consolidated summary available; images diff works; semantic compare only when Vision LLM is enabled.
5. Email: Multi-recipient routing; attachment vs link logic enforced; override available; templates and auditing complete.
6. Version Control: Version timeline, compare any two versions, mandatory notes, rollback, and major version approval flow.
7. RBAC: Distribution lists visible and manageable per role; enforcement validated by tests.
8. Optional 00210: If enabled, departmental presets and RBAC wired; navigation consistent with 00200.

## 13. Enterprise Hardening Addendum (MVP-First Emphasis)

Precedence note: MVPs for Email (Phase 1), Record Manager (Phase 2), and Version Control (Phase 3) ship first; hardening and advanced capabilities follow in Phase 4+.

Precedence note: Controls that directly affect Email and Versioning are prioritized earlier (Phases 1–3). Remaining items can proceed in later phases.

1. Compliance, Governance, and Legal Hold

- Add retention schedules by document class/department with exceptions.
- Legal hold: apply/release holds via API/UI; block deletion; full audit trail.
- Records declaration: immutable state; only new versions allowed; support WORM-backed storage where required.
- Regulatory mappings and workflows (ISO 9001/27001, SOC 2, GDPR/POPIA DSRs).
- Acceptance:
  - Retention policies enforce delete/retain unless on hold.
  - Hold placement/release audited; deletions blocked under hold.
  - Records declaration prevents content edits; audit any metadata changes.

2. Security Hardening and Data Protection

- Encryption at rest via KMS (key rotation); TLS + HSTS; optional client-side encryption tier.
- Row-Level Security for department/org isolation; document-level policies beyond distribution lists.
- DLP scanning on upload (PII, secrets) with quarantine/review workflow.
- Centralized secrets management (vault); no secrets in code or production .env.
- Acceptance:
  - Encryption and key rotation verified; RLS policies covered by tests.
  - DLP blocks/flags sensitive uploads with auditable review decisions.

3. Access Control Model Depth

- Document-level ACL overlay: view, comment, edit, route, approve, delete.
- Time-bound and purpose-bound share links; view-only with download/print controls and watermarking.
- Approver/Publisher roles integrated into version approvals.
- Delegated and break-glass access with justification and audit.
- Acceptance:
  - Policy engine tests for RBAC + ACL + link scopes; watermark enforced per policy.

4. Full Auditability and Tamper Evidence

- Append-only central audit log for view, search, download, email, compare, upsert, version change, ACL, holds.
- Integrity: hash-chaining or periodic signed checkpoints; optional secure external log sink.
- Acceptance:
  - Every sensitive action logged with actor, context, before/after; tamper detection validated.

5. Storage Lifecycle, Archival, and Disaster Recovery

- Lifecycle tiering (hot → warm → cold/archive) with restore workflow.
- Backups for metadata and blobs; defined RPO/RTO; cross-region replication.
- Regular backup integrity tests and documented DR drills.
- Acceptance:
  - Restore drill meets RTO/RPO; lifecycle transitions observable and reversible.

6. Content Processing and OCR Reliability

- OCR pipeline with quality gates, multi-language packs, skew/denoise; generate searchable PDFs for images.
- Post-OCR confidence checks; low-confidence review queue.
- Structured extraction (headings, tables) feeding compare/LLM summaries.
- Acceptance:
  - OCR KPIs tracked; searchable PDFs produced; compare leverages structured sections.

7. Metadata, Classification, and Taxonomy

- Mandatory metadata schemas per document class; validation on upsert.
- Controlled vocabularies and taxonomy management with dept extensions.
- Auto-tagging via ML/LLM with human-in-the-loop confirmation.
- Acceptance:
  - Uploads blocked without required metadata; taxonomy edits audited; auto-tag precision measured.

8. Advanced Search and eDiscovery

- Hybrid search (keyword + vector) with fielded filters: department, type, version, dates, tags, retention/hold.
- Saved searches with alerts; strict ACL enforcement in results.
- eDiscovery export: deduped corpus, checksums, manifest, chain-of-custody.
- Acceptance:
  - Relevancy tests pass; exports verifiable with checksums and manifests.

9. Collaboration, Annotation, and Review Workflows

- In-document annotations and threaded comments with proper permissions.
- Review/approval workflows per department; electronic signature integration.
- Concurrency control (check-in/out or optimistic locking) and presence indicators.
- Acceptance:
  - Approval trail binds to version; signature validation; conflict resolution UX proven.

10. Performance, Scale, and Cost Controls

- SLOs for upload/search/compare; autoscaling for OCR/LLM/compare workloads.
- Queueing/backpressure for bulk ingestion; retries and poison-queue handling.
- Cost dashboards, per-department quotas, LLM and egress spend alerts.
- Acceptance:
  - Load tests at 10k-user scale meet SLOs; throttling and cost guardrails verified.

11. Internationalization and Accessibility

- i18n support for UI and templates; locale-aware formatting; RTL if needed.
- Accessibility: keyboard nav, ARIA, contrast, screen readers; PDF accessibility tags where possible.
- Acceptance:
  - WCAG 2.1 AA checks pass; automated accessibility scans in CI.

12. Observability and Operational Excellence

- Structured logging, metrics, tracing (RED/USE); SLO-based alerting.
- Dashboards for ingestion, compare, email, search, RBAC errors.
- Runbooks for incidents; chaos tests for dependencies (LLM, storage, email).
- Acceptance:
  - On-call triage supported by dashboards; synthetic probes and alerts effective.

13. Data Residency, Multi-Tenancy, and Organization Isolation

- Data residency routing to correct region; per-org buckets/keys and theming.
- Tenant isolation via schema or strict RLS; org-scoped configs.
- Acceptance:
  - Residency honored end-to-end; isolation validated via pen tests and integration tests.

14. API Design, Extensibility, and SDKs

- Versioned public APIs; webhooks for lifecycle events (ingested, versioned, routed, retention).
- Bulk import/export and reindex tools; migration playbooks.
- Acceptance:
  - API docs and contract tests; webhook signing and retry logic validated.

15. Content Integrity and Watermarking

- Per-version content digests and provenance metadata.
- Visible/invisible watermarking per sensitivity policy; view-only rendering where required.
- Acceptance:
  - Integrity checks on retrieval; watermark presence and policy enforcement verified.

Additions to Existing Sections

- Testing Strategy

  - Add security tests (RLS/ACL bypass), chaos tests, performance/load tests, accessibility tests.
  - Add DLP tests and backup-restore drills with integrity validation.

- Rollout and Feature Flags

  - Stage enablement of DLP, legal hold, retention; include training and change management.
  - Pilot in a compliance-heavy department before org-wide rollout.

- Acceptance Criteria Addendum (Summary)
  - Compliance/Retention: legal hold, retention schedules, records declaration enforced with audit.
  - Security/Isolation: encryption in transit/at rest, RLS/ACL tests, secrets externalized, DLP.
  - Audit/Integrity: append-only audit with integrity attestations.
  - DR/Lifecycle: backup/restore meets RTO/RPO; lifecycle and archival validated.
  - Performance/Observability: load tests meet SLOs; dashboards/alerts operational.
  - Accessibility/i18n: WCAG AA and localization on core paths.
  - eDiscovery/Search: fielded search with ACL; export manifests with checksums.
  - Collaboration/Workflow: annotations, approvals, signatures, conflict handling implemented.

## Appendix: Linked Documents Index (References)
- Email system (complete): docs/1300_03010_EMAIL_MANAGEMENT_SYSTEM_COMPLETE.md
- Email test data: docs/1300_03010_EMAIL_TEST_DATA_README.md
- Email Integration MVP: docs/1300_03020_EMAIL_INTEGRATION_MVP.md
- Version Control MVP: docs/1300_03040_VERSION_CONTROL_MVP.md
- Record Manager (general): docs/1410_LANGCHAIN_RECORD_MANAGER.md
- Record Manager MVP: docs/1410_03030_RECORD_MANAGER_MVP.md
- Complete LangChain implementation: docs/1410_COMPLETE_LANGCHAIN_IMPLEMENTATION.md
- LangChain Supabase storage: docs/1410_LANGCHAIN_SUPABASE_STORAGE_IMPLEMENTATION.md
- Flowise Record Manager setup: docs/1360_FLOWISE_RECORD_MANAGER_SETUP_GUIDE.md
- Flowise Supabase setup: docs/1360_FLOWISE_SUPABASE_SETUP.md
- Flowise vector search: docs/1360_FLOWISE_VECTOR_SEARCH.md
- Document numbering: docs/1300_00200_DOCUMENT_NUMBERING_COMPLETE_SYSTEM.md
- Path management: docs/1300_00200_PATH_MANAGEMENT.md
- Modal architecture overview: docs/1300_00170_MODAL_SYSTEM_DOCUMENTATION.md
- Modal development guide: docs/1300_00170_MODAL_DEVELOPMENT_GUIDE.md
- Modal quick reference: docs/1300_00170_MODAL_QUICK_REFERENCE.md
- Modal workflow guide: docs/1300_00170_MODAL_WORKFLOW_GUIDE.md
- Upsert File Modal AI Enhancement Plan: docs/1300_00170_UPSERT_FILE_MODAL_AI_ENHANCEMENT_PLAN.md
- All Documents system reference: docs/1300_0200_ALL_DOCUMENTS_SYSTEM.md
- User access control: docs/1400_USER_ACCESS_CONTROL_IMPLEMENTATION.md
