# Amplifier Agent Mapping

Reference for superpowers skills. Consult this to select the right Amplifier agent for each task.

## Task Type to Agent

| Task Type | Agent | Trigger Keywords |
|-----------|-------|-----------------|
| Architecture/Design | `zen-architect` | plan, design, architect, structure, module spec, system design |
| Implementation | `modular-builder` | implement, build, create, add, write code |
| Testing | `test-coverage` | test, coverage, verify, validate, assertion |
| Debugging | `bug-hunter` | fix, debug, error, failure, broken, regression |
| Security Review | `security-guardian` | security, auth, secrets, OWASP, vulnerability, permission |
| Integration | `integration-specialist` | API, MCP, external, dependency, connection, integration |
| Performance | `performance-optimizer` | performance, slow, optimize, bottleneck, latency |
| Cleanup | `post-task-cleanup` | cleanup, hygiene, lint, format, unused, dead code |
| UI/Component | `component-designer` | component, UI, frontend, visual, layout, style |
| API Design | `api-contract-designer` | endpoint, contract, REST, GraphQL, schema, route |
| Database | `database-architect` | schema, migration, query, index, table, database |

## Review Agent Mapping

| Review Type | Agent | When |
|-------------|-------|------|
| Spec Compliance | `test-coverage` | After every implementation task |
| Code Quality | `zen-architect` (REVIEW mode) | After spec compliance passes |
| Security | `security-guardian` | Security-sensitive tasks or final review |
| Post-completion | `post-task-cleanup` | After all tasks pass, before finishing branch |

## Selection Rules

1. Match task description keywords against the Trigger Keywords column
2. If multiple agents match, pick the one whose Task Type best describes the primary goal
3. Implementation tasks default to `modular-builder` unless a more specific agent fits
4. Review tasks always use the Review Agent Mapping above
5. When unsure, `modular-builder` for building and `bug-hunter` for fixing
