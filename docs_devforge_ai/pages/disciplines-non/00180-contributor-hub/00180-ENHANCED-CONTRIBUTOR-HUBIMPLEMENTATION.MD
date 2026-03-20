# 1300_00180 Enhanced Contributor Hub Implementation

Status: Proposed
Last Updated: 2025-08-01

This document supersedes and replaces the former 0915_ENHANCED_CONTRIBUTOR_HUB_IMPLEMENTATION.md. The 0915-prefixed file will be removed to align all contributor-facing hub documents under the 1300_00180 namespace.

Cross-References
- 1300_00180_CONTRIBUTOR_SYSTEM_IMPLEMENTATION_SUMMARY.md
- 1300_00180_CONTRIBUTOR_GUIDE.md
- 1300_00180_CONTRIBUTOR_HUB_ASSIGNMENT_SYSTEM.md
- 1300_00180_CONTRIBUTOR_ACCESS_SOLUTION_SUMMARY.md
- 0915_CONTRIBUTOR_ACCESS_ARCHITECTURE.md (platform-level architecture)

Numbering Convention
- 1300_00180_* → Contributor-facing workflows, hub UX, and summaries
- 0915_* → Platform/architecture specifications supporting contributor features

Overview
The Enhanced Contributor Hub provides a unified UI to:
1) Create and track contributor assignments
2) Auto-generate files, branches, and integration guides
3) Provision isolated “External Agent Workspaces” using a curated GitHub template
4) Govern contributions through PRs, CODEOWNERS, and checks
5) Integrate accepted work back into the main repository

Key Features

A) Assignment Lifecycle (00180)
- Create Assignment: modal + DB record
- Auto File Generation: React components, integration guides
- Branch Management: consistent naming and status tracking
- Status & Activity: view current work, guides, and next steps

B) External Agent Workspace Provisioning (New)
- “Create External Agent Workspace” action
- Inputs: GitHub username, pageCode (e.g., 00435), template profile, visibility
- Backend calls GitHub APIs to:
  - Create repo from template (agent-dev-template)
  - Create branch assignment/<pageCode>/<assignmentId>
  - Seed “Start Here” docs and assignment metadata
  - Optionally add collaborator with restricted permissions
- Returns “Open in Desktop”, clone URL, Codespaces link

C) Contributor UX Enhancements
- Guided flow with step indicators
- Contextual documentation links (1300_00180_* docs)
- Copy-paste snippets for page integration
- Links to PR checklist and status

D) Governance
- CODEOWNERS: reviewers from core team
- Branch Protections: required reviews and checks
- CI: build/lint/tests per workspace
- Audit trail: assignment → repo → PR → merge back

UI Flows

Flow 1: Internal Contributor Assignment
1) Create assignment
2) Auto-generate files + branch
3) Show integration guide
4) Track progress and open PR to contrib branch

Flow 2: External Agent Workspace
1) Click “Create External Agent Workspace”
2) Enter GitHub handle and scope (e.g., 00435)
3) System provisions repo from template and seeds branch
4) Contributor clones and runs dev harness
5) Contributor opens PR to workspace repo
6) Maintainers review, then integrate into monorepo (see 0915_CONTRIBUTOR_ACCESS_ARCHITECTURE.md)

APIs (Backend Support)
- POST /api/contributors/assignments/modal (existing)
- POST /api/contributors/external/agent-workspace (new)
  Request:
  {
    "contributorGitHub": "octocat",
    "pageCode": "00435",
    "scope": ["modals","chatbots"],
    "repoName": "agent-00435-octocat-20250801",
    "visibility": "private",
    "template": "agent-dev-default"
  }
  Response:
  {
    "repoUrl": "...",
    "branch": "assignment/00435/12345",
    "cloneUrl": "...",
    "openInDesktopUrl": "...",
    "codespacesUrl": "...",
    "nextSteps": [...]
  }

Template Repository Requirements
- Minimal dev harness (Vite)
- Local shims for shared services (Supabase, path generation, numbering)
- Mock /api/process or proxy
- README and CONTRIBUTOR_INSTRUCTIONS generated from 1300_00180 docs
- CODEOWNERS and branch protection guidance

Integration Back to Monorepo
- Submodule or CI Sync paths documented in 0915_CONTRIBUTOR_ACCESS_ARCHITECTURE.md

Documentation Alignment
- This file: hub UX and flows (1300_00180)
- 0915_CONTRIBUTOR_ACCESS_ARCHITECTURE.md: platform/architecture for isolation & GitHub repos
- 1300_00180_CONTRIBUTOR_SYSTEM_IMPLEMENTATION_SUMMARY.md: automation capabilities overview
- 1300_00180_CONTRIBUTOR_GUIDE.md: contributor-facing steps
- 1300_00180_CONTRIBUTOR_HUB_ASSIGNMENT_SYSTEM.md: assignment creation & tracking
- 1300_00180_CONTRIBUTOR_ACCESS_SOLUTION_SUMMARY.md: access models and governance

Change Log
- v1.0 (2025-08-01): Migrated from 0915_ to 1300_00180_ namespace and aligned cross-references
