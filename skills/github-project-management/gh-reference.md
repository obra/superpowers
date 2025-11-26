# GitHub CLI Reference for Project Management

## Prerequisites

```bash
# Check auth status and scopes
gh auth status

# Add project scope (required for project operations)
gh auth refresh -s project
```

## Project Operations

```bash
# List projects for owner
gh project list --owner obra
gh project list --owner my-org

# View project details
gh project view 1 --owner obra

# View in browser
gh project view 1 --owner obra --web

# List fields (get field IDs for item-edit)
gh project field-list 1 --owner obra

# List items in project
gh project item-list 1 --owner obra --limit 50
```

## Issue Operations (Repo-Level)

```bash
# Create issue
gh issue create -R owner/repo --title "Title" --body "Body"
gh issue create -R owner/repo --title "Title" --body "Body" --label "bug"
gh issue create -R owner/repo --title "Title" --body "Body" --assignee "@me"

# Create and add to project in one command
gh issue create -R owner/repo --title "Title" --body "Body" --project "Project Name"

# View issue
gh issue view 123 -R owner/repo
gh issue view 123 -R owner/repo --json title,body,state,labels

# Edit issue
gh issue edit 123 -R owner/repo --title "New Title"
gh issue edit 123 -R owner/repo --add-label "priority:high"
gh issue edit 123 -R owner/repo --add-assignee "@me"
gh issue edit 123 -R owner/repo --add-project "Project Name"

# Close issue
gh issue close 123 -R owner/repo

# List issues
gh issue list -R owner/repo
gh issue list -R owner/repo --label "bug" --state open
```

## Project Item Operations (Project-Level)

```bash
# Create draft item (for cross-repo/spike work)
gh project item-create 1 --owner obra --title "Title" --body "Description"

# Add existing issue/PR to project
gh project item-add 1 --owner obra --url https://github.com/owner/repo/issues/123

# List items
gh project item-list 1 --owner obra --format json

# Edit item field (requires field-id and project-id from field-list)
gh project item-edit --id ITEM_ID --field-id FIELD_ID --project-id PROJECT_ID --text "value"
gh project item-edit --id ITEM_ID --field-id FIELD_ID --project-id PROJECT_ID --single-select-option-id OPTION_ID

# Delete item
gh project item-delete 1 --owner obra --id ITEM_ID

# Archive item
gh project item-archive 1 --owner obra --id ITEM_ID
```

## Common Workflows

### Create Issue and Add to Project

```bash
# Method 1: Use --project flag (by project name)
gh issue create -R owner/repo \
  --title "[Feature] New notification preferences" \
  --body "## Summary
Implement user notification preferences.

## Design
See: docs/plans/2025-11-25-notification-preferences-design.md" \
  --project "My Project"

# Method 2: Two-step (by project number)
ISSUE_URL=$(gh issue create -R owner/repo --title "Title" --body "Body" | tail -1)
gh project item-add 1 --owner obra --url "$ISSUE_URL"
```

### Create Cross-Repo Draft Item

```bash
gh project item-create 1 --owner obra \
  --title "[Spike] Evaluate auth library options" \
  --body "## Context
Need to choose auth library for new microservices.

## Scope
- Evaluate Auth0, Clerk, and roll-our-own
- Affects: api-gateway, user-service, admin-portal"
```

### Find and Update Item Status

```bash
# Get field IDs
gh project field-list 1 --owner obra --format json

# Get item ID from list
gh project item-list 1 --owner obra --format json | jq '.items[] | select(.content.title == "Issue Title")'

# Update status field (need field-id, project-id, option-id from above)
gh project item-edit \
  --id PVTI_xxx \
  --field-id PVTF_xxx \
  --project-id PVT_xxx \
  --single-select-option-id OPTION_ID
```

## JSON Output Examples

```bash
# Issue with project info
gh issue view 123 -R owner/repo --json title,projectItems

# Project items as JSON
gh project item-list 1 --owner obra --format json

# Filter with jq
gh project item-list 1 --owner obra --format json | jq '.items[] | {title: .content.title, status: .status}'
```
