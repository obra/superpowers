---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans
---

# Using Git Worktrees - Usando Git Worktrees

## Vision General

Git worktrees crean workspaces aislados compartiendo el mismo repositorio, permitiendo trabajo en multiples ramas simultaneamente sin switching.

**Principio central:** Seleccion sistematica de directorio + verificacion de seguridad = aislamiento confiable.

**Anuncia al inicio:** "Estoy usando el skill using-git-worktrees para configurar un workspace aislado."

## Proceso de Seleccion de Directorio

### 1. Chequear Directorios Existentes

```bash
ls -d .worktrees 2>/dev/null     # Preferido (hidden)
ls -d worktrees 2>/dev/null      # Alternativo
```

**Si encontrado:** Usar ese directorio.

### 2. Chequear CLAUDE.md/AGENTS.md

```bash
grep -i "worktree.*director" AGENTS.md 2>/dev/null
```

**Si preference especificada:** Usarla sin preguntar.

### 3. Preguntar al Usuario

Si no existe directorio y no hay preference:

```
No worktree directory found. Where should I create worktrees?

1. .worktrees/ (project-local, hidden)
2. ~/.config/superpowers/worktrees/<project-name>/ (global location)

Which would you prefer?
```

## Verificacion de Seguridad

### Para Directorios Project-Local

**DEBES verificar directorio esta ignorado antes de crear worktree:**

```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**Si NO esta ignorado:**

1. Agregar linea apropiada a .gitignore
2. Commit el cambio
3. Proceder con creacion de worktree

### Para Directorio Global

No necesita verificacion .gitignore - fuera del proyecto enteramente.

## Pasos de Creacion

### 1. Detectar Nombre de Proyecto

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

### 2. Crear Worktree

```bash
git worktree add "$path" -b "$BRANCH_NAME"
```

### 3. Ejecutar Project Setup

```bash
# .NET
if [ -f "*.sln" ]; then dotnet restore; fi

# Node.js
if [ -f package.json ]; then npm install; fi
```

### 4. Verificar Baseline Limpio

Ejecutar tests para asegurar worktree empieza limpio:

```bash
dotnet test
```

**Si tests fallan:** Reportar failures, preguntar si proceder o investigar.

**Si tests pasan:** Reportar ready.

## Referencia Rapida

| Situacion | Accion |
|-----------|--------|
| `.worktrees/` existe | Usarlo (verificar ignorado) |
| Neither existe | Check AGENTS.md → Ask user |
| Directorio no ignorado | Agregar a .gitignore + commit |
| Tests fallan baseline | Report failures + ask |
| No solution/package | Skip dependency install |

## Red Flags

**Nunca:**
- Crear worktree sin verificar esta ignorado (project-local)
- Saltar verificacion de test baseline
- Proceder con tests fallando sin preguntar
- Asumir ubicacion de directorio cuando es ambiguo

**Siempre:**
- Seguir prioridad de directorio: existente > AGENTS.md > ask
- Verificar directorio esta ignorado para project-local
- Auto-detectar y ejecutar project setup
- Verificar clean test baseline
