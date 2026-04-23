# Agent Architecture Audit — References

## Report Schema

Every audit should produce a structured report following this shape:

```json
{
  "schema_version": "oh-my-agent-check.report.v1",
  "executive_verdict": {
    "overall_health": "high_risk",
    "primary_failure_mode": "string",
    "most_urgent_fix": "string"
  },
  "scope": {
    "target_name": "string",
    "entrypoints": ["string"],
    "model_stack": ["string"],
    "symptoms": ["string"],
    "time_window": "string",
    "layers_to_audit": ["string"]
  },
  "findings": [
    {
      "severity": "critical|high|medium|low",
      "title": "string",
      "mechanism": "string",
      "source_layer": "string",
      "root_cause": "string",
      "evidence_refs": ["file:line or log:row"],
      "confidence": 0.0,
      "fix_type": "code_gate|prompt_removal|prompt_tightening|state_cleanup|architecture_change",
      "recommended_fix": "string"
    }
  ],
  "ordered_fix_plan": [
    {
      "order": 1,
      "goal": "string",
      "why_now": "string",
      "expected_effect": "string"
    }
  ]
}
```

## Code Patterns to Search For

### Tool Discipline (grep patterns)

```bash
# Tool requirement in prompt only (no code enforcement)
rg "must.*tool|必须.*工具" --type md

# Tool execution without validation
rg "tool_call|toolCall" --type py --type ts

# Hidden LLM calls outside main agent loop
rg "completion|chat\.create|llm\.invoke" --type py --type ts
```

### Memory Contamination

```bash
# Memory admission without user priority
rg "memory.*admit|记忆.*准入|long.*term.*update" --type py --type ts

# Distillation without TTL
rg "distill|summarize.*session|compress.*context" --type py --type ts
```

### Hidden Repair Loops

```bash
# Fallback that runs additional LLM calls
rg "fallback|retry|repair|re-?prompt" --type py --type ts

# Silent output mutation
rg "mutate|rewrite|transform.*response|shap" --type py --type ts
```

## Quick Diagnostic Questions

When auditing an agent system, answer these:

1. **Can the model skip a required tool and still answer?** → Tool not code-gated.
2. **Does old conversation content appear in new turns?** → Memory contamination.
3. **Is the same info in system prompt AND memory AND history?** → Context duplication.
4. **Does the platform run a second LLM pass before delivery?** → Hidden repair loop.
5. **Does the output differ between internal generation and user delivery?** → Rendering corruption.
6. **Are "must use tool X" rules only in prompt text?** → Tool discipline failure.
7. **Can the agent's own monologue become persistent memory?** → Memory poisoning.
