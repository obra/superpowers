# Amplifier Agent Mapping

Reference for superpowers skills. Consult this to select the right Amplifier agent for each task.

## Core Development Agents

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
| API Design | `api-contract-designer` | endpoint, contract, REST, GraphQL, schema, route |
| Database | `database-architect` | schema, migration, query, index, table, database |
| Specifications | `contract-spec-author` | spec, contract, interface, protocol, requirements doc |

## Design Agents

| Task Type | Agent | Trigger Keywords |
|-----------|-------|-----------------|
| UI/Component | `component-designer` | component, UI, frontend, visual, widget |
| Aesthetic Direction | `art-director` | aesthetic, brand, visual identity, mood, style guide |
| Animation/Motion | `animation-choreographer` | animation, transition, motion, easing, keyframe |
| Layout | `layout-architect` | layout, grid, page structure, sidebar, navigation |
| Responsive | `responsive-strategist` | responsive, breakpoint, mobile, tablet, viewport |
| Design System | `design-system-architect` | design tokens, theme, design system, foundation |
| UX Writing | `voice-strategist` | copy, microcopy, tone, error message, UX writing |

## Knowledge & Analysis Agents

| Task Type | Agent | Trigger Keywords |
|-----------|-------|-----------------|
| Research | `content-researcher` | research, investigate, compare, survey, evaluate |
| Analysis | `analysis-engine` | analyze, assess, audit, measure, report |
| Concept Extraction | `concept-extractor` | extract, summarize, distill, key ideas, themes |
| Synthesis | `insight-synthesizer` | synthesize, combine, cross-reference, connect |
| Code Archaeology | `knowledge-archaeologist` | history, evolution, legacy, why was this, original intent |
| Pattern Discovery | `pattern-emergence` | pattern, recurring, commonality, trend, structural |
| Visualization | `visualization-architect` | diagram, chart, graph, visualize, data viz |
| Knowledge Graph | `graph-builder` | graph, relationship, entity, connection, network |

## Meta Agents

| Task Type | Agent | Trigger Keywords |
|-----------|-------|-----------------|
| Module Design | `module-intent-architect` | module boundary, brick, stud, interface, contract |
| Agent Creation | `subagent-architect` | new agent, specialized agent, create agent |
| CLI Tool Design | `amplifier-cli-architect` | CLI tool, command, scenario, amplifier tool |
| Ambiguity Detection | `ambiguity-guardian` | ambiguous, unclear, vague, conflicting, assumption |

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
6. Design agents are for UI/frontend work — use only when the task is primarily visual/design
7. Knowledge agents are for research/analysis — use when gathering or synthesizing information
