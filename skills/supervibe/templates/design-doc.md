# {Feature Name} Design Document

**Work Item:** #{work_item_id}
**Date:** {YYYY-MM-DD}
**Author:** {author}

---

## Summary

{One paragraph summary of the design decision}

## Requirements

### From ADO Work Item

{Paste description from Work Item}

### Acceptance Criteria

{Paste acceptance criteria from Work Item}

## Design

### Chosen Approach

{Describe the selected approach}

**Why this approach:**
- {Reason 1}
- {Reason 2}

### Alternatives Considered

| Approach | Pros | Cons | Why Not |
|----------|------|------|---------|
| {Alt 1} | {pros} | {cons} | {reason} |
| {Alt 2} | {pros} | {cons} | {reason} |

## Technical Details

### Architecture

{Architecture description or diagram}

### Components

| Component | Responsibility | Files |
|-----------|---------------|-------|
| {Component 1} | {What it does} | {file paths} |
| {Component 2} | {What it does} | {file paths} |

### Data Flow

```
{Input} → {Process 1} → {Process 2} → {Output}
```

### API / Interfaces

{If applicable, define interfaces}

```typescript
interface {InterfaceName} {
  {method}: {signature}
}
```

## Testing Strategy

### Unit Tests

- [ ] {Test case 1}
- [ ] {Test case 2}

### Integration Tests

- [ ] {Test case 1}

### Manual Testing

- [ ] {Verification step 1}

## Dependencies & Risks

### Dependencies

| Dependency | Status | Owner |
|------------|--------|-------|
| {Work Item or component} | {Done/In Progress/Blocked} | {name} |

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| {Risk 1} | {High/Medium/Low} | {How to address} |

## Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Implementation | {X days} | Working code |
| Testing | {X days} | Tests passing |
| Review | {X days} | Approved PR |
