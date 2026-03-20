# 0915 Contributor Access Architecture

Status: Proposed
Last Updated: 2025-08-01

This document aligns with and cross-references:
- 0915_ENHANCED_CONTRIBUTOR_HUB_IMPLEMENTATION.md
- 1300_00180_CONTRIBUTOR_SYSTEM_IMPLEMENTATION_SUMMARY.md
- 1300_00180_CONTRIBUTOR_ACCESS_SOLUTION_SUMMARY.md
- 1300_00180_CONTRIBUTOR_GUIDE.md
- 1300_00180_CONTRIBUTOR_HUB_ASSIGNMENT_SYSTEM.md

Note on numbering: All contributor access and hub implementation docs use the 0915 prefix for architecture/implementation under the platform layer, and 1300_00180 prefix for contributor-facing workflows and summaries. Keep these prefixes consistent across new docs.

Overview
This document defines the end-to-end architecture for safely onboarding external contributors with tightly scoped access, using GitHub features and our existing 00180 Contributor System (see 1300_00180_CONTRIBUTOR_SYSTEM_IMPLEMENTATION_SUMMARY.md). The goal is to allow third parties to develop agents and UI modules in an isolated workspace while protecting the main repository and infrastructure.

Objectives
- Isolate contributor access to specific page scopes (e.g., 00435 Contracts Post-Award)
- Provide a runnable “replica” workspace with minimal dependencies
- Automate provisioning from our Contributor Hub (00180)
- Govern contributions via PRs, CODEOWNERS, and branch protections
- Cleanly integrate accepted work back into the monorepo
- Keep contributor UX unified with hub enhancements (see 0915_ENHANCED_CONTRIBUTOR_HUB_IMPLEMENTATION.md)

High-level Approach
1) Curated “Agent-Dev” Template Repository
A dedicated template repository (e.g., construct_ai-agent-dev-template) contains:
- Minimal runnable harness (Vite/Webpack dev server, package.json)
- Aliases and local shims for shared modules (Supabase client, services, modal wrapper)
- The page scope subtree (e.g., client/src/pages/00435-contracts-post-award) or placeholders
- Mock API (/api/process) or proxy for local testing
- README with “npm i && npm run dev”
- CODEOWNERS and branch protection expectations

2) Automated Provisioning via Contributor Hub (00180)
The Contributor Hub exposes “Create External Agent Workspace” (see 0915_ENHANCED_CONTRIBUTOR_HUB_IMPLEMENTATION.md) that:
- Creates a new private repo from the template (GitHub template APIs)
- Creates a contributor branch (assignment/<pageCode>/<assignmentId>)
- Seeds assignment metadata and a “Start Here” guide generated from 1300_00180 docs
- Optionally invites the contributor as a collaborator (push or triage)
- Returns links: repo URL, clone URL, “Open in Desktop”, and “Open in Codespaces”

3) Contribution Governance
- External contributors work only in the curated repo
- PRs are required for merging (branch protections)
- CODEOWNERS requires reviews by core team
- CI (build/lint/tests) gates merges

4) Back Integration to Monorepo
Choose one:
- Submodule: Replace the monorepo subtree (e.g., 00435) with a submodule pointing to agent-dev repo. Maintainers bump the pinned commit when changes are accepted.
- CI Sync: Keep the monorepo canonical and run Actions to mirror the subtree to/from agent-dev via PRs managed by maintainers.

Why This Architecture
- Isolation: External parties cannot access the full monorepo
- UX: One-click workspace creation via Contributor Hub (see 0915_ENHANCED_CONTRIBUTOR_HUB_IMPLEMENTATION.md)
- Governance: Standard PR flow with protections and reviews
- Reusability: Template pattern applies to any page scope (00435, 00900, 02050, etc.)
- Maintainability: Clear boundary between curated repos and monorepo

Key Components

Backend (server/src)
- githubService.js (extend with):
  - createRepoFromTemplate({ templateOwner, templateRepo, newRepoName, private })
  - createBranch({ owner, repo, base, newBranch })
  - addCollaborator({ owner, repo, username, permission })
  - createOrUpdateFile({ owner, repo, path, content, branch, message })
  - openPullRequest({ owner, repo, head, base, title, body })
  - protectBranch({ owner, repo, branch, rules })
- New route: POST /api/contributors/external/agent-workspace
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
    "nextSteps": [
      "Clone repository",
      "npm i && npm run dev",
      "Work in client/src/pages/00435-contracts-post-award",
      "Open PR to agent-dev when done"
    ]
  }

Frontend (client/src/pages/00180-contributor-hub)
- Add “Create External Agent Workspace” UI (see 0915_ENHANCED_CONTRIBUTOR_HUB_IMPLEMENTATION.md):
  - Inputs: GitHub username, page code (default 00435), template profile, visibility
  - Calls the new API route and shows step-by-step progress
  - Displays result links and PR checklist
  - Reuses 1300_00180 contributor messaging and guidance

Template Repository (agent-dev-template)
- Minimal harness (Vite recommended)
- Local shims:
  - Supabase client mock with deterministic data
  - documentNumberingService mock
  - pathGenerationService default config + generatePath
  - activeEntitiesService mock
  - langchainSettingsService defaults
- UI shims:
  - Modal wrapper, useModal, ProcessingOptions, UserAccessSelector (simplified)
- API mock:
  - /api/process returning a 200 response with example metadata
- Docs:
  - README run instructions
  - CONTRIBUTOR_INSTRUCTIONS.md (generated from 1300_00180_* docs)

00435 Page Viability
The 00435 Contracts Post-Award module is suitable as the nucleus for this approach. It currently depends on many shared services/components:
- Supabase (organizations/projects/companies/project_phases)
- organizationConfig and activeEntities
- pathGenerationService and documentNumberingService
- Shared Modal/UI components
- /api/process endpoint (server integration)

For the template:
- Provide mock versions of those services
- Keep UI intact; wire mocks under feature flag or environment config
- Ensure Upload & Process flow works end-to-end locally (mocked)

Governance & Security
- Repo Isolation: External devs only see agent-dev repos
- Branch Protections: Required reviews, required checks, no direct pushes to protected branches
- CODEOWNERS: Require core maintainers for all paths
- Access Revocation: Remove collaborator or archive/delete repo at any time
- Optional: Codespaces for zero local machine exposure

Back-Integration Options

Option A: Submodule
- In monorepo: replace client/src/pages/00435-contracts-post-award with a git submodule pointing to agent-dev repo
- Pros: Single source of truth lives in agent-dev
- Cons: Submodule workflow overhead

Option B: CI Mirror via Actions
- Monorepo stays canonical
- Action mirrors updated subtree to agent-dev on push and opens PRs back from agent-dev as needed
- Pros: Familiar monorepo dev
- Cons: Requires sync automation

Contributor Hub Extension Plan
Cross-reference: See 0915_ENHANCED_CONTRIBUTOR_HUB_IMPLEMENTATION.md for UI flows and states.

Phase 1
- Create template repo (agent-dev-template) with mocks and harness
- Implement /api/contributors/external/agent-workspace
- Add Hub UI button and progress flow

Phase 2
- Automatic collaborator invite and branch protections
- Generate assignment-specific README from 1300_00180 docs
- Optional: Codespaces config (.devcontainer)

Phase 3
- Submodule integration or CI syncing
- Additional CI checks (unit tests, lint, smoke tests)

Appendix A: Example README for Agent-Dev Template

# Agent Development Workspace (00435)

This repository is a curated workspace for developing the Contracts Post-Award page features.

Quick Start
1. Prerequisites: Node 18+ and npm
2. Install: npm install
3. Run Dev Server: npm run dev
4. Open: http://localhost:5173/

Scope
You should work only in:
client/src/pages/00435-contracts-post-award/**

Testing Upload & Process
- Use the Upload modal in the page UI
- The /api/process endpoint is mocked for local testing
- OCR and metadata options are simulated

Submitting Work
- Commit your changes to the assignment branch
- Open a Pull Request to the main branch of this workspace
- A maintainer will review your changes and integrate into the main repository

Support
Please refer to your Contributor Assignment ticket or 1300_00180_CONTRIBUTOR_GUIDE.md, and contact the maintainer listed in CODEOWNERS.

Appendix B: API Contract (External Workspace)

POST /api/contributors/external/agent-workspace
- Creates a repository from template
- Creates branch
- Seeds docs and configuration
- Adds collaborator (optional)
- Returns links and next steps

Cross-References
- 0915_ENHANCED_CONTRIBUTOR_HUB_IMPLEMENTATION.md (Hub UI flows, states, error handling)
- 1300_00180_CONTRIBUTOR_SYSTEM_IMPLEMENTATION_SUMMARY.md (automation capabilities and file generation)
- 1300_00180_CONTRIBUTOR_ACCESS_SOLUTION_SUMMARY.md (access models and patterns)
- 1300_00180_CONTRIBUTOR_GUIDE.md (user-facing onboarding and workflow)
- 1300_00180_CONTRIBUTOR_HUB_ASSIGNMENT_SYSTEM.md (assignment lifecycle)

This architecture leverages GitHub-native flows and our automated 00180 system to provide safe, productive external development with minimal friction and strong governance, and keeps all contributor documentation aligned across 0915 and 1300_00180 namespaces.
