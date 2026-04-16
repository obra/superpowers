# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize project dependencies

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T003 Setup core models and entities
- [ ] T004 Configure error handling and logging

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

- [ ] T005 [P] [US1] Write failing test for [feature]
- [ ] T006 [US1] Implement [feature] logic
- [ ] T007 [US1] Verify test passes

## Phase 4: User Story 2 - [Title] (Priority: P2)

- [ ] T008 [P] [US2] Write failing test for [feature]
- [ ] T009 [US2] Implement [feature] logic

## Phase N: Polish & Cross-Cutting Concerns

- [ ] TXXX Documentation updates
- [ ] TXXX Code cleanup and refactoring

## Dependencies & Execution Order

- **Setup**: No dependencies
- **Foundational**: Depends on Setup - BLOCKS all stories
- **User Stories**: Depend on Foundational
- **Polish**: Depends on all stories
