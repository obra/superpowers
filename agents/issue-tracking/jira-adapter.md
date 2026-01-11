# Jira MCP Adapter

## Detection

Attempt MCP tool call with graceful failure handling:

```
atlassianUserInfo
```

Returns user info if configured, error if not.

**Limitation:** Requires Atlassian Cloud. Server edition not supported via MCP.

## Commands

### discover

```
# Get specific issue by ID
getJiraIssue with issueIdOrKey: "<PROJ-123>"

# Search by keyword
searchJiraIssuesUsingJql with JQL:
  "summary ~ \"<keyword>\" ORDER BY updated DESC"

# List my open issues
searchJiraIssuesUsingJql with JQL:
  "assignee = currentUser() AND status != Done ORDER BY updated DESC"
```

### update-status

```
getTransitionsForJiraIssue with issueIdOrKey: "<PROJ-123>"
# Returns available transitions

transitionJiraIssue with:
  issueIdOrKey: "<PROJ-123>"
  transitionId: "<id-from-above>"
```

Common transition names: "In Progress", "Done", "To Do"

**Note:** Transition names vary by Jira workflow. Must call getTransitionsForJiraIssue first to discover available transitions, then use the transitionId returned.

### create

```
createJiraIssue with:
  projectKey: "<PROJ>"
  summary: "<title>"
  issueType: "Task"
  description: "<body>"
```

**Note:** Project key must be known. Parse from branch name or ask user. Issue type should match project configuration ("Task" is common but may be "Story", "Bug", etc.).

### close

```
getTransitionsForJiraIssue with issueIdOrKey: "<PROJ-123>"
# Find transition to "Done" status

transitionJiraIssue with:
  issueIdOrKey: "<PROJ-123>"
  transitionId: "<done-transition-id>"
```

### add-comment

```
addCommentToJiraIssue with:
  issueIdOrKey: "<PROJ-123>"
  body: "<comment>"
```

### get-branch-convention

Jira doesn't enforce conventions. Common patterns from enterprise:
- `feature/PROJ-123-description`
- `PROJ-123/feature-name`
- `feature/PROJ-123`

Parse project key from existing branches or issue references.

## Error Handling

MCP calls may fail intermittently. Implement retry with backoff:
1. First attempt
2. Wait 1s, retry
3. Wait 2s, retry
4. Report failure, suggest checking MCP configuration
