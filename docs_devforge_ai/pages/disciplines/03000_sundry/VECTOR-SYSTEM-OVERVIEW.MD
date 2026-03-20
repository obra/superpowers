# Vector System Overview

**Document ID**: `0000_VECTOR_SYSTEM_OVERVIEW.md`
**Created**: 2026-02-15
**Version**: 1.0
**Status**: ACTIVE
**Author**: Construct AI System

---

## Overview

This document provides an overview of the Vector System documentation architecture and how the various procedures relate to each other.

## Documentation Structure

| Document | Purpose | Key Features |
|----------|---------|--------------|
| **[0000_VECTOR_UPSERT_PROCEDURE.md](0000_VECTOR_UPSERT_PROCEDURE.md)** | Real-time file/document upload to vector stores | File upload, URL import, LlamaParse, chunking, embeddings |
| **[0000_TABLE_VECTOR_STORE_POPULATION.md](0000_TABLE_VECTOR_STORE_POPULATION.md)** | Batch population from existing database tables | ETL from source tables, bulk processing |
| **[0000_VECTOR_DATA_ISOLATION_PROCEDURE.md](0000_VECTOR_DATA_ISOLATION_PROCEDURE.md)** | Implementation guide for access control | Workspaces, sharing, workspaces, RLS policies |
| **[0000_VECTOR_ISOLATION_SECURITY_PROCEDURE.md](0000_VECTOR_ISOLATION_SECURITY_PROCEDURE.md)** | Security policies and compliance | Encryption, audit logging, GDPR, SOC2 |

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    VECTOR SYSTEM ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │   UPSERT     │     │   TABLE      │     │   SEARCH     │   │
│  │   (Real-time)│     │   POPULATION │     │   (Query)    │   │
│  │              │     │   (Batch)     │     │              │   │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘   │
│         │                    │                    │            │
│         ▼                    ▼                    ▼            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              VECTOR PROCESSING SERVICE                    │   │
│  │         (VectorProcessingService.js)                     │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              DISCIPLINE-SPECIFIC VECTOR TABLES            │   │
│  │              (44 discipline tables)                       │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│         ┌────────────────┼────────────────┐                   │
│         ▼                ▼                ▼                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  ACCESS     │  │  WORKSPACE  │  │  SECURITY   │          │
│  │  CONTROL    │  │  MANAGEMENT │  │  POLICIES   │          │
│  │  (RLS)      │  │             │  │             │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Reference

### Upsert vs Table Population

| Aspect | Upsert (Real-time) | Table Population (Batch) |
|--------|-------------------|------------------------|
| **Trigger** | User file upload | Scheduled/processed |
| **Volume** | Single/multiple files | Bulk from source tables |
| **Processing** | LlamaParse/Mammoth | Direct DB queries |
| **Use Case** | New documents | Migrating existing data |
| **Endpoint** | `/api/process` | Custom ETL scripts |

### Access Scopes

| Scope | Description | Visibility |
|-------|-------------|------------|
| `private` | Owner only | Creator only |
| `team` | Organization members | Same org |
| `shared` | Selected disciplines | Specific disciplines |
| `public` | All users | Entire org |
| `temporary` | Auto-expiring | Based on cleanup policy |

### 44 Discipline Vector Tables

```
Engineering:     00835, 00850, 00860, 00870, 00871, 00872, 00875, 00877
Directors:      00880, 00882, 00883, 00884, 00885, 00886, 00888, 00889, 00890, 00895
Admin/Core:     00102, 00900, 01000, 01100, 01200, 01300, 01400, 01500, 
                01600, 01700, 01750, 01800, 01850, 01900
Project/QM:     02000, 02025, 02035, 02050, 02075, 02100, 02200, 02250
Safety/Security: 02400, 02500
Special:        00435, 03000
```

### Key Services

| Service | Location | Purpose |
|---------|----------|---------|
| VectorProcessingService | `server/src/services/VectorProcessingService.js` | Core vector operations |
| vectorIsolationService | `client/src/common/js/services/vectorIsolationService.js` | Frontend isolation utilities |
| PDFProcessingService | `server/src/services/pdfProcessingService.js` | LlamaParse integration |

---

## Related Procedures

- **[0000_VECTOR_UPSERT_PROCEDURE.md](0000_VECTOR_UPSERT_PROCEDURE.md)** → File upload workflow
- **[0000_TABLE_VECTOR_STORE_POPULATION.md](0000_TABLE_VECTOR_STORE_POPULATION.md)** → Batch population
- **[0000_VECTOR_DATA_ISOLATION_PROCEDURE.md](0000_VECTOR_DATA_ISOLATION_PROCEDURE.md)** → Implementation guide
- **[0000_VECTOR_ISOLATION_SECURITY_PROCEDURE.md](0000_VECTOR_ISOLATION_SECURITY_PROCEDURE.md)** → Security policies
