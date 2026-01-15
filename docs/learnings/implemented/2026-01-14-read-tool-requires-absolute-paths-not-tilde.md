---
date: 2026-01-14
type: repeated-error
source: ai-detected
confidence: high
tags: [tool:read, file-operations, path-resolution, general]
project: calendar-prep-mvp
---

# Read Tool Requires Absolute Paths Not Tilde

## What Happened

When searching for Todoist priority configuration files, used tilde-abbreviated paths (`~/Dev/sterling/...`) with the Read tool, which failed with "File does not exist" errors. This happened twice before correcting to use full absolute paths.

## AI Assumption

The Read tool would expand tilde (`~`) paths like bash does, treating `~/Dev/...` as equivalent to `/Users/pieter/Dev/...`.

## Reality

The Read tool requires **full absolute paths** starting with `/Users/...` and does not expand tilde paths. Tool calls with `~/` prefix fail even when the file exists.

## Lesson

**Always use full absolute paths with Read tool** - `/Users/pieter/Dev/...` not `~/Dev/...`

When Read fails with "File does not exist":
1. Check if using `~` in the path
2. Replace with full absolute path `/Users/[username]/...`
3. OR verify path with `ls` first, then use the absolute path shown

## Context

General tool usage pattern - applies to all Read tool invocations across all projects.

## Suggested Action

None - this is a general tool usage pattern that should be remembered for future sessions.
