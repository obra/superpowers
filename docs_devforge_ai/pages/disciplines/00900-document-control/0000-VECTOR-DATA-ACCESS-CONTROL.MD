# Vector Data Access Control - User Manual

> Complete guide to understanding and managing document access control in ConstructAI

---

## Table of Contents

1. [Introduction](#introduction)
2. [Understanding Access Control](#understanding-access-control)
3. [Access Scope Options](#access-scope-options)
4. [Workspace Types](#workspace-types)
5. [How to Share Documents Across Disciplines](#how-to-share-documents-across-disciplines)
6. [Managing Your Documents](#managing-your-documents)
7. [Troubleshooting](#troubleshooting)

---

## Introduction

ConstructAI uses a **two-layer access control system** to ensure your documents are:

- 🔒 **Secure** - Only authorized users can access your documents
- 📋 **Organized** - Documents are grouped logically by workspace
- 🌐 **Shareable** - Easy collaboration across disciplines when needed

This manual explains how to control who can see your documents and how to organize them effectively.

---

## Understanding Access Control

### Two Layers of Protection

| Layer | Purpose | Example |
|-------|---------|---------|
| **Access Scope** | WHO can access | "Only my team" |
| **Workspace** | WHERE it's stored | "Design Phase" |

Both layers work together to provide comprehensive document management.

---

## Access Scope Options

Access Scope determines **who can see and search** your uploaded documents.

### 🔒 Private
**Who can access:** Only you (the document owner)

Best for:
- Personal notes and drafts
- Confidential procurement strategies
- Draft contracts before finalization

### 👥 Team Only  
**Who can access:** Your discipline team members

Best for:
- Internal team documents
- Department-specific procedures
- Collaborative drafts within your discipline

### 🤝 Shared
**Who can access:** Specific disciplines you choose

Best for:
- Documents needed by multiple departments
- Cross-disciplinary project documents
- Contracts requiring Legal/Finance review

### 🌐 Public
**Who can access:** All organization members

Best for:
- Company-wide policies
- Standard procedures
- Publicly available templates

### ⏰ Temporary
**Who can access:** Selected users for a limited time

Best for:
- Time-sensitive reviews
- Limited-access windows
- Expiring access for external reviewers

---

## Workspace Types

Workspace determines **how documents are grouped** for organization and AI context.

### 👤 Personal
Documents for your eyes only

### 📋 Phase
Project phase specific (e.g., Design, Procurement, Construction)

### 👥 Collaborative  
Team-accessible documents

### 📁 Project
Project-specific organization

### 🏢 Organization
All organization members can access

### ⏰ Temporary
Auto-delete after set period

### 📦 Archive
Long-term storage

---

## How to Share Documents Across Disciplines

### Step-by-Step Guide

1. **Upload your document** via Upsert Files/URL/Cloud
2. **Select Access Scope** → Choose "Shared"
3. **Select Disciplines** → Check the disciplines that need access
4. **Save** → Document is now visible to selected disciplines

### Managing Cross-Discipline Sharing

Use the **Cross-Discipline Sharing** button in the Workspace state to:
- View current sharing permissions
- Modify which disciplines can access your documents
- Request access from other disciplines

---

## Managing Your Documents

### Workspace State Buttons

| Button | Function | Status |
|--------|----------|--------|
| **Access Permissions** | View and manage who can access your documents | ✅ Available |
| **Cross-Discipline Sharing** | Configure sharing between disciplines | ✅ Available |
| **Vector Data Manager** | Browse and manage uploaded documents | ✅ Available (Delete/Move/Export) |

### Current Features in Vector Data Manager

The **Vector Data Manager** provides the following capabilities:

| Feature | Description | Status |
|---------|-------------|--------|
| **Browse Documents** | View uploaded documents by company/project | ✅ Implemented |
| **Delete** | Remove selected documents | ✅ Implemented (API endpoint required) |
| **Move** | Move documents to another collection | ✅ Implemented (API endpoint required) |
| **Export** | Export documents in JSON format | ✅ Implemented (API endpoint required) |

> ⚠️ **Note:** The Vector Data Manager currently uses sample data. Backend API endpoints (`/api/vector/delete`, `/api/vector/move`, `/api/vector/export`) need to be configured for full functionality.

### Finding Your Documents

Documents are stored in **per-discipline vector tables**:
- Procurement documents → `a_01900_procurement_vector`
- Contracts documents → `a_00435_contracts_post_vector`
- HR documents → `a_01500_hr_vector`
- ...and 50+ more disciplines

This separation ensures:
- ✅ Data isolation per discipline
- ✅ Faster search performance
- ✅ Clear audit trails

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Document not appearing in search | Check Access Scope - you may not have permission |
| Can't share with another discipline | Ensure you selected "Shared" and checked the disciplines |
| Workspace button not visible | Navigate to the Workspace state |

### Need Help?

Contact your system administrator or refer to the AI IT Knowledge Base for technical details.

---

## Related Documentation

- [Vector Data Access Control - Technical Documentation](../../deep-agents/ai_it_knowledge/organisation-conventions.md)
- [Procurement Page - Modal Reference](../../deep-agents/ai_it_knowledge/disciplines/01900-procurement.md)

---

*Last Updated: 2026-02-15*
