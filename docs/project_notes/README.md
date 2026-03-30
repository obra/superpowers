# Project Notes

`docs/project_notes/` is supportive project memory for FeatureForge. It exists to reduce rediscovery cost across sessions, but it is supportive context only and not authoritative workflow state.

## Authority Order

When sources disagree, follow this order:

1. approved specs under `docs/featureforge/specs/`
2. approved plans under `docs/featureforge/plans/`
3. execution evidence and review artifacts tied to approved work
4. runtime state under `~/.featureforge/projects/`
5. `docs/project_notes/*`

Approved specs, approved plans, execution evidence, review artifacts, and runtime state all outrank this directory. If project memory conflicts with a higher-authority source, update project memory to match the higher-authority source instead of splitting the difference.
Active repo instructions such as `AGENTS.md` also remain authoritative over `docs/project_notes/*`.

Never store credentials, secrets, or secret-shaped values in this directory.

## Update Guidance

- Distill durable takeaways from approved artifacts or stable repo docs.
- Keep entries short and add `Source:` or `Last Verified:` markers so the origin stays inspectable.
- Preserve valid existing content and repair only missing or malformed boundary text unless a rewrite is explicitly requested.

## File Maintenance Rubric

- `bugs.md`: recurring-only or high-cost rediscovery failures. Keep root cause, fix, prevention, and a source backlink.
- `decisions.md`: compact decision summaries with backlinks. Supersede or annotate old entries conservatively instead of erasing useful history.
- `key_facts.md`: stable non-sensitive facts. Refresh `Last Verified` markers when facts can drift.
- `issues.md`: breadcrumb-only references to tickets, plans, reviews, evidence, or TODO follow-ups. Do not turn it into an active checklist or status board.
