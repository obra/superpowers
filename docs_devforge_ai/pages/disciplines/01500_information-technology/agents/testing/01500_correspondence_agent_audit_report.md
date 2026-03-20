# Correspondence Reply Agent — Audit Report

**File Audited:** `deep-agents/deep_agents/agents/pages/00435-contracts_post_award/agents/correspondence_agent.py`  
**Audit Date:** 2026-02-18  
**Auditor:** Cline (AI Code Audit)  
**Scope:** Security vulnerabilities, architectural alignment, HITL/Task integration, code quality, and improvement opportunities

---

## Executive Summary

The `correspondence_agent.py` file (`ConstructionCorrespondenceDeepAgent`) is a **stub/legacy wrapper** that is **architecturally disconnected** from the live production system. The real correspondence processing system lives in `main_agents/a_construction_correspondence_deep_agent.py` (the 24-agent supervisor) and the JavaScript front-end agents (`correspondence-01` through `correspondence-07`). The Python stub in `agents/correspondence_agent.py` contains several significant vulnerabilities, missing integrations, and design issues that would cause silent failures if invoked directly.

**Overall Risk Rating: HIGH** — The file is misleadingly named, partially functional, and lacks the HITL, task, and governance integrations that the rest of the system depends on.

---

## 1. Critical Vulnerabilities

### 1.1 In-Memory State — No Persistence or Audit Trail

```python
# agents/correspondence_agent.py
self._communication_history = []

def _store_correspondence_history(self, correspondence: dict, validation: dict):
    self._communication_history.append(history_entry)
    if len(self._communication_history) > 100:
        self._communication_history = self._communication_history[-100:]
```

**Problem:** All correspondence history is stored in a Python list on the agent instance. This means:
- History is **lost on every restart or new instance** — no persistence to Supabase or any database.
- There is **no audit trail** for compliance purposes (AIUC-1, ISO 42001, EU AI Act, NIS2 — all of which the governance decorator claims to enforce).
- The 100-entry cap silently discards older records with no archival.

**Required Fix:** Persist every correspondence record to the `agent_operations_audit` table (as defined in `0000_WORKFLOW_TASK_PROCEDURE.md`) and the `task_history` table. The `ContractsHITLCoordinator` and `HumanReviewAgent` both do this correctly.

---

### 1.2 No HITL Integration — Mandatory Requirement Completely Missing

The HITL procedure (`0000_WORKFLOW_HITL_PROCEDURE.md`) is unambiguous:

> **CORRESPONDENCE AGENT POLICY: ALWAYS CREATE HITL TASKS**  
> This agent MUST create HITL tasks for ALL correspondence — no assessment based on complexity/risk.

The stub agent has **zero HITL integration**:
- No call to `/api/tasks/hitl`
- No `dispatchHITLModalEvent`
- No `hitlAssignmentService` invocation
- No `ContractsHITLCoordinator` usage
- No `is_hitl` task creation

The `generate_correspondence` method returns a result and considers itself done. In the real system, this would bypass the mandatory human review gate entirely, violating the 100% HITL rate policy for contractual correspondence.

**Required Fix:** After generating correspondence, the agent must call `ContractsHITLCoordinator._execute_impl()` or invoke the HITL API endpoint, creating a task with `is_hitl=True`, `intervention_type='complex_decision'`, and `business_object_type='contractual_correspondence'`.

---

### 1.3 No Task Creation — MyTasksDashboard Integration Missing

The Task Workflow Procedure requires that all agent operations create tasks in the `tasks` table for tracking in MyTasksDashboard. This agent creates no tasks at any point. Users will have no visibility into correspondence being processed, no assignment notifications, and no way to track status.

**Required Fix:** On correspondence submission, create a task record:
```python
task_data = {
    'task_type': 'correspondence_review',
    'business_object_type': 'contractual_correspondence',
    'discipline': 'construction',
    'priority': 'high',
    'status': 'pending',
    'is_hitl': True,
    'intervention_type': 'complex_decision',
    'metadata': { 'agent': 'ConstructionCorrespondenceDeepAgent', ... }
}
```

---

### 1.4 Prompt Injection Risk in `_build_content_prompt`

```python
def _build_content_prompt(self, correspondence_type: str, requirements: dict) -> str:
    base_prompt = f"""
    Generate {correspondence_type} content for construction contract correspondence.
    Requirements: {requirements}
    ...
    """
```

**Problem:** `correspondence_type` and `requirements` are interpolated directly into the LLM prompt with no sanitisation. A malicious or malformed `requirements` dict containing prompt-injection strings (e.g., `"Ignore all previous instructions and..."`) would be passed verbatim to the LLM.

**Required Fix:**
- Validate `correspondence_type` against an allowlist (already partially defined in `config_schema` but not enforced at runtime).
- Sanitise or JSON-encode `requirements` before interpolation.
- Use structured message formats (system/user roles) rather than raw f-string concatenation.

---

### 1.5 Hardcoded Placeholder Sender Identity

```python
def _get_email_signature(self) -> str:
    return """
Construction Correspondence Specialist
Email: correspondence@constructai.com
Phone: +1-555-CONSTRUCT
"""

def _get_sender_address(self) -> dict:
    return {
        'company': 'ConstructAI',
        'address': '123 Construction Way',
        'city': 'Build City',
        'state': 'BC',
        'zip': '12345'
    }
```

**Problem:** These are hardcoded fake values. Any correspondence generated by this agent would carry a fictitious sender identity, which is a **legal and contractual liability** in a post-award contracts context. The implementation procedure explicitly prohibits hardcoded fake data.

**Required Fix:** Load sender identity from the authenticated user's profile and organisation record in Supabase. The `ContractsHITLCoordinator` correctly uses `organization_id` for all context.

---

### 1.6 Reference Number Not Unique Enough

```python
def _generate_reference_number(self) -> str:
    import uuid
    return f"CC-{uuid.uuid4().hex[:8].upper()}"
```

**Problem:** An 8-character hex prefix from UUID4 gives ~4 billion combinations but is not collision-proof at scale, and more importantly, it is not linked to any project, contract, or organisation identifier. In a multi-tenant system, reference numbers must be namespaced (e.g., `CC-{org_id[:4]}-{contract_id[:4]}-{uuid[:8]}`). Duplicate reference numbers across organisations would cause audit confusion.

---

## 2. Architectural Misalignment

### 2.1 This File Is a Stub — The Real Agent Is Elsewhere

The production correspondence system is a **24-agent deep architecture** defined in:
- `main_agents/a_construction_correspondence_deep_agent.py` — the `ConstructionCorrespondenceDeepAgent` supervisor (7 main agents + 17 specialists)
- `specialist_agents/coordination/c_parallel_specialist_coordinator_agent.py` — parallel specialist execution
- `a_contracts_hitl_coordinator.py` — HITL escalation logic

The file being audited (`agents/correspondence_agent.py`) is a **separate, simpler class** with the same name (`ConstructionCorrespondenceDeepAgent`) as the main supervisor. This creates a **naming collision** and risks the wrong class being imported.

**Evidence of duplication:**
```python
# agents/correspondence_agent.py
class ConstructionCorrespondenceDeepAgent(DeepAgent):  # ← stub

# main_agents/a_construction_correspondence_deep_agent.py  
class ConstructionCorrespondenceDeepAgent(MessagingMixin, SupervisorAgent):  # ← real
```

Both classes share the same name. Any code doing `from ... import ConstructionCorrespondenceDeepAgent` could silently import the wrong one depending on import path resolution.

**Required Fix:** Either:
- Delete `agents/correspondence_agent.py` if it is superseded, or
- Rename it clearly (e.g., `CorrespondenceAgentLegacy`) and add a deprecation warning, or
- Refactor it to be a thin adapter that delegates to the real supervisor.

---

### 2.2 `@agent_plugin` Decorator Declares Wrong Capabilities

```python
@agent_plugin({
    'capabilities': ['correspondence', 'construction', 'contracts'],
    'dependencies': ['langchain', 'openai'],
    ...
})
```

The real system uses 24 agents, vector database retrieval, Supabase integration, HITL workflows, governance swarm, and fine-tuned specialist models. The plugin declaration lists only `langchain` and `openai` as dependencies, which would cause the agent registry to believe this agent is self-contained when it is not.

---

### 2.3 `@with_governance` Decorator Applied But Governance Swarm Not Wired

```python
@with_governance(jurisdiction='FI', strict_mode=True)
async def generate_correspondence(self, request: dict) -> dict:
```

The governance decorator is applied, which is correct. However:
- The `ContractsHITLCoordinator` and `HumanReviewAgent` both correctly integrate with `MetricsStore`, `HealthMonitor`, `CheckpointManager`, `AgentMailStore`, and `AgentIdentityStore` (the Phase 1–3 messaging/observability stack).
- This stub agent has **none of these integrations**. There is no `self.mail`, `self.metrics`, `self.health`, `self.checkpoints`, or `self.identity`.
- The governance decorator will wrap the method but the underlying observability infrastructure is absent, meaning governance audit records will be incomplete.

**Required Fix:** Inherit from `MessagingMixin` (as the real supervisor does) and initialise all five observability components in `__init__`.

---

### 2.4 `_validate_correspondence` Is Superficial and Misleading

```python
def _check_professional_tone(self, content: str) -> bool:
    professional_indicators = ['please', 'thank you', 'regards', 'sincerely']
    unprofessional_indicators = ['hey', 'sup', 'lol', 'omg']
    ...
```

This validation:
- Will pass any content containing the word "please" regardless of actual quality.
- Will fail legitimate content that doesn't happen to contain these exact words.
- Has no domain-specific checks (no contract clause validation, no legal language checks, no jurisdiction-specific requirements).
- The `score` calculation (`score -= 0.2` per failed check) is arbitrary and not calibrated.

The real system uses the `QualityAssessmentService` and `agentQualityAssurance.validateAgentConfidence()` framework with consistency, relevance, and factual accuracy factors. This stub's validation is not equivalent.

---

### 2.5 `_load_contract_templates` Uses Hardcoded Strings, Not Database

```python
async def _load_contract_templates(self):
    self._contract_templates = {
        'variation_request': "Template for contract variation requests",
        'progress_report': "Template for construction progress reports",
        ...
    }
```

The real system loads prompts from the Supabase `prompts` table via `PromptsService.getPromptByKey()` with 34 confirmed prompts. This stub uses placeholder strings that would produce meaningless LLM output.

---

## 3. Security Concerns

### 3.1 No RBAC / Discipline Confinement

The Task Workflow Procedure mandates:
> **CRITICAL REQUIREMENT**: All agents involved in task orchestration must adhere to strict discipline confinement rules.

This agent has no:
- User authentication check
- Role validation (`user_roles` table lookup)
- Discipline confinement (`discipline_code` enforcement)
- `SecureTaskDispatcher` pattern

Any caller can invoke `generate_correspondence` without any permission check.

---

### 3.2 No Input Validation on `request` Dict

```python
async def generate_correspondence(self, request: dict) -> dict:
    correspondence_type = request.get('type', 'email')
    recipient = request.get('recipient', {})
    subject = request.get('subject', '')
```

There is no schema validation on the incoming `request`. The `config_schema` is defined in the plugin decorator but is never applied to method inputs. A caller could pass:
- Oversized content (no `max_tokens` guard on input, only on output)
- Malformed recipient objects
- Arbitrary `correspondence_type` values not in the enum

**Required Fix:** Validate `request` against a Pydantic model or jsonschema before processing.

---

### 3.3 Error Messages Leak Internal State

```python
except Exception as e:
    error_msg = f"Failed to generate correspondence: {str(e)}"
    return {
        'success': False,
        'error': error_msg,
        ...
    }
```

`str(e)` on an unhandled exception can expose stack traces, internal paths, database connection strings, or API keys in the error response returned to the caller. This is a standard information disclosure vulnerability.

**Required Fix:** Log the full exception internally (`self.logger.error(error_msg, exc_info=True)`) but return only a sanitised, generic error message to the caller.

---

### 3.4 No Rate Limiting or Cost Controls

The agent calls `self.llm.ainvoke(prompt)` with no:
- Per-user rate limiting
- Token budget enforcement
- Cost tracking
- Circuit breaker (the real system has `LLMService` with circuit breaker pattern)

A single malformed or adversarial request could trigger unlimited LLM calls.

---

## 4. Integration Gaps

### 4.1 HITL Workflow — Not Integrated (Critical)

| Required Integration | Status |
|---|---|
| Create HITL task via `/api/tasks/hitl` | ❌ Missing |
| `ContractsHITLCoordinator` invocation | ❌ Missing |
| `hitlAssignmentService` specialist routing | ❌ Missing |
| HITL modal event dispatch | ❌ Missing |
| HITL resolution handling | ❌ Missing |
| 17 specialist HITL tasks creation | ❌ Missing |
| Final contracts manager HITL task | ❌ Missing |

---

### 4.2 Task System — Not Integrated (Critical)

| Required Integration | Status |
|---|---|
| Task creation in `tasks` table | ❌ Missing |
| Task status updates | ❌ Missing |
| `task_history` audit entries | ❌ Missing |
| MyTasksDashboard visibility | ❌ Missing |
| Discipline-based task assignment | ❌ Missing |

---

### 4.3 Observability Stack — Not Integrated

| Required Integration | Status |
|---|---|
| `AgentMailStore` (inter-agent messaging) | ❌ Missing |
| `CheckpointManager` (workflow checkpoints) | ❌ Missing |
| `MetricsStore` (performance metrics) | ❌ Missing |
| `HealthMonitor` (agent health) | ❌ Missing |
| `AgentIdentityStore` (completion records) | ❌ Missing |

The `ContractsHITLCoordinator` and `ConstructionCorrespondenceDeepAgent` supervisor both implement all five. This stub has none.

---

### 4.4 Vector Database / Document Retrieval — Not Integrated

The 7-step workflow requires vector database retrieval (Step 3) to find relevant contract documents, variations, technical docs, and clauses. This stub has no vector store integration — it generates correspondence purely from the LLM prompt with no grounding in actual contract documents.

---

### 4.5 Specialist Agent Consultation — Not Integrated

The real system runs 17 specialist agents in parallel (civil, structural, mechanical, electrical, etc.) before generating a response. This stub skips all specialist consultation and goes directly to LLM generation.

---

### 4.6 PromptsService — Not Used

All real agents use `PromptsService.getPromptByKey()` to load prompts from the database. This stub uses hardcoded placeholder strings. If the database prompts are updated, this agent will not reflect those changes.

---

## 5. Code Quality Issues

### 5.1 `cleanup()` Destroys All State Without Persistence

```python
async def cleanup(self):
    self._contract_templates.clear()
    self._communication_history.clear()
```

Calling `cleanup()` silently destroys all correspondence history. Since history is in-memory only (see §1.1), this is a permanent, unrecoverable data loss. There is no flush-to-database before clearing.

---

### 5.2 `_get_timestamp()` and `_get_formatted_date()` Import Inside Methods

```python
def _get_timestamp(self) -> str:
    from datetime import datetime
    return datetime.now().isoformat()

def _get_formatted_date(self) -> str:
    from datetime import datetime
    return datetime.now().strftime("%B %d, %Y")
```

Importing `datetime` inside a method on every call is a minor performance anti-pattern. Move imports to the module level.

---

### 5.3 `_generate_reference_number()` Imports `uuid` Inside Method

Same pattern — `import uuid` inside a method body. Move to module level.

---

### 5.4 `get_statistics()` Division Without Guard

```python
avg_score = sum(...) / total_correspondence
```

This is guarded by `if total_correspondence == 0: return ...` above, which is correct. However, the guard returns early with a partial dict (`{'total_correspondence': 0}`) that is missing all other keys. Callers expecting a consistent schema will get a `KeyError`. Return a full zero-valued dict instead.

---

### 5.5 `_format_email` and `_format_letter` Return Nested Dicts That Overwrite Top-Level Keys

```python
formatted.update(self._format_email(recipient, subject, content))
```

`_format_email` returns `{'email_format': {...}}` which is merged into `formatted`. But `formatted` already has `'subject'` and `'content'` at the top level. The nested `email_format` dict duplicates these fields. This creates an inconsistent data structure where the same information exists at two different paths.

---

### 5.6 No Type Hints on Several Methods

`_format_email_body`, `_format_letter_body`, `_get_email_signature`, `_get_sender_address`, `_get_letter_closing`, `_get_formatted_date` all lack return type hints, inconsistent with the rest of the codebase.

---

### 5.7 `temperature=0.7` for Legal/Contractual Correspondence

The default temperature of `0.7` is appropriate for creative writing but is **too high for contractual correspondence**, which requires deterministic, precise language. The `HumanReviewAgent` and the real correspondence agents use lower temperatures for legal/contractual content. Recommend `0.2–0.3` as the default for this domain, with `0.7` available only for `style='concise'` informal communications.

---

## 6. Alignment with Procedures

### 6.1 vs. `0000_WORKFLOW_HITL_PROCEDURE.md`

| Requirement | Compliant? |
|---|---|
| 100% HITL rate for contractual correspondence | ❌ No HITL at all |
| Create 17 specialist HITL tasks | ❌ |
| Create 1 final contracts manager HITL task | ❌ |
| All HITL tasks use simple modal | N/A (no tasks created) |
| `hitlAssignmentService` automatic assignment | ❌ |
| HITL resolution audit trail | ❌ |
| `hitl_performance_metrics` table entries | ❌ |

---

### 6.2 vs. `0000_WORKFLOW_TASK_PROCEDURE.md`

| Requirement | Compliant? |
|---|---|
| Agent discipline confinement | ❌ No RBAC |
| Task creation in `tasks` table | ❌ |
| `agent_operations_audit` logging | ❌ |
| MyTasksDashboard visibility | ❌ |
| Notification via tasks (not email) | ❌ (email signature hardcoded) |
| `SecureTaskDispatcher` pattern | ❌ |

---

### 6.3 vs. `1300_00435_CONTRACTS_POST_AWARD_CORRESPONDENCE_AGENT_IMPLEMENTATION_PROCEDURE.md`

| Requirement | Compliant? |
|---|---|
| 7-step workflow | ❌ Single-step LLM call |
| PromptsService integration | ❌ Hardcoded strings |
| Vector database document retrieval | ❌ |
| 17 specialist parallel consultation | ❌ |
| Transparency flags on fallback | ❌ |
| No hardcoded fake data | ❌ (fake address, email, phone) |
| Word boundary regex patterns | N/A |
| Circuit breaker on LLM calls | ❌ |

---

## 7. Recommendations (Priority Order)

### Priority 1 — Immediate (Blocking Issues)

1. **Resolve the naming collision.** Rename `agents/correspondence_agent.py` to `agents/correspondence_agent_legacy.py` or delete it. The real agent is `main_agents/a_construction_correspondence_deep_agent.py`. Add a module-level deprecation warning if keeping the file.

2. **Add HITL integration.** If this agent is to remain active, it must call `ContractsHITLCoordinator` and create HITL tasks via the API. The HITL procedure is non-negotiable for contractual correspondence.

3. **Add task creation.** Every correspondence processing run must create a `tasks` table record so it appears in MyTasksDashboard.

4. **Remove hardcoded fake identity data.** Replace `_get_email_signature()` and `_get_sender_address()` with lookups from the authenticated user's organisation profile.

5. **Add input validation.** Validate the `request` dict against a Pydantic schema before processing. Sanitise all LLM prompt inputs.

### Priority 2 — High (Security & Compliance)

6. **Add RBAC / discipline confinement.** Validate the calling user's role and discipline before allowing correspondence generation.

7. **Sanitise error responses.** Never return raw `str(e)` to callers. Log internally, return generic message externally.

8. **Add circuit breaker to LLM calls.** Use the `LLMService` circuit breaker pattern already implemented in the real system.

9. **Persist correspondence history to Supabase.** Replace the in-memory list with `agent_operations_audit` table inserts.

10. **Add observability stack.** Initialise `AgentMailStore`, `CheckpointManager`, `MetricsStore`, `HealthMonitor`, and `AgentIdentityStore` as done in `ContractsHITLCoordinator`.

### Priority 3 — Medium (Quality & Alignment)

11. **Integrate PromptsService.** Replace hardcoded template strings with `PromptsService.getPromptByKey()` calls.

12. **Lower default LLM temperature.** Change from `0.7` to `0.2` for contractual correspondence.

13. **Improve `_validate_correspondence`.** Replace the keyword-matching heuristic with the `agentQualityAssurance.validateAgentConfidence()` framework.

14. **Fix `get_statistics()` return schema.** Return a consistent dict structure even when `total_correspondence == 0`.

15. **Move imports to module level.** Move `datetime` and `uuid` imports out of method bodies.

16. **Namespace reference numbers.** Include `org_id` and `contract_id` in generated reference numbers.

### Priority 4 — Low (Code Hygiene)

17. **Add type hints** to all methods missing them.
18. **Fix duplicate data** in `_format_email` / `_format_letter` nested dict structure.
19. **Add `flush_to_db()` before `cleanup()`** to prevent silent data loss.
20. **Add `@agent_plugin` dependency declarations** for all actual runtime dependencies (Supabase, vector store, HITL API, etc.).

---

## 8. Summary Table

| Category | Issues Found | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| HITL Integration | 7 | 1 | 6 | — | — |
| Task System Integration | 5 | 1 | 4 | — | — |
| Security | 4 | — | 3 | 1 | — |
| Architectural Alignment | 5 | 1 | 2 | 2 | — |
| Data Integrity | 3 | 1 | 1 | 1 | — |
| Code Quality | 7 | — | — | 3 | 4 |
| **Total** | **31** | **4** | **16** | **7** | **4** |

---

## 9. Conclusion

The `agents/correspondence_agent.py` file should be treated as a **non-production stub** that must not be invoked in a live environment. It lacks the HITL integration that is mandatory for all contractual correspondence, creates no tasks for user visibility, has no audit trail, contains hardcoded fake identity data, and is architecturally disconnected from the 24-agent production system.

The recommended path forward is:
1. **Immediately** rename or deprecate this file to prevent accidental use.
2. **Verify** that all production invocations route through `main_agents/a_construction_correspondence_deep_agent.py`.
3. **Implement** the Priority 1 and Priority 2 fixes if this file is to be retained as a lightweight alternative entry point.
4. **Add a test** that asserts the correct class is imported when `ConstructionCorrespondenceDeepAgent` is referenced from any module in the `00435` page.

---

*End of Audit Report*
