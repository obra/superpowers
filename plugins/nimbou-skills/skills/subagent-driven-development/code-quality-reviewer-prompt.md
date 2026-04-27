# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

**Role context:** Read the task's `**Role:**` slug from the plan and pass it as `[ROLE]`. The reviewer uses it to focus quality concerns on what matters for that role (see "Role-specific focus" below). When `Role:` is missing, pass `general-purpose` and review against the standard checklist only.

```
Task tool (nimbou-skills:code-reviewer):
  Use template at request-review/code-reviewer.md

  ROLE: [ROLE]
  WHAT_WAS_IMPLEMENTED: [from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  DESCRIPTION: [task summary]
```

**In addition to standard code quality concerns, the reviewer should check:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this implementation create new files that are already large, or significantly grow existing files? (Don't flag pre-existing file sizes — focus on what this change contributed.)

**Role-specific focus:**

- `prisma-schema-author` → expand/migrate/contract discipline; index coverage matches downstream access patterns; no rename/drop without explicit task spec.
- `prisma-repository-author` → no Prisma types leak from public methods; no `@nestjs/common` HTTP imports; transaction boundary matches port contract.
- `nestjs-usecase-author` → one verb per use-case; no Prisma/NestJS-HTTP imports; ports cleanly typed.
- `nestjs-controller-author` → controllers are 3-step coordinators (parse → call → map); no business logic; DTO validation present; no `@prisma/client` import.
- `vue-component-author` → catalog reuse confirmed; no banned CSS patterns; scoped styles only; no composable/page sneaking in.
- `nuxt-composable-author` → no markup; no duplicate fetch ownership; no mirrored watchers; cleanup paths exist.
- `nuxt-page-author` → no new component/composable/store created; loading/empty/error/success reachable; no duplicate fetch ownership with composables.
- `general-purpose` (fallback) → standard checklist only; flag the missing role as a planning gap in the report.

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
