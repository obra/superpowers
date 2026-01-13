# Checklist: subagent-driven-development Compliance

## Context Curation Gate (COMPULSORY - per task)
- [ ] Full task text extracted from plan (not "see plan file" reference)
- [ ] Specific file paths listed in handoff (e.g., "Files: src/components/Greeting.tsx")
- [ ] Prior decisions from earlier tasks noted (Task 2+ should reference Task 1 context)
- [ ] Structured handoff format used (Task: ... Files: ... Context: ... Constraints: ...)

## Handoff Consumption Gate (COMPULSORY)
- [ ] Implementer explicitly acknowledges receiving context
- [ ] Implementer states task name in acknowledgment (e.g., "Received context for: Task 1 - Create Greeting component")
- [ ] Implementer references specific files from handoff before modifying them
- [ ] No "I'll read the plan file" statements from implementer

## Orchestrator Verification
- [ ] Orchestrator verifies implementer's response references handoff content
- [ ] If implementer proceeds without acknowledgment, orchestrator stops and re-prompts

## Review Sequence Gate (COMPULSORY - per task)
- [ ] Spec Compliance Review dispatched FIRST after implementer completes
- [ ] Spec Compliance Review verdict shown (approved or issues found)
- [ ] If Spec issues found: implementer fixes, then Spec Review runs again
- [ ] ONLY AFTER Spec ✅: Code Quality Review dispatched
- [ ] Code Quality Review verdict shown
- [ ] If Quality issues found: implementer fixes, then Quality Review runs again

## Task Completion Gate (COMPULSORY - per task)
- [ ] Both Spec Compliance AND Code Quality reviews explicitly approved
- [ ] TodoWrite updated to mark task complete ONLY after both reviews pass
- [ ] Progress tracking updated between tasks
- [ ] Clear "Task N complete" statement before moving to next task

## Full 3-Task Verification
- [ ] Task 1: All 4 gates executed (Context, Handoff, Review Sequence, Completion)
- [ ] Task 2: Context includes reference to Task 1 decisions
- [ ] Task 2: All 4 gates executed
- [ ] Task 3: Context includes reference to Tasks 1-2 decisions
- [ ] Task 3: All 4 gates executed
- [ ] Final state: All 3 tasks marked complete in TodoWrite
