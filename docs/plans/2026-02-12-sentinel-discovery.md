# Progress Sentinel & Dynamic Skill Discovery Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance Superpowers with automated progress tracking, optimized skill discovery, and native Windows adaptability.

**Architecture:** 
1. **Sentinel**: Inject progress tracking requirements into core execution skills.
2. **Discovery**: Implement a summary index for all available skills to prevent context overload.
3. **Adaptability**: Provide a command mapping standard for cross-platform execution.

---

### Task 1: Update `using-superpowers` (OS Adaptability)
**Files:**
- Modify: `skills/using-superpowers/SKILL.md`

### Task 2: Implement Skill Discovery Index
**Files:**
- Create: `lib/scripts/generate_skills_index.py`
- Create: `skills/SKILLS_INDEX.md`

### Task 3: Implement Sentinel Logic (Progress Tracking)
**Files:**
- Modify: `skills/executing-plans/SKILL.md`
- Create: `PROGRESS.md` (template)
