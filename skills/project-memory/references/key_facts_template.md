# `docs/project_notes/key_facts.md` Template

Use for stable non-sensitive facts that are expensive to rediscover.

```markdown
# Key Facts

- <fact>
  Last Verified: YYYY-MM-DD
  Source: `<stable repo doc or approved artifact>`
```

Maintenance:

- never store passwords, API keys, tokens, private keys, or credential blobs
- refresh volatile facts instead of letting them rot
- prefer source links when the fact can be rechecked quickly
