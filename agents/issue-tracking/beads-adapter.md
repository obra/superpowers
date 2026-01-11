# Beads Adapter

## Detection

```bash
# Check directory exists AND CLI works
test -d .beads && bd version >/dev/null 2>&1
```

Exit code 0 = beads available.

## Commands

### discover

```bash
# List all open issues
bd list --status=open

# Search by keyword
bd search "<keyword>"

# Get specific issue
bd show <id>
```

### update-status

```bash
bd update <id> --status=in_progress
```

Valid statuses: `open`, `in_progress`, `blocked`, `deferred`, `closed`

### create

```bash
bd create --title="<title>" --type=task --priority=2
```

Returns: Issue ID in output

### close

```bash
bd close <id>
# Or with reason:
bd close <id> --reason="<reason>"
```

### add-comment

```bash
bd comments add <id> "<comment>"
```

### get-branch-convention

Beads doesn't enforce branch conventions. Check other sources or return default:
`feature/<issue-id>-<description>`
