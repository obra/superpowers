---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work
---

# Finishing a Development Branch - Finalizando una Rama de Desarrollo

## Vision General

Guia la completacion del trabajo de desarrollo presentando opciones claras y manejando el workflow elegido.

**Principio central:** Verificar tests → Presentar opciones → Ejecutar eleccion → Limpiar.

**Anuncia al inicio:** "Estoy usando el skill finishing-a-development-branch para completar este trabajo."

## El Proceso

### Step 1: Verificar Tests

**Antes de presentar opciones, verificar que tests pasan:**

```bash
dotnet test
```

**Si tests fallan:**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Para. No procedas a Step 2.

**Si tests pasan:** Continua a Step 2.

### Step 2: Presentar Opciones

Present exactamente estas 4 opciones:

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

### Step 3: Ejecutar Eleccion

#### Opcion 1: Merge Local

```bash
git checkout <base-branch>
git pull
git merge <feature-branch>
dotnet test
git branch -d <feature-branch>
```

#### Opcion 2: Push and Create PR

```bash
git push -u origin <feature-branch>
gh pr create --title "<title>" --body "## Summary"
```

#### Opcion 3: Keep As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

#### Opcion 4: Discard

**Confirmar primero:**
```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>

Type 'discard' to confirm.
```

### Quick Reference

| Opcion | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | Yes | - | - | Yes |
| 2. Create PR | - | Yes | Yes | - |
| 3. Keep as-is | - | - | Yes | - |
| 4. Discard | - | - | - | Yes (force) |

## Red Flags

**Nunca:**
- Proceder con tests fallando
- Merge sin verificar tests en resultado
- Delete work sin confirmacion
- Force-push sin peticion explicita

**Siempre:**
- Verificar tests antes de ofrecer opciones
- Presentar exactamente 4 opciones
- Obtener confirmacion tipeada para Opcion 4
