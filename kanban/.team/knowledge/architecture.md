---
title: "System Architecture"
tags:
  - architecture
  - overview
author: admin
date: "2026-02-27"
---

## Overview

Jingxia Kanban is a lightweight, Git-native project management tool for AI-native teams.

## Components

### Backend (`kanban/backend/`)
- **Runtime**: Bun
- **Framework**: Hono
- **Data store**: Plain files in `.team/` directory
  - `tasks/*.md` — task cards with YAML frontmatter
  - `sprints/*.json` — sprint metadata
  - `people/*.md` — team member profiles
  - `knowledge/*.md` — shared knowledge base
  - `decisions/*.md` — Architecture Decision Records (ADRs)
- **API**: REST + Server-Sent Events (SSE) for real-time updates

### Frontend (`kanban/frontend/`)
- **Framework**: React + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **State**: TanStack Query (server state) + Zustand (UI state)

## Data Flow

```
.team/*.md / *.json
       ↕ (chokidar watch)
  Hono REST API + SSE
       ↕ (fetch + EventSource)
  React Frontend
```

## Design Principles

1. **Git is the database** — all data lives in the repo, versioned alongside code
2. **No server required** — the backend is a dev tool, not a hosted service
3. **Human-readable** — Markdown/JSON files that any editor can open
4. **Agent-friendly** — Claude Code agents can read/write .team/ directly
