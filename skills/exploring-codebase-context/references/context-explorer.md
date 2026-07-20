# Context Explorer Dispatch Template

Use this template to create a fresh, read-only explorer task.

```markdown
Work read-only. Do not edit files or propose implementation.

Objective: <decision or workflow this research must unblock>
Known facts: <facts that must not be rediscovered>
Scope: <allowed packages, directories, or subsystem>
Question: <one concrete, answerable question>
Evidence required: <contracts, flows, definitions, tests, or history>
Exclusions: <adjacent areas and downstream work to avoid>
Stop condition: <evidence that makes the question answered>

Follow the shortest evidence chain: authoritative entry point, direct contract or data edge, then tests or history only if required by the question or an ambiguity. Do not map adjacent code after the stop condition is met.

Return a minimally sufficient report:

1. Direct answer to the assigned question.
2. Findings whose omission could change scope, feasible approaches, material risks, or verification; cite a primary repository path inline for each.
3. Unknowns that still prevent a confident answer.

Omit task restatement, process narration, raw listings, large code excerpts, and catalogs of every component or file read.
If the scope cannot answer one coherent question, stop and propose independent questions instead of broadening the report.
```
