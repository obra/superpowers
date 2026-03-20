# AI Governance Task Workflow Integration

## Overview

This document describes the integration between the AI Governance Swarm (11 agents) and the Task Workflow system, enabling automatic routing of governance violations to the AI Management team for remediation.

**Standards:**
- AIUC-1 (AI Unified Compliance)
- ISO 42001 (AI Management Systems)
- Workflow Task Procedure (`0000_WORKFLOW_TASK_PROCEDURE.md`)
- HITL Workflow Procedure (`0000_WORKFLOW_HITL_PROCEDURE.md`)
- Roles User Implementation Procedure (`0000_ROLES_USER_IMPLEMENTATION_PROCEDURE.md`)

**Department:** 01300 (Governance) - AI Management Team

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI GOVERNANCE SWARM                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  Security   │ │   Safety    │ │   Privacy   │ │ Reliability │  ...      │
│  │   Agent     │ │    Agent    │ │    Agent    │ │    Agent    │           │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘           │
└─────────┼───────────────┼───────────────┼───────────────┼──────────────────┘
          │               │               │               │
          └───────────────┴───────────────┴───────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Governance Swarm  │
                    │    Orchestrator    │
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
┌─────────▼─────────┐ ┌───────▼────────┐ ┌───────▼────────┐
│ ai_governance_    │ │ ai_governance_ │ │ ai_governance_ │
│ decisions         │ │ violations     │ │ audit_log      │
└─────────┬─────────┘ └───────┬────────┘ └────────────────┘
          │                   │
          │         ┌─────────▼──────────┐
          │         │  DATABASE TRIGGER  │
          │         │ trg_create_violation_task
          │         └─────────┬──────────┘
          │                   │
          │         ┌─────────▼──────────┐
          │         │     tasks          │
          │         │ (Workflow System)  │
          │         └─────────┬──────────┘
          │                   │
          │    ┌──────────────┼──────────────┐
          │    │              │              │
┌─────────▼────▼─────┐ ┌──────▼──────┐ ┌────▼─────────┐
│ AI Management Team │ │   HITL      │ │ Notifications│
│  (Department 01300)│ │  Workflow   │ │              │
└────────────────────┘ └─────────────┘ └──────────────┘
```

---

## Database Schema

### Extended Violations Table

The `ai_governance_violations` table is extended with workflow integration fields:

| Field | Type | Description |
|-------|------|-------------|
| `task_id` | UUID → tasks | Reference to workflow task |
| `hitl_required` | BOOLEAN | Whether HITL intervention needed |
| `hitl_reason` | TEXT | Reason for HITL requirement |
| `escalation_level` | INTEGER | Current escalation level (0-3) |
| `assigned_team` | TEXT | Team responsible ('ai_management') |
| `workflow_status` | TEXT | pending, task_created, in_review, escalated, resolved |
| `auto_escalation_at` | TIMESTAMP | When auto-escalation scheduled |
| `resolution_deadline` | TIMESTAMP | SLA deadline for resolution |

### Automatic Task Creation

When a violation is inserted, the `trg_create_violation_task` trigger automatically:

1. **Determines Priority** based on severity:
   - `critical` → Priority: critical, SLA: 4 hours
   - `high` → Priority: high, SLA: 24 hours
   - `medium` → Priority: medium, SLA: 72 hours
   - `low` → Priority: low, SLA: 7 days

2. **Determines HITL Requirement**:
   - Critical/High severity → `approval_required`
   - Security/Privacy violations → `approval_required`
   - Others → `clarification_needed`

3. **Finds AI Management Assignee**:
   ```sql
   SELECT user_id FROM user_roles
   WHERE department_code = '01300'
     AND level >= 3  -- Manager or above
   ORDER BY created_at ASC
   LIMIT 1
   ```

4. **Creates Task** in `tasks` table:
   ```sql
   INSERT INTO tasks (
       task_type = 'governance_violation',
       assigned_to = <ai_mgmt_user>,
       priority = <severity_based>,
       is_hitl = true,
       intervention_type = <based_on_severity>,
       due_date = <sla_based>
   )
   ```

---

## Routing to AI Management Team

### Role-Based Assignment

Violations are routed to users with roles in **Department 01300 (Governance)**:

| Level | Role | Assignment Priority |
|-------|------|---------------------|
| 4 | Director/Admin | Escalation target |
| 3 | Manager | Primary assignee |
| 2 | Contributor | Fallback assignee |
| 1 | Viewer | Last resort |

### Assignment Algorithm

1. **Initial Assignment**:
   - Find Level 3+ Governance users
   - Round-robin by `created_at` (oldest first)
   - Filter by organization if specified

2. **Escalation Assignment**:
   - Find Level 4+ users (Director level)
   - Exclude current assignee
   - Higher level = higher priority

### SQL Assignment Query

```sql
-- Primary assignment (Level 3+)
SELECT user_id FROM user_roles
WHERE department_code = '01300'
  AND level >= 3
  AND (organization_id = :org_id OR organization_id IS NULL)
ORDER BY created_at ASC
LIMIT 1;

-- Escalation assignment (Level 4+)
SELECT user_id FROM user_roles
WHERE department_code = '01300'
  AND level >= 4
  AND user_id != :current_assignee
ORDER BY level DESC, created_at ASC
LIMIT 1;
```

---

## Escalation Workflow

### Automatic Escalation

The `escalate_overdue_violations()` function runs periodically:

```sql
-- Find violations approaching deadline
SELECT * FROM ai_governance_violations
WHERE status IN ('open', 'in_review')
  AND resolution_deadline < NOW() + INTERVAL '1 hour'
  AND escalation_level < 3;
```

**Escalation Actions:**
1. Increment `escalation_level`
2. Reassign to higher-level user
3. Update priority to `critical` or `high`
4. Create escalation notification
5. Log to audit trail

### Escalation Levels

| Level | Trigger | Action |
|-------|---------|--------|
| 0 | Initial creation | Assign to Level 3 user |
| 1 | Deadline < 1 hour | Escalate to Level 4 |
| 2 | Still unresolved | Escalate to Director |
| 3 | Critical breach | Escalate to Admin |

---

## Python Integration Service

### GovernanceTaskIntegration Class

```python
from deep_agents.agents.shared.governance.governance_task_integration import (
    GovernanceTaskIntegration,
    create_violation_from_agent_verdict
)

# Initialize service
integration = GovernanceTaskIntegration()

# Create violation from agent verdict
result = await integration.create_violation_from_verdict(
    verdict=verdict_dict,
    decision_id=decision_id,
    organization_id=org_id,
    project_id=project_id
)
# Returns: {success, violation_id, task_id, severity}
```

### Usage in Governance Agents

The base governance agent automatically creates violations:

```python
# In 0000_base_governance_agent.py
async def _log_compliance_check(self, verdict, workflow_state):
    # Log to ai_governance_decisions
    result = supabase.table('ai_governance_decisions').insert(record).execute()
    
    # Create violation for rejected verdicts with medium+ risk
    if not verdict.approved and verdict.risk_score >= 25:
        await self._create_violation_if_needed(verdict, workflow_state, decision_id)
```

---

## Task Resolution Sync

### Automatic Sync

When a task is marked `completed`, the `trg_sync_task_resolution` trigger:

1. Updates violation status to `remediated`
2. Sets `remediated_at` timestamp
3. Records resolver user ID
4. Appends resolution notes
5. Logs to audit trail

### Manual Resolution

```python
# Resolve via Python service
result = await integration.resolve_violation_via_task(
    violation_id="VIO-ABC12345",
    resolution_notes="Fixed by updating prompt template",
    resolved_by="user_uuid",
    remediation_actions=["Updated safeguards", "Retrained model"]
)
```

---

## Dashboard View

### v_governance_violations_tasks

Combined view for monitoring:

```sql
SELECT 
    v.violation_id,
    v.agent_type,
    v.severity,
    v.workflow_status,
    t.task_id,
    t.status as task_status,
    t.assigned_to,
    u.email as assigned_to_email,
    v.resolution_deadline,
    CASE 
        WHEN v.resolution_deadline < NOW() THEN 'overdue'
        WHEN v.resolution_deadline < NOW() + INTERVAL '4 hours' THEN 'urgent'
        ELSE 'on_track'
    END as deadline_status
FROM ai_governance_violations v
LEFT JOIN tasks t ON v.task_id = t.id
LEFT JOIN user_management u ON t.assigned_to = u.user_id
WHERE v.status IN ('open', 'in_review', 'escalated');
```

---

## HITL Integration

### Human-in-the-Loop Triggers

HITL is automatically triggered for:

| Condition | Intervention Type |
|-----------|-------------------|
| Critical severity | `approval_required` |
| High severity | `complex_decision` |
| Security/Privacy principle | `approval_required` |
| Risk score > 75 | `approval_required` |
| Risk score 50-75 | `complex_decision` |
| Others | `clarification_needed` |

### HITL Task Metadata

```json
{
  "violation_id": "VIO-ABC12345",
  "agent_type": "security",
  "aiuc1_principle": "security",
  "severity": "critical",
  "auto_created": true,
  "escalation_level": 0,
  "assigned_team": "ai_management"
}
```

---

## Configuration

### Environment Variables

```bash
# Supabase configuration (already existing)
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# Governance-specific (optional)
GOVERNANCE_AUTO_ESCALATION_HOURS=4
GOVERNANCE_CRITICAL_SLA_HOURS=4
GOVERNANCE_HIGH_SLA_HOURS=24
```

### Role Configuration

Ensure AI Management roles exist:

```sql
INSERT INTO role_definitions (role_name, permissions, description)
VALUES 
    ('AI Governance Manager', 
     ARRAY['governance:view_violations', 'governance:resolve_violations'],
     'Manages AI governance violations'),
    ('AI Compliance Officer',
     ARRAY['governance:view_violations', 'governance:audit'],
     'Audits AI governance compliance');
```

---

## API Endpoints

### For AI Management Dashboard

```javascript
// Get violations dashboard
GET /api/governance/violations
  ?status=open&severity=high&assigned_to=me

// Escalate violation
POST /api/governance/violations/:id/escalate
  { reason: "Need director approval" }

// Resolve violation
POST /api/governance/violations/:id/resolve
  { resolution_notes: "Fixed", actions: [...] }
```

---

## Deployment

### 1. Execute SQL Integration

```bash
# Run the task integration SQL
psql -d construct_ai -f database-systems/ai_governance_task_integration.sql
```

### 2. Verify Triggers

```sql
-- Check triggers are active
SELECT * FROM pg_trigger WHERE tgname LIKE '%violation%';

-- Test with sample violation
INSERT INTO ai_governance_violations (
    violation_id, agent_type, severity, status
) VALUES ('TEST-001', 'security', 'high', 'open');

-- Verify task was created
SELECT * FROM tasks WHERE business_object_id = 'TEST-001';
```

### 3. Schedule Escalation Job

```python
# Run every 15 minutes
async def scheduled_escalation_check():
    integration = GovernanceTaskIntegration()
    result = await integration.run_escalation_check()
    print(f"Escalated {result['escalated_count']} violations")
```

---

## Monitoring

### Key Metrics

| Metric | Query |
|--------|-------|
| Open violations | `COUNT(*) WHERE status = 'open'` |
| Avg resolution time | `AVG(remediated_at - created_at)` |
| Escalation rate | `COUNT(*) WHERE escalation_level > 0 / COUNT(*)` |
| SLA breaches | `COUNT(*) WHERE resolution_deadline < NOW()` |

### Alerts

```sql
-- Critical violations > 4 hours old
SELECT * FROM ai_governance_violations
WHERE severity = 'critical'
  AND status = 'open'
  AND created_at < NOW() - INTERVAL '4 hours';
```

---

## Security & RLS

### Row Level Security Policies

```sql
-- AI Management can view all governance tasks
CREATE POLICY ai_mgmt_view_governance_tasks ON tasks
    FOR SELECT USING (
        task_type = 'governance_violation'
        AND EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()::text
            AND department_code = '01300'
        )
    );
```

---

## Troubleshooting

### Common Issues

**Issue:** Violation created but no task created  
**Solution:** Check trigger is enabled:
```sql
SELECT tgname, tgenabled FROM pg_trigger 
WHERE tgname = 'trg_create_violation_task';
```

**Issue:** Task not assigned to anyone  
**Solution:** Verify AI Management users exist:
```sql
SELECT * FROM user_roles WHERE department_code = '01300';
```

**Issue:** Escalation not working  
**Solution:** Check escalation function:
```sql
SELECT escalate_overdue_violations();
```

---

## References

- [Governance Swarm Architecture](../../standards/0000_GOVERNANCE_SWARM_ARCHITECTURE.md)
- [Task Workflow Procedure](../../procedures/human-workflows/0000_WORKFLOW_TASK_PROCEDURE.md)
- [HITL Workflow Procedure](../../procedures/human-workflows/0000_WORKFLOW_HITL_PROCEDURE.md)
- [Roles User Implementation](../../procedures/human-workflows/0000_ROLES_USER_IMPLEMENTATION_PROCEDURE.md)
- [AI Governance Tables](../database-systems/ai_governance_swarm_tables.sql)
- [Task Integration SQL](../database-systems/ai_governance_task_integration.sql)

---

## Status

- [x] SQL schema for governance tables
- [x] Task workflow integration
- [x] Auto-assignment to AI Management team
- [x] Escalation workflow
- [x] Python integration service
- [x] Base agent violation creation
- [x] Documentation
- [ ] Production deployment
- [ ] End-to-end testing

**Last Updated:** 2026-02-08  
**Version:** 1.0.0
