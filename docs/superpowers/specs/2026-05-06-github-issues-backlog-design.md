# Spec: GitHub Issues for Backlog Management

**Date:** 2026-05-06
**Status:** Draft
**Author:** Brainstormed with human partner, written by agent

## Problem
The current `managing-backlog-items` skill uses a local markdown file (`BACKLOG.md` or `.local/BACKLOG.md`) for tracking incidental work. While this works well for an individual developer, it is brittle in a team environment due to potential merge conflicts and lacks visibility for other team members.

## Goals
- Transition the `managing-backlog-items` skill to use GitHub Issues as the backing datastore instead of a local file.
- Maintain the structured capture and completion discipline (drafting, show-before-write, explicit approval).
- Support team collaboration by using a centralized, shared state.
- Add integration with PR finalization to ensure issues are properly updated and closed with context.

## Proposed Changes

### Architecture
- The skill will rely exclusively on the GitHub CLI (`gh`) for all operations.
- It will not read or write to any local markdown file for backlog purposes.

### Data Structure
- **Labels**: Metadata will be mapped to GitHub labels:
    - **Priority**: `priority:critical`, `priority:high`, `priority:medium`, `priority:low`.
    - **Effort**: `effort:XS`, `effort:S`, `effort:M`, `effort:L`, `effort:XL`, `effort:XXL`.
- **Issue Body**: The body of the issue will retain the existing structured template:
    - **Context**
    - **Where**
    - **Symptom**
    - **Why it matters**
    - **Proposed fix**
    - **Acceptance**

### Workflows

#### Procedure A: Capture an Item
1.  **Trigger**: Agent notices tangential issue or human requests capture.
2.  **Duplicate Check**: Use `gh issue list --state open` and semantic search to check for existing similar issues.
3.  **Draft**: Draft the issue title, structured body, and determine priority/effort labels.
4.  **Show Draft**: Print the draft (Title, Body, Labels) and wait for user approval.
5.  **Create**: On approval, run `gh issue create --title "<title>" --body "<body>" --label "priority:<level>,effort:<size>"`.

#### Procedure B: Mark an Item Done
1.  **Trigger**: Human partner says an item is done.
2.  **Locate**: Use `gh issue list` to find the matching open issue.
3.  **Draft Outcome**: Draft the outcome summary (What shipped, Why, How) as a comment.
4.  **Show Draft**: Print the drafted comment and target issue for approval.
5.  **Complete**: On approval, add the comment via `gh issue comment` and close the issue via `gh issue close`.

#### PR Integration
- When finalizing a branch or PR (e.g., in `finishing-a-development-branch` skill), the agent will check for linked issues (e.g., `Closes #123` or `#123` in commits or PR description).
- If found, the agent will prompt the user to run the Procedure B (Mark an Item Done) to ensure the outcome summary is captured before or upon closing.

## Verification Plan

### Automated Tests
- Since this skill relies on `gh` CLI, testing will involve mocking the CLI output or running it against a test repository.
- We should verify that the duplicate check correctly identifies similar issues.

### Manual Verification
- Create a test issue using the new skill and verify it appears in GitHub with correct labels and body.
- Complete a test issue and verify the comment is added and the issue is closed.
- Verify the PR integration by creating a branch with a commit referencing a test issue and running the finalization flow.
