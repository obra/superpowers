# Scenario: Research Skill

## Setup
This test runs in the test project directory with a pre-existing design document.
The design document contains open questions that should be investigated by the research agents.

## Pre-Test Setup Script Must:
1. Create a design document at `docs/designs/2026-01-13-notification-system-design.md`
2. The design document contains:
   - Feature description (notification system)
   - Initial architecture thoughts
   - Open questions requiring research
3. Initialize git so the research doc can be committed

## User Prompt
"Research this design"

## Expected Skill Trigger
- The research skill should activate
- Claude should find and read the design document
- Claude should:
  - Dispatch ALL 8 research agents in parallel
  - Wait for all agents to complete
  - Execute Handoff Consumption Gate
  - Execute Synthesis Verification Gate
  - Cite EACH agent's findings by name with quotes
  - Identify contradictions/nuances between agents
  - Address open questions from design
  - Save research document to docs/research/

## Test Duration
Expected: 15-20 minutes (8 parallel agents + synthesis)

## Critical Verification Points
1. **Agent Dispatch:** ALL 8 agents MUST be dispatched (no fewer)
2. **Handoff Consumption:** Each agent's findings MUST be quoted in synthesis
3. **Per-Agent Citation:** All 8 agents explicitly cited by name
4. **Contradictions:** At least one nuance/contradiction identified between agents
5. **Open Questions:** Design doc open questions addressed in synthesis

## Design Document Content (to be created by test script)

```markdown
# Notification System Design

## Date
2026-01-13

## Overview
Add a notification system to the Next.js app that supports:
- In-app toast notifications
- Email notifications (via external service)
- Notification preferences per user

## Initial Architecture Thoughts
- Could use React Context for in-app notification state
- Toast component should support multiple notification types (success, error, warning, info)
- Email integration will need an API route
- Preferences should persist

## Requirements
1. Toast notifications with configurable duration
2. Email notifications for critical events
3. User can configure notification preferences
4. Notifications should be accessible (ARIA)

## Open Questions
- What existing notification patterns exist in the codebase?
- What email service integrations are common in Next.js apps?
- How should notification state be managed - Context vs Zustand vs Redux?
- What accessibility requirements apply to toast notifications?
- Are there any performance concerns with real-time notifications?
```

## Research Agents Expected
The research skill MUST dispatch all 8 of these agents:
1. **Codebase Analyst** - Find existing notification patterns
2. **Test Coverage Analyst** - Analyze testing strategies for notifications
3. **Architecture Boundaries Analyst** - Where should notification code live
4. **Framework Docs Researcher** - Next.js notification best practices
5. **Best Practices Researcher** - Community patterns for notifications
6. **Error Handling Analyst** - How to handle notification failures
7. **Git History Analyzer** - Any prior notification work in history
8. **Dependency Analyst** - Notification-related dependencies available

## Success Criteria
- All 8 agents dispatched (visible in session)
- Each agent's findings cited with quotes in synthesis
- Synthesis verification gate executed
- Research doc saved with all sections populated
- Open questions from design addressed or noted as unresolved
